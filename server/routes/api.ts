import { Router, Request, Response } from 'express';
import { db, OFFICIAL_AVATARS } from '../db/store.js';
import { smsGateway } from '../sms/manager.js';
import { requestPhoneOtp, verifyPhoneOtp, validateAndNormalizePhone, quickPhoneLogin } from '../auth/controller.js';
import { generateClubPredictionAnalysis } from '../predictions/aiPredictor.js';
import { paymentGateway } from '../payments/manager.js';
import { sportsHoldersManager } from '../holders/manager.js';

export const apiRouter = Router();

// Middleware to extract authenticated user from Bearer Token
function authenticate(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Sessão não autenticada. Token em falta.' });
  }

  const token = authHeader.split(' ')[1];
  const session = db.getSession(token);

  if (!session) {
    return res.status(401).json({ success: false, error: 'Sessão expirada ou inválida.' });
  }

  (req as any).user = session.user;
  (req as any).session = session;
  next();
}

// Optional auth middleware (for routes accessible by guests or users)
function optionalAuthenticate(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const session = db.getSession(token);
    if (session) {
      (req as any).user = session.user;
      (req as any).session = session;
    }
  }
  next();
}

// ----------------------------------------------------
// 1. AUTHENTICATION (PHONE + OTP)
// ----------------------------------------------------

// Request OTP
apiRouter.post('/auth/phone/send-otp', async (req: Request, res: Response) => {
  try {
    const { phone, countryCode } = req.body;
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

    const result = await requestPhoneOtp(phone, countryCode || '+244', ip);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    console.error('Erro em send-otp:', err);
    return res.status(500).json({ success: false, error: err.message || 'Erro interno do servidor.' });
  }
});

// Verify OTP
apiRouter.post('/auth/phone/verify-otp', async (req: Request, res: Response) => {
  try {
    const { phone, code, countryCode } = req.body;
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'browser';

    const result = await verifyPhoneOtp(phone, code, countryCode || '+244', ip, userAgent);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    console.error('Erro em verify-otp:', err);
    return res.status(500).json({ success: false, error: err.message || 'Erro interno do servidor.' });
  }
});

// Quick Phone Login / Direct Access (Angola +244)
apiRouter.post('/auth/phone/quick-login', async (req: Request, res: Response) => {
  try {
    const { phone, countryCode } = req.body;
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'browser';

    const result = await quickPhoneLogin(phone, countryCode || '+244', ip, userAgent);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    console.error('Erro em quick-login:', err);
    return res.status(500).json({ success: false, error: err.message || 'Erro interno do servidor.' });
  }
});

// Sync Firebase Authentication with Backend DB & Sessions
apiRouter.post('/auth/sync-firebase', async (req: Request, res: Response) => {
  try {
    const { phone, countryCode } = req.body;
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'firebase-client';

    const result = await quickPhoneLogin(phone, countryCode || '+244', ip, userAgent);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err: any) {
    console.error('Erro em sync-firebase:', err);
    return res.status(500).json({ success: false, error: err.message || 'Erro interno do servidor.' });
  }
});

// Get Current Session
apiRouter.get('/auth/session', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const token = (req as any).session.token;

  const profile = db.getPublicProfile(user.id);
  const privateIdentity = db.getPrivateIdentity(user.id);
  const kyc = db.getKyc(user.id);
  const wallet = db.getWallet(user.id);

  return res.json({
    success: true,
    token,
    user,
    profile,
    privateIdentity,
    kyc,
    wallet
  });
});

// Logout
apiRouter.post('/auth/logout', authenticate, (req: Request, res: Response) => {
  const token = (req as any).session.token;
  db.revokeSession(token);
  return res.json({ success: true, message: 'Sessão encerrada com sucesso.' });
});

// ----------------------------------------------------
// 2. SMS GATEWAY STATUS & CONFIGURATION
// ----------------------------------------------------

apiRouter.get('/sms-gateway/status', (req: Request, res: Response) => {
  return res.json({
    success: true,
    ...smsGateway.getStatus()
  });
});

apiRouter.post('/sms-gateway/config', (req: Request, res: Response) => {
  try {
    const config = req.body;
    const status = smsGateway.updateConfig(config);
    return res.json({ success: true, ...status });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// Test SMS dispatch without changing login state
apiRouter.post('/sms-gateway/test-dispatch', async (req: Request, res: Response) => {
  try {
    const { phone, countryCode } = req.body;
    const validation = validateAndNormalizePhone(phone, countryCode || '+244');
    if (!validation.isValid) {
      return res.status(400).json({ success: false, error: validation.error });
    }

    const testCode = '789123';
    const result = await smsGateway.sendOtp(validation.phoneE164, testCode);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 3. PUBLIC PROFILES & AVATARS
// ----------------------------------------------------

// List official avatars
apiRouter.get('/profile/avatars', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    avatars: OFFICIAL_AVATARS
  });
});

// Update public profile (username, avatar)
apiRouter.patch('/profile/public', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { username, avatar_id } = req.body;

    const updated = db.updatePublicProfile(user.id, { username, avatar_id });
    return res.json({ success: true, profile: updated });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 4. PRIVATE IDENTITY & KYC SEPARATION
// ----------------------------------------------------

// Get KYC and private identity (authenticated user only)
apiRouter.get('/kyc/status', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const identity = db.getPrivateIdentity(user.id);
  const kyc = db.getKyc(user.id);

  return res.json({
    success: true,
    privateIdentity: identity,
    kyc
  });
});

// Submit KYC verification documents
apiRouter.post('/kyc/submit', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { full_legal_name, date_of_birth, doc_type, doc_number, doc_front_name, doc_back_name } = req.body;

    if (!full_legal_name || full_legal_name.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Nome legal completo é obrigatório.' });
    }

    if (!date_of_birth) {
      return res.status(400).json({ success: false, error: 'Data de nascimento é obrigatória.' });
    }

    // Check age >= 18
    const dob = new Date(date_of_birth);
    const ageDiffMs = Date.now() - dob.getTime();
    const ageDate = new Date(ageDiffMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (age < 18) {
      return res.status(400).json({ success: false, error: 'A idade mínima legal para participar em apostas é 18 anos.' });
    }

    if (!doc_type || !['BI_ANGOLA', 'PASSAPORTE', 'CARTA_CONDUCAO'].includes(doc_type)) {
      return res.status(400).json({ success: false, error: 'Tipo de documento inválido.' });
    }

    if (!doc_number || doc_number.trim().length < 5) {
      return res.status(400).json({ success: false, error: 'Número de documento inválido.' });
    }

    const result = db.submitKyc(user.id, {
      full_legal_name,
      date_of_birth,
      doc_type,
      doc_number,
      doc_front_name,
      doc_back_name
    });

    return res.json({
      success: true,
      message: 'Documentos submetidos para validação. Estado atual: PENDENTE.',
      privateIdentity: result.privateIdentity,
      kyc: result.kyc
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// Admin Review KYC (Regulatory compliance verification simulation)
apiRouter.post('/kyc/admin-review', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { action, notes } = req.body;

    if (!['APPROVE', 'REJECT', 'REQUEST_REVIEW'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Ação de conformidade inválida.' });
    }

    const reviewed = db.adminReviewKyc(user.id, action, notes || 'Verificação concluída.');
    const updatedProfile = db.getPublicProfile(user.id);

    return res.json({
      success: true,
      kyc: reviewed,
      profile: updatedProfile
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 5. SECURITY & OPTIONAL EMAIL LINKING
// ----------------------------------------------------

apiRouter.post('/security/email/link', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Endereço de e-mail inválido.' });
    }

    const updatedIdentity = db.linkEmail(user.id, email);
    return res.json({
      success: true,
      message: 'E-mail associado com sucesso para segurança e recuperação de conta.',
      privateIdentity: updatedIdentity
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.get('/security/events', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const events = db.getSecurityEvents(user.id);
  return res.json({ success: true, events });
});

// ----------------------------------------------------
// 6. WALLET & FINANCIAL PRIVACY
// ----------------------------------------------------

apiRouter.get('/wallet', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const wallet = db.getWallet(user.id);
  const kyc = db.getKyc(user.id);

  return res.json({
    success: true,
    wallet,
    kycStatus: kyc?.status || 'NOT_STARTED',
    canWithdraw: kyc?.status === 'VERIFIED'
  });
});

apiRouter.post('/wallet/deposit', authenticate, (_req: Request, res: Response) => {
  return res.status(403).json({
    success: false,
    code: 'DIRECT_DEPOSIT_BLOCKED',
    error: 'Crédito direto não autorizado: Por determinação regulatória e segurança financeira, pedidos diretos do cliente não podem aumentar o saldo da carteira. Os depósitos devem ser iniciados via gateway e confirmados pelo prestador de pagamentos.'
  });
});

apiRouter.post('/wallet/withdraw', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { amount, iban } = req.body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 1000) {
      return res.status(400).json({ success: false, error: 'O valor mínimo de levantamento é 1.000 Kz.' });
    }

    if (!iban || iban.trim().length < 15) {
      return res.status(400).json({ success: false, error: 'IBAN angolano inválido (mínimo 21 caracteres).' });
    }

    const wallet = db.withdraw(user.id, numAmount, iban);
    return res.json({
      success: true,
      wallet,
      message: `Levantamento de ${numAmount.toLocaleString('pt-AO')} Kz processado com sucesso para a conta bancária.`
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 6.1 PRODUCTION PAYMENT PROVIDERS (ANGOLA - EMIS / MCX / PAYSUITE)
// ----------------------------------------------------

apiRouter.get('/payments/providers', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    providers: paymentGateway.getAvailableProviders()
  });
});

apiRouter.post('/payments/deposit/initiate', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { amount, provider, customerPhone } = req.body;

    const result = await paymentGateway.initiateDeposit({
      userId: user.id,
      amount: Number(amount),
      provider,
      customerPhone
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.get('/payments/transactions', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const transactions = paymentGateway.getUserTransactions(user.id);
  return res.json({ success: true, transactions });
});

apiRouter.post('/payments/webhook/:provider', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const payload = req.body;

    // 1. Validação de autenticidade do webhook (Header Secret / Assinatura)
    const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'boos_secret_webhook_internal_gateway_key';
    const providedSecret = req.headers['x-payment-webhook-secret'] || req.headers['x-webhook-signature'];

    if (!providedSecret || providedSecret !== webhookSecret) {
      return res.status(401).json({
        success: false,
        code: 'WEBHOOK_UNAUTHENTICATED',
        error: 'Assinatura ou chave de webhook em falta ou inválida. Rejeitado por segurança financeira.'
      });
    }

    // 2. Validação de payload e integridade da transação
    if (!payload || !payload.transactionId || !payload.status) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_PAYLOAD',
        error: 'Payload de webhook incompleto: transactionId e status são obrigatórios.'
      });
    }

    // 3. Verificação de idempotência no banco de dados
    if (db.isDepositConfirmed(payload.transactionId)) {
      return res.status(200).json({
        success: true,
        alreadyProcessed: true,
        message: `Transação ${payload.transactionId} já se encontra liquidada e creditada. Crédito duplicado ignorado.`
      });
    }

    const tx = paymentGateway.getTransaction(payload.transactionId);
    if (!tx) {
      return res.status(404).json({
        success: false,
        code: 'TRANSACTION_NOT_FOUND',
        error: `Transação ${payload.transactionId} não encontrada nos registos do gateway.`
      });
    }

    // Validação de correspondência de provider
    if (tx.provider !== provider) {
      return res.status(400).json({
        success: false,
        code: 'PROVIDER_MISMATCH',
        error: `O prestador indicado (${provider}) diverge do prestador da transação (${tx.provider}).`
      });
    }

    // 4. Se o pagamento falhou ou foi cancelado
    if (payload.status !== 'SUCCESS') {
      tx.status = 'FAILED';
      tx.failureReason = payload.reason || 'Recusado pelo prestador ou cancelado.';
      tx.updatedAt = new Date().toISOString();
      return res.json({
        success: true,
        status: 'FAILED',
        message: 'Estado da transação atualizado para FAILED. Nenhum crédito efetuado.'
      });
    }

    // 5. Pagamento confirmado com sucesso: processar crédito seguro e idempotente
    tx.status = 'COMPLETED';
    tx.completedAt = new Date().toISOString();
    tx.updatedAt = tx.completedAt;

    const updatedWallet = db.creditConfirmedDeposit({
      transactionId: tx.id,
      userId: tx.userId,
      amount: tx.amount,
      currency: tx.currency,
      provider: tx.provider,
      reference: tx.referenceNumber || tx.externalTransactionId || tx.id
    });

    return res.json({
      success: true,
      transaction: tx,
      wallet: updatedWallet,
      message: `Depósito de ${tx.amount.toLocaleString('pt-AO')} Kz confirmado e creditado com sucesso.`
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// ----------------------------------------------------
// 7. LEADERBOARD (PUBLIC IDENTITIES ONLY)
// ----------------------------------------------------

apiRouter.get('/leaderboard', (_req: Request, res: Response) => {
  const leaders = db.getLeaderboard();
  return res.json({ success: true, leaderboard: leaders });
});

// ----------------------------------------------------
// 8. SPORTSBOOK & BETS (FIMSER BET & PREVISÕES BOOS - HOLDERS EM TEMPO REAL)
// ----------------------------------------------------

apiRouter.get('/sports/matches', (req: Request, res: Response) => {
  const sport = req.query.sport as string;
  const q = (req.query.q as string || '').toLowerCase().trim();
  let matches = sportsHoldersManager.getAllMatches().map(m => ({
    ...m,
    home_team: m.homeTeam,
    away_team: m.awayTeam,
    start_time: m.startTime,
    is_live: m.isLive,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    startTime: m.startTime,
    isLive: m.isLive,
    sport: m.sport,
    country: m.country
  }));

  if (sport && sport !== 'all') {
    matches = matches.filter(m => m.sport?.toLowerCase() === sport.toLowerCase());
  }

  if (q) {
    matches = matches.filter(m =>
      m.home_team.toLowerCase().includes(q) ||
      m.away_team.toLowerCase().includes(q) ||
      m.competition.toLowerCase().includes(q) ||
      (m.country && m.country.toLowerCase().includes(q))
    );
  }

  return res.json({ success: true, matches });
});

apiRouter.get('/sports/categories', (_req: Request, res: Response) => {
  const matches = sportsHoldersManager.getAllMatches();
  const competitions = Array.from(new Set(matches.map(m => m.competition)));
  const sports = Array.from(new Set(matches.map(m => m.sport)));

  return res.json({
    success: true,
    categories: [
      { id: 'all', label: 'Todos os Jogos', count: matches.length },
      { id: 'live', label: 'Ao Vivo', count: matches.filter(m => m.isLive).length },
      ...sports.map(s => ({
        id: s.toLowerCase(),
        label: s,
        count: matches.filter(m => m.sport === s).length
      })),
      ...competitions.map(c => ({
        id: c.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        label: c,
        count: matches.filter(m => m.competition === c).length
      }))
    ]
  });
});

apiRouter.get('/sports/matches/:id/odds', (req: Request, res: Response) => {
  const match = sportsHoldersManager.getMatch(req.params.id);
  if (!match) {
    return res.status(404).json({ success: false, error: 'Partida não encontrada nos holders oficiais.' });
  }
  return res.json({
    success: true,
    matchId: match.id,
    odds: match.odds,
    markets: match.markets,
    lastUpdate: match.lastFeedUpdate
  });
});

// ----------------------------------------------------
// 8.01 REAL-TIME LIVE SCORES LISTENER & SSE STREAM
// ----------------------------------------------------

// Snapshot de pontuações e minutos ao vivo
apiRouter.get('/sports/live-scores', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    liveScores: sportsHoldersManager.getAllLiveScores(),
    timestamp: new Date().toISOString()
  });
});

// Stream SSE em Tempo Real para ouvintes de cartões de jogos ativos
apiRouter.get('/sports/live-scores/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // 1. Enviar estado inicial imediatamente na conexão
  const initialSnapshot = sportsHoldersManager.getAllLiveScores();
  res.write(`event: init\ndata: ${JSON.stringify(initialSnapshot)}\n\n`);

  // 2. Subscrição para atualizações de placar / odds / minutos
  const unsubscribeScore = sportsHoldersManager.onScoreUpdate((update) => {
    try {
      res.write(`event: score_update\ndata: ${JSON.stringify(update)}\n\n`);
    } catch (err) {
      // Stream write error
    }
  });

  // 3. Subscrição para eventos desportivos críticos (Golos, Cartões, Intervalo)
  const unsubscribeEvent = sportsHoldersManager.onMatchEvent((matchEvent) => {
    try {
      res.write(`event: match_event\ndata: ${JSON.stringify(matchEvent)}\n\n`);
    } catch (err) {
      // Stream write error
    }
  });

  // 4. Heartbeat keep-alive a cada 15s
  const heartbeatTimer = setInterval(() => {
    try {
      res.write(`event: ping\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`);
    } catch (err) {
      clearInterval(heartbeatTimer);
    }
  }, 15000);

  // Limpeza de ouvintes quando o cliente fecha a ligação
  req.on('close', () => {
    clearInterval(heartbeatTimer);
    unsubscribeScore();
    unsubscribeEvent();
    res.end();
  });
});

// Disparador manual para validação ou teste de golo instantâneo
apiRouter.post('/sports/matches/:id/simulate-goal', (req: Request, res: Response) => {
  const { id } = req.params;
  const { team = 'HOME', player } = req.body;
  const goalEvent = sportsHoldersManager.simulateGoal(id, team as 'HOME' | 'AWAY', player);
  if (!goalEvent) {
    return res.status(404).json({ success: false, error: 'Partida não encontrada ou sem placar ativo.' });
  }
  return res.json({ success: true, event: goalEvent });
});

// ----------------------------------------------------
// 8.1 SPORTS DATA HOLDERS (BETRADAR / SPORTRADAR / ODDSPEDIA)
// ----------------------------------------------------

apiRouter.get('/holders/providers', (_req: Request, res: Response) => {
  return res.json({
    success: true,
    providers: sportsHoldersManager.getHoldersList()
  });
});

apiRouter.get('/holders/matches', (req: Request, res: Response) => {
  const isLive = req.query.live === 'true';
  const matches = isLive 
    ? sportsHoldersManager.getLiveMatches() 
    : sportsHoldersManager.getAllMatches();
  return res.json({ success: true, matches });
});

apiRouter.post('/holders/ingest', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const result = sportsHoldersManager.ingestFeed(payload);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

// Predictions Hub & Search API (Geração Dinâmica a partir dos Holders Oficiais)
apiRouter.get('/sports/predictions', (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  const competition = (req.query.competition as string || '').trim();
  const minConfidence = Number(req.query.minConfidence) || 0;

  const allPredictions = sportsHoldersManager.getHolderPredictions();
  let filtered = allPredictions;

  if (query) {
    filtered = filtered.filter(p =>
      p.homeTeam.toLowerCase().includes(query) ||
      p.awayTeam.toLowerCase().includes(query) ||
      p.competition.toLowerCase().includes(query) ||
      p.recommendedTip.title.toLowerCase().includes(query) ||
      (p.trendingTag && p.trendingTag.toLowerCase().includes(query))
    );
  }

  if (competition && competition !== 'all') {
    filtered = filtered.filter(p => p.competition.toLowerCase().includes(competition.toLowerCase()));
  }

  if (minConfidence > 0) {
    filtered = filtered.filter(p => p.recommendedTip.confidencePercent >= minConfidence);
  }

  return res.json({ success: true, predictions: filtered });
});

apiRouter.get('/sports/predictions/:matchId', (req: Request, res: Response) => {
  const { matchId } = req.params;
  const allPredictions = sportsHoldersManager.getHolderPredictions();
  const prediction = allPredictions.find(p => p.matchId === matchId || p.id === matchId);
  if (!prediction) {
    return res.status(404).json({ success: false, error: 'Previsão não encontrada para este jogo.' });
  }
  return res.json({ success: true, prediction });
});

// ----------------------------------------------------
// 8.1. AI PREDICTIONS CHATBOT & QUOTA
// ----------------------------------------------------

apiRouter.get('/predictions/quota', optionalAuthenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    // Guest gets 1 free analysis
    return res.json({
      success: true,
      freeRemaining: 1,
      totalCount: 0,
      costPerAnalysis: 200,
      balance: 0,
      isAuthenticated: false
    });
  }

  const quota = db.getUserAiQuota(user.id);
  return res.json({
    success: true,
    freeRemaining: quota.freeRemaining,
    totalCount: quota.totalCount,
    costPerAnalysis: 200,
    balance: quota.balance,
    isAuthenticated: true
  });
});

apiRouter.post('/predictions/ai-chat', optionalAuthenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { query, club, confirmPaid } = req.body;

    if (!query && !club) {
      return res.status(400).json({ success: false, error: 'Por favor, indique a equipa ou partida que deseja analisar.' });
    }

    let wasFree = false;
    let freeRemaining = 0;
    let updatedWallet = null;

    if (user) {
      const quota = db.getUserAiQuota(user.id);
      if (quota.freeRemaining > 0) {
        // Free analysis available!
        const result = db.useFreeAnalysis(user.id);
        wasFree = true;
        freeRemaining = result.freeRemaining;
      } else {
        // Paid analysis required (200 Kz)
        if (!confirmPaid) {
          return res.status(402).json({
            success: false,
            requirePaymentConfirmation: true,
            fee: 200,
            currentBalance: quota.balance,
            message: 'A sua análise gratuita já foi utilizada. Deseja realizar esta Análise Estatística Profunda com Inteligência Artificial por 200 Kz debitados da sua carteira?'
          });
        }

        const deductResult = db.deductAnalysisFee(user.id, 200);
        wasFree = false;
        freeRemaining = deductResult.freeRemaining;
        updatedWallet = deductResult.wallet;
      }
    } else {
      // Guest user gets 1 free analysis
      wasFree = true;
      freeRemaining = 0;
    }

    const analysis = await generateClubPredictionAnalysis(query || club, club);
    analysis.wasFree = wasFree;
    analysis.analysesRemaining = freeRemaining;

    return res.json({
      success: true,
      analysis,
      wasFree,
      freeRemaining,
      wallet: updatedWallet,
      message: wasFree
        ? 'Análise gratuita realizada com sucesso! As próximas análises custarão 200 Kz.'
        : 'Análise inteligente concluída com sucesso (200 Kz debitados da carteira).'
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message || 'Erro ao processar análise inteligente.' });
  }
});



apiRouter.post('/bets/place', authenticate, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { stake, selections } = req.body;

    if (!selections || !Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({ success: false, error: 'Nenhuma seleção escolhida para o boletim.' });
    }

    const ticket = db.placeBet(user.id, Number(stake), selections);
    const updatedWallet = db.getWallet(user.id);
    const updatedProfile = db.getPublicProfile(user.id);

    return res.json({
      success: true,
      ticket,
      wallet: updatedWallet,
      profile: updatedProfile
    });
  } catch (err: any) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

apiRouter.get('/bets/my-bets', authenticate, (req: Request, res: Response) => {
  const user = (req as any).user;
  const bets = db.getUserBets(user.id);
  return res.json({ success: true, bets });
});
