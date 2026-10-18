import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  PublicProfile,
  PrivateIdentity,
  KycVerification,
  Wallet,
  SecurityEvent,
  LeaderboardEntry,
  BetTicket,
  AvatarOption
} from '../../src/types/index.js';

export interface AuthIdentityRecord {
  id: string;
  user_id: string;
  type: 'PHONE' | 'EMAIL' | 'PASSKEY';
  identifier: string;
  is_primary: boolean;
  verified_at: string;
}

export interface PhoneVerificationRecord {
  id: string;
  phone_e164: string;
  hashed_otp: string;
  salt: string;
  expires_at: number;
  attempts: number;
  verified: boolean;
  created_at: number;
  ip_address: string;
}

export interface UserSessionRecord {
  token: string;
  user_id: string;
  user_agent: string;
  ip_address: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface ConfirmedDepositRecord {
  transaction_id: string;
  user_id: string;
  amount: number;
  currency: 'AOA';
  provider: string;
  reference: string;
  credited_at: string;
}

export interface DatabaseSchema {
  users: Record<string, User>;
  auth_identities: Record<string, AuthIdentityRecord>;
  phone_verifications: Record<string, PhoneVerificationRecord>;
  public_profiles: Record<string, PublicProfile>;
  private_identities: Record<string, PrivateIdentity>;
  kyc_verifications: Record<string, KycVerification>;
  wallets: Record<string, Wallet>;
  user_sessions: Record<string, UserSessionRecord>;
  security_events: SecurityEvent[];
  bets: Record<string, BetTicket>;
  confirmed_deposits: Record<string, ConfirmedDepositRecord>;
}

// Curated official BOOS BET Avatars
export const OFFICIAL_AVATARS: AvatarOption[] = [
  {
    id: 'boos_mascot_king',
    name: 'Mascote Rei BOOS BET (Oficial)',
    category: 'FIMSER_UNIVERSE',
    color: '#F5A900',
    accent: '#FFC21A',
    svgIcon: 'boos_mascot'
  },
  {
    id: 'fimser_palanca',
    name: 'Palanca Negra Real',
    category: 'FIMSER_UNIVERSE',
    color: '#0ea5e9',
    accent: '#38bdf8',
    svgIcon: 'palanca'
  },
  {
    id: 'fimser_cyber_falcon',
    name: 'Falcão Cibernético',
    category: 'FIMSER_UNIVERSE',
    color: '#10b981',
    accent: '#34d399',
    svgIcon: 'falcon'
  },
  {
    id: 'fimser_sol_benguela',
    name: 'Sol de Benguela',
    category: 'FIMSER_UNIVERSE',
    color: '#f59e0b',
    accent: '#fbbf24',
    svgIcon: 'sun'
  },
  {
    id: 'fimser_diamante_lunda',
    name: 'Diamante da Lunda',
    category: 'FIMSER_UNIVERSE',
    color: '#8b5cf6',
    accent: '#a78bfa',
    svgIcon: 'diamond'
  },
  {
    id: 'gaming_neon_striker',
    name: 'Neon Striker',
    category: 'GAMING',
    color: '#ec4899',
    accent: '#f472b6',
    svgIcon: 'striker'
  },
  {
    id: 'gaming_apex_champion',
    name: 'Apex Champion',
    category: 'GAMING',
    color: '#06b6d4',
    accent: '#22d3ee',
    svgIcon: 'apex'
  },
  {
    id: 'gaming_phantom_byte',
    name: 'Phantom Byte',
    category: 'GAMING',
    color: '#6366f1',
    accent: '#818cf8',
    svgIcon: 'phantom'
  },
  {
    id: 'geo_poly_gold',
    name: 'Polígono Dourado',
    category: 'GEOMETRIC',
    color: '#eab308',
    accent: '#fde047',
    svgIcon: 'polygon'
  },
  {
    id: 'geo_emerald_matrix',
    name: 'Matriz Esmeralda',
    category: 'GEOMETRIC',
    color: '#059669',
    accent: '#10b981',
    svgIcon: 'matrix'
  },
  {
    id: 'geo_quantum_shield',
    name: 'Escudo Quântico',
    category: 'GEOMETRIC',
    color: '#2563eb',
    accent: '#60a5fa',
    svgIcon: 'shield'
  }
];

class DatabaseStore {
  private dbPath: string;
  private data: DatabaseSchema;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'server', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.dbPath = path.join(dataDir, 'db.json');
    this.data = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed.confirmed_deposits) {
          parsed.confirmed_deposits = {};
        }
        return parsed;
      } catch (e) {
        console.error('Erro ao ler base de dados, reinicializando schema...', e);
      }
    }
    return {
      users: {},
      auth_identities: {},
      phone_verifications: {},
      public_profiles: {},
      private_identities: {},
      kyc_verifications: {},
      wallets: {},
      user_sessions: {},
      security_events: [],
      bets: {},
      confirmed_deposits: {}
    };
  }

  private saveDatabase() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Erro ao salvar base de dados:', e);
    }
  }

  // --- Users & Profiles ---

  getUserByPhone(phoneE164: string): User | null {
    for (const u of Object.values(this.data.users)) {
      if (u.phone_e164 === phoneE164) return u;
    }
    return null;
  }

  getUserById(id: string): User | null {
    return this.data.users[id] || null;
  }

  generatePseudonym(): string {
    let candidate = '';
    let exists = true;
    while (exists) {
      const num = crypto.randomInt(1000, 9999);
      const prefix = Math.random() > 0.3 ? 'Player' : 'Boos-Player';
      candidate = `${prefix}-${num}`;
      exists = Object.values(this.data.public_profiles).some(p => p.username.toLowerCase() === candidate.toLowerCase());
    }
    return candidate;
  }

  createUser(phoneE164: string, phoneNational: string, countryCode: string = '+244'): {
    user: User;
    profile: PublicProfile;
    privateIdentity: PrivateIdentity;
    kyc: KycVerification;
    wallet: Wallet;
  } {
    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
    const now = new Date().toISOString();

    const user: User = {
      id: userId,
      phone_e164: phoneE164,
      phone_national: phoneNational,
      country_code: countryCode,
      created_at: now,
      last_login_at: now,
      status: 'ACTIVE'
    };

    // Auto-generate public pseudonym
    const pseudonym = this.generatePseudonym();

    const profile: PublicProfile = {
      user_id: userId,
      username: pseudonym,
      avatar_id: 'boos_mascot_king',
      level: 1,
      xp: 0,
      rank_points: 100,
      win_streak: 0,
      badges: ['NOVO_JOGADOR', 'ANGOLA_VERIFIED', 'BOOS_VIP'],
      custom_username_set: false,
      ai_free_analyses: 1,
      ai_analyses_count: 0
    };

    // Private identity - completely separated from public profile
    const privateIdentity: PrivateIdentity = {
      user_id: userId,
      full_legal_name: null,
      date_of_birth: null,
      doc_type: null,
      doc_number: null,
      nationality: 'AO',
      email: null,
      email_verified: false,
      updated_at: now
    };

    // KYC State - initialized as NOT_STARTED
    const kyc: KycVerification = {
      user_id: userId,
      status: 'NOT_STARTED',
      submitted_at: null,
      reviewed_at: null,
      reviewer_notes: null,
      provider: 'BOOS_BET_ANGOLA_COMPLIANCE'
    };

    // Wallet for BOOS BET (currency AOA / Kz)
    const wallet: Wallet = {
      user_id: userId,
      currency: 'AOA',
      balance: 0,
      bonus_balance: 0,
      locked_balance: 0,
      updated_at: now
    };

    const authIdentity: AuthIdentityRecord = {
      id: `aid_${crypto.randomBytes(6).toString('hex')}`,
      user_id: userId,
      type: 'PHONE',
      identifier: phoneE164,
      is_primary: true,
      verified_at: now
    };

    this.data.users[userId] = user;
    this.data.public_profiles[userId] = profile;
    this.data.private_identities[userId] = privateIdentity;
    this.data.kyc_verifications[userId] = kyc;
    this.data.wallets[userId] = wallet;
    this.data.auth_identities[authIdentity.id] = authIdentity;

    this.saveDatabase();

    this.addSecurityEvent({
      user_id: userId,
      event_type: 'ACCOUNT_CREATED',
      ip: '127.0.0.1',
      details: `Conta FIMSER criada via Telemóvel (${phoneE164}). Pseudónimo público atribuído: ${pseudonym}`
    });

    return { user, profile, privateIdentity, kyc, wallet };
  }

  getPublicProfile(userId: string): PublicProfile | null {
    return this.data.public_profiles[userId] || null;
  }

  updatePublicProfile(userId: string, updates: Partial<PublicProfile>): PublicProfile {
    const profile = this.data.public_profiles[userId];
    if (!profile) throw new Error('Perfil público não encontrado');

    if (updates.username && updates.username !== profile.username) {
      // Validate uniqueness
      const cleanUsername = updates.username.trim();
      if (!/^[a-zA-Z0-9_\-]{3,20}$/.test(cleanUsername)) {
        throw new Error('O username deve ter entre 3 e 20 caracteres alfanuméricos.');
      }
      const isTaken = Object.values(this.data.public_profiles).some(
        p => p.user_id !== userId && p.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (isTaken) {
        throw new Error('Este username já está em uso por outro jogador.');
      }
      profile.username = cleanUsername;
      profile.custom_username_set = true;
    }

    if (updates.avatar_id) {
      const valid = OFFICIAL_AVATARS.some(a => a.id === updates.avatar_id);
      if (valid) {
        profile.avatar_id = updates.avatar_id;
      }
    }

    if (typeof updates.level === 'number') profile.level = updates.level;
    if (typeof updates.xp === 'number') profile.xp = updates.xp;
    if (typeof updates.rank_points === 'number') profile.rank_points = updates.rank_points;
    if (typeof updates.win_streak === 'number') profile.win_streak = updates.win_streak;

    this.saveDatabase();
    return profile;
  }

  // --- Private Identity & KYC ---

  getPrivateIdentity(userId: string): PrivateIdentity | null {
    return this.data.private_identities[userId] || null;
  }

  getKyc(userId: string): KycVerification | null {
    return this.data.kyc_verifications[userId] || null;
  }

  submitKyc(
    userId: string,
    data: {
      full_legal_name: string;
      date_of_birth: string;
      doc_type: 'BI_ANGOLA' | 'PASSAPORTE' | 'CARTA_CONDUCAO';
      doc_number: string;
      doc_front_name?: string;
      doc_back_name?: string;
    }
  ): { privateIdentity: PrivateIdentity; kyc: KycVerification } {
    const identity = this.data.private_identities[userId];
    const kyc = this.data.kyc_verifications[userId];
    if (!identity || !kyc) throw new Error('Utilizador não registado.');

    const now = new Date().toISOString();

    // Update Private Identity
    identity.full_legal_name = data.full_legal_name.trim();
    identity.date_of_birth = data.date_of_birth;
    identity.doc_type = data.doc_type;
    identity.doc_number = data.doc_number.trim().toUpperCase();
    identity.updated_at = now;

    // Set KYC to PENDING (Never auto-verified simply because form was filled!)
    kyc.status = 'PENDING';
    kyc.submitted_at = now;
    kyc.reviewed_at = null;
    kyc.reviewer_notes = 'Documentos submetidos. Em análise de conformidade pelo departamento regulatório.';
    kyc.doc_front_name = data.doc_front_name || 'frente_doc.pdf';
    kyc.doc_back_name = data.doc_back_name || 'verso_doc.pdf';

    this.saveDatabase();

    this.addSecurityEvent({
      user_id: userId,
      event_type: 'KYC_SUBMITTED',
      ip: '127.0.0.1',
      details: `Submissão de documento ${data.doc_type} para verificação. Estado atual: PENDING.`
    });

    return { privateIdentity: identity, kyc };
  }

  adminReviewKyc(
    userId: string,
    action: 'APPROVE' | 'REJECT' | 'REQUEST_REVIEW',
    notes: string
  ): KycVerification {
    const kyc = this.data.kyc_verifications[userId];
    if (!kyc) throw new Error('Registo KYC não encontrado.');

    const now = new Date().toISOString();
    kyc.reviewed_at = now;
    kyc.reviewer_notes = notes;

    if (action === 'APPROVE') {
      kyc.status = 'VERIFIED';
      // Add verified badge to public profile without revealing identity
      const profile = this.data.public_profiles[userId];
      if (profile && !profile.badges.includes('KYC_VERIFICADO')) {
        profile.badges.push('KYC_VERIFICADO');
      }
    } else if (action === 'REJECT') {
      kyc.status = 'REJECTED';
    } else {
      kyc.status = 'REQUIRES_REVIEW';
    }

    this.saveDatabase();

    this.addSecurityEvent({
      user_id: userId,
      event_type: 'KYC_STATUS_CHANGED',
      ip: '127.0.0.1',
      details: `Parecer de conformidade emitido: ${kyc.status}. Notas: ${notes}`
    });

    return kyc;
  }

  // --- Email Link (Optional secondary attribute) ---

  linkEmail(userId: string, email: string): PrivateIdentity {
    const identity = this.data.private_identities[userId];
    if (!identity) throw new Error('Utilizador não encontrado');

    const cleanEmail = email.trim().toLowerCase();
    identity.email = cleanEmail;
    identity.email_verified = true; // In this flow marked verified upon code confirmation
    identity.updated_at = new Date().toISOString();

    // Check if auth_identities already has email
    const exists = Object.values(this.data.auth_identities).some(
      a => a.user_id === userId && a.type === 'EMAIL'
    );
    if (!exists) {
      const id = `aid_${crypto.randomBytes(6).toString('hex')}`;
      this.data.auth_identities[id] = {
        id,
        user_id: userId,
        type: 'EMAIL',
        identifier: cleanEmail,
        is_primary: false,
        verified_at: new Date().toISOString()
      };
    }

    this.saveDatabase();

    this.addSecurityEvent({
      user_id: userId,
      event_type: 'EMAIL_LINKED',
      ip: '127.0.0.1',
      details: `E-mail secundário associado à conta para segurança e recuperação: ${cleanEmail}`
    });

    return identity;
  }

  // --- Wallet & Ledger ---

  getWallet(userId: string): Wallet | null {
    return this.data.wallets[userId] || null;
  }

  deposit(_userId: string, _amount: number, _method: string): Wallet {
    throw new Error(
      'DEPÓSITO DIRETO BLOQUEADO: Crédito direto sem confirmação financeira é proibido. Toda mutação de saldo exige confirmação autenticada de gateway de pagamento.'
    );
  }

  isDepositConfirmed(transactionId: string): boolean {
    return !!(this.data.confirmed_deposits && this.data.confirmed_deposits[transactionId]);
  }

  creditConfirmedDeposit(params: {
    transactionId: string;
    userId: string;
    amount: number;
    currency: 'AOA';
    provider: string;
    reference: string;
  }): Wallet {
    if (!params.transactionId || typeof params.transactionId !== 'string') {
      throw new Error('ID de transação financeiro obrigatório para liquidação de depósito.');
    }

    if (this.isDepositConfirmed(params.transactionId)) {
      throw new Error(`CRÉDITO DUPLICADO IMPEDIDO: A transação ${params.transactionId} já foi creditada anteriormente.`);
    }

    if (!params.amount || typeof params.amount !== 'number' || params.amount <= 0 || isNaN(params.amount)) {
      throw new Error('Montante inválido para crédito de depósito.');
    }

    if (params.currency !== 'AOA') {
      throw new Error(`Moeda ${params.currency} não suportada. Apenas AOA é autorizada.`);
    }

    const wallet = this.data.wallets[params.userId];
    if (!wallet) {
      throw new Error(`Carteira do utilizador ${params.userId} não encontrada.`);
    }

    // Mutação atómica e registo de confirmação
    wallet.balance += params.amount;
    wallet.updated_at = new Date().toISOString();

    if (!this.data.confirmed_deposits) {
      this.data.confirmed_deposits = {};
    }

    this.data.confirmed_deposits[params.transactionId] = {
      transaction_id: params.transactionId,
      user_id: params.userId,
      amount: params.amount,
      currency: params.currency,
      provider: params.provider,
      reference: params.reference,
      credited_at: new Date().toISOString()
    };

    this.saveDatabase();

    this.addSecurityEvent({
      user_id: params.userId,
      event_type: 'DEPOSIT_CONFIRMED_CREDITED',
      ip: '127.0.0.1',
      details: `Depósito autenticado de ${params.amount.toLocaleString('pt-AO')} Kz creditado com sucesso via ${params.provider} (Ref: ${params.reference}, TxId: ${params.transactionId}).`
    });

    return wallet;
  }

  withdraw(userId: string, amount: number, iban: string): Wallet {
    const wallet = this.data.wallets[userId];
    const kyc = this.data.kyc_verifications[userId];
    if (!wallet) throw new Error('Carteira não encontrada');

    // Strict KYC validation gate: Withdrawals REQUIRE verified KYC
    if (!kyc || kyc.status !== 'VERIFIED') {
      throw new Error(
        'Operação não autorizada: Os levantamentos exigem verificação de identidade (KYC) aprovada por determinação regulatória.'
      );
    }

    if (amount <= 0) throw new Error('Valor inválido para levantamento');
    if (wallet.balance < amount) throw new Error('Saldo insuficiente para levantamento.');

    wallet.balance -= amount;
    wallet.updated_at = new Date().toISOString();
    this.saveDatabase();

    this.addSecurityEvent({
      user_id: userId,
      event_type: 'WITHDRAWAL_REQUESTED',
      ip: '127.0.0.1',
      details: `Levantamento de ${amount.toLocaleString('pt-AO')} Kz solicitado para IBAN ${iban}.`
    });

    return wallet;
  }

  // --- AI Analysis Free vs Paid Quota ---

  getUserAiQuota(userId: string): { freeRemaining: number; totalCount: number; balance: number } {
    const profile = this.data.public_profiles[userId];
    const wallet = this.data.wallets[userId];
    const freeRemaining = profile?.ai_free_analyses !== undefined ? profile.ai_free_analyses : 1;
    const totalCount = profile?.ai_analyses_count || 0;
    const balance = wallet?.balance || 0;
    return { freeRemaining, totalCount, balance };
  }

  useFreeAnalysis(userId: string): { freeRemaining: number; totalCount: number; wasFree: boolean } {
    const profile = this.data.public_profiles[userId];
    if (!profile) throw new Error('Perfil não encontrado');

    const currentFree = profile.ai_free_analyses !== undefined ? profile.ai_free_analyses : 1;
    if (currentFree <= 0) {
      throw new Error('A sua análise gratuita já foi utilizada.');
    }

    profile.ai_free_analyses = currentFree - 1;
    profile.ai_analyses_count = (profile.ai_analyses_count || 0) + 1;
    this.saveDatabase();

    return {
      freeRemaining: profile.ai_free_analyses,
      totalCount: profile.ai_analyses_count,
      wasFree: true
    };
  }

  deductAnalysisFee(userId: string, feeAmount: number = 200): { wallet: Wallet; freeRemaining: number; totalCount: number; wasFree: boolean } {
    const wallet = this.data.wallets[userId];
    const profile = this.data.public_profiles[userId];
    if (!wallet || !profile) throw new Error('Carteira ou perfil não encontrado.');

    if (wallet.balance < feeAmount) {
      throw new Error(`Saldo insuficiente na sua carteira (${wallet.balance.toLocaleString('pt-AO')} Kz). A análise inteligente de IA custa ${feeAmount.toLocaleString('pt-AO')} Kz. Efetue um depósito via Multicaixa Express.`);
    }

    wallet.balance -= feeAmount;
    wallet.updated_at = new Date().toISOString();
    profile.ai_analyses_count = (profile.ai_analyses_count || 0) + 1;
    this.saveDatabase();

    this.addSecurityEvent({
      user_id: userId,
      event_type: 'AI_PREDICTION_PAID',
      ip: '127.0.0.1',
      details: `Taxa de análise inteligente de IA (${feeAmount.toLocaleString('pt-AO')} Kz) debitada com sucesso.`
    });

    return {
      wallet,
      freeRemaining: profile.ai_free_analyses || 0,
      totalCount: profile.ai_analyses_count,
      wasFree: false
    };
  }

  // --- Sessions & Auth ---

  createSession(userId: string, ip: string, userAgent: string): UserSessionRecord {
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const session: UserSessionRecord = {
      token,
      user_id: userId,
      user_agent: userAgent,
      ip_address: ip,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: true
    };

    this.data.user_sessions[token] = session;

    // Update last_login_at
    if (this.data.users[userId]) {
      this.data.users[userId].last_login_at = now.toISOString();
    }

    this.saveDatabase();

    this.addSecurityEvent({
      user_id: userId,
      event_type: 'LOGIN_SUCCESS',
      ip,
      details: `Sessão iniciada com sucesso. Token emitido.`
    });

    return session;
  }

  getSession(token: string): (UserSessionRecord & { user: User }) | null {
    const session = this.data.user_sessions[token];
    if (!session || !session.is_active) return null;

    if (new Date(session.expires_at).getTime() < Date.now()) {
      session.is_active = false;
      this.saveDatabase();
      return null;
    }

    const user = this.data.users[session.user_id];
    if (!user) return null;

    return { ...session, user };
  }

  revokeSession(token: string) {
    if (this.data.user_sessions[token]) {
      this.data.user_sessions[token].is_active = false;
      this.saveDatabase();
    }
  }

  // --- Phone OTP Verifications ---

  saveOtpVerification(record: PhoneVerificationRecord) {
    this.data.phone_verifications[record.phone_e164] = record;
    this.saveDatabase();
  }

  getOtpVerification(phoneE164: string): PhoneVerificationRecord | null {
    return this.data.phone_verifications[phoneE164] || null;
  }

  clearOtpVerification(phoneE164: string) {
    delete this.data.phone_verifications[phoneE164];
    this.saveDatabase();
  }

  // --- Security Audit Trail ---

  addSecurityEvent(event: Omit<SecurityEvent, 'id' | 'created_at'>) {
    const fullEvent: SecurityEvent = {
      id: `sec_${crypto.randomBytes(6).toString('hex')}`,
      created_at: new Date().toISOString(),
      ...event
    };
    this.data.security_events.push(fullEvent);
    // Keep last 300 events
    if (this.data.security_events.length > 300) {
      this.data.security_events = this.data.security_events.slice(-300);
    }
    this.saveDatabase();
  }

  getSecurityEvents(userId?: string): SecurityEvent[] {
    if (!userId) {
      return [...this.data.security_events].reverse();
    }
    return this.data.security_events
      .filter(e => e.user_id === userId)
      .reverse();
  }

  // --- Leaderboard (Public pseudonymous stats only) ---

  getLeaderboard(): LeaderboardEntry[] {
    const list = Object.values(this.data.public_profiles).map(p => ({
      username: p.username,
      avatar_id: p.avatar_id,
      level: p.level,
      score: p.rank_points,
      win_streak: p.win_streak
    }));

    list.sort((a, b) => b.score - a.score);

    return list.slice(0, 10).map((item, idx) => ({
      rank: idx + 1,
      ...item
    }));
  }

  // --- Bets & Games ---

  placeBet(userId: string, stake: number, selections: any[]): BetTicket {
    const wallet = this.data.wallets[userId];
    if (!wallet) throw new Error('Carteira não encontrada');
    if (stake <= 0) throw new Error('Montante inválido');
    if (wallet.balance < stake) throw new Error('Saldo insuficiente para esta aposta.');

    const totalOdds = selections.reduce((acc, s) => acc * s.odd, 1);
    const potentialPayout = Math.round(stake * totalOdds);

    wallet.balance -= stake;
    wallet.updated_at = new Date().toISOString();

    const ticket: BetTicket = {
      id: `bet_${crypto.randomBytes(6).toString('hex')}`,
      user_id: userId,
      placed_at: new Date().toISOString(),
      stake,
      potential_payout: potentialPayout,
      total_odds: Number(totalOdds.toFixed(2)),
      status: 'PENDING',
      selections
    };

    this.data.bets[ticket.id] = ticket;

    // Update user stats
    const profile = this.data.public_profiles[userId];
    if (profile) {
      profile.xp += 50;
      profile.rank_points += 10;
      if (profile.xp >= profile.level * 200) {
        profile.level += 1;
      }
    }

    this.saveDatabase();

    this.addSecurityEvent({
      user_id: userId,
      event_type: 'BET_PLACED',
      ip: '127.0.0.1',
      details: `Boletim de aposta #${ticket.id} registado. Valor: ${stake} Kz. Retorno potencial: ${potentialPayout} Kz.`
    });

    return ticket;
  }

  getUserBets(userId: string): BetTicket[] {
    return Object.values(this.data.bets)
      .filter(b => b.user_id === userId)
      .reverse();
  }
}

export const db = new DatabaseStore();
