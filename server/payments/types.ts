/**
 * BOOS BET — Production Payment Gateway Architecture (Angola)
 * Regulado pelo Instituto de Supervisão de Jogos (ISJ)
 */

export type PaymentProviderType = 
  | 'multicaixa_express' 
  | 'multicaixa_gpo' 
  | 'paysuite' 
  | 'appypay' 
  | 'bai_directo'
  | 'pix';

export type PaymentMethodCategory = 'MOBILE_MONEY' | 'REFERENCE_ATM' | 'BANK_TRANSFER';

export type TransactionStatus = 
  | 'PENDING' 
  | 'WAITING_CUSTOMER_APPROVAL' 
  | 'PROCESSING' 
  | 'COMPLETED' 
  | 'FAILED' 
  | 'CANCELLED' 
  | 'EXPIRED';

export interface PaymentProviderConfig {
  id: PaymentProviderType;
  name: string;
  category: PaymentMethodCategory;
  currency: 'AOA';
  minAmountKz: number;
  maxAmountKz: number;
  feePercentage: number;
  isActive: boolean;
  webhookConfigured: boolean;
  description: string;
}

export interface PaymentTransaction {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  provider: PaymentProviderType;
  amount: number;
  currency: 'AOA';
  status: TransactionStatus;
  customerPhone?: string;
  customerIban?: string;
  // EMIS / Multicaixa specific fields
  referenceNumber?: string;
  entityCode?: string;
  externalTransactionId?: string;
  providerResponseCode?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failureReason?: string;
}

export interface DepositInitiateRequest {
  userId: string;
  amount: number;
  provider: PaymentProviderType;
  customerPhone?: string;
}

export interface DepositInitiateResponse {
  success: boolean;
  transaction: PaymentTransaction;
  actionRequired?: 'APPROVE_ON_PHONE' | 'PAY_REFERENCE_ATM' | 'REDIRECT_URL' | 'PAY_PIX_QRCODE';
  instructions: string;
  referenceData?: {
    entity: string;
    reference: string;
    amount: number;
    expiresInMinutes: number;
  };
}

export interface WithdrawalInitiateRequest {
  userId: string;
  amount: number;
  iban: string;
  accountHolderName?: string;
}

export interface IPaymentAdapter {
  readonly providerId: PaymentProviderType;
  readonly name: string;
  isConfigured(): boolean;
  initiateDeposit(req: DepositInitiateRequest): Promise<DepositInitiateResponse>;
  verifyTransaction(transactionId: string): Promise<PaymentTransaction>;
  handleWebhook(payload: any, signature?: string): Promise<{ success: boolean; transactionId: string; newStatus: TransactionStatus }>;
  initiateWithdrawal(req: WithdrawalInitiateRequest): Promise<{ success: boolean; transactionId: string; message: string }>;
}
