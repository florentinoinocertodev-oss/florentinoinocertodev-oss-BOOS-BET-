/**
 * BOOS BET — Domain Contracts & Abstract Interfaces (FASE 002)
 * Arquivo preparatório de tipos de domínio congelados.
 * Nenhuma alteração no código legado em execução.
 */

// 1. DOMÍNIO FINANCEIRO (Centésimos inteiros de Kwanza / minor units)
export type CurrencyCode = 'AOA';

export interface WalletState {
  uid: string;
  currency: CurrencyCode;
  available_minor: number; // Saldo disponível em cêntimos de Kz (Ex: 100000 = 1.000,00 Kz)
  locked_minor: number;    // Saldo em custódia/retenção
  version: number;         // Optimistic Concurrency Control (OCC)
  status: 'ACTIVE' | 'FROZEN' | 'SUSPENDED';
  updated_at: string;
}

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
  amount_minor: number;
  balance_after_minor: number;
  reference_id: string;
  metadata: {
    origin: 'PSP_WEBHOOK' | 'BETTING_ENGINE' | 'COMPLIANCE_OPERATOR' | 'SETTLEMENT_WORKER';
    reason?: string;
    operator_uid?: string;
  };
  created_at: string;
}

// 2. DOMÍNIO DE APOSTAS & SNAPSHOT DE ODDS
export interface BetSelectionIntent {
  event_id: string;
  market_id: string;
  selection_id: string;
  client_observed_odd: number;
}

export interface BetPlacementIntent {
  idempotency_key: string;
  bet_type: 'SINGLE' | 'MULTIPLE' | 'SYSTEM';
  stake_minor: number;
  selections: BetSelectionIntent[];
}

export interface OfficialBetSelection {
  event_id: string;
  event_title: string;
  market_id: string;
  market_type: string;
  selection_id: string;
  selection_label: string;
  odds_snapshot: number;
  event_status: 'NOT_STARTED' | 'LIVE' | 'FINISHED' | 'SUSPENDED';
  match_start_time: string;
  result: 'PENDING' | 'WON' | 'LOST' | 'VOID';
}

export interface OfficialBetTicket {
  ticket_id: string;
  uid: string;
  idempotency_key: string;
  bet_type: 'SINGLE' | 'MULTIPLE' | 'SYSTEM';
  stake_minor: number;
  raw_odds: number;
  bonus_multiplier_percent: number;
  total_odds: number;
  potential_payout_minor: number;
  settled_payout_minor: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'VOID' | 'REFUNDED';
  selections: OfficialBetSelection[];
  placed_at: string;
  settled_at: string | null;
}

// 3. ADAPTERS ABSTRATOS PARA PROVEDORES EXTERNOS

// 3.1. Provedor Desportivo (Sports Provider Adapter)
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

export interface NormalizedMarketOutcome {
  selection_id: string;
  label: string;
  odd: number;
  probability_implied?: number;
}

export interface NormalizedMarket {
  provider_market_id: string;
  event_id: string;
  market_type: '1X2' | 'DOUBLE_CHANCE' | 'OVER_UNDER' | 'BTTS';
  status: 'OPEN' | 'SUSPENDED' | 'SETTLED' | 'CANCELLED';
  outcomes: NormalizedMarketOutcome[];
}

export interface ISportsProviderAdapter {
  fetchUpcomingEvents(competitionId?: string): Promise<NormalizedEvent[]>;
  fetchLiveEvents(): Promise<NormalizedEvent[]>;
  fetchEventMarkets(eventId: string): Promise<NormalizedMarket[]>;
  getOfficialMatchResult(eventId: string): Promise<{ home: number; away: number; status: string }>;
}

// 3.2. Provedor de Pagamentos (PSP Adapter)
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
