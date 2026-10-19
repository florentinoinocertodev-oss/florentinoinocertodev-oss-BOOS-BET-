/**
 * BOOS BET — Contratos Canónicos e Tipos do Livro-Razão Financeiro (FIN-004.1)
 * Princípio: No evidence, no compliance claim.
 */

import { CanonicalCurrency } from './money.js';

// 1. CHART OF ACCOUNTS (Plano de Contas Oficial)
export type CanonicalAccountType =
  | 'USER_AVAILABLE'       // wallet:{uid}:available (Passivo Exigível)
  | 'USER_LOCKED'          // wallet:{uid}:locked (Passivo Segregado para Saque)
  | 'PSP_CLEARING'         // psp:clearing:{psp_id} (Ativo - Direitos a Receber da EMIS/PSP)
  | 'PSP_OUTBOUND'         // psp:outbound:{psp_id} (Passivo Transitório de Saídas)
  | 'HOUSE_ESCROW'         // house:bet_escrow (Custódia de Apostas Ativas)
  | 'HOUSE_REVENUE'        // house:revenue (Receita Operacional / GGR)
  | 'HOUSE_PAYOUT_EXPENSE' // house:payout_expense (Custo Operacional de Prémios)
  | 'SYSTEM_EQUITY_OFFSET';// system:opening_equity (Património Líquido para reconciliação)

export type PostingDirection = 'DEBIT' | 'CREDIT';

export interface LedgerPosting {
  posting_id: string;              // "pst_{uuid}"
  journal_id: string;              // Vínculo ao Journal Entry pai
  account_id: string;              // Ex: "wallet:usr_123:available"
  account_type: CanonicalAccountType;
  owner_uid?: string;              // Preenchido estritamente para contas USER_*
  direction: PostingDirection;
  amount_minor: number;            // Inteiro estrito em cêntimos de Kz (> 0)
  balance_after_minor: number;     // Saldo da conta imediatamente após o lançamento
  created_at: string;
}

export type JournalState = 'COMMITTED' | 'REVERSED';

export type FinancialOperationType =
  | 'DEPOSIT_CONFIRMED'
  | 'WITHDRAWAL_RESERVATION'
  | 'WITHDRAWAL_CONFIRMED'
  | 'WITHDRAWAL_REVERSED'
  | 'BET_STAKE_ESCROW'
  | 'BET_SETTLEMENT_WIN'
  | 'BET_SETTLEMENT_LOSS'
  | 'BET_SETTLEMENT_VOID'
  | 'SERVICE_FEE'
  | 'SYSTEM_RECONCILIATION';

export interface JournalEntry {
  journal_id: string;             // "jnl_{uuid}"
  operation_id: string;           // Identificador de negócio (ex: tx_123, bet_456)
  operation_type: FinancialOperationType;
  idempotency_key: string;        // Chave estrita de unicidade
  state: JournalState;
  currency: CanonicalCurrency;    // 'AOA'
  total_amount_minor: number;     // Soma total de débitos (que é idêntica à de créditos)
  postings: LedgerPosting[];
  metadata: {
    origin: 'PSP_WEBHOOK' | 'BETTING_ENGINE' | 'WITHDRAWAL_ENGINE' | 'AI_SERVICE' | 'OPERATOR';
    provider_id?: string;
    external_reference?: string;
    user_id?: string;
    description: string;
  };
  created_at: string;
  reversed_by_journal_id?: string; // Se estornado, aponta para o voucher de estorno
  reverses_journal_id?: string;    // Se este voucher é estorno de outro anterior
}

// 2. IDEMPOTENCY & TRANSACTION ENVELOPE
export interface IdempotencyRecord {
  idempotency_key: string;
  operation_id: string;
  operation_type: FinancialOperationType;
  payload_hash: string;           // Hash SHA-256 do payload para detetar tampering/reutilização indevida
  journal_id: string;
  status: 'COMMITTED' | 'FAILED';
  response_payload: unknown;
  created_at: string;
}

// 3. ADAPTERS CONTRACT (Gateways de Pagamento)
export type ProviderConfigurationStatus = 
  | 'UNCONFIGURED' 
  | 'CONFIGURED_SANDBOX' 
  | 'CONFIGURED_PRODUCTION';

export interface ProviderCapabilities {
  supportsDeposits: boolean;
  supportsWithdrawals: boolean;
  supportsWebhooks: boolean;
  requiresMtls: boolean;
  currenciesSupported: readonly ['AOA'];
}

export interface DepositInitiateIntent {
  userId: string;
  amountMinor: number;
  currency: CanonicalCurrency;
  providerId: string;
  customerPhone?: string;
  idempotencyKey: string;
}

export interface DepositInitiationResult {
  success: boolean;
  transactionId: string;
  providerStatus: 'AWAITING_CUSTOMER_ACTION' | 'PROCESSING' | 'UNAVAILABLE';
  instructions: string;
  externalReference?: string;
  rawResponse?: unknown;
}

export interface WithdrawalInitiateIntent {
  userId: string;
  amountMinor: number;
  currency: CanonicalCurrency;
  iban: string;
  accountHolderName?: string;
  idempotencyKey: string;
}

export interface WithdrawalInitiationResult {
  success: boolean;
  transactionId: string;
  providerStatus: 'DISPATCHED' | 'QUEUED' | 'REJECTED' | 'UNAVAILABLE';
  instructions: string;
  externalReference?: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  errorCode?: 'MISSING_SIGNATURE' | 'INVALID_SIGNATURE' | 'EXPIRED_TIMESTAMP' | 'PAYLOAD_MISMATCH' | 'PROVIDER_NOT_CONFIGURED';
  transactionId?: string;
  externalStatus?: 'SUCCESS' | 'FAILED' | 'PENDING';
  amountMinor?: number;
  currency?: CanonicalCurrency;
  rawPayload?: unknown;
}

export interface PaymentProviderAdapter {
  readonly providerId: string;
  readonly name: string;
  readonly capabilities: ProviderCapabilities;
  getStatus(): ProviderConfigurationStatus;
  isConfigured(): boolean;

  initiateDeposit(intent: DepositInitiateIntent): Promise<DepositInitiationResult>;
  initiateWithdrawal(intent: WithdrawalInitiateIntent): Promise<WithdrawalInitiationResult>;
  verifyWebhook(rawBody: string | Buffer, headers: Record<string, string>): Promise<WebhookVerificationResult>;
}

// 4. RECONCILIATION CONTRACTS
export type DiscrepancySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type DiscrepancyType =
  | 'INTERNAL_WITHOUT_EXTERNAL'   // Transação no sistema sem registo no extrato do PSP
  | 'EXTERNAL_WITHOUT_INTERNAL'   // Dinheiro recebido no PSP sem registo interno
  | 'AMOUNT_MISMATCH'             // Valor interno diverge do valor liquidado externamente
  | 'CURRENCY_MISMATCH'           // Moeda divergente
  | 'DUPLICATE_EXTERNAL_REF'      // Mesma referência bancária associada a mais de uma operação
  | 'STATE_INCOMPATIBLE'          // Interno diz CONFIRMED, mas PSP diz REJECTED
  | 'TIMED_OUT_UNSETTLED';        // Transação pendente além do SLA do provedor (ex: > 24h)

export interface ReconciliationDiscrepancy {
  discrepancy_id: string;
  type: DiscrepancyType;
  severity: DiscrepancySeverity;
  internal_operation_id?: string;
  external_reference?: string;
  expected_minor?: number;
  actual_minor?: number;
  details: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'WAIVED';
  created_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface ReconciliationReport {
  report_id: string;
  generated_at: string;
  provider_id: string;
  period_start: string;
  period_end: string;
  total_internal_transactions: number;
  total_internal_amount_minor: number;
  total_external_transactions: number;
  total_external_amount_minor: number;
  discrepancies: ReconciliationDiscrepancy[];
  is_balanced: boolean;
}
