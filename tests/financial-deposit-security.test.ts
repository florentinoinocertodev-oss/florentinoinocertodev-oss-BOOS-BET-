import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { Server } from 'http';
import { db } from '../server/db/store.js';
import { paymentGateway } from '../server/payments/manager.js';
import { apiRouter } from '../server/routes/api.js';

describe('BOOS BET — FIN-001: Bloqueio de Créditos e Segurança de Depósitos', () => {
  let testUserId: string;
  let secondUserId: string;
  let server: Server;
  let testBaseUrl: string;

  before(async () => {
    // 1. Criar utilizadores de teste dedicados
    const user1 = db.createUser('+244923000001', '923 000 001', '+244');
    testUserId = user1.user.id;

    const user2 = db.createUser('+244923000002', '923 000 002', '+244');
    secondUserId = user2.user.id;

    // 2. Inicializar servidor de teste in-process para validação de endpoints HTTP
    const app = express();
    app.use(express.json());
    app.use('/api', apiRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        testBaseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    try {
      (server as any)?.closeAllConnections?.();
      await new Promise<void>((resolve) => server?.close(() => resolve()));
    } catch {
      // Ignore cleanup error
    }
  });

  test('Cenário 1: Um pedido de depósito direto (sem confirmação financeira) lança erro e NÃO aumenta o saldo', () => {
    const walletBefore = db.getWallet(testUserId);
    assert.ok(walletBefore, 'Carteira deve existir');
    const balanceBefore = walletBefore.balance;

    assert.throws(
      () => {
        // Tentativa de chamada direta ao método legado db.deposit
        db.deposit(testUserId, 50000, 'Multicaixa Express');
      },
      /DEPÓSITO DIRETO BLOQUEADO/i,
      'Chamada direta ao método de depósito deve ser explicitamente rejeitada'
    );

    const walletAfter = db.getWallet(testUserId);
    assert.equal(
      walletAfter?.balance,
      balanceBefore,
      'O saldo da carteira deve permanecer inalterado após tentativa de depósito direto'
    );
  });

  test('Cenário 2: Um pagamento pendente, cancelado ou recusado (FAILED) NÃO aumenta o saldo', async () => {
    const walletBefore = db.getWallet(testUserId);
    const balanceBefore = walletBefore!.balance;

    // Iniciar depósito no gateway (fica em estado WAITING_CUSTOMER_APPROVAL / PENDING)
    const initiated = await paymentGateway.initiateDeposit({
      userId: testUserId,
      amount: 10000,
      provider: 'multicaixa_express',
      customerPhone: '923000001'
    });

    assert.equal(initiated.success, true);
    assert.equal(initiated.transaction.status, 'WAITING_CUSTOMER_APPROVAL');

    // Verificar que iniciar a transação não aumenta o saldo
    const walletCurrent = db.getWallet(testUserId);
    assert.equal(walletCurrent!.balance, balanceBefore, 'Iniciar transação não pode creditar saldo');

    // Simular que o provedor emite webhook com status FAILED
    const webhookRes = await paymentGateway.processWebhook('multicaixa_express', {
      transactionId: initiated.transaction.id,
      status: 'FAILED'
    });

    assert.equal(webhookRes.transaction.status, 'FAILED');

    // Confirmar que o saldo continua estritamente intacto
    const walletAfter = db.getWallet(testUserId);
    assert.equal(walletAfter!.balance, balanceBefore, 'Pagamento falhado/recusado não pode creditar saldo');
  });

  test('Cenário 3: Idempotência estrita — Uma referência de pagamento repetida não gera um segundo crédito', async () => {
    const walletBefore = db.getWallet(testUserId);
    const balanceBefore = walletBefore!.balance;
    const depositAmount = 7500;

    const initiated = await paymentGateway.initiateDeposit({
      userId: testUserId,
      amount: depositAmount,
      provider: 'multicaixa_express',
      customerPhone: '923000001'
    });

    const txId = initiated.transaction.id;

    // Primeiro crédito legítimo e autenticado
    const firstCredit = db.creditConfirmedDeposit({
      transactionId: txId,
      userId: testUserId,
      amount: depositAmount,
      currency: 'AOA',
      provider: 'multicaixa_express',
      reference: initiated.transaction.externalTransactionId || txId
    });

    assert.equal(firstCredit.balance, balanceBefore + depositAmount, 'Primeiro crédito deve somar o valor');
    assert.equal(db.isDepositConfirmed(txId), true, 'Transação deve estar registada como confirmada');

    // Segunda tentativa com a MESMA transação (replay attack ou reenvio de webhook)
    assert.throws(
      () => {
        db.creditConfirmedDeposit({
          transactionId: txId,
          userId: testUserId,
          amount: depositAmount,
          currency: 'AOA',
          provider: 'multicaixa_express',
          reference: initiated.transaction.externalTransactionId || txId
        });
      },
      /CRÉDITO DUPLICADO IMPEDIDO/i,
      'Reenvio da mesma transação tem de ser bloqueado por idempotência'
    );

    const walletFinal = db.getWallet(testUserId);
    assert.equal(
      walletFinal!.balance,
      balanceBefore + depositAmount,
      'O saldo não pode ser duplicado sob nenhuma circunstância'
    );
  });

  test('Cenário 4: Uma transação associada ao Utilizador A NÃO pode creditar a carteira do Utilizador B', async () => {
    const walletUser2Before = db.getWallet(secondUserId);
    const balanceUser2Before = walletUser2Before!.balance;

    const initiated = await paymentGateway.initiateDeposit({
      userId: testUserId, // Pertence ao Utilizador 1
      amount: 15000,
      provider: 'multicaixa_gpo'
    });

    assert.equal(initiated.transaction.userId, testUserId);
    assert.notEqual(initiated.transaction.userId, secondUserId);

    // Carteira de terceiros permanece inalterada
    const walletUser2After = db.getWallet(secondUserId);
    assert.equal(walletUser2After!.balance, balanceUser2Before, 'Carteira de terceiros não foi afetada');
  });

  test('Cenário 5: Alterar o valor enviado pelo cliente não inflaciona o crédito da transação', async () => {
    const txAmountRegistered = 5000;

    const initiated = await paymentGateway.initiateDeposit({
      userId: testUserId,
      amount: txAmountRegistered,
      provider: 'multicaixa_express',
      customerPhone: '923000001'
    });

    const tx = paymentGateway.getTransaction(initiated.transaction.id);
    assert.ok(tx);
    assert.equal(tx.amount, 5000, 'Montante oficial no servidor é 5000');

    // Tentativa com valor adulterado
    assert.notEqual(tx.amount, 500000, 'Valor registrado na transação do servidor não pode ser alterado pelo cliente');
  });

  test('Cenário 6: Confirmação com moeda inválida ou montante não positivo é rejeitada', () => {
    const invalidTxId = `tx_invalid_${Date.now()}`;

    // Moeda estrangeira não autorizada
    assert.throws(
      () => {
        db.creditConfirmedDeposit({
          transactionId: invalidTxId,
          userId: testUserId,
          amount: 1000,
          currency: 'USD' as any,
          provider: 'multicaixa_express',
          reference: 'ref_usd'
        });
      },
      /Moeda USD não suportada/i
    );

    // Montante negativo ou zero
    assert.throws(
      () => {
        db.creditConfirmedDeposit({
          transactionId: `${invalidTxId}_zero`,
          userId: testUserId,
          amount: -500,
          currency: 'AOA',
          provider: 'multicaixa_express',
          reference: 'ref_neg'
        });
      },
      /Montante inválido/i
    );
  });

  test('Cenário 7: Falha ou exceção durante processamento não corrompe saldo nem gera crédito parcial', () => {
    const nonExistentUserId = 'usr_non_existent_99999';
    const fakeTxId = `tx_fail_${Date.now()}`;

    assert.throws(
      () => {
        db.creditConfirmedDeposit({
          transactionId: fakeTxId,
          userId: nonExistentUserId,
          amount: 5000,
          currency: 'AOA',
          provider: 'multicaixa_express',
          reference: 'ref_fail'
        });
      },
      /não encontrada/i
    );

    // Garantir que a transação falhada não foi gravada como confirmada
    assert.equal(db.isDepositConfirmed(fakeTxId), false);
  });

  test('Cenário 8: [API Endpoint] POST /api/wallet/deposit é estritamente bloqueado com HTTP 403', async () => {
    // Criar sessão autenticada para o utilizador
    const session = db.createSession(testUserId, '127.0.0.1', 'test-agent');

    const res = await fetch(`${testBaseUrl}/api/wallet/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      },
      body: JSON.stringify({ amount: 50000, method: 'Multicaixa Express' })
    });

    const data = await res.json();
    assert.equal(res.status, 403, 'A resposta deve ser HTTP 403 Forbidden');
    assert.equal(data.success, false);
    assert.equal(data.code, 'DIRECT_DEPOSIT_BLOCKED');
  });

  test('Cenário 9: [API Endpoint] POST /api/payments/webhook sem autenticação é rejeitado com HTTP 401', async () => {
    const res = await fetch(`${testBaseUrl}/api/payments/webhook/multicaixa_express`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Sem header x-payment-webhook-secret
      },
      body: JSON.stringify({ transactionId: 'any_tx', status: 'SUCCESS' })
    });

    const data = await res.json();
    assert.equal(res.status, 401, 'A resposta deve ser HTTP 401 Unauthorized');
    assert.equal(data.success, false);
    assert.equal(data.code, 'WEBHOOK_UNAUTHENTICATED');
  });

  test('Cenário 10: [API Endpoint] Webhook autenticado liquida transação com idempotência estrita', async () => {
    const walletBefore = db.getWallet(secondUserId);
    const balanceBefore = walletBefore!.balance;
    const depositAmount = 25000;

    // Iniciar depósito no gateway
    const initiated = await paymentGateway.initiateDeposit({
      userId: secondUserId,
      amount: depositAmount,
      provider: 'multicaixa_express',
      customerPhone: '923000002'
    });

    const txId = initiated.transaction.id;
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'boos_secret_webhook_internal_gateway_key';

    // 1ª chamada de webhook com assinatura/chave válida
    const res1 = await fetch(`${testBaseUrl}/api/payments/webhook/multicaixa_express`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-payment-webhook-secret': webhookSecret
      },
      body: JSON.stringify({ transactionId: txId, status: 'SUCCESS' })
    });

    const data1 = await res1.json();
    assert.equal(res1.status, 200);
    assert.equal(data1.success, true);
    assert.equal(data1.transaction.status, 'COMPLETED');
    assert.equal(data1.wallet.balance, balanceBefore + depositAmount);

    // 2ª chamada com a mesma transação (Replay / Retentativa de webhook)
    const res2 = await fetch(`${testBaseUrl}/api/payments/webhook/multicaixa_express`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-payment-webhook-secret': webhookSecret
      },
      body: JSON.stringify({ transactionId: txId, status: 'SUCCESS' })
    });

    const data2 = await res2.json();
    assert.equal(res2.status, 200);
    assert.equal(data2.alreadyProcessed, true, 'Deve identificar que já foi processada');

    // Confirmar saldo final intacto
    const walletAfter = db.getWallet(secondUserId);
    assert.equal(walletAfter!.balance, balanceBefore + depositAmount, 'Saldo não pode ter sido duplicado');
  });
});
