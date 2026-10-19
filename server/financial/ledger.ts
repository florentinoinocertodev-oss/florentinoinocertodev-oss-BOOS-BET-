/**
 * BOOS BET — Livro-Razão Contabilístico de Partidas Dobradas (FIN-004.1)
 * Princípio: No evidence, no compliance claim.
 * 
 * Invariante Contabilístico Fundamental:
 * Para todo e qualquer JournalEntry com estado COMMITTED:
 * sum(Amount_DEBIT) == sum(Amount_CREDIT)
 */

import crypto from 'crypto';
import {
  JournalEntry,
  LedgerPosting,
  IdempotencyRecord,
  FinancialOperationType,
  CanonicalAccountType,
  PostingDirection
} from './types.js';
import { CANONICAL_CURRENCY, safeAddMinor, safeSubtractMinor } from './money.js';

export interface ExecuteTransactionParams {
  operationId: string;
  operationType: FinancialOperationType;
  idempotencyKey: string;
  payloadToHash: unknown;
  postings: Array<{
    accountId: string;
    accountType: CanonicalAccountType;
    ownerUid?: string;
    direction: PostingDirection;
    amountMinor: number;
  }>;
  metadata: {
    origin: 'PSP_WEBHOOK' | 'BETTING_ENGINE' | 'WITHDRAWAL_ENGINE' | 'AI_SERVICE' | 'OPERATOR';
    provider_id?: string;
    providerId?: string;
    external_reference?: string;
    externalReference?: string;
    user_id?: string;
    userId?: string;
    description: string;
  };
}

export class FinancialLedgerService {
  private journals: Map<string, JournalEntry> = new Map();
  private idempotencyRegistry: Map<string, IdempotencyRecord> = new Map();
  private accountBalances: Map<string, number> = new Map(); // account_id -> balance_minor
  private userLocks: Map<string, Promise<void>> = new Map(); // Mutex per user to prevent concurrent race conditions

  /**
   * Obtém o saldo atual de qualquer conta do plano de contas
   */
  getAccountBalanceMinor(accountId: string): number {
    return this.accountBalances.get(accountId) || 0;
  }

  /**
   * Saldo disponível do utilizador (Passivo da Casa exigível)
   */
  getUserAvailableBalanceMinor(uid: string): number {
    return this.getAccountBalanceMinor(`wallet:${uid}:available`);
  }

  /**
   * Saldo reservado do utilizador (Custódia para levantamento pendente)
   */
  getUserLockedBalanceMinor(uid: string): number {
    return this.getAccountBalanceMinor(`wallet:${uid}:locked`);
  }

  /**
   * Inicializa uma conta com saldo de abertura auditado (apenas em ambiente controlado)
   */
  seedAccount(accountId: string, initialMinor: number) {
    if (!Number.isSafeInteger(initialMinor) || initialMinor < 0) {
      throw new Error('Saldo inicial deve ser um inteiro não-negativo.');
    }
    this.accountBalances.set(accountId, initialMinor);
  }

  /**
   * Gera hash SHA-256 canónico de um payload para deteção de adulteração de chave de idempotência
   */
  private hashPayload(payload: unknown): string {
    const canonicalString = JSON.stringify(payload, Object.keys(payload as any || {}).sort());
    return crypto.createHash('sha256').update(canonicalString || '').digest('hex');
  }

  /**
   * Adquire bloqueio serializado para operações que afetam um utilizador específico (Mutex de Concorrência)
   */
  private async acquireUserLock(uid: string): Promise<() => void> {
    while (this.userLocks.has(uid)) {
      await this.userLocks.get(uid);
    }
    let releaseLock: () => void = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.userLocks.set(uid, lockPromise);

    return () => {
      this.userLocks.delete(uid);
      releaseLock();
    };
  }

  /**
   * Executa uma transação financeira atómica com garantias de partida dobrada e idempotência estrita.
   */
  async executeFinancialTransaction(params: ExecuteTransactionParams): Promise<{
    journal: JournalEntry;
    idempotentReplay: boolean;
  }> {
    const currentPayloadHash = this.hashPayload(params.payloadToHash);

    // 1. Verificação de Idempotência Prévia
    const existingRecord = this.idempotencyRegistry.get(params.idempotencyKey);
    if (existingRecord) {
      // PROTEÇÃO CONTRA TAMPERING: Se a mesma chave for reutilizada com payload divergente, rejeitar imediatamente
      if (existingRecord.payload_hash !== currentPayloadHash) {
        throw new Error(
          `IDEMPOTENCY_TAMPERING_DETECTED: A chave ${params.idempotencyKey} já foi utilizada para uma operação com parâmetros diferentes.`
        );
      }
      const existingJournal = this.journals.get(existingRecord.journal_id);
      if (!existingJournal) {
        throw new Error('Inconsistência interna: Registo de idempotência aponta para JournalEntry inexistente.');
      }
      return { journal: existingJournal, idempotentReplay: true };
    }

    // 2. Aquisição de Lock do Utilizador (se aplicável)
    const lockTarget = params.metadata.userId || 'global_ledger_mutex';
    const releaseLock = await this.acquireUserLock(lockTarget);

    try {
      // Re-verificação após adquirir o lock (Double-Check Locking pattern)
      const doubleCheck = this.idempotencyRegistry.get(params.idempotencyKey);
      if (doubleCheck) {
        const journal = this.journals.get(doubleCheck.journal_id)!;
        return { journal, idempotentReplay: true };
      }

      // 3. Validação da Invariante de Partida Dobrada (Débitos == Créditos)
      let totalDebits = 0;
      let totalCredits = 0;

      for (const p of params.postings) {
        if (!Number.isSafeInteger(p.amountMinor) || p.amountMinor <= 0) {
          throw new Error(`Lançamento inválido: o montante deve ser um inteiro positivo em minor units (recebido: ${p.amountMinor}).`);
        }
        if (p.direction === 'DEBIT') {
          totalDebits = safeAddMinor(totalDebits, p.amountMinor);
        } else if (p.direction === 'CREDIT') {
          totalCredits = safeAddMinor(totalCredits, p.amountMinor);
        } else {
          throw new Error(`Direção de lançamento inválida: ${p.direction}`);
        }
      }

      if (totalDebits !== totalCredits) {
        throw new Error(
          `INVARIANTE CONTABILÍSTICA VIOLADA: Total de Débitos (${totalDebits}) diferente do Total de Créditos (${totalCredits}). Lançamento desequilibrado abortado.`
        );
      }

      // 4. Validação de Regras de Saldo (Prevenção de Saldo Disponível Negativo)
      // Simular aplicação dos lançamentos para verificar se alguma conta de utilizador ficaria negativa
      const prospectiveBalances = new Map<string, number>();

      for (const p of params.postings) {
        const currentBal = prospectiveBalances.get(p.accountId) ?? this.getAccountBalanceMinor(p.accountId);
        let nextBal: number;

        if (p.accountType === 'USER_AVAILABLE' || p.accountType === 'USER_LOCKED') {
          // Contas de passivo perante o jogador: CRÉDITO aumenta saldo do utilizador, DÉBITO diminui
          if (p.direction === 'CREDIT') {
            nextBal = safeAddMinor(currentBal, p.amountMinor);
          } else {
            if (currentBal < p.amountMinor) {
              throw new Error(
                `INSUFFICIENT_AVAILABLE_FUNDS: Saldo insuficiente na conta ${p.accountId}. Saldo atual: ${currentBal}, Débito pretendido: ${p.amountMinor}.`
              );
            }
            nextBal = safeSubtractMinor(currentBal, p.amountMinor, true);
          }
        } else {
          // Outras contas institucionais
          if (p.direction === 'DEBIT') {
            nextBal = safeAddMinor(currentBal, p.amountMinor);
          } else {
            nextBal = safeSubtractMinor(currentBal, p.amountMinor, false);
          }
        }

        prospectiveBalances.set(p.accountId, nextBal);
      }

      // 5. Commit Atómico dos Lançamentos no Livro-Razão (Append-Only)
      const now = new Date().toISOString();
      const journalId = `jnl_${crypto.randomBytes(8).toString('hex')}`;
      const committedPostings: LedgerPosting[] = [];

      for (const p of params.postings) {
        const postingId = `pst_${crypto.randomBytes(8).toString('hex')}`;
        const newBalance = prospectiveBalances.get(p.accountId)!;

        // Atualizar saldo em memória
        this.accountBalances.set(p.accountId, newBalance);

        committedPostings.push({
          posting_id: postingId,
          journal_id: journalId,
          account_id: p.accountId,
          account_type: p.accountType,
          owner_uid: p.ownerUid,
          direction: p.direction,
          amount_minor: p.amountMinor,
          balance_after_minor: newBalance,
          created_at: now
        });
      }

      const journalEntry: JournalEntry = {
        journal_id: journalId,
        operation_id: params.operationId,
        operation_type: params.operationType,
        idempotency_key: params.idempotencyKey,
        state: 'COMMITTED',
        currency: CANONICAL_CURRENCY,
        total_amount_minor: totalDebits,
        postings: committedPostings,
        metadata: {
          origin: params.metadata.origin,
          provider_id: params.metadata.provider_id || params.metadata.providerId,
          external_reference: params.metadata.external_reference || params.metadata.externalReference,
          user_id: params.metadata.user_id || params.metadata.userId,
          description: params.metadata.description
        },
        created_at: now
      };

      // Gravar no registo imutável
      this.journals.set(journalId, journalEntry);

      // Registar chave de idempotência
      this.idempotencyRegistry.set(params.idempotencyKey, {
        idempotency_key: params.idempotencyKey,
        operation_id: params.operationId,
        operation_type: params.operationType,
        payload_hash: currentPayloadHash,
        journal_id: journalId,
        status: 'COMMITTED',
        response_payload: { journalId, totalAmountMinor: totalDebits },
        created_at: now
      });

      return { journal: journalEntry, idempotentReplay: false };
    } finally {
      releaseLock();
    }
  }

  /**
   * Reversão Contabilística Compensatória Estrita (Compensating Journal Entry)
   * NUNCA edita ou apaga o registo original: cria um novo Journal Entry com débitos e créditos invertidos.
   */
  async reverseJournalEntry(
    originalJournalId: string,
    reason: string,
    operatorUid?: string
  ): Promise<JournalEntry> {
    const original = this.journals.get(originalJournalId);
    if (!original) {
      throw new Error(`Transação original ${originalJournalId} não encontrada para estorno.`);
    }

    if (original.state === 'REVERSED') {
      throw new Error(`A transação ${originalJournalId} já se encontra estornada pelo voucher ${original.reversed_by_journal_id}.`);
    }

    // Inverter direção de cada posting: DÉBITO vira CRÉDITO e CRÉDITO vira DÉBITO
    const reversePostings = original.postings.map(p => ({
      accountId: p.account_id,
      accountType: p.account_type,
      ownerUid: p.owner_uid,
      direction: (p.direction === 'DEBIT' ? 'CREDIT' : 'DEBIT') as PostingDirection,
      amountMinor: p.amount_minor
    }));

    const reversalIdempotencyKey = `reversal_${original.idempotency_key}_${Date.now()}`;

    const { journal: reversalJournal } = await this.executeFinancialTransaction({
      operationId: `rev_${original.operation_id}`,
      operationType: 'WITHDRAWAL_REVERSED',
      idempotencyKey: reversalIdempotencyKey,
      payloadToHash: { originalJournalId, reason },
      postings: reversePostings,
      metadata: {
        origin: 'OPERATOR',
        user_id: original.metadata.user_id,
        description: `Estorno compensatório: ${reason} (Ref original: ${originalJournalId})`
      }
    });

    // Marcar relação bidirecional
    original.state = 'REVERSED';
    original.reversed_by_journal_id = reversalJournal.journal_id;
    reversalJournal.reverses_journal_id = original.journal_id;

    return reversalJournal;
  }

  /**
   * Obtém extrato completo de um utilizador no livro-razão
   */
  getUserLedgerPostings(uid: string): LedgerPosting[] {
    const results: LedgerPosting[] = [];
    for (const j of this.journals.values()) {
      for (const p of j.postings) {
        if (p.owner_uid === uid || p.account_id.includes(uid)) {
          results.push(p);
        }
      }
    }
    return results.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  /**
   * Auditoria de integridade matemática global do ledger
   */
  auditGlobalBalance(): { isBalanced: boolean; totalDebits: number; totalCredits: number; journalCount: number } {
    let totalDebits = 0;
    let totalCredits = 0;

    for (const j of this.journals.values()) {
      for (const p of j.postings) {
        if (p.direction === 'DEBIT') {
          totalDebits = safeAddMinor(totalDebits, p.amount_minor);
        } else {
          totalCredits = safeAddMinor(totalCredits, p.amount_minor);
        }
      }
    }

    return {
      isBalanced: totalDebits === totalCredits,
      totalDebits,
      totalCredits,
      journalCount: this.journals.size
    };
  }
}

export const financialLedger = new FinancialLedgerService();
