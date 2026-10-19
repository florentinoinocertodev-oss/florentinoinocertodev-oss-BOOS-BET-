/**
 * BOOS BET — Suíte de Testes Automatizados de Integridade Financeira & Contabilística (FIN-004.1)
 * Princípio: "No evidence, no compliance claim."
 * 
 * Normas Cobertas:
 * 1. Princípio das Partidas Dobradas (Double-Entry Balance: Débitos = Créditos)
 * 2. Aritmética de Precisão Inteira (Minor Units: Cêntimos de Kwanza AOA)
 * 3. Proibição Estrita de Saldo Negativo em Contas de Utilizador
 * 4. Imutabilidade e Append-Only do Livro-Razão (Sem mutação direta de linhas passadas)
 * 5. Idempotência Criptográfica e Deteção de Tampering de Payload
 * 6. Ciclo de Vida em Três Etapas para Levantamentos (Reserva -> Despacho -> Liquidação/Devolução)
 * 7. Estorno Contabilístico Compensatório (Reversal Journal com Vínculo Bidirecional)
 * 8. Rejeição de Provedores Não Homologados (Zero Auto-Aprovação Sem Configuração)
 * 9. Motor de Reconciliação e Deteção de Discrepâncias Contabilísticas
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  majorToMinor,
  minorToMajor,
  formatAOA,
  validateMonetaryInput,
  safeAddMinor,
  safeSubtractMinor,
  CANONICAL_CURRENCY
} from '../server/financial/money.js';
import { FinancialLedgerService } from '../server/financial/ledger.js';
import { WithdrawalService } from '../server/financial/services/withdrawalService.js';
import { DepositService } from '../server/financial/services/depositService.js';
import { FinancialReconciliationService } from '../server/financial/services/reconciliationService.js';
import { PaymentProviderAdapter, DepositInitiateIntent, WithdrawalInitiateIntent } from '../server/financial/types.js';

describe('BOOS BET — FIN-004: Auditoria e Conformidade de Integridade Financeira', () => {

  describe('1. Aritmética Monetária Inteira e Prevenção de Floating Point (money.ts)', () => {
    it('1.1 Converte valores principais (Kz) para cêntimos inteiros (minor units) sem distorção', () => {
      // 0.1 + 0.2 em ponto flutuante IEEE-754 é 0.30000000000000004
      const minorA = majorToMinor(0.1);
      const minorB = majorToMinor(0.2);
      const sum = safeAddMinor(minorA, minorB);
      assert.equal(sum, 30); // 30 cêntimos
      assert.equal(minorToMajor(sum), 0.3);
    });

    it('1.2 Rejeita valores não numéricos, NaN, infinitos e montantes menores ou iguais a zero', () => {
      assert.equal(validateMonetaryInput(0).isValid, false);
      assert.equal(validateMonetaryInput(-500).isValid, false);
      assert.equal(validateMonetaryInput(NaN).isValid, false);
      assert.equal(validateMonetaryInput(Infinity).isValid, false);
      assert.equal(validateMonetaryInput(100.005).isValid, false); // Mais de 2 casas decimais
      assert.equal(validateMonetaryInput(100.5).isValid, true);
      assert.equal(validateMonetaryInput(5000).isValid, true);
    });

    it('1.3 Garante formatação canónica oficial AOA / Kz', () => {
      const formatted = formatAOA(150000); // 1500.00 Kz
      assert.match(formatted, /Kz/);
      assert.match(formatted, /1[\.,\s]?500/);
    });

    it('1.4 Protege subtração contra saldos negativos quando preventNegative=true', () => {
      assert.throws(() => {
        safeSubtractMinor(1000, 1500, true);
      }, /saldo negativo/);
    });
  });

  describe('2. Princípio das Partidas Dobradas & Imutabilidade (ledger.ts)', () => {
    it('2.1 Rejeita qualquer transação onde a soma dos Débitos seja diferente da soma dos Créditos', async () => {
      const ledger = new FinancialLedgerService();

      await assert.rejects(
        async () => {
          await ledger.executeFinancialTransaction({
            operationId: 'op_unbalanced_001',
            operationType: 'DEPOSIT_CONFIRMED',
            idempotencyKey: 'idem_unbal_1',
            payloadToHash: { test: 1 },
            postings: [
              {
                accountId: 'psp:clearing:emis',
                accountType: 'PSP_CLEARING',
                direction: 'DEBIT',
                amountMinor: 50000 // 500 Kz
              },
              {
                accountId: 'wallet:usr_1:available',
                accountType: 'USER_AVAILABLE',
                direction: 'CREDIT',
                amountMinor: 40000 // 400 Kz (DESBALANCEADO!)
              }
            ],
            metadata: {
              origin: 'PSP_WEBHOOK',
              description: 'Tentativa desbalanceada'
            }
          });
        },
        /INVARIANTE CONTABILÍSTICA VIOLADA/
      );
    });

    it('2.2 Executa transação equilibrada de depósito e atualiza saldos de acordo com o plano de contas', async () => {
      const ledger = new FinancialLedgerService();
      const amountMinor = 1000000; // 10.000,00 Kz

      const result = await ledger.executeFinancialTransaction({
        operationId: 'dep_tx_001',
        operationType: 'DEPOSIT_CONFIRMED',
        idempotencyKey: 'idem_dep_001',
        payloadToHash: { tx: 'dep_tx_001', amount: amountMinor },
        postings: [
          {
            accountId: 'psp:clearing:emis',
            accountType: 'PSP_CLEARING',
            direction: 'DEBIT',
            amountMinor: amountMinor
          },
          {
            accountId: 'wallet:usr_test:available',
            accountType: 'USER_AVAILABLE',
            ownerUid: 'usr_test',
            direction: 'CREDIT',
            amountMinor: amountMinor
          }
        ],
        metadata: {
          origin: 'PSP_WEBHOOK',
          user_id: 'usr_test',
          provider_id: 'multicaixa_express',
          description: 'Depósito Multicaixa Express validado'
        }
      });

      assert.equal(result.idempotentReplay, false);
      assert.equal(result.journal.state, 'COMMITTED');
      assert.equal(result.journal.currency, CANONICAL_CURRENCY);
      assert.equal(result.journal.postings.length, 2);

      // Verificação de saldos
      assert.equal(ledger.getUserAvailableBalanceMinor('usr_test'), amountMinor);
      assert.equal(ledger.getAccountBalanceMinor('psp:clearing:emis'), amountMinor);

      // Verificação da Equação Contabilística Global (Ativo = Passivo + PL)
      const audit = ledger.auditGlobalBalance();
      assert.equal(audit.isBalanced, true);
      assert.equal(audit.totalDebits, audit.totalCredits);
    });

    it('2.3 Idempotência Estrita: Segundo envio com mesmo payload retorna o voucher existente sem re-creditar', async () => {
      const ledger = new FinancialLedgerService();
      const amountMinor = 500000;

      const payload = { tx: 'dep_tx_idem', amount: amountMinor };

      // 1ª execução
      const res1 = await ledger.executeFinancialTransaction({
        operationId: 'dep_tx_idem',
        operationType: 'DEPOSIT_CONFIRMED',
        idempotencyKey: 'idem_unique_key_999',
        payloadToHash: payload,
        postings: [
          { accountId: 'psp:clearing:emis', accountType: 'PSP_CLEARING', direction: 'DEBIT', amountMinor },
          { accountId: 'wallet:usr_idem:available', accountType: 'USER_AVAILABLE', ownerUid: 'usr_idem', direction: 'CREDIT', amountMinor }
        ],
        metadata: { origin: 'PSP_WEBHOOK', description: 'Idempotency test' }
      });
      assert.equal(res1.idempotentReplay, false);
      assert.equal(ledger.getUserAvailableBalanceMinor('usr_idem'), amountMinor);

      // 2ª execução com a mesma chave e payload
      const res2 = await ledger.executeFinancialTransaction({
        operationId: 'dep_tx_idem',
        operationType: 'DEPOSIT_CONFIRMED',
        idempotencyKey: 'idem_unique_key_999',
        payloadToHash: payload,
        postings: [
          { accountId: 'psp:clearing:emis', accountType: 'PSP_CLEARING', direction: 'DEBIT', amountMinor },
          { accountId: 'wallet:usr_idem:available', accountType: 'USER_AVAILABLE', ownerUid: 'usr_idem', direction: 'CREDIT', amountMinor }
        ],
        metadata: { origin: 'PSP_WEBHOOK', description: 'Idempotency test' }
      });
      assert.equal(res2.idempotentReplay, true);
      assert.equal(res2.journal.journal_id, res1.journal.journal_id);

      // O saldo DEVE permanecer inalterado (sem crédito duplo)
      assert.equal(ledger.getUserAvailableBalanceMinor('usr_idem'), amountMinor);
    });

    it('2.4 Deteção de Tampering: Reutilização da mesma chave de idempotência com payload diferente é REJEITADA', async () => {
      const ledger = new FinancialLedgerService();
      const amountMinor = 200000;

      await ledger.executeFinancialTransaction({
        operationId: 'op_tamper_1',
        operationType: 'DEPOSIT_CONFIRMED',
        idempotencyKey: 'key_tamper_check',
        payloadToHash: { amount: 2000 },
        postings: [
          { accountId: 'psp:clearing:emis', accountType: 'PSP_CLEARING', direction: 'DEBIT', amountMinor },
          { accountId: 'wallet:usr_t:available', accountType: 'USER_AVAILABLE', ownerUid: 'usr_t', direction: 'CREDIT', amountMinor }
        ],
        metadata: { origin: 'PSP_WEBHOOK', description: 'Original payload' }
      });

      // Tentativa de alterar o montante reutilizando a chave
      await assert.rejects(
        async () => {
          await ledger.executeFinancialTransaction({
            operationId: 'op_tamper_1',
            operationType: 'DEPOSIT_CONFIRMED',
            idempotencyKey: 'key_tamper_check',
            payloadToHash: { amount: 9999999 }, // Payload alterado!
            postings: [
              { accountId: 'psp:clearing:emis', accountType: 'PSP_CLEARING', direction: 'DEBIT', amountMinor: 999999900 },
              { accountId: 'wallet:usr_t:available', accountType: 'USER_AVAILABLE', ownerUid: 'usr_t', direction: 'CREDIT', amountMinor: 999999900 }
            ],
            metadata: { origin: 'PSP_WEBHOOK', description: 'Tampered payload' }
          });
        },
        /IDEMPOTENCY_TAMPERING_DETECTED/
      );
    });
  });

  describe('3. Ciclo de Vida em Três Etapas para Levantamentos (WithdrawalService.ts)', () => {
    it('3.1 Rejeita levantamento se saldo disponível for insuficiente (sem saldo negativo)', async () => {
      const ledger = new FinancialLedgerService();
      const withdrawalService = new WithdrawalService(ledger);

      const intent: WithdrawalInitiateIntent = {
        userId: 'usr_poor',
        amountMinor: 500000, // 5.000 Kz
        currency: 'AOA',
        iban: 'AO06004000001234567890123',
        idempotencyKey: 'wd_poor_01'
      };

      await assert.rejects(
        async () => {
          await withdrawalService.requestWithdrawalReservation(intent, 'emis');
        },
        /Saldo insuficiente/
      );
    });

    it('3.2 Etapa 1 (Reserva): Segrega fundos de "available" para "locked" com total rastreabilidade', async () => {
      const ledger = new FinancialLedgerService();
      const withdrawalService = new WithdrawalService(ledger);
      const uid = 'usr_rich';

      // Creditar previamente 10.000 Kz
      await ledger.executeFinancialTransaction({
        operationId: 'funding_rich',
        operationType: 'DEPOSIT_CONFIRMED',
        idempotencyKey: 'idem_funding_rich',
        payloadToHash: { uid, amount: 1000000 },
        postings: [
          { accountId: 'psp:clearing:emis', accountType: 'PSP_CLEARING', direction: 'DEBIT', amountMinor: 1000000 },
          { accountId: `wallet:${uid}:available`, accountType: 'USER_AVAILABLE', ownerUid: uid, direction: 'CREDIT', amountMinor: 1000000 }
        ],
        metadata: { origin: 'PSP_WEBHOOK', description: 'Funding' }
      });

      // Solicitar reserva de 4.000 Kz
      const reservation = await withdrawalService.requestWithdrawalReservation({
        userId: uid,
        amountMinor: 400000,
        currency: 'AOA',
        iban: 'AO06004000001234567890123',
        idempotencyKey: 'wd_reserve_01'
      }, 'emis');

      assert.equal(reservation.success, true);
      assert.equal(reservation.transaction.status, 'RESERVED');
      assert.equal(ledger.getUserAvailableBalanceMinor(uid), 600000); // 6.000 Kz restam disponíveis
      assert.equal(ledger.getUserLockedBalanceMinor(uid), 400000);    // 4.000 Kz cativos/bloqueados
    });

    it('3.3 Etapa 3a (Liquidação com Sucesso): Debita "locked" e credita "psp:outbound"', async () => {
      const ledger = new FinancialLedgerService();
      const withdrawalService = new WithdrawalService(ledger);
      const uid = 'usr_settle';

      // 10.000 Kz disponíveis
      await ledger.executeFinancialTransaction({
        operationId: 'fund_settle',
        operationType: 'DEPOSIT_CONFIRMED',
        idempotencyKey: 'idem_fund_settle',
        payloadToHash: { uid },
        postings: [
          { accountId: 'psp:clearing:emis', accountType: 'PSP_CLEARING', direction: 'DEBIT', amountMinor: 1000000 },
          { accountId: `wallet:${uid}:available`, accountType: 'USER_AVAILABLE', ownerUid: uid, direction: 'CREDIT', amountMinor: 1000000 }
        ],
        metadata: { origin: 'PSP_WEBHOOK', description: 'Fund' }
      });

      // Reserva 3.000 Kz
      const res = await withdrawalService.requestWithdrawalReservation({
        userId: uid,
        amountMinor: 300000,
        currency: 'AOA',
        iban: 'AO06004000001234567890123',
        idempotencyKey: 'wd_settle_idem'
      }, 'emis');

      // Simula confirmação de liquidação bancária pelo PSP
      const txSettled = await withdrawalService.finalizeWithdrawal(
        res.transaction.id,
        'SUCCESS'
      );

      assert.equal(txSettled.status, 'SETTLED');
      assert.equal(ledger.getUserLockedBalanceMinor(uid), 0);          // Cativo zerado
      assert.equal(ledger.getUserAvailableBalanceMinor(uid), 700000);   // 7.000 Kz restantes intactos
      assert.equal(ledger.getAccountBalanceMinor('psp:outbound:emis'), -300000); // Saída definitiva (Crédito institucional)
    });

    it('3.4 Etapa 3b (Falha Bancária / Estorno): Devolve fundos de "locked" para "available" sem perda', async () => {
      const ledger = new FinancialLedgerService();
      const withdrawalService = new WithdrawalService(ledger);
      const uid = 'usr_reversal';

      // 5.000 Kz disponíveis
      await ledger.executeFinancialTransaction({
        operationId: 'fund_rev',
        operationType: 'DEPOSIT_CONFIRMED',
        idempotencyKey: 'idem_fund_rev',
        payloadToHash: { uid },
        postings: [
          { accountId: 'psp:clearing:emis', accountType: 'PSP_CLEARING', direction: 'DEBIT', amountMinor: 500000 },
          { accountId: `wallet:${uid}:available`, accountType: 'USER_AVAILABLE', ownerUid: uid, direction: 'CREDIT', amountMinor: 500000 }
        ],
        metadata: { origin: 'PSP_WEBHOOK', description: 'Fund' }
      });

      // Reserva 2.000 Kz
      const res = await withdrawalService.requestWithdrawalReservation({
        userId: uid,
        amountMinor: 200000,
        currency: 'AOA',
        iban: 'AO06004000001234567890123',
        idempotencyKey: 'wd_rev_idem'
      }, 'emis');

      assert.equal(ledger.getUserAvailableBalanceMinor(uid), 300000);
      assert.equal(ledger.getUserLockedBalanceMinor(uid), 200000);

      // Simula rejeição bancária (ex: conta destino encerrada)
      const txReversed = await withdrawalService.finalizeWithdrawal(
        res.transaction.id,
        'FAILED',
        'Conta bancária de destino inexistente ou inválida na EMIS'
      );

      assert.equal(txReversed.status, 'REVERSED');
      // Saldo cativo deve ser zero e o saldo disponível volta exatamente aos 5.000 Kz iniciais
      assert.equal(ledger.getUserLockedBalanceMinor(uid), 0);
      assert.equal(ledger.getUserAvailableBalanceMinor(uid), 500000);
    });
  });

  describe('4. Estorno Compensatório Contabilístico Bidirecional (ledger.reverseJournalEntry)', () => {
    it('4.1 Inverte lançamentos de voucher original e cria apontadores bidirecionais imutáveis', async () => {
      const ledger = new FinancialLedgerService();

      // Creditar fundos primeiro para permitir débito da taxa
      await ledger.executeFinancialTransaction({
        operationId: 'fund_fee_user',
        operationType: 'DEPOSIT_CONFIRMED',
        idempotencyKey: 'idem_fund_fee_user',
        payloadToHash: { user: 'usr_fee' },
        postings: [
          { accountId: 'psp:clearing:emis', accountType: 'PSP_CLEARING', direction: 'DEBIT', amountMinor: 100000 },
          { accountId: 'wallet:usr_fee:available', accountType: 'USER_AVAILABLE', ownerUid: 'usr_fee', direction: 'CREDIT', amountMinor: 100000 }
        ],
        metadata: { origin: 'PSP_WEBHOOK', description: 'Initial credit' }
      });

      const orig = await ledger.executeFinancialTransaction({
        operationId: 'fee_charged_01',
        operationType: 'SERVICE_FEE',
        idempotencyKey: 'idem_fee_01',
        payloadToHash: { fee: 500 },
        postings: [
          { accountId: 'wallet:usr_fee:available', accountType: 'USER_AVAILABLE', ownerUid: 'usr_fee', direction: 'DEBIT', amountMinor: 50000 },
          { accountId: 'house:revenue', accountType: 'HOUSE_REVENUE', direction: 'CREDIT', amountMinor: 50000 }
        ],
        metadata: { origin: 'OPERATOR', description: 'Taxa operacional' }
      });

      const revJournal = await ledger.reverseJournalEntry(
        orig.journal.journal_id,
        'Erro na cobrança de taxa operacional pelo operador'
      );

      assert.equal(orig.journal.state, 'REVERSED');
      assert.equal(orig.journal.reversed_by_journal_id, revJournal.journal_id);
      assert.equal(revJournal.reverses_journal_id, orig.journal.journal_id);

      // Reversão não permite segundo estorno do mesmo voucher
      await assert.rejects(
        async () => {
          await ledger.reverseJournalEntry(orig.journal.journal_id, 'Segundo estorno indevido');
        },
        /já se encontra estornada/
      );
    });
  });

  describe('5. Barreira de Provedores Não Homologados (DepositService.ts)', () => {
    it('5.1 Provedor sem credenciais de produção/sandbox é categorizado como UNAVAILABLE e não credita', async () => {
      const ledger = new FinancialLedgerService();
      const depositService = new DepositService(ledger);

      // Criar adaptador mockup desconfigurado
      const unconfiguredAdapter: PaymentProviderAdapter = {
        providerId: 'fake_psp',
        name: 'Provedor Não Homologado',
        capabilities: {
          supportsDeposits: true,
          supportsWithdrawals: false,
          supportsWebhooks: false,
          requiresMtls: false,
          currenciesSupported: ['AOA']
        },
        getStatus: () => 'UNCONFIGURED',
        isConfigured: () => false,
        initiateDeposit: async () => ({ success: false, transactionId: '', providerStatus: 'UNAVAILABLE', instructions: 'Não homologado' }),
        initiateWithdrawal: async () => ({ success: false, transactionId: '', providerStatus: 'UNAVAILABLE', instructions: 'Não homologado' }),
        verifyWebhook: async () => ({ isValid: false, errorCode: 'PROVIDER_NOT_CONFIGURED' })
      };

      depositService.registerAdapter(unconfiguredAdapter);

      const result = await depositService.initiateDeposit({
        userId: 'usr_probe',
        amountMinor: 500000,
        currency: 'AOA',
        providerId: 'fake_psp',
        idempotencyKey: 'probe_01'
      });

      assert.equal(result.success, false);
      assert.equal(result.isAvailable, false);
      assert.match(result.instructions, /não se encontra homologado/);

      // Garantir saldo estritamente zero
      assert.equal(ledger.getUserAvailableBalanceMinor('usr_probe'), 0);
    });
  });

  describe('6. Motor de Reconciliação Contabilística (FinancialReconciliationService.ts)', () => {
    it('6.1 Deteta discrepâncias de montante (AMOUNT_MISMATCH) entre extracto do banco e lançamentos internos', () => {
      const service = new FinancialReconciliationService();

      const internalRecord = {
        id: 'tx_rec_001',
        externalReference: 'EMIS_REF_100',
        amountMinor: 500000, // 5.000 Kz registado internamente
        currency: 'AOA' as const,
        status: 'CONFIRMED' as const,
        createdAt: new Date().toISOString()
      };

      const externalBankStatement = [
        {
          externalReference: 'EMIS_REF_100',
          providerId: 'multicaixa_express',
          amountMinor: 450000, // Banco só creditou 4.500 Kz! (Discrepância de 500 Kz)
          currency: 'AOA' as const,
          settledAt: new Date().toISOString(),
          status: 'SETTLED' as const
        }
      ];

      const report = service.reconcileBatch({
        providerId: 'multicaixa_express',
        periodStart: new Date(Date.now() - 86400000).toISOString(),
        periodEnd: new Date().toISOString(),
        internalOperations: [internalRecord],
        externalRecords: externalBankStatement
      });

      assert.equal(report.is_balanced, false);
      assert.equal(report.discrepancies.length, 1);
      assert.equal(report.discrepancies[0].type, 'AMOUNT_MISMATCH');
      assert.equal(report.discrepancies[0].expected_minor, 500000);
      assert.equal(report.discrepancies[0].actual_minor, 450000);
    });

    it('6.2 Deteta pagamentos recebidos no extrato bancário sem registo interno (EXTERNAL_WITHOUT_INTERNAL)', () => {
      const service = new FinancialReconciliationService();

      const externalBankStatement = [
        {
          externalReference: 'ORPHAN_EMIS_999',
          providerId: 'multicaixa_express',
          amountMinor: 2000000, // 20.000 Kz caiu na conta da empresa sem webhook correspondente
          currency: 'AOA' as const,
          settledAt: new Date().toISOString(),
          status: 'SETTLED' as const
        }
      ];

      const report = service.reconcileBatch({
        providerId: 'multicaixa_express',
        periodStart: new Date(Date.now() - 86400000).toISOString(),
        periodEnd: new Date().toISOString(),
        internalOperations: [],
        externalRecords: externalBankStatement
      });

      assert.equal(report.is_balanced, false);
      assert.equal(report.discrepancies.length, 1);
      assert.equal(report.discrepancies[0].type, 'EXTERNAL_WITHOUT_INTERNAL');
      assert.equal(report.discrepancies[0].severity, 'CRITICAL');
    });

    it('6.3 Emite relatório balanceado (is_balanced: true) quando extrato e registos internos coincidem 100%', () => {
      const service = new FinancialReconciliationService();

      const internalRecord = {
        id: 'tx_match_01',
        externalReference: 'EMIS_PERFECT_MATCH',
        amountMinor: 1500000,
        currency: 'AOA' as const,
        status: 'CONFIRMED' as const,
        createdAt: new Date().toISOString()
      };

      const externalBankStatement = [
        {
          externalReference: 'EMIS_PERFECT_MATCH',
          providerId: 'multicaixa_express',
          amountMinor: 1500000,
          currency: 'AOA' as const,
          settledAt: new Date().toISOString(),
          status: 'SETTLED' as const
        }
      ];

      const report = service.reconcileBatch({
        providerId: 'multicaixa_express',
        periodStart: new Date(Date.now() - 86400000).toISOString(),
        periodEnd: new Date().toISOString(),
        internalOperations: [internalRecord],
        externalRecords: externalBankStatement
      });

      assert.equal(report.is_balanced, true);
      assert.equal(report.discrepancies.length, 0);
      assert.equal(report.total_internal_amount_minor, report.total_external_amount_minor);
    });
  });

});
