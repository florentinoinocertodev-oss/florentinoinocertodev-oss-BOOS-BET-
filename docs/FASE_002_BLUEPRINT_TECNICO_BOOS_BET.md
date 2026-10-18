# BOOS BET — FASE 002: BLUEPRINT TÉCNICO DEFINITIVO
## Arquitetura de Produção, Modelo de Dados, Segurança e Governança Financeira

> **Status**: Documento Arquitetural Congelado para Migração  
> **Versão**: 2.0.0-PROD  
> **Ambiente Alvo**: Firebase (Auth, Firestore, Cloud Functions, Storage, FCM, App Check) + React/Vite SPA  
> **Moeda Oficial**: Kwanza Angolano (`AOA`), indicativo telefónico `+244`  
> **Regra de Ouro**: *O frontend apresenta e solicita. O backend autoriza e calcula. O Firestore regista. Os webhooks confirmam eventos externos.*

---

## 1. ARQUITETURA GERAL DO SISTEMA

```
                              ┌────────────────────────────────────────┐
                              │             CLIENT / SPA               │
                              │        React + Vite (TypeScript)       │
                              │     BOOS BET UI / Presentation Only    │
                              └───────────────────┬────────────────────┘
                                                  │
                                                  │ (Firebase ID Token + App Check Token)
                                                  ▼
                              ┌────────────────────────────────────────┐
                              │         GATEWAY / CLOUD FUNCTIONS      │
                              │         Node.js 20 LTS (TypeScript)    │
                              │   - Autenticação & Custom Claims       │
                              │   - Validação de Esquemas (Zod)        │
                              │   - Idempotência & Controle OCC        │
                              └───────┬──────────────┬───────────────┬─┘
                                      │              │               │
                     ┌────────────────┘              │               └────────────────┐
                     ▼                               ▼                                ▼
       ┌──────────────────────────┐    ┌───────────────────────────┐    ┌───────────────────────────┐
       │   FIRESTORE (DATABASE)   │    │  FIREBASE STORAGE (FILES) │    │  FCM & INTEGRAÇÕES PUSH   │
       │  - Wallets & Ledger      │    │  - Documentos KYC         │    │  - Notificações de Golo   │
       │  - Bets & Tickets        │    │    (Acesso Privado)       │    │  - Liquidação de Apostas  │
       │  - Sports & Odds Feed    │    │  - Assets de Perfil       │    │  - Alertas de Segurança   │
       │  - Audit Logs            │    └───────────────────────────┘    └───────────────────────────┘
       └─────────────┬────────────┘
                     │
                     ├───────────────────────────────────────────────┐
                     ▼                                               ▼
       ┌──────────────────────────┐                    ┌───────────────────────────┐
       │    PAYMENT GATEWAY / PSP │                    │       SPORTS PROVIDER     │
       │  - Multicaixa Express    │                    │  - Feed Oficial de Odds   │
       │  - GPO / Referências     │                    │  - Eventos Ao Vivo        │
       │  - Webhooks Assinados    │                    │  - Liquidação de Placares │
       └──────────────────────────┘                    └───────────────────────────┘
```

### Divisão Estrita de Responsabilidades
| Domínio | Responsabilidade do Frontend (React) | Responsabilidade do Backend (Cloud Functions / Worker) |
|---|---|---|
| **Odds & Mercados** | Exibir cotações recebidas em tempo real | Ingerir feed do provedor desportivo, calcular margem e congelar snapshot no bilhete |
| **Boletim de Apostas** | Capturar intenção de aposta e montante pretendido | Validar se o mercado está aberto, revalidar odds aceitas, calcular retorno potencial oficial |
| **Carteira / Saldo** | Exibir saldo formatado (`AOA 000,00`) | Executar débitos/créditos atómicos com verificação de fundos e registo em Ledger |
| **Depósitos / Levantamentos** | Iniciar solicitação e exibir instruções | Processar webhooks assinados por HMAC do PSP e liquidar fundos |
| **KYC** | Fazer upload de imagens para bucket isolado | Validar hash, registrar status em Firestore e aprovar via painel Compliance |
| **Identidade** | Fornecer interface de login por telefone | Verificar SMS OTP via Firebase Auth e atribuir Custom Claims (`player`, `admin`, etc.) |

---

## 2. ESTRUTURA DO FIRESTORE (COLEÇÕES E ESQUEMAS)

Todas as entidades financeiras utilizam números inteiros em centésimos (`minor units`, onde 100 kz = `10000`) para eliminar erros de arredondamento de ponto flutuante.

```
/users/{uid}
├── /wallet/current                     (Documento da carteira principal)
├── /wallet/ledger/{transactionId}      (Subcoleção imutável de transações financeiras)
├── /kyc/record                         (Dados cadastrais e status de conformidade)
├── /limits/current                     (Limites de jogo responsável: diário, semanal, mensal)
└── /notifications/{notificationId}     (Notificações de apostas e conta)

/bets/{ticketId}                        (Bilhetes de apostas registados)
/events/{eventId}                       (Eventos desportivos ingeridos)
├── /markets/{marketId}                 (Mercados e cotações ativas)
/sports_providers_logs/{logId}          (Logs de ingestão de odds e eventos)
/promotion_rules/{ruleId}               (Regras ativas de Multi-Boost e bónus versionadas)
/payment_transactions/{txId}            (Tentativas de depósito/levantamento iniciadas)
/psp_webhooks_idempotency/{webhookId}   (Registo de webhooks de pagamento processados)
/audit_logs/{auditId}                   (Trilha de auditoria administrativa e financeira)
```

### Esquemas TypeScript Oficiais

```typescript
// 1. Usuário
export interface UserProfileDocument {
  uid: string;
  phone_number: string; // Ex: "+244923456789"
  username: string; // Pseudónimo público (Ex: "ReiDoFutebol")
  avatar_id: string; // "boos_master" | "boos_gold"
  role: 'PLAYER' | 'AGENT' | 'COMPLIANCE' | 'TRADER' | 'SUPERADMIN';
  status: 'ACTIVE' | 'SUSPENDED' | 'SELF_EXCLUDED' | 'BANNED';
  created_at: FirebaseFirestore.Timestamp;
  updated_at: FirebaseFirestore.Timestamp;
}

// 2. Carteira (Entidade Autorizada Apenas por Transação Server-Side)
export interface WalletDocument {
  uid: string;
  currency: 'AOA';
  available_minor: number; // Saldo disponível em cêntimos de Kwanza (Ex: 1500000 = 15.000,00 Kz)
  locked_minor: number;    // Saldo retido em levantamentos pendentes
  bonus_minor: number;     // Saldo de bónus com rollover
  version: number;         // Optimistic Concurrency Control (OCC)
  updated_at: FirebaseFirestore.Timestamp;
}

// 3. Ledger Financeiro (Subcoleção Imutável)
export type LedgerEntryType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'WITHDRAWAL_LOCK'
  | 'WITHDRAWAL_UNLOCK'
  | 'BET_STAKE'
  | 'BET_WIN'
  | 'BET_REFUND'
  | 'BET_VOID'
  | 'PROMO_BONUS'
  | 'ADJUSTMENT_CREDIT'
  | 'ADJUSTMENT_DEBIT'
  | 'REVERSAL';

export interface WalletLedgerDocument {
  id: string;
  uid: string;
  type: LedgerEntryType;
  amount_minor: number;       // Positivo para créditos, negativo para débitos
  balance_after_minor: number; // Saldo pós-transação para auditoria instantânea
  reference_id: string;       // ticketId, pspTransactionId, etc.
  idempotency_key: string;
  metadata: {
    ip?: string;
    operator_uid?: string;
    reason?: string;
  };
  created_at: FirebaseFirestore.Timestamp;
}

// 4. Bilhete de Aposta Oficial
export interface BetTicketDocument {
  id: string;
  uid: string;
  idempotency_key: string;
  bet_type: 'SINGLE' | 'MULTIPLE' | 'SYSTEM';
  stake_minor: number;
  total_odds: number;                 // Calculada exclusivamente pelo backend
  raw_odds: number;                   // Produto das cotas puras
  applied_promotion_id: string | null;// ID da regra em /promotion_rules
  bonus_multiplier_percent: number;   // Ex: 10 para +10% Multi-Boost
  potential_payout_minor: number;     // stake_minor * total_odds
  settled_payout_minor: number;       // Valor real pago após liquidação
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID' | 'REFUNDED' | 'CANCELLED';
  selections: {
    event_id: string;
    event_title: string;
    market_id: string;
    market_type: '1X2' | 'OVER_UNDER' | 'BTTS' | 'DOUBLE_CHANCE';
    selection_id: string;
    selection_label: string;
    odds_snapshot: number;            // Cota oficial travada no momento do aceite
    event_status: 'NOT_STARTED' | 'LIVE' | 'FINISHED' | 'SUSPENDED';
    match_start_time: FirebaseFirestore.Timestamp;
    result: 'PENDING' | 'WON' | 'LOST' | 'VOID';
  }[];
  placed_at: FirebaseFirestore.Timestamp;
  settled_at: FirebaseFirestore.Timestamp | null;
  settled_by: 'AUTOMATED_SETTLEMENT_WORKER' | 'ADMIN_MANUAL' | null;
}
```

---

## 3. FIREBASE AUTH & FLUXO DE IDENTIDADE (+244 TELEMÓVEL)

1. **Autenticação Pura por Telemóvel (+244)**:
   - Utilização do Firebase Phone Auth (`signInWithPhoneNumber`).
   - Verificação via reCAPTCHA Enterprise invisível / App Check.
   - Envio e verificação de código SMS de 6 dígitos gerado pelo Firebase Auth.
2. **Ciclo de Registro do Usuário**:
   - No evento `auth.user().onCreate`:
     - Dispara Cloud Function `onUserCreated`.
     - Gera pseudónimo público aleatório (`Jogador-XXXX`) para blindar anonimato desportivo.
     - Cria documento de perfil `/users/{uid}`.
     - Cria documento de carteira `/users/{uid}/wallet/current` com `available_minor: 0`, `locked_minor: 0`, `version: 1`.
     - Atribui Custom Claim inicial `{ role: 'PLAYER' }`.
3. **Eliminação do Token Legado**:
   - O token manual em `localStorage.getItem('fimser_auth_token')` é **completamente removido**.
   - Toda comunicação com Cloud Functions utiliza o cabeçalho padrão:  
     `Authorization: Bearer <firebase_id_token>`.

---

## 4. CUSTOM CLAIMS & RBAC (ROLE-BASED ACCESS CONTROL)

Nenhuma verificação de permissão administrativa deve ser feita inspecionando o Firestore no cliente. As decisões no Security Rules e nas Cloud Functions dependem estritamente de `request.auth.token.role`:

| Função (Role) | Descrição | Acesso Permitido |
|---|---|---|
| `PLAYER` | Apostador regular | Apostar, consultar sua carteira, depositar, solicitar saque, enviar KYC |
| `AGENT` | Ponto de atendimento local | Consultar saldos de clientes com autorização e emitir vouchers físicos |
| `COMPLIANCE` | Oficial de compliance | Auditar e aprovar/rejeitar documentos de KYC e relatórios de Jogo Responsável |
| `TRADER` | Gestor de riscos desportivos | Suspender mercados de odds, forçar liquidação manual de jogos suspensos |
| `SUPERADMIN` | Administrador master | Configurar regras de bónus, comissões de PSP e auditar logs gerais |

---

## 5. CARTEIRA & LEDGER IMUTÁVEL (AUTORIDADE FINANCEIRA)

### Princípio Contábil da Partida Dobrada
O saldo da carteira (`available_minor`) nunca é alterado por incrementos diretos soltos (`update({ balance: x })`). Toda modificação é acompanhada obrigatoriamente por uma entrada gravada no Ledger:

```
[Entrada de Aposta]
1. Ler /users/{uid}/wallet/current
2. Validar: available_minor >= stake_minor
3. Gerar /users/{uid}/wallet/ledger/{txId}:
   - type: 'BET_STAKE'
   - amount_minor: -stake_minor
   - balance_after_minor: available_minor - stake_minor
4. Atualizar /users/{uid}/wallet/current:
   - available_minor: balance_after_minor
   - version: version + 1
```

---

## 6. IDEMPOTÊNCIA & GESTÃO DE REPETIÇÕES

Para prevenir cobranças duplicadas devido a instabilidades de rede móvel (muito comuns em Angola):
1. O frontend gera um UUID v4 como `idempotencyKey` ao carregar a revisão do bilhete ou solicitar pagamento.
2. A Cloud Function inicia verificando se `/bets` ou `/payment_transactions` já possuem um documento com essa `idempotencyKey`.
3. Se existir:
   - Retorna o resultado já processado anteriormente imediatamente (resposta cacheada idempotente), sem reenviar transação ou debitar saldo novamente.
4. Se não existir:
   - Processa a transação e grava a chave de idempotência atomicamente.

---

## 7. OCC (OPTIMISTIC CONCURRENCY CONTROL) NO FIRESTORE

Para evitar condições de corrida (*race conditions*) caso o apostador submeta duas apostas simultaneamente em abas diferentes:
- Toda transação de carteira utiliza `db.runTransaction()`.
- A função lê a `version` da carteira.
- Na gravação, valida `version == previousVersion`.
- Se a carteira tiver sido alterada concurrentemente, a transação aborta e reexecuta com o saldo atualizado.

---

## 8. SPORTS PROVIDER & INGESTÃO DE DADOS EXTERNOS

1. **Ingestão Isolada**:
   - Um worker de background agendado (`functions.pubsub.schedule('every 1 minutes')` ou webhook de Provedor Oficial de Desporto) ingere o catálogo de partidas.
2. **Normalização**:
   - Padroniza equipas, horários de início e IDs de competições em `/events/{eventId}`.
3. **Snapshots de Odds**:
   - As cotações são salvas com carimbo de data/hora (`odds_updated_at`).
   - O frontend consome os dados exclusivamente de `/events` via snapshots do Firestore.

---

## 9. CICLO DE VIDA DE MERCADOS, ODDS E SLIPPAGE

1. **Suspensão Automática**:
   - Quando um golo ocorre ou o VAR é acionado, o provedor marca `market_status: 'SUSPENDED'`.
   - Nenhuma aposta pode ser confirmada se o mercado estiver suspenso no Firestore no milissegundo do envio.
2. **Validação de Slippage (Tolerância de Variação de Odd)**:
   - O payload enviado pelo cliente contém:
     `client_observed_odds: 1.85`.
   - O servidor verifica a odd atual no momento do aceite:
     - Se `server_odds >= client_observed_odds`: aceita e utiliza a melhor odd em favor do jogador.
     - Se `server_odds < client_observed_odds`: a aposta é rejeitada com erro `ODDS_CHANGED`, devolvendo a nova cotação para confirmação explícita do utilizador.

---

## 10. BET PLACEMENT (COLOCAÇÃO ATÓMICA DE APOSTA)

```typescript
// Fluxo da Callable Cloud Function: placeBetTicket(data)
export async function placeBetTicket(data: PlaceBetRequest, context: CallableContext) {
  // 1. Validar autenticação e status do utilizador
  // 2. Validar esquema da requisição via Zod
  // 3. Executar db.runTransaction:
  //    a) Verificar idempotency_key
  //    b) Verificar disponibilidade de todos os eventos e mercados
  //    c) Ler regras de promoção em /promotion_rules e calcular bónus Multi-Boost
  //    d) Ler carteira do utilizador e verificar fundos
  //    e) Gravar entrada em /users/{uid}/wallet/ledger (BET_STAKE)
  //    f) Atualizar saldo da carteira
  //    g) Criar documento /bets/{ticketId} com status 'PENDING'
  // 4. Retornar Bilhete Registado Oficial
}
```

---

## 11. LIQUIDAÇÃO CONFIÁVEL (SETTLEMENT)

1. **Trigger de Fim de Partida**:
   - Provedor desportivo confirma placar final oficial.
   - Cloud Function `settleEventMatches(eventId, finalScore)` é invocada com permissões de serviço restritas.
2. **Resolução de Bilhetes**:
   - Localiza todos os bilhetes em `/bets` que possuam esse evento com status `PENDING`.
   - Avalia cada prognóstico:
     - Se todas as seleções forem `WON`: marca bilhete como `WON`.
     - Se houver pelo menos uma seleção `LOST`: marca bilhete como `LOST`.
     - Em caso de jogo cancelado: cota do evento vira `1.00` (*VOID*).
3. **Pagamento Automático**:
   - Para bilhetes vencedores (`WON`):
     - Executa transação contábil creditando `potential_payout_minor` na carteira do jogador via Ledger (`BET_WIN`).
     - Emite notificação push via FCM com o resultado da vitória real.

---

## 12. GATEWAY DE PAGAMENTOS (PSP) & DEPÓSITOS EM ANGOLA

1. **Métodos Nacionais**: Multicaixa Express (MCX), Referências Bancárias GPO, Transferência Direta com comprovativo de IBAN.
2. **Webhooks Assinados**:
   - O PSP externo envia notificação HTTP para `/api/webhooks/psp/payment-confirmed`.
   - O backend valida a assinatura digital (HMAC-SHA256) utilizando chave secreta em `functions.config().psp.secret`.
   - Valida a chave de idempotência em `/psp_webhooks_idempotency/{txId}`.
   - Credita o saldo na carteira atomicamente via Ledger (`DEPOSIT`).

---

## 13. FLUXO DE LEVANTAMENTOS (WITHDRAWALS)

1. **Validação Prévia de Conformidade**:
   - Não permitir levantamento se o status de KYC não for `VERIFIED`.
   - Não permitir levantamento caso o valor pretendido exceda os limites de Jogo Responsável.
2. **Bloqueio de Saldo (Escrow)**:
   - No momento do pedido:
     - `available_minor -= amount_minor`
     - `locked_minor += amount_minor`
     - Registra Ledger `WITHDRAWAL_LOCK`.
3. **Dispersão Bancária**:
   - PSP efetua a transferência para o IBAN validado em Angola.
   - Ao receber confirmação do PSP:
     - `locked_minor -= amount_minor`
     - Registra Ledger `WITHDRAWAL`.
   - Se rejeitado pelo banco:
     - Fundos retornam para `available_minor` com Ledger `WITHDRAWAL_UNLOCK`.

---

## 14. KYC & ARMAZENAMENTO PRIVADO NO FIREBASE STORAGE

1. **Estrutura de Armazenamento**:
   - `gs://boosbet-kyc-private/private/kyc/{uid}/document_front_{timestamp}.webp`
   - `gs://boosbet-kyc-private/private/kyc/{uid}/document_back_{timestamp}.webp`
2. **Regras do Storage**:
   - Leitura: apenas usuários com Custom Claim `COMPLIANCE` ou `SUPERADMIN`.
   - Escrita: o próprio usuário autenticado pode subir apenas arquivos de imagem com tamanho máximo de 5MB e MIME `image/jpeg` ou `image/png`.
   - Proibido qualquer acesso público aos documentos.

---

## 15. NOTIFICAÇÕES EM TEMPO REAL & FCM

1. **Tópicos Desportivos**:
   - Inscrição em tópicos FCM: `match_{eventId}` para acompanhar atualizações de jogo.
2. **Notificações Pessoais**:
   - Envio direcionado para o token de dispositivo do utilizador quando:
     - Um bilhete de aposta for ganho (`Vitória Real BOOS BET!`);
     - Um depósito for creditado com sucesso;
     - A análise do KYC for concluída pela equipa.

---

## 16. BOOS AI & PREVISÕES ESTATÍSTICAS

1. **Previsões Protegidas no Backend**:
   - Os cálculos e probabilidades de vitória da IA não residem no navegador.
   - O modelo do Gemini / Interaction API é invocado estritamente via Cloud Function segura server-side.
2. **Controlo de Quotas**:
   - O documento `/users/{uid}/ai_quotas/current` rastreia análises gratuitas (*Free Tier*: 3 análises/dia) vs créditos comprados.
   - Impede requisições ilimitadas diretamente para a API.

---

## 17. JOGO RESPONSÁVEL & LIMITES OBRIGATÓRIOS (+18)

1. **Limites Configuráveis**:
   - Limite Diário de Depósito (AOA);
   - Limite de Perda Semanal (AOA);
   - Limite de Tempo de Sessão.
2. **Autoexclusão**:
   - Opções de 24 horas, 7 dias, 30 dias ou Indefinida.
   - Durante a autoexclusão, qualquer chamada a `placeBetTicket` ou depósito é bloqueada com erro irrecuperável até ao término do prazo.
3. **Mensagem Oficial**:
   - Apenas: *"Apenas maiores de 18 anos. Jogue com moderação."*
   - Todas as menções com números de licença fictícios são permanentemente eliminadas.

---

## 18. AUDIT LOGS (REGISTO DE AUDITORIA IMUTÁVEL)

Documentos em `/audit_logs` possuem escrita autorizada apenas pelo Admin SDK e leitura estritamente restrita a Auditores:
- Todas as alterações manuais em odds;
- Aprovação e rejeição de documentos KYC;
- Ajustes manuais de saldo;
- Suspensão de contas de utilizadores.

---

## 19. REGRAS DE SEGURANÇA DO FIRESTORE (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(uid) {
      return isAuthenticated() && request.auth.uid == uid;
    }

    function hasRole(role) {
      return isAuthenticated() && request.auth.token.role == role;
    }

    function isCompliance() {
      return hasRole('COMPLIANCE') || hasRole('SUPERADMIN');
    }

    function isTrader() {
      return hasRole('TRADER') || hasRole('SUPERADMIN');
    }

    // 1. Perfil Público e Usuários
    match /users/{uid} {
      allow read: if isAuthenticated();
      allow create: if isOwner(uid);
      allow update: if isOwner(uid) && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'status']);
      allow delete: if false;

      // Carteira: NENHUM cliente pode alterar saldos diretamente!
      match /wallet/{docId} {
        allow read: if isOwner(uid);
        allow write: if false; // Apenas Admin SDK / Cloud Functions
      }

      // Ledger: Somente leitura pelo dono, escrita bloqueada
      match /wallet/ledger/{txId} {
        allow read: if isOwner(uid);
        allow write: if false;
      }

      // KYC
      match /kyc/{docId} {
        allow read: if isOwner(uid) || isCompliance();
        allow create: if isOwner(uid);
        allow update: if isCompliance();
        allow delete: if false;
      }
    }

    // 2. Bilhetes de Apostas: Clientes só leem seus próprios bilhetes
    match /bets/{ticketId} {
      allow read: if isAuthenticated() && (resource.data.uid == request.auth.uid || isTrader());
      allow write: if false; // Criado apenas pela Cloud Function placeBetTicket
    }

    // 3. Eventos e Mercados: Leitura pública, escrita apenas Traders
    match /events/{eventId} {
      allow read: if true;
      allow write: if isTrader();

      match /markets/{marketId} {
        allow read: if true;
        allow write: if isTrader();
      }
    }

    // 4. Regras de Promoção e Multi-Boost: Leitura pública, escrita SuperAdmin
    match /promotion_rules/{ruleId} {
      allow read: if true;
      allow write: if hasRole('SUPERADMIN');
    }

    // 5. Auditoria: Totalmente bloqueada para clientes
    match /audit_logs/{auditId} {
      allow read: if hasRole('SUPERADMIN');
      allow write: if false;
    }
  }
}
```

---

## 20. FIREBASE APP CHECK & PROTEÇÃO DE BORDA

1. **Provedores de Atestação**:
   - Web: **reCAPTCHA Enterprise** configurado com domínio oficial.
   - Mobile: **Play Integrity** (Android) e **DeviceCheck / App Attest** (iOS).
2. **Objetivo**:
   - Rejeitar qualquer script automatizado, bot de scraping de odds ou chamada externa que tente invocar as Cloud Functions sem passar pela aplicação oficial BOOS BET.

---

## 21. CATÁLOGO DE CLOUD FUNCTIONS OFICIAIS

| Nome da Função | Tipo | Descrição |
|---|---|---|
| `onUserCreated` | Auth Trigger | Criação de perfil, carteira inicial e claims |
| `placeBetTicket` | HTTPS Callable | Validação, snapshot de odds, débito e registo do bilhete |
| `cancelPendingBet` | HTTPS Callable | Cancelamento voluntário dentro da janela de carência (5 segundos) |
| `settleMatchEvent` | Event Trigger / PubSub | Liquidação de apostas e crédito automático de prémios |
| `initiateDeposit` | HTTPS Callable | Geração de referência Multicaixa / pagamento MCX |
| `handlePspWebhook` | HTTPS Raw (POST) | Processamento de webhooks assinados do provedor de pagamento |
| `requestWithdrawal` | HTTPS Callable | Validação de KYC, retenção em `locked_minor` e pedido de saque |
| `submitKycVerification`| HTTPS Callable | Submissão de documentos para fila de conformidade |
| `reviewKycCompliance` | HTTPS Callable | Aprovação/rejeição por oficial de compliance |
| `queryBoosAiPrediction`| HTTPS Callable | Execução server-side de análise preditiva via Gemini |

---

## 22. REMOÇÃO DEFINITIVA DO FIMSER WIN & CASINO

Para garantir que o produto seja uma plataforma desportiva pura e legítima:
1. **Componentes a Excluir do Código**:
   - `src/components/FimserWin.tsx`
   - `src/components/brand/BoosCasinoArea.tsx`
   - Rotas internas ou sub-abas de `crash` e `casino`.
2. **Higienização de Vocabulário**:
   - Todas as referências a `FIMSER` (como carteira FIMSER ou FimserWin) são substituídas pelo ecossistema oficial **BOOS BET**.
3. **Limpeza da Barra de Navegação e Categorias**:
   - Apenas modalidades desportivas reais (Futebol, Basquetebol, Ténis, MMA, etc.) e a Central de Previsões Inteligentes.

---

## 23. ESTRATÉGIA DE MIGRAÇÃO DO `/api` ANTIGO

1. **Fase Atual (Congelamento)**: Código antigo em funcionamento com o Express mock / in-memory até validação da fundação.
2. **Criação da Camada de Adaptadores (`src/services/adapters/`)**:
   - Criação de adaptadores de serviço com a mesma assinatura do `apiClient`.
   - O frontend continuará a chamar métodos como `apiClient.placeBet()`, mas o adaptador comutará transparentemente para `httpsCallable(functions, 'placeBetTicket')`.
3. **Desativação Gradual**:
   - Remoção de `server.ts` e do mock Express assim que as regras e funções Firebase estiverem provisionadas.

---

## 24. PLANO DE MIGRAÇÃO SEM QUEBRAR A INTERFACE (ZERO REGRESSIONS)

1. **Passo 1**: Manter todos os componentes visuais (`BoosBetSlip`, `BoosLogo`, `BoosCharacter`, `BoosSportsCard`) intactos quanto às suas propriedades estéticas.
2. **Passo 2**: Atualizar as tipagens em `src/types/index.ts` mantendo compatibilidade transitória com campos antigos através de `type aliases` ou getters.
3. **Passo 3**: Eliminar `FimserWin` e `BoosCasinoArea` de `App.tsx`, redirecionando as abas e o fluxo para a experiência desportiva limpa.
4. **Passo 4**: Homologar a compilação contínua com `compile_applet` e `lint_applet` a cada remoção controlada.

---

## 25. ESTRATÉGIA DE TESTES DE PRODUÇÃO

1. **Firebase Emulator Suite**:
   - Teste unitário local das Security Rules com `@firebase/rules-unit-testing`.
   - Garantir que nenhum cliente consegue alterar documentos em `/users/{uid}/wallet`.
2. **Teste de Concorrência de Carteira**:
   - Disparo simulado de 10 apostas concorrentes com o mesmo saldo para certificar que o OCC aborta débitos quando os fundos acabam.
3. **Teste de Slippage**:
   - Envio de bilhete com odd alterada artificialmente para validar a rejeição imediata pelo backend.
4. **Teste de Webhook Falso**:
   - Envio de payload para o webhook do PSP com assinatura HMAC inválida, verificando o bloqueio com `HTTP 401 Unauthorized`.

---

## 26. MATRIZ DE SEGURANÇA & MITIGAÇÃO DE AMEAÇAS (P0 A P3)

| Prioridade | Vetor de Ameaça | Impacto | Mitigação Arquitetural Implementada |
|---|---|---|---|
| **P0** | Manipulação de Odds no Navegador | Risco financeiro crítico | O cliente apenas envia `selectionId`; o backend busca a cotação oficial no Firestore e trava o snapshot |
| **P0** | Débito Concorrente / Double Spend | Saldo negativo do utilizador | Execução de todas as apostas via `runTransaction` com controle OCC e Ledger |
| **P1** | Ataque de Replay em Webhooks de Pagamento | Créditos duplicados de saldo | Registro atómico de `webhookId` em `/psp_webhooks_idempotency` com chave única |
| **P1** | Acesso Não Autorizado a Documentos KYC | Violação grave de privacidade | Documentos armazenados em bucket privado do Firebase Storage com acesso apenas a `COMPLIANCE` |
| **P2** | Automação por Bots e Scraping de Odds | Sobrecarga de infraestrutura | Firebase App Check obrigatório em todas as chamadas de API |
| **P3** | Alegações Regulatórias Falsas | Risco jurídico e de conformidade | Eliminação de números de licença fictícios e padronização para Jogo Responsável +18 |

---

### Conclusão e Próximo Passo
Com este documento técnico devidamente estruturado e congelado, a arquitetura-base do **BOOS BET** fica formalmente definida antes de qualquer alteração destrutiva no código ou provisionamento de SDKs.
