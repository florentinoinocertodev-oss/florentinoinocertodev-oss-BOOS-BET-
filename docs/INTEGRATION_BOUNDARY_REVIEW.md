# BOOS BET — INTEGRATION BOUNDARY REVIEW (DOCUMENTO D)
## Auditoria Técnica das Fronteiras de Integração Externa (PSP, Sportsbook, FCM e AI)

> **Status**: Architecture Review — Implementation Frozen  
> **Classificação de Integração**: Contratos Abstratos e Adapters Isolados  
> **Princípio de Fronteira**: *Sistemas externos informam fatos do mundo real; o Backend autoriza e o Firestore persiste.*

---

### 1. FRONTEIRA DO PROVEDOR DESPORTIVO (SPORTS PROVIDER ADAPTER)

#### 1.1 Contrato da Interface `ISportsProviderAdapter`
```typescript
export interface ISportsProviderAdapter {
  fetchActiveCompetitions(): Promise<NormalizedCompetition[]>;
  fetchScheduledEvents(competitionId?: string): Promise<NormalizedEvent[]>;
  fetchLiveEvents(): Promise<NormalizedEvent[]>;
  fetchEventMarkets(eventId: string): Promise<NormalizedMarket[]>;
  getOfficialMatchResult(eventId: string): Promise<NormalizedMatchResult>;
}
```

#### 1.2 O Fim da Ilusão do "Mesmo Milissegundo" e Controle de Concorrência
Substituímos qualquer alegação irreal de *"aceitação no mesmo milissegundo"* pelo controle formal de **ordenação e atomicidade transacional no backend**:
- **Suspensão de Mercado**: Quando o provedor desportivo envia uma notificação de gol, falta perigosa ou VAR, o worker atualiza imediatamente o status do mercado para `'SUSPENDED'`.
- **Atomicidade no Aceite da Aposta**: A Cloud Function `placeBetTicket` executa a verificação do mercado e o congelamento do snapshot dentro do bloco atómico `runTransaction`. Se a gravação da aposta ocorrer após a escrita da suspensão pelo worker, a transação aborta deterministicamente por condição de pré-requisito violada.

#### 1.3 `OddsSnapshot` e Estrutura de Aceitação
O valor `client_observed_odds_milli` enviado pelo apostador é meramente observacional. A aposta grava um snapshot autoritativo com identificador rastreável:
```typescript
export interface BetLegSnapshot {
  leg_id: string;
  event_id: string;
  market_id: string;
  selection_id: string;
  selection_label: string;
  market_type: string;
  accepted_odds_milli: number;      // Cota oficial congelada pelo servidor
  odds_version: string;             // Hash ou timestamp da cota emitida pelo feed
  provider_id: string;              // Identificador do provedor desportivo
  provider_version: string;         // Versão da API do feed
  market_status_at_acceptance: 'OPEN';
  event_status_at_acceptance: 'SCHEDULED' | 'LIVE';
  settlement_rule_id: string;       // Regra formal vinculada
  rule_version: number;             // Versão da regra regulatória
  accepted_at: string;              // ISO 8601 UTC
}
```

#### 1.4 Política de Adiamento (`postponement_policy_id`)
Eliminamos qualquer prazo fixo hardcoded de "48 horas". Cada competição ou mercado referencia uma política formal versionada:
```typescript
export interface PostponementPolicy {
  policy_id: string;               // Ex: "postpone_uefa_standard"
  version: number;
  max_wait_hours: number;          // Ex: 36, 48 ou até às 23:59 do dia seguinte
  action_on_timeout: 'VOID_SELECTION' | 'PUSH' | 'CUSTOM_SETTLEMENT';
}
```

---

### 2. FRONTEIRA DO PROVEDOR DE PAGAMENTOS (PSP ADAPTER)

#### 2.1 Contrato da Interface `IPaymentProviderAdapter`
```typescript
export interface IPaymentProviderAdapter {
  createPaymentIntent(req: DepositIntentRequest): Promise<DepositIntentResponse>;
  getPaymentStatus(paymentIntentId: string): Promise<PaymentStatusResponse>;
  createWithdrawal(req: WithdrawalDispatch): Promise<WithdrawalResponse>;
  getWithdrawalStatus(withdrawalId: string): Promise<WithdrawalStatusResponse>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  parseWebhook(rawBody: string): NormalizedPspWebhook;
  reconcileTransaction(providerReference: string): Promise<ReconciliationReport>;
}
```

#### 2.2 Ciclo Completo de Estados de Depósito e Retirada
Além dos fluxos ideais, a fronteira contempla explicitamente cenários de atrito e exceções financeiras:
- **Depósitos**: `CREATED` $\rightarrow$ `PENDING` $\rightarrow$ `CONFIRMED` | `FAILED` | `EXPIRED` | `REVERSED` | `CHARGEBACK` | `RECONCILIATION_REQUIRED`.
- **Retiradas**: `RESERVED` $\rightarrow$ `PROCESSING` $\rightarrow$ `COMPLETED` | `FAILED` | `REVERSED` | `TIMEOUT_RETRY` | `MANUAL_REVIEW_REQUIRED`.

#### 2.3 Tratamento de Webhooks Não Ordenados e Duplicados
- **Duplicação**: A chave composta `provider_id + provider_event_id` é verificada em transação atómica. Se já existir registro confirmado, o sistema retorna `HTTP 200 OK` silenciosamente sem duplicar lançamentos.
- **Fora de Ordem**: Se um webhook com status `PENDING` chegar após um webhook com status `CONFIRMED`, a máquina de estados rejeita a regressão e preserva o estado de compromisso financeiro.

---

### 3. FRONTEIRA DE NOTIFICAÇÕES (TRANSACTIONAL OUTBOX PATTERN)

Para evitar que falhas ou repetições de entrega de notificações push (FCM) comprometam ou dupliquem transações financeiras:
```
[Operação Financeira Atómica (runTransaction)]
  ├── Posta no Ledger
  ├── Atualiza a Wallet
  └── Insere Evento na Fila Outbox: /outbox_events/{id}
                    │
                    ▼ (Desacoplamento Assíncrono)
[Worker Assíncrono de Notificações (FCM Delivery)]
  ├── Consome evento da Outbox
  ├── Envia notificação ao dispositivo do utilizador
  └── Marca evento como entregue com chave de idempotência
```

---

### 4. FRONTEIRA DO BOOS AI

- O BOOS AI atua exclusivamente como ferramenta consultiva baseada na Google GenAI TypeScript SDK (`@google/genai`).
- **Limitação de Acesso a Dados**: O serviço de IA só recebe dados estruturados e verificados pelo backend (estatísticas de jogos e histórico desportivo homologado).
- **Sem Permissões no Ledger ou Motor de Odds**: O serviço de IA não possui credenciais nem endpoints capazes de emitir transações contábeis, aprovar saques, validar identidades ou alterar cotações.
- Toda consulta é registrada na coleção `/ai_queries` com metadados mínimos para controle de cotas e prevenção de abusos.
