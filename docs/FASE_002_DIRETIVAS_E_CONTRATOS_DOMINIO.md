# BOOS BET — FASE 002: DIRETIVAS E CONTRATOS DE DOMÍNIO
## Especificação Formal de Contratos, Interfaces e Adapters Abstratos

> **Status**: Arquitetura Congelada / Diretivas Aprovadas (PROMPT 002)  
> **Papel**: Executor Técnico  
> **Regra de Ouro**: O cliente apresenta e solicita. O backend autoriza e calcula. O Firestore regista. Provedores externos confirmam eventos.

---

### 1. CONTRATOS DE DOMÍNIO FINANCEIRO (WALLET & LEDGER)

Valores monetários expressos exclusivamente em cêntimos inteiros de Kwanza (`minor units` — Exemplo: 1.000,00 Kz = `100000`).

```typescript
// Domínio: Carteira Financeira
export interface WalletState {
  uid: string;
  currency: 'AOA';
  available_minor: number; // Saldo disponível para apostas
  locked_minor: number;    // Saldo em retenção temporária (ex: levantamento solicitado)
  version: number;         // Optimistic Concurrency Control (OCC)
  status: 'ACTIVE' | 'FROZEN' | 'SUSPENDED';
  updated_at: string;
}

// Domínio: Ledger Imutável (Append-Only)
export type LedgerEntryType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'WITHDRAWAL_LOCK'
  | 'WITHDRAWAL_UNLOCK'
  | 'BET_STAKE'
  | 'BET_WIN'
  | 'BET_LOSS'
  | 'BET_REFUND'
  | 'REVERSAL'
  | 'ADJUSTMENT';

export interface LedgerTransaction {
  transaction_id: string;
  idempotency_key: string;
  uid: string;
  type: LedgerEntryType;
  amount_minor: number; // Positivo para créditos, negativo para débitos
  balance_after_minor: number;
  reference_id: string; // ID do bilhete, transação PSP ou protocolo
  metadata: {
    origin: 'PSP_WEBHOOK' | 'BETTING_ENGINE' | 'COMPLIANCE_OPERATOR' | 'SETTLEMENT_WORKER';
    reason?: string;
    operator_uid?: string;
  };
  created_at: string;
}
```

---

### 2. CONTRATOS DE APOSTAS E SNAPSHOT DE ODDS (BET ENGINE)

O cliente **nunca** define `totalOdds`, `payout` ou `acceptedOdd`.

```typescript
// Payload enviado pelo cliente (Intenção de Aposta)
export interface BetPlacementIntent {
  idempotency_key: string;
  bet_type: 'SINGLE' | 'MULTIPLE' | 'SYSTEM';
  stake_minor: number;
  selections: {
    event_id: string;
    market_id: string;
    selection_id: string;
    client_observed_odd: number; // Informada para detecção de slippage
  }[];
}

// Contrato Oficial do Bilhete Emitido pelo Servidor
export interface OfficialBetTicket {
  ticket_id: string;
  uid: string;
  idempotency_key: string;
  bet_type: 'SINGLE' | 'MULTIPLE' | 'SYSTEM';
  stake_minor: number;
  raw_odds: number;
  bonus_multiplier_percent: number; // Calculado pelo backend com base nas regras ativas
  total_odds: number;               // Odd oficial autorizada
  potential_payout_minor: number;   // Calculado oficialmente pelo backend
  settled_payout_minor: number;     // 0 enquanto PENDING
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID' | 'REFUNDED';
  selections: {
    event_id: string;
    event_title: string;
    market_id: string;
    market_type: string;
    selection_id: string;
    selection_label: string;
    odds_snapshot: number;          // Cota travada no instante do aceite
    event_status: 'NOT_STARTED' | 'LIVE' | 'FINISHED' | 'SUSPENDED';
    match_start_time: string;
    result: 'PENDING' | 'WON' | 'LOST' | 'VOID';
  }[];
  placed_at: string;
  settled_at: string | null;
}
```

---

### 3. ADAPTERS ABSTRATOS PARA PROVEDORES EXTERNOS

#### A. Sports Provider Adapter (Agnóstico ao Fornecedor de Odds)
```typescript
export interface NormalizedEvent {
  provider_event_id: string;
  competition: {
    id: string;
    name: string;
    country: string;
  };
  home_team: string;
  away_team: string;
  start_time: string;
  status: 'SCHEDULED' | 'IN_PLAY' | 'PAUSED' | 'ENDED' | 'SUSPENDED' | 'CANCELLED';
  score?: {
    home: number;
    away: number;
    minute?: number;
  };
}

export interface NormalizedMarket {
  provider_market_id: string;
  event_id: string;
  market_type: '1X2' | 'DOUBLE_CHANCE' | 'OVER_UNDER' | 'BTTS';
  status: 'OPEN' | 'SUSPENDED' | 'SETTLED' | 'CANCELLED';
  outcomes: {
    selection_id: string;
    label: string;
    odd: number;
    probability_implied?: number;
  }[];
}

export interface ISportsProviderAdapter {
  fetchUpcomingEvents(competitionId?: string): Promise<NormalizedEvent[]>;
  fetchLiveEvents(): Promise<NormalizedEvent[]>;
  fetchEventMarkets(eventId: string): Promise<NormalizedMarket[]>;
  getOfficialMatchResult(eventId: string): Promise<{ home: number; away: number; status: string }>;
}
```

#### B. Payment Service Provider (PSP) Adapter (Agnóstico ao Gateway)
```typescript
export interface DepositIntentRequest {
  idempotency_key: string;
  uid: string;
  amount_minor: number;
  method: 'MULTICAIXA_EXPRESS' | 'BANK_TRANSFER' | 'REFERENCE_GPO';
  phone_number?: string;
}

export interface DepositIntentResponse {
  payment_reference_id: string;
  instructions: {
    entity_code?: string;
    reference_number?: string;
    phone_prompt_sent?: boolean;
    expires_at: string;
  };
}

export interface PspWebhookPayload {
  raw_body: string;
  signature: string;
}

export interface VerifiedPspTransaction {
  psp_transaction_id: string;
  idempotency_key: string;
  amount_minor: number;
  status: 'SUCCESS' | 'FAILED' | 'EXPIRED';
  paid_at: string;
}

export interface IPaymentProviderAdapter {
  initiateDeposit(req: DepositIntentRequest): Promise<DepositIntentResponse>;
  validateWebhookSignature(payload: PspWebhookPayload): boolean;
  parseWebhookEvent(payload: PspWebhookPayload): VerifiedPspTransaction;
  requestWithdrawalPayout(tx: { uid: string; amount_minor: number; iban: string }): Promise<{ psp_payout_id: string }>;
}
```

---

### 4. REGRAS DE TRANSIÇÃO E PRESERVAÇÃO DE ARQUIVOS LEGADOS

Os seguintes arquivos são preservados estritamente para consulta e transição sem refatoração neste estágio:
- `server/db/store.ts`
- `server/data/db.json`
- `server/auth/controller.ts`
- `server/sms/` (todos)
- `src/components/FimserWin.tsx`
- `src/components/brand/BoosCasinoArea.tsx`
- `src/components/SmsGatewayModal.tsx`
