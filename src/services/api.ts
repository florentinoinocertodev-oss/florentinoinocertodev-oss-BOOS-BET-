import {
  SessionData,
  PublicProfile,
  PrivateIdentity,
  KycVerification,
  Wallet,
  AvatarOption,
  SmsGatewayStatus,
  SecurityEvent,
  SportMatch,
  BetTicket,
  KycStatus,
  MatchPrediction,
  AiClubAnalysisResult
} from '../types';

const TOKEN_KEY = 'boos_auth_token';

export const apiClient = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('fimser_auth_token');
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || `Erro HTTP ${res.status}`);
    }
    return data;
  },

  // Auth
  async sendPhoneOtp(phone: string, countryCode: string = '+244') {
    return this.request<{
      success: boolean;
      status: string;
      phoneE164: string;
      phoneNational: string;
      expiresInSeconds: number;
      providerMessageId?: string;
      codeHint?: string;
    }>('/api/auth/phone/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, countryCode })
    });
  },

  async verifyPhoneOtp(phone: string, code: string, countryCode: string = '+244') {
    const data = await this.request<{
      success: boolean;
      isNewUser: boolean;
      token: string;
      user: any;
      profile: PublicProfile;
      privateIdentity: PrivateIdentity;
      kyc: KycVerification;
      wallet: Wallet;
    }>('/api/auth/phone/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, code, countryCode })
    });

    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async quickPhoneLogin(phone: string, countryCode: string = '+244') {
    const data = await this.request<{
      success: boolean;
      isNewUser: boolean;
      token: string;
      user: any;
      profile: PublicProfile;
      privateIdentity: PrivateIdentity;
      kyc: KycVerification;
      wallet: Wallet;
    }>('/api/auth/phone/quick-login', {
      method: 'POST',
      body: JSON.stringify({ phone, countryCode })
    });

    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async syncFirebaseUser(phone: string, firebaseUid?: string, countryCode: string = '+244') {
    const data = await this.request<{
      success: boolean;
      isNewUser: boolean;
      token: string;
      user: any;
      profile: PublicProfile;
      privateIdentity: PrivateIdentity;
      kyc: KycVerification;
      wallet: Wallet;
    }>('/api/auth/sync-firebase', {
      method: 'POST',
      body: JSON.stringify({ phone, firebaseUid, countryCode })
    });

    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async getSession(): Promise<SessionData | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      return await this.request<SessionData>('/api/auth/session');
    } catch {
      this.clearToken();
      return null;
    }
  },

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.clearToken();
    }
  },

  // SMS Gateway
  async getSmsGatewayStatus() {
    return this.request<{
      success: boolean;
      activeProvider: string;
      isConfigured: boolean;
      status: 'READY' | 'UNAVAILABLE' | 'TEST_MODE';
      providerName: string;
      description: string;
      supportedProviders: Array<{ id: string; name: string; configured: boolean }>;
      recentDispatches: any[];
    }>('/api/sms-gateway/status');
  },

  async updateSmsConfig(config: any) {
    return this.request('/api/sms-gateway/config', {
      method: 'POST',
      body: JSON.stringify(config)
    });
  },

  async testSmsDispatch(phone: string, countryCode: string = '+244') {
    return this.request('/api/sms-gateway/test-dispatch', {
      method: 'POST',
      body: JSON.stringify({ phone, countryCode })
    });
  },

  // Profile & Avatars
  async getAvatars() {
    return this.request<{ success: boolean; avatars: AvatarOption[] }>('/api/profile/avatars');
  },

  async updatePublicProfile(updates: { username?: string; avatar_id?: string }) {
    return this.request<{ success: boolean; profile: PublicProfile }>('/api/profile/public', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  },

  // KYC
  async getKycStatus() {
    return this.request<{
      success: boolean;
      privateIdentity: PrivateIdentity;
      kyc: KycVerification;
    }>('/api/kyc/status');
  },

  async submitKyc(data: {
    full_legal_name: string;
    date_of_birth: string;
    doc_type: string;
    doc_number: string;
    doc_front_name?: string;
    doc_back_name?: string;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      privateIdentity: PrivateIdentity;
      kyc: KycVerification;
    }>('/api/kyc/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async adminReviewKyc(action: 'APPROVE' | 'REJECT' | 'REQUEST_REVIEW', notes: string) {
    return this.request<{
      success: boolean;
      kyc: KycVerification;
      profile: PublicProfile;
    }>('/api/kyc/admin-review', {
      method: 'POST',
      body: JSON.stringify({ action, notes })
    });
  },

  // Security
  async linkEmail(email: string) {
    return this.request<{
      success: boolean;
      message: string;
      privateIdentity: PrivateIdentity;
    }>('/api/security/email/link', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async getSecurityEvents() {
    return this.request<{ success: boolean; events: SecurityEvent[] }>('/api/security/events');
  },

  // Wallet
  async getWallet() {
    return this.request<{
      success: boolean;
      wallet: Wallet;
      kycStatus: KycStatus;
      canWithdraw: boolean;
    }>('/api/wallet');
  },

  async deposit(amount: number, method: string = 'Multicaixa Express') {
    return this.request<{ success: boolean; wallet: Wallet; message: string }>('/api/wallet/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount, method })
    });
  },

  // Official Production Payment Gateway Methods (EMIS / MCX / PaySuite)
  async getPaymentProviders() {
    return this.request<{ success: boolean; providers: any[] }>('/api/payments/providers');
  },

  async initiatePaymentDeposit(amount: number, provider: string, customerPhone?: string) {
    return this.request<{
      success: boolean;
      transaction: any;
      actionRequired?: string;
      instructions: string;
      referenceData?: {
        entity: string;
        reference: string;
        amount: number;
        expiresInMinutes: number;
      };
    }>('/api/payments/deposit/initiate', {
      method: 'POST',
      body: JSON.stringify({ amount, provider, customerPhone })
    });
  },

  async getPaymentTransactions() {
    return this.request<{ success: boolean; transactions: any[] }>('/api/payments/transactions');
  },

  // Official Sports Data Holders (Betradar / Sportradar / Oddspedia)
  async getSportsHolders() {
    return this.request<{ success: boolean; providers: any[] }>('/api/holders/providers');
  },

  async getHolderMatches(isLive: boolean = false) {
    return this.request<{ success: boolean; matches: SportMatch[] }>(`/api/holders/matches?live=${isLive}`);
  },

  async withdraw(amount: number, iban: string) {
    return this.request<{ success: boolean; wallet: Wallet; message: string }>('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, iban })
    });
  },

  // Sports & Bets & Previsões
  async getMatches(params?: { sport?: string; query?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.sport && params.sport !== 'all') searchParams.set('sport', params.sport);
    if (params?.query) searchParams.set('q', params.query);
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<{ success: boolean; matches: SportMatch[] }>(`/api/sports/matches${qs}`);
  },

  async getPredictions(params?: { query?: string; competition?: string; minConfidence?: number }) {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set('q', params.query);
    if (params?.competition) searchParams.set('competition', params.competition);
    if (params?.minConfidence) searchParams.set('minConfidence', String(params.minConfidence));
    const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<{ success: boolean; predictions: MatchPrediction[] }>(`/api/sports/predictions${qs}`);
  },

  async getPredictionById(matchId: string) {
    return this.request<{ success: boolean; prediction: MatchPrediction }>(`/api/sports/predictions/${matchId}`);
  },

  async getLiveScores() {
    return this.request<{
      success: boolean;
      liveScores: Record<string, any>;
      timestamp: string;
    }>('/api/sports/live-scores');
  },

  async simulateGoal(matchId: string, team: 'HOME' | 'AWAY' = 'HOME', player?: string) {
    return this.request<{ success: boolean; event: any }>(`/api/sports/matches/${matchId}/simulate-goal`, {
      method: 'POST',
      body: JSON.stringify({ team, player })
    });
  },

  // AI Predictor Chatbot & Quota
  async getAiPredictionQuota() {
    return this.request<{
      success: boolean;
      freeRemaining: number;
      totalCount: number;
      costPerAnalysis: number;
      balance: number;
      isAuthenticated: boolean;
    }>('/api/predictions/quota');
  },

  async sendAiPredictionChat(params: { query: string; club?: string; confirmPaid?: boolean }) {
    return this.request<{
      success: boolean;
      analysis: AiClubAnalysisResult;
      wasFree: boolean;
      freeRemaining: number;
      wallet?: Wallet;
      message: string;
      requirePaymentConfirmation?: boolean;
      fee?: number;
      currentBalance?: number;
    }>('/api/predictions/ai-chat', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  async placeBet(stake: number, selections: any[]) {
    return this.request<{
      success: boolean;
      ticket: BetTicket;
      wallet: Wallet;
      profile: PublicProfile;
    }>('/api/bets/place', {
      method: 'POST',
      body: JSON.stringify({ stake, selections })
    });
  },

  async getMyBets() {
    return this.request<{ success: boolean; bets: BetTicket[] }>('/api/bets/my-bets');
  },

  // Sportsbook Dynamic Categories & Odds
  async getSportsCategories() {
    return this.request<{
      success: boolean;
      categories: Array<{ id: string; label: string; count: number }>;
    }>('/api/sports/categories');
  },

  async getMatchOdds(matchId: string) {
    return this.request<{
      success: boolean;
      matchId: string;
      odds: { home: number; draw: number; away: number };
      markets: any[];
      lastUpdate: string;
    }>(`/api/sports/matches/${matchId}/odds`);
  }
};
