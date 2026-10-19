/**
 * BOOS BET — Serviço de Ciclo de Vida de Depósitos (FIN-004.1)
 * Princípio: No evidence, no compliance claim.
 * 
 * Regra Fundamental: Um pedido de depósito NÃO CREDITA saldo no momento da criação.
 * O crédito só ocorre após confirmação autenticada do prestador financeiro via Journal Entry.
 */

import crypto from 'crypto';
import { FinancialLedgerService } from '../ledger.js';
import { PaymentProviderAdapter, DepositInitiateIntent } from '../types.js';
import { validateMonetaryInput, minorToMajor } from '../money.js';

export interface InternalDepositTransaction {
  id: string;
  userId: string;
  amountMinor: number;
  currency: 'AOA';
  providerId: string;
  status: 'INITIATED' | 'AWAITING_CUSTOMER_ACTION' | 'CONFIRMED' | 'FAILED' | 'EXPIRED';
  externalReference?: string;
  idempotencyKey: string;
  createdAt: string;
  confirmedAt?: string;
  failureReason?: string;
  journalId?: string;
}

export class DepositService {
  private transactions: Map<string, InternalDepositTransaction> = new Map();
  private adapters: Map<string, PaymentProviderAdapter> = new Map();

  constructor(private ledger: FinancialLedgerService) {}

  registerAdapter(adapter: PaymentProviderAdapter) {
    this.adapters.set(adapter.providerId, adapter);
  }

  getTransaction(id: string): InternalDepositTransaction | undefined {
    return this.transactions.get(id);
  }

  /**
   * 1. Iniciação do Pedido de Depósito.
   * Não afeta o saldo do utilizador sob nenhuma circunstância.
   */
  async initiateDeposit(intent: DepositInitiateIntent): Promise<{
    success: boolean;
    transaction?: InternalDepositTransaction;
    instructions: string;
    isAvailable: boolean;
  }> {
    const majorAmount = minorToMajor(intent.amountMinor);
    const validation = validateMonetaryInput(majorAmount);
    if (!validation.isValid) {
      throw new Error(`Validação de depósito falhou: ${validation.errorMessage}`);
    }

    const adapter = this.adapters.get(intent.providerId);
    if (!adapter || !adapter.isConfigured()) {
      return {
        success: false,
        isAvailable: false,
        instructions: `O método de pagamento solicitado (${intent.providerId}) não se encontra homologado ou ativo. Nenhum depósito foi iniciado.`
      };
    }

    const txId = `dep_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    const tx: InternalDepositTransaction = {
      id: txId,
      userId: intent.userId,
      amountMinor: intent.amountMinor,
      currency: intent.currency,
      providerId: intent.providerId,
      status: 'INITIATED',
      idempotencyKey: intent.idempotencyKey,
      createdAt: now
    };

    const initiationResult = await adapter.initiateDeposit(intent);
    if (!initiationResult.success) {
      tx.status = 'FAILED';
      tx.failureReason = initiationResult.instructions;
      this.transactions.set(txId, tx);
      return {
        success: false,
        transaction: tx,
        instructions: initiationResult.instructions,
        isAvailable: true
      };
    }

    tx.status = 'AWAITING_CUSTOMER_ACTION';
    tx.externalReference = initiationResult.externalReference;
    this.transactions.set(txId, tx);

    return {
      success: true,
      transaction: tx,
      instructions: initiationResult.instructions,
      isAvailable: true
    };
  }

  /**
   * 2. Confirmação Autenticada de Depósito (Liquidação Contabilística).
   * Invocado estritamente após verificação criptográfica bem-sucedida de notificação do prestador.
   */
  async confirmDeposit(params: {
    transactionId: string;
    providerId: string;
    externalReference: string;
    verifiedAmountMinor: number;
    idempotencyKey: string;
  }): Promise<{
    success: boolean;
    transaction: InternalDepositTransaction;
    newAvailableBalanceMinor: number;
    alreadyConfirmed: boolean;
  }> {
    const tx = this.transactions.get(params.transactionId);
    if (!tx) {
      throw new Error(`Transação de depósito ${params.transactionId} não encontrada.`);
    }

    // Se já foi confirmada anteriormente, devolver resultado idempotente sem duplicar
    if (tx.status === 'CONFIRMED') {
      const currentBalance = this.ledger.getUserAvailableBalanceMinor(tx.userId);
      return {
        success: true,
        transaction: tx,
        newAvailableBalanceMinor: currentBalance,
        alreadyConfirmed: true
      };
    }

    // Proteção contra adulteração de montante
    if (tx.amountMinor !== params.verifiedAmountMinor) {
      throw new Error(
        `DIVERGÊNCIA DE VALOR DEPOSITADO: O montante autenticado (${params.verifiedAmountMinor}) diverge do montante registrado na transação (${tx.amountMinor}).`
      );
    }

    // Execução do lançamento de partida dobrada no livro-razão
    const { journal } = await this.ledger.executeFinancialTransaction({
      operationId: tx.id,
      operationType: 'DEPOSIT_CONFIRMED',
      idempotencyKey: params.idempotencyKey,
      payloadToHash: { txId: tx.id, amountMinor: tx.amountMinor, ref: params.externalReference },
      postings: [
        {
          accountId: `psp:clearing:${params.providerId}`,
          accountType: 'PSP_CLEARING',
          direction: 'DEBIT',
          amountMinor: tx.amountMinor
        },
        {
          accountId: `wallet:${tx.userId}:available`,
          accountType: 'USER_AVAILABLE',
          ownerUid: tx.userId,
          direction: 'CREDIT',
          amountMinor: tx.amountMinor
        }
      ],
      metadata: {
        origin: 'PSP_WEBHOOK',
        providerId: params.providerId,
        externalReference: params.externalReference,
        userId: tx.userId,
        description: `Depósito confirmado via ${params.providerId} (Ref: ${params.externalReference})`
      }
    });

    tx.status = 'CONFIRMED';
    tx.confirmedAt = new Date().toISOString();
    tx.journalId = journal.journal_id;
    this.transactions.set(tx.id, tx);

    const newBalance = this.ledger.getUserAvailableBalanceMinor(tx.userId);

    return {
      success: true,
      transaction: tx,
      newAvailableBalanceMinor: newBalance,
      alreadyConfirmed: false
    };
  }
}
