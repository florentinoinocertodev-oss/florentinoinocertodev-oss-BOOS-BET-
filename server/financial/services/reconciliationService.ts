/**
 * BOOS BET — Serviço de Reconciliação Financeira Avançada (FIN-004.1)
 * Princípio: No evidence, no compliance claim.
 * 
 * Regra Obrigatória: NUNCA ajusta saldos automaticamente para mascarar divergências.
 * Toda discrepância deve ter identificador, motivo, severidade e rastro de auditoria.
 */

import crypto from 'crypto';
import {
  ReconciliationReport,
  ReconciliationDiscrepancy,
  DiscrepancyType
} from '../types.js';

export interface ExternalSettlementRecord {
  externalReference: string;
  internalTransactionId?: string;
  providerId: string;
  amountMinor: number;
  currency: 'AOA';
  status: 'SETTLED' | 'REJECTED' | 'PENDING';
  settledAt: string;
}

export class FinancialReconciliationService {
  /**
   * Executa auditoria e conciliação entre o livro interno e o extrato do prestador externo.
   */
  reconcileBatch(params: {
    providerId: string;
    periodStart: string;
    periodEnd: string;
    internalOperations: Array<{
      id: string;
      externalReference?: string;
      amountMinor: number;
      currency: 'AOA';
      status: 'CONFIRMED' | 'FAILED' | 'PENDING';
      createdAt: string;
    }>;
    externalRecords: ExternalSettlementRecord[];
  }): ReconciliationReport {
    const reportId = `rec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const discrepancies: ReconciliationDiscrepancy[] = [];

    const internalMap = new Map<string, typeof params.internalOperations[0]>();
    const internalByRef = new Map<string, typeof params.internalOperations[0]>();

    for (const op of params.internalOperations) {
      internalMap.set(op.id, op);
      if (op.externalReference) {
        internalByRef.set(op.externalReference, op);
      }
    }

    const processedExternalRefs = new Set<string>();

    let totalInternalMinor = 0;
    let totalExternalMinor = 0;

    for (const op of params.internalOperations) {
      if (op.status === 'CONFIRMED') {
        totalInternalMinor += op.amountMinor;
      }
    }

    for (const ext of params.externalRecords) {
      if (ext.status === 'SETTLED') {
        totalExternalMinor += ext.amountMinor;
      }
    }

    // 1. Auditoria a partir dos registos externos
    for (const ext of params.externalRecords) {
      // Deteção de referência duplicada no extrato do provedor
      if (processedExternalRefs.has(ext.externalReference)) {
        discrepancies.push(this.createDiscrepancy(
          'DUPLICATE_EXTERNAL_REF',
          'CRITICAL',
          `Referência externa duplicada no extrato do prestador: ${ext.externalReference}`,
          ext.internalTransactionId,
          ext.externalReference,
          ext.amountMinor,
          ext.amountMinor
        ));
      }
      processedExternalRefs.add(ext.externalReference);

      // Localizar operação interna correspondente (por ID de transação ou referência bancária)
      const internalMatch = (ext.internalTransactionId && internalMap.get(ext.internalTransactionId)) ||
        internalByRef.get(ext.externalReference);

      if (!internalMatch) {
        // EXTERNAL_WITHOUT_INTERNAL: Dinheiro consta no extrato mas não existe no BOOS BET
        discrepancies.push(this.createDiscrepancy(
          'EXTERNAL_WITHOUT_INTERNAL',
          'CRITICAL',
          `Movimento financeiro detetado no extrato do provedor sem transação interna correspondente.`,
          undefined,
          ext.externalReference,
          0,
          ext.amountMinor
        ));
        continue;
      }

      // Validação de Moeda
      if (ext.currency !== internalMatch.currency) {
        discrepancies.push(this.createDiscrepancy(
          'CURRENCY_MISMATCH',
          'CRITICAL',
          `Moeda divergente entre registo interno (${internalMatch.currency}) e externo (${ext.currency}).`,
          internalMatch.id,
          ext.externalReference,
          internalMatch.amountMinor,
          ext.amountMinor
        ));
      }

      // Validação de Montante
      if (ext.amountMinor !== internalMatch.amountMinor) {
        discrepancies.push(this.createDiscrepancy(
          'AMOUNT_MISMATCH',
          'HIGH',
          `Divergência de montante: interno=${internalMatch.amountMinor}, externo=${ext.amountMinor}.`,
          internalMatch.id,
          ext.externalReference,
          internalMatch.amountMinor,
          ext.amountMinor
        ));
      }

      // Validação de Compatibilidade de Estado
      if (ext.status === 'REJECTED' && internalMatch.status === 'CONFIRMED') {
        discrepancies.push(this.createDiscrepancy(
          'STATE_INCOMPATIBLE',
          'CRITICAL',
          `Incompatibilidade grave: Operação confirmada internamente mas recusada pelo prestador.`,
          internalMatch.id,
          ext.externalReference,
          internalMatch.amountMinor,
          ext.amountMinor
        ));
      }
    }

    // 2. Auditoria de transações internas sem liquidação externa
    for (const op of params.internalOperations) {
      if (op.status === 'CONFIRMED') {
        const found = params.externalRecords.some(
          ext => (ext.internalTransactionId === op.id) || (op.externalReference && ext.externalReference === op.externalReference)
        );
        if (!found) {
          discrepancies.push(this.createDiscrepancy(
            'INTERNAL_WITHOUT_EXTERNAL',
            'HIGH',
            `Operação confirmada no BOOS BET sem liquidação correspondente no prestador externo.`,
            op.id,
            op.externalReference,
            op.amountMinor,
            0
          ));
        }
      }
    }

    return {
      report_id: reportId,
      generated_at: new Date().toISOString(),
      provider_id: params.providerId,
      period_start: params.periodStart,
      period_end: params.periodEnd,
      total_internal_transactions: params.internalOperations.length,
      total_internal_amount_minor: totalInternalMinor,
      total_external_transactions: params.externalRecords.length,
      total_external_amount_minor: totalExternalMinor,
      discrepancies,
      is_balanced: discrepancies.length === 0 && totalInternalMinor === totalExternalMinor
    };
  }

  private createDiscrepancy(
    type: DiscrepancyType,
    severity: ReconciliationDiscrepancy['severity'],
    details: string,
    internalId?: string,
    externalRef?: string,
    expectedMinor?: number,
    actualMinor?: number
  ): ReconciliationDiscrepancy {
    return {
      discrepancy_id: `disc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      type,
      severity,
      internal_operation_id: internalId,
      external_reference: externalRef,
      expected_minor: expectedMinor,
      actual_minor: actualMinor,
      details,
      status: 'OPEN',
      created_at: new Date().toISOString()
    };
  }
}

export const reconciliationEngine = new FinancialReconciliationService();
