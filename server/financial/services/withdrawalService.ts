/**
 * BOOS BET — Serviço de Ciclo de Vida de Levantamentos em Três Etapas (FIN-004.1)
 * Princípio: No evidence, no compliance claim.
 * 
 * Etapa 1 (Reserva): wallet:available -> wallet:locked
 * Etapa 2 (Despacho): Transmissão da ordem bancária ao provedor
 * Etapa 3 (Liquidação/Estorno):
 *   - Se Sucesso: wallet:locked -> psp:outbound (liquidação definitiva)
 *   - Se Falha: wallet:locked -> wallet:available (devolução atómica)
 */

import crypto from 'crypto';
import { FinancialLedgerService } from '../ledger.js';
import { PaymentProviderAdapter, WithdrawalInitiateIntent } from '../types.js';
import { validateMonetaryInput, minorToMajor } from '../money.js';

export interface InternalWithdrawalTransaction {
  id: string;
  userId: string;
  amountMinor: number;
  currency: 'AOA';
  iban: string;
  providerId: string;
  status: 'RESERVED' | 'DISPATCHED' | 'SETTLED' | 'REVERSED';
  reservationJournalId: string;
  settlementJournalId?: string;
  reversalJournalId?: string;
  idempotencyKey: string;
  createdAt: string;
  settledAt?: string;
  failureReason?: string;
}

export class WithdrawalService {
  private transactions: Map<string, InternalWithdrawalTransaction> = new Map();
  private adapters: Map<string, PaymentProviderAdapter> = new Map();

  constructor(private ledger: FinancialLedgerService) {}

  registerAdapter(adapter: PaymentProviderAdapter) {
    this.adapters.set(adapter.providerId, adapter);
  }

  getTransaction(id: string): InternalWithdrawalTransaction | undefined {
    return this.transactions.get(id);
  }

  /**
   * Etapa 1: Reserva Atómica de Fundos (Lock)
   */
  async requestWithdrawalReservation(intent: WithdrawalInitiateIntent, providerId: string): Promise<{
    success: boolean;
    transaction: InternalWithdrawalTransaction;
    remainingAvailableMinor: number;
  }> {
    const majorAmount = minorToMajor(intent.amountMinor);
    const validation = validateMonetaryInput(majorAmount);
    if (!validation.isValid) {
      throw new Error(`Validação de levantamento falhou: ${validation.errorMessage}`);
    }

    // Validação de formato de IBAN angolano (AO06 + 21 dígitos)
    const cleanIban = intent.iban.replace(/\s+/g, '').toUpperCase();
    if (!cleanIban.startsWith('AO06') || cleanIban.length !== 25) {
      throw new Error('IBAN angolano inválido. Deve iniciar por AO06 seguido de exatamente 21 dígitos numéricos.');
    }

    const txId = `wd_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    // Executa Lançamento Contabilístico de Reserva:
    // DÉBITO wallet:available (diminui disponível) / CRÉDITO wallet:locked (aumenta cativo)
    const { journal } = await this.ledger.executeFinancialTransaction({
      operationId: txId,
      operationType: 'WITHDRAWAL_RESERVATION',
      idempotencyKey: intent.idempotencyKey,
      payloadToHash: { txId, amountMinor: intent.amountMinor, iban: cleanIban, userId: intent.userId },
      postings: [
        {
          accountId: `wallet:${intent.userId}:available`,
          accountType: 'USER_AVAILABLE',
          ownerUid: intent.userId,
          direction: 'DEBIT',
          amountMinor: intent.amountMinor
        },
        {
          accountId: `wallet:${intent.userId}:locked`,
          accountType: 'USER_LOCKED',
          ownerUid: intent.userId,
          direction: 'CREDIT',
          amountMinor: intent.amountMinor
        }
      ],
      metadata: {
        origin: 'WITHDRAWAL_ENGINE',
        userId: intent.userId,
        description: `Reserva para levantamento bancário para IBAN ${cleanIban}`
      }
    });

    const tx: InternalWithdrawalTransaction = {
      id: txId,
      userId: intent.userId,
      amountMinor: intent.amountMinor,
      currency: intent.currency,
      iban: cleanIban,
      providerId,
      status: 'RESERVED',
      reservationJournalId: journal.journal_id,
      idempotencyKey: intent.idempotencyKey,
      createdAt: now
    };

    this.transactions.set(txId, tx);

    const remainingAvailable = this.ledger.getUserAvailableBalanceMinor(intent.userId);

    return {
      success: true,
      transaction: tx,
      remainingAvailableMinor: remainingAvailable
    };
  }

  /**
   * Etapa 2: Despacho ao Provedor Bancário
   */
  async dispatchWithdrawal(txId: string): Promise<{ success: boolean; message: string }> {
    const tx = this.transactions.get(txId);
    if (!tx || tx.status !== 'RESERVED') {
      throw new Error(`Transação ${txId} em estado inválido para despacho (atual: ${tx?.status}).`);
    }

    const adapter = this.adapters.get(tx.providerId);
    if (!adapter || !adapter.isConfigured()) {
      // Falha imediata de provedor: reverter reserva atómica
      await this.finalizeWithdrawal(txId, 'FAILED', `Provedor ${tx.providerId} não configurado.`);
      return {
        success: false,
        message: `Provedor de liquidação ${tx.providerId} não configurado. Reserva libertada de volta para a carteira.`
      };
    }

    const dispatchResult = await adapter.initiateWithdrawal({
      userId: tx.userId,
      amountMinor: tx.amountMinor,
      currency: tx.currency,
      iban: tx.iban,
      idempotencyKey: `dispatch_${tx.idempotencyKey}`
    });

    if (!dispatchResult.success) {
      await this.finalizeWithdrawal(txId, 'FAILED', dispatchResult.instructions);
      return { success: false, message: dispatchResult.instructions };
    }

    tx.status = 'DISPATCHED';
    this.transactions.set(tx.id, tx);

    return { success: true, message: 'Ordem de levantamento transmitida ao provedor bancário.' };
  }

  /**
   * Etapa 3: Liquidação Definitiva ou Devolução Compensatória
   */
  async finalizeWithdrawal(
    txId: string,
    outcome: 'SUCCESS' | 'FAILED',
    failureReason?: string
  ): Promise<InternalWithdrawalTransaction> {
    const tx = this.transactions.get(txId);
    if (!tx) {
      throw new Error(`Transação de levantamento ${txId} não encontrada.`);
    }

    if (tx.status === 'SETTLED' || tx.status === 'REVERSED') {
      return tx; // Idempotente
    }

    if (outcome === 'SUCCESS') {
      // Liquidação Definitiva:
      // DÉBITO wallet:locked (extingue passivo do jogador)
      // CRÉDITO psp:outbound (reconhece saída para o banco)
      const { journal } = await this.ledger.executeFinancialTransaction({
        operationId: `settle_${tx.id}`,
        operationType: 'WITHDRAWAL_CONFIRMED',
        idempotencyKey: `settle_${tx.idempotencyKey}`,
        payloadToHash: { txId: tx.id, status: 'SUCCESS' },
        postings: [
          {
            accountId: `wallet:${tx.userId}:locked`,
            accountType: 'USER_LOCKED',
            ownerUid: tx.userId,
            direction: 'DEBIT',
            amountMinor: tx.amountMinor
          },
          {
            accountId: `psp:outbound:${tx.providerId}`,
            accountType: 'PSP_OUTBOUND',
            direction: 'CREDIT',
            amountMinor: tx.amountMinor
          }
        ],
        metadata: {
          origin: 'WITHDRAWAL_ENGINE',
          userId: tx.userId,
          description: `Liquidação definitiva de levantamento para IBAN ${tx.iban}`
        }
      });

      tx.status = 'SETTLED';
      tx.settlementJournalId = journal.journal_id;
      tx.settledAt = new Date().toISOString();
    } else {
      // Falha: Devolução Atómica Compensatória:
      // DÉBITO wallet:locked (baixa custódia)
      // CRÉDITO wallet:available (restaura saldo desimpedido do jogador)
      const { journal } = await this.ledger.executeFinancialTransaction({
        operationId: `revert_${tx.id}`,
        operationType: 'WITHDRAWAL_REVERSED',
        idempotencyKey: `revert_${tx.idempotencyKey}`,
        payloadToHash: { txId: tx.id, status: 'FAILED', reason: failureReason },
        postings: [
          {
            accountId: `wallet:${tx.userId}:locked`,
            accountType: 'USER_LOCKED',
            ownerUid: tx.userId,
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
          origin: 'WITHDRAWAL_ENGINE',
          userId: tx.userId,
          description: `Libertação de reserva por rejeição bancária: ${failureReason || 'Recusado'}`
        }
      });

      tx.status = 'REVERSED';
      tx.reversalJournalId = journal.journal_id;
      tx.failureReason = failureReason || 'Falha na liquidação bancária.';
    }

    this.transactions.set(tx.id, tx);
    return tx;
  }
}
