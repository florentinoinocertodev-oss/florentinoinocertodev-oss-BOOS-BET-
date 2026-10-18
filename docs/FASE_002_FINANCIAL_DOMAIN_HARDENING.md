# BOOS BET — FASE 002: FINANCIAL DOMAIN HARDENING
## Especificação Canónica da Arquitetura Contábil, Invariantes e Modelo de Liquidação

> **Status**: Especificação Formal de Segunda Ordem (PROMPT 004)  
> **Papel**: Executor / Construtor Técnico  
> **Princípio Fundamental**: Contabilidade de Partida Dobrada Estrita, Escala Canónica Inteira e Imutabilidade.

---

### 1. SISTEMA CONTÁBIL DE PARTIDA DOBRADA (DOUBLE-ENTRY BOOKKEEPING)

#### Hierarquia Conceitual
```
Business Transaction (Operação de Negócio: ftx_xxx)
         │
         ▼
Journal Entry (Voucher Contábil Atómico: jnl_xxx)
         │
    ┌────┴────┐
    ▼         ▼
Ledger Entry Ledger Entry (Linhas de Partida Dobrada: led_xxx)
(DEBIT)      (CREDIT)
    │         │
    ▼         ▼
Account A    Account B (Contas de Usuário ou da Casa)
```

#### Regra da Conservação de Valor
Para qualquer `JournalEntry` com status `COMMITTED`:
$$\sum \text{Amount}_{\text{DEBIT}} = \sum \text{Amount}_{\text{CREDIT}}$$
Nenhum centésimo de Kwanza pode ser criado ou debitado sem uma contrapartida idêntica no mesmo Journal Entry.

---

### 2. PLANO DE CONTAS DA PLATAFORMA (CHART OF ACCOUNTS)

| Identificador Canónico da Conta (`account_id`) | Categoria | Natureza Contábil | Descrição |
|---|---|---|---|
| `wallet:{uid}:available` | Usuário | Passivo da Casa (*Liability*) | Saldo desimpedido do jogador para apostas ou levantamento |
| `wallet:{uid}:locked` | Usuário | Passivo da Casa (*Liability*) | Saldo do jogador reservado em processo de levantamento |
| `house:bet_escrow` | Casa | Passivo Transitório (*Escrow*) | Custódia dos stakes de apostas ativas aguardando liquidação |
| `house:revenue` | Casa | Receita (*GGR - Gross Gaming Revenue*) | Lucro bruto retido de apostas perdidas pelos jogadores |
| `house:capital` | Casa | Património Líquido / Reserva | Fundo de reserva e liquidez para pagamento de prémios líquidos |
| `psp:clearing:{psp_id}` | Externo | Ativo Circulante (*Receivables*) | Valores recebidos de depósitos de jogadores via PSP |
| `psp:outbound:{psp_id}` | Externo | Ativo Transitório | Valores em trânsito no banco/PSP para liquidação de saques |

---

### 3. MODELO DE TRANSAÇÕES E LANÇAMENTOS DO JOURNAL

```typescript
export interface JournalEntry {
  journal_id: string;               // "jnl_{uuid}"
  transaction_id: string;          // Vínculo com a Business Transaction ("ftx_{uuid}")
  transaction_group_id: string;    // Agrupa operações correlatas (ex: saque pedido + saque pago)
  idempotency_key: string;
  state: 'COMMITTED' | 'REVERSED';
  currency: 'AOA';
  total_amount_minor: number;      // Soma total dos débitos (que é idêntica à dos créditos)
  postings: LedgerPosting[];
  created_at: string;
}

export interface LedgerPosting {
  posting_id: string;              // "pst_{uuid}"
  account_id: string;              // Ex: "wallet:usr_123:available" ou "house:bet_escrow"
  account_type: 'USER_AVAILABLE' | 'USER_LOCKED' | 'HOUSE_ESCROW' | 'HOUSE_REVENUE' | 'HOUSE_CAPITAL' | 'PSP_CLEARING' | 'PSP_OUTBOUND';
  owner_uid?: string;              // Preenchido APENAS quando account_type for USER_*
  direction: 'DEBIT' | 'CREDIT';
  amount_minor: number;            // Inteiro estrito > 0
  balance_after_minor: number;     // Saldo da conta específica imediatamente após o lançamento
}
```

---

### 4. MATRIZ DE MOVIMENTAÇÕES CONTÁBEIS PADRONIZADAS

#### A. Depósito Confirmado via PSP (Ex: 10.000,00 Kz)
- **Débito**: `psp:clearing:appypay` $\rightarrow$ `1.000.000 minor`
- **Crédito**: `wallet:{uid}:available` $\rightarrow$ `1.000.000 minor`
- *Equilíbrio*: Débito = Crédito = 10.000,00 Kz.

#### B. Colocação de Aposta (Ex: Stake de 5.000,00 Kz)
- **Débito**: `wallet:{uid}:available` $\rightarrow$ `500.000 minor`
- **Crédito**: `house:bet_escrow` $\rightarrow$ `500.000 minor`
- *Nota*: `locked_minor` do usuário **NÃO** é afetado. O valor sai da carteira e entra na custódia de apostas da casa.

#### C. Liquidação de Aposta Perdida (Stake de 5.000,00 Kz)
- **Débito**: `house:bet_escrow` $\rightarrow$ `500.000 minor`
- **Crédito**: `house:revenue` $\rightarrow$ `500.000 minor`
- *Nota*: A carteira do jogador não sofre alteração nesta fase (o stake já havia saído). O escrow é transferido para receita da casa.

#### D. Liquidação de Aposta Vencedora (Stake 5.000 Kz, Odd 3.00, Payout 15.000 Kz)
- **Débito**: `house:bet_escrow` $\rightarrow$ `500.000 minor` (devolução do stake)
- **Débito**: `house:capital` $\rightarrow$ `1.000.000 minor` (lucro líquido pago pela casa)
- **Crédito**: `wallet:{uid}:available` $\rightarrow$ `1.500.000 minor` (payout integral do bilhete)
- *Equilíbrio*: Débito Total ($500.000 + 1.000.000$) = Crédito Total ($1.500.000$).

#### E. Aposta Anulada / Cancelada (VOID - Retorno de 5.000,00 Kz)
- **Débito**: `house:bet_escrow` $\rightarrow$ `500.000 minor`
- **Crédito**: `wallet:{uid}:available` $\rightarrow$ `500.000 minor`
- *Equilíbrio*: Débito = Crédito = 5.000,00 Kz.

#### F. Fluxo de Levantamento (Saque de 20.000,00 Kz)
- **Fase 1 (Solicitação pelo Jogador)**:
  - Débito: `wallet:{uid}:available` $\rightarrow$ `2.000.000 minor`
  - Crédito: `wallet:{uid}:locked` $\rightarrow$ `2.000.000 minor`
- **Fase 2 (Envio para Processamento Bancário no PSP)**:
  - Débito: `wallet:{uid}:locked` $\rightarrow$ `2.000.000 minor`
  - Crédito: `psp:outbound:appypay` $\rightarrow$ `2.000.000 minor`
- **Fase 3a (Sucesso na Transferência - Confirmação do PSP)**:
  - Débito: `psp:outbound:appypay` $\rightarrow$ `2.000.000 minor`
  - Crédito: `psp:clearing:appypay` $\rightarrow$ `2.000.000 minor` (baixa definitiva)
- **Fase 3b (Falha Bancária / IBAN Rejeitado)**:
  - Débito: `psp:outbound:appypay` $\rightarrow$ `2.000.000 minor`
  - Crédito: `wallet:{uid}:available` $\rightarrow$ `2.000.000 minor` (estorno para o saldo do jogador com notificação)

---

### 5. MODELO DE LIQUIDAÇÃO BASEADO EM REGRAS DE MERCADO (`MarketSettlementRule`)

Proibida qualquer simplificação como *"adiado por 24h = anulação automática"*. Cada mercado obedece a uma política formal de resolução:

```typescript
export interface MarketSettlementRule {
  market_type: '1X2' | 'DOUBLE_CHANCE' | 'OVER_UNDER' | 'BTTS' | 'DRAW_NO_BET' | 'HALF_TIME_RESULT';
  period_scope: 'REGULAR_TIME_90M' | 'FIRST_HALF' | 'SECOND_HALF' | 'EXTRA_TIME' | 'FULL_MATCH_INC_ET';
  unconditional_resolution_supported: boolean;
  abandonment_policy: 'ABANDONMENT_DETERMINED_OR_VOID' | 'POSTPONEMENT_48H_WAIT' | 'IMMEDIATE_VOID';
}
```

#### Regras de Resolução Incondicional
1. **Mercados Concluídos antes da Interrupção**:
   - Se uma partida for abandonada aos 68' com placar 2-1:
     - Mercado *Total de Golos Mais de 2.5*: **WON** (o evento já se concretizou fisicamente).
     - Mercado *Total de Golos Menos de 2.5*: **LOST** (impossível de reverter).
     - Mercado *Resultado aos 90m (1X2)*: **VOID** (não atingiu o tempo regulamentar estipulado pela regra do mercado).
2. **Mercado de Intervalo (*Half-Time*)**:
   - Se o primeiro tempo foi finalizado normalmente pelo árbitro (1-0), todas as apostas em mercados de 1º Tempo são liquidadas como **COMMITTED**, mesmo que a partida inteira seja cancelada durante o 2º tempo.
3. **Adiamentos (*Postponements*)**:
   - A partida aguarda até ao limite oficial da competição (ex: 48 horas). Somente após declaração de cancelamento sem remarcação pela entidade organizadora o mercado emite resolução `VOID`.

---

### 6. CADEIA DE HOMOLOGAÇÃO E VERSIONAMENTO DE SETTLEMENT

```
PROVIDER_RESULT (Evento do feed desportivo externo)
       │
       ▼
SETTLEMENT_VALIDATION (Validação de conformidade contra regras de mercado)
       │
       ▼
SETTLEMENT_HOMOLOGATED (Versão v1 gravada oficialmente no Firestore)
       │
       ▼ (Apenas em caso de correção de súmula oficial pelo regulador)
SETTLEMENT_REVISION (Versão v2 vinculada via transaction_group_id com Journal de compensação)
```

- Cada documento de liquidação possui `settlement_version: number` (iniciando em 1).
- Se houver retificação do resultado pelo órgão oficial (ex: VAR pós-jogo homologado pela federação):
  - A revisão é registrada com `settlement_version: 2`.
  - O sistema gera um `JournalEntry` de compensação com `state: 'REVERSED'`.
  - O bilhete nunca tem seu registro original sobrescrito; é anexada a decisão de homologação retificada.

---

### 7. LIMITES MATEMÁTICOS DE SEGURANÇA E PREVENÇÃO DE OVERFLOW

Em JavaScript/TypeScript, $Number.MAX\_SAFE\_INTEGER = 2^{53} - 1 = 9.007.199.254.740.991$. Para garantir que nenhuma multiplicação de cotações em acumuladores exceda os inteiros seguros ou cause perda de precisão:

```typescript
export const FINANCIAL_BOUNDS = {
  MONETARY_SCALE: 100,           // 1 Kz = 100 minor units
  ODDS_SCALE: 1000,               // 1.85 = 1850 odds_milli
  MAX_SELECTIONS_PER_TICKET: 20,  // Máximo de 20 jogos por boletim múltiplo
  MAX_ODD_MILLI_PER_SELECTION: 1_000_000, // Cota máxima individual: 1.000,00
  MAX_TOTAL_ODDS_MILLI: 5_000_000,        // Cota máxima acumulada: 5.000,00
  MIN_STAKE_MINOR: 10_000,                // Aposta mínima: 100,00 Kz (10000 minor)
  MAX_STAKE_MINOR: 100_000_000,           // Aposta máxima: 1.000.000,00 Kz
  MAX_POTENTIAL_PAYOUT_MINOR: 5_000_000_000, // Payout máximo: 50.000.000,00 Kz
} as const;
```

#### Multiplicação Determinística com BigInt
Para evitar overflow transitório durante a multiplicação em cadeia de até 20 seleções:
```typescript
function calculateAccumulatorOdds(oddsMilliList: number[]): number {
  if (oddsMilliList.length === 0) return 0;
  
  // Utilização obrigatória de BigInt para o produto acumulado
  let product = BigInt(oddsMilliList[0]);
  const divisor = BigInt(1000);

  for (let i = 1; i < oddsMilliList.length; i++) {
    product = (product * BigInt(oddsMilliList[i])) / divisor;
  }

  const result = Number(product);
  
  if (!Number.isSafeInteger(result) || result > FINANCIAL_BOUNDS.MAX_TOTAL_ODDS_MILLI) {
    return FINANCIAL_BOUNDS.MAX_TOTAL_ODDS_MILLI;
  }

  return result;
}
```

---

### 8. CICLO DE VIDA E RETENÇÃO DE IDEMPOTÊNCIA

A chave de idempotência é separada estritamente do registro contábil permanente:

| Escopo da Chave | Política de Retenção (TTL) | Justificativa |
|---|---|---|
| `BET_PLACEMENT` | 72 horas | Previne repetições de cliques ou reenvio de rede do jogador |
| `WALLET_WITHDRAWAL` | 30 dias | Cobre fila de autorização bancária e reenvio de requisições |
| `PSP_WEBHOOK` | 90 dias | Cobre disputas financeiras e reconciliação com o extrato bancário do adquirente |
| `MATCH_SETTLEMENT` | **PERMANENTE (Sem TTL)** | Uma partida jamais pode ser liquidada duas vezes na história do sistema |

#### Estrutura Tipada da Resposta Cacheada
```typescript
export interface IdempotencyCachedReceipt {
  operation_type: 'BET_PLACED' | 'DEPOSIT_PROCESSED' | 'WITHDRAWAL_QUEUED' | 'SETTLEMENT_COMMITTED';
  reference_id: string;        // ID do bilhete ou da transação
  committed_at: string;
  financial_summary: {
    amount_minor: number;
    new_available_minor: number;
    currency: 'AOA';
  };
}
```
*Proibido armazenar tokens, senhas, headers HTTP, nomes de arquivo ou payloads brutos dentro do registro de idempotência.*

---

### 9. FRONTEIRA DE AUTORIZAÇÃO E SEGURANÇA DO KYC

- **Upload Binário Protegido**: Realizado diretamente para o Firebase Storage em caminho isolado `private/kyc/{uid}/{case_id}/{document_side}.jpg`.
- **Regras do Storage**:
  - `allow write: if request.auth.uid == uid && request.resource.size < 5 * 1024 * 1024 && request.resource.contentType.matches('image/(jpeg|png|webp)');`
  - `allow read: if request.auth.uid == uid || request.auth.token.role == 'COMPLIANCE';`
  - Proibido qualquer acesso público. Nenhuma URL assinada pública permanente é gerada.
- **Fronteira no Firestore**:
  - O cliente **NÃO PODE** criar nem alterar diretamente o status de documentos em `/users/{uid}/kyc`.
  - A inicialização do caso é gerada pela Callable `requestKycSubmission`.
  - A aprovação/rejeição é autorizada exclusivamente pela Callable `reviewKycCase` restrita a operadores com a Custom Claim `COMPLIANCE`.

---

### 10. MATRIZ DE FALHAS, RETRY E CONCORRÊNCIA

| Cenário de Concorrência | Mecanismo de Defesa | Comportamento do Sistema |
|---|---|---|
| **2 Apostas Simultâneas disputando o saldo restante** | `db.runTransaction` com OCC | A primeira aposta debita o saldo e incrementa `version`. A segunda transação detecta conflito de versão, reexecuta, valida saldo insuficiente e rejeita sem saldo negativo. |
| **Aposta simultânea com Webhook de Depósito** | `db.runTransaction` atómica | O Firestore serializa as transações. O depósito é creditado primeiro ou a aposta avalia o saldo antes do crédito; nenhuma escrita é sobrescrita. |
| **Retry de rede do cliente no envio da aposta** | Idempotência SHA-256 | A função identifica a mesma chave e mesmo hash, retornando o bilhete já gerado sem debitar a carteira novamente. |
| **Retry com mesma chave mas aposta modificada** | Idempotência Hash Mismatch | Retorna imediatamente `HTTP 409 Conflict` por colisão de chave de idempotência com payload divergente. |
| **Timeout de Cloud Function durante aposta** | Transação Rollback | Se a função cair antes de gravar o Journal, nada é debitado. Se cair após, o retry do cliente recupera o bilhete via chave de idempotência. |

---

### 11. MODELO DE RECONCILIAÇÃO CONTÁBIL (AUDITORIA DIÁRIA)

Uma Cloud Function agendada (`dailyFinancialReconciliation`) executa a cada 24 horas a verificação da equação geral de solvência da plataforma:

$$\sum \text{Wallet Available} + \sum \text{Wallet Locked} + \text{House Escrow} + \text{House Revenue} = \sum \text{PSP Clearing Balances} - \sum \text{Disbursed Payouts}$$

Se a equação apresentar discrepância diferente de zero:
1. Alerta de severidade máxima emitido para a equipa financeira.
2. Bloqueio automático de saques não supervisionados.
3. Geração de log forense na coleção `/audit_logs`.
