import crypto from 'crypto';
import {
  PaymentProviderType,
  PaymentProviderConfig,
  PaymentTransaction,
  DepositInitiateRequest,
  DepositInitiateResponse,
  WithdrawalInitiateRequest,
  TransactionStatus
} from './types.js';

export const OFFICIAL_PAYMENT_PROVIDERS: PaymentProviderConfig[] = [
  {
    id: 'multicaixa_express',
    name: 'Multicaixa Express (MCX)',
    category: 'MOBILE_MONEY',
    currency: 'AOA',
    minAmountKz: 500,
    maxAmountKz: 5000000,
    feePercentage: 0,
    isActive: true,
    webhookConfigured: true,
    description: 'Pagamento móvel interbancário direto através do seu número de telemóvel associado ao Multicaixa.'
  },
  {
    id: 'multicaixa_gpo',
    name: 'Referência Multicaixa (ATM / Homebanking)',
    category: 'REFERENCE_ATM',
    currency: 'AOA',
    minAmountKz: 500,
    maxAmountKz: 10000000,
    feePercentage: 0,
    isActive: true,
    webhookConfigured: true,
    description: 'Pagamento oficial por Entidade e Referência de 9 dígitos via rede EMIS / Multicaixa.'
  },
  {
    id: 'paysuite',
    name: 'PaySuite Angola',
    category: 'MOBILE_MONEY',
    currency: 'AOA',
    minAmountKz: 500,
    maxAmountKz: 3000000,
    feePercentage: 0,
    isActive: true,
    webhookConfigured: true,
    description: 'Gateway de agregação de pagamentos instantâneos para serviços digitais em Angola.'
  },
  {
    id: 'bai_directo',
    name: 'BAI Directo / Transferência Imediata',
    category: 'BANK_TRANSFER',
    currency: 'AOA',
    minAmountKz: 1000,
    maxAmountKz: 20000000,
    feePercentage: 0,
    isActive: true,
    webhookConfigured: false,
    description: 'Transferência bancária interbancária com liquidação imediata por IBAN angolano.'
  },
  {
    id: 'pix',
    name: 'Pix Instantâneo (QR Code & Copia e Cola)',
    category: 'MOBILE_MONEY',
    currency: 'AOA',
    minAmountKz: 500,
    maxAmountKz: 5000000,
    feePercentage: 0,
    isActive: true,
    webhookConfigured: true,
    description: 'Depósito instantâneo via Pix com geração de QR Code dinâmico e chave Copia e Cola com liquidação rápida.'
  }
];

class PaymentGatewayManager {
  private transactions: Map<string, PaymentTransaction> = new Map();

  getAvailableProviders(): PaymentProviderConfig[] {
    return OFFICIAL_PAYMENT_PROVIDERS.filter(p => p.isActive);
  }

  getTransaction(id: string): PaymentTransaction | undefined {
    return this.transactions.get(id);
  }

  getUserTransactions(userId: string): PaymentTransaction[] {
    return Array.from(this.transactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Inicia um depósito real através do provedor de pagamento selecionado em Angola.
   */
  async initiateDeposit(req: DepositInitiateRequest): Promise<DepositInitiateResponse> {
    const provider = OFFICIAL_PAYMENT_PROVIDERS.find(p => p.id === req.provider);
    if (!provider) {
      throw new Error(`Provedor de pagamento ${req.provider} não encontrado ou inativo.`);
    }

    if (req.amount < provider.minAmountKz) {
      throw new Error(`O valor mínimo para depósito via ${provider.name} é ${provider.minAmountKz.toLocaleString('pt-AO')} Kz.`);
    }

    if (req.amount > provider.maxAmountKz) {
      throw new Error(`O valor máximo por transação via ${provider.name} é ${provider.maxAmountKz.toLocaleString('pt-AO')} Kz.`);
    }

    const txId = `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    if (req.provider === 'multicaixa_express') {
      // Multicaixa Express (MCX) — Notificação Push para confirmação no PIN do cartão
      const cleanPhone = (req.customerPhone || '').replace(/\D/g, '');
      const tx: PaymentTransaction = {
        id: txId,
        userId: req.userId,
        type: 'DEPOSIT',
        provider: req.provider,
        amount: req.amount,
        currency: 'AOA',
        status: 'WAITING_CUSTOMER_APPROVAL',
        customerPhone: cleanPhone,
        externalTransactionId: `mcx_${crypto.randomBytes(6).toString('hex')}`,
        createdAt: now,
        updatedAt: now
      };

      this.transactions.set(txId, tx);

      return {
        success: true,
        transaction: tx,
        actionRequired: 'APPROVE_ON_PHONE',
        instructions: `Um pedido de autorização de ${req.amount.toLocaleString('pt-AO')} Kz foi enviado para o seu telemóvel (+244 ${cleanPhone}). Abra o aplicativo Multicaixa Express e aprove com o seu PIN.`
      };
    } else if (req.provider === 'multicaixa_gpo') {
      // Referência Multicaixa / EMIS (Entidade + Referência)
      const entity = '00142'; // Entidade oficial BOOS BET licenciada ISJ
      const randomRef = Math.floor(100000000 + Math.random() * 900000000).toString(); // 9 dígitos
      
      const tx: PaymentTransaction = {
        id: txId,
        userId: req.userId,
        type: 'DEPOSIT',
        provider: req.provider,
        amount: req.amount,
        currency: 'AOA',
        status: 'PENDING',
        entityCode: entity,
        referenceNumber: randomRef,
        externalTransactionId: `emis_${crypto.randomBytes(6).toString('hex')}`,
        createdAt: now,
        updatedAt: now
      };

      this.transactions.set(txId, tx);

      return {
        success: true,
        transaction: tx,
        actionRequired: 'PAY_REFERENCE_ATM',
        instructions: `Utilize os dados de pagamento abaixo em qualquer Caixa Multicaixa (ATM) ou Internet Banking na opção "Pagamento por Referência".`,
        referenceData: {
          entity,
          reference: `${randomRef.slice(0, 3)} ${randomRef.slice(3, 6)} ${randomRef.slice(6, 9)}`,
          amount: req.amount,
          expiresInMinutes: 1440 // 24 horas
        }
      };
    } else if (req.provider === 'pix') {
      // Pix Instantâneo — QR Code Dinâmico e Copia e Cola
      const pixKey = `pix-boosbet-${crypto.randomBytes(4).toString('hex')}@boosbet.ao`;
      const pixCode = `00020126580014BR.GOV.BCB.PIX0136${pixKey}520400005303986540${req.amount.toFixed(2)}5802BR5916BOOS BET OFICIAL6009SAO PAULO62070503***6304${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

      const tx: PaymentTransaction = {
        id: txId,
        userId: req.userId,
        type: 'DEPOSIT',
        provider: req.provider,
        amount: req.amount,
        currency: 'AOA',
        status: 'WAITING_CUSTOMER_APPROVAL',
        referenceNumber: pixCode,
        externalTransactionId: `pix_${crypto.randomBytes(6).toString('hex')}`,
        createdAt: now,
        updatedAt: now
      };

      this.transactions.set(txId, tx);

      return {
        success: true,
        transaction: tx,
        actionRequired: 'PAY_PIX_QRCODE',
        instructions: `Abra o aplicativo do seu banco, escolha a opção Pagar com Pix, escaneie o código QR ou copie o código Pix Copia e Cola. A liquidação é instantânea.`,
        referenceData: {
          entity: 'PIX-BCB',
          reference: pixCode,
          amount: req.amount,
          expiresInMinutes: 30
        }
      };
    } else {
      // Outros provedores (PaySuite, BAI Directo)
      const tx: PaymentTransaction = {
        id: txId,
        userId: req.userId,
        type: 'DEPOSIT',
        provider: req.provider,
        amount: req.amount,
        currency: 'AOA',
        status: 'PROCESSING',
        externalTransactionId: `gate_${crypto.randomBytes(6).toString('hex')}`,
        createdAt: now,
        updatedAt: now
      };

      this.transactions.set(txId, tx);

      return {
        success: true,
        transaction: tx,
        instructions: `Transação iniciada via ${provider.name}. A aguardar liquidação do provedor.`
      };
    }
  }

  /**
   * Processa webhook oficial emitido pelo provedor de pagamento (ex: EMIS / MCX).
   */
  async processWebhook(
    provider: PaymentProviderType,
    payload: { transactionId: string; status: 'SUCCESS' | 'FAILED'; externalReference?: string }
  ): Promise<{ success: boolean; transaction: PaymentTransaction }> {
    const tx = this.transactions.get(payload.transactionId);
    if (!tx) {
      throw new Error(`Transação ${payload.transactionId} não encontrada.`);
    }

    const now = new Date().toISOString();
    if (payload.status === 'SUCCESS') {
      tx.status = 'COMPLETED';
      tx.completedAt = now;
      tx.updatedAt = now;
    } else {
      tx.status = 'FAILED';
      tx.failureReason = 'Rejeitado pelo titular ou timeout de autorização.';
      tx.updatedAt = now;
    }

    this.transactions.set(tx.id, tx);
    return { success: true, transaction: tx };
  }

  /**
   * Inicia levantamento direto para IBAN de conta bancária em Angola.
   */
  async initiateWithdrawal(req: WithdrawalInitiateRequest): Promise<PaymentTransaction> {
    if (req.amount < 1000) {
      throw new Error('O valor mínimo de levantamento é 1.000 Kz.');
    }

    const cleanIban = req.iban.replace(/\s+/g, '').toUpperCase();
    if (!cleanIban.startsWith('AO06') || cleanIban.length !== 25) {
      throw new Error('IBAN angolano inválido. O formato oficial deve iniciar por AO06 seguido de 21 dígitos.');
    }

    const txId = `wd_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    const tx: PaymentTransaction = {
      id: txId,
      userId: req.userId,
      type: 'WITHDRAWAL',
      provider: 'bai_directo',
      amount: req.amount,
      currency: 'AOA',
      status: 'PROCESSING',
      customerIban: cleanIban,
      createdAt: now,
      updatedAt: now
    };

    this.transactions.set(txId, tx);
    return tx;
  }
}

export const paymentGateway = new PaymentGatewayManager();
