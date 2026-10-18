// Core types for FIMSER Bet & Win platform

export type KycStatus = 
  | 'NOT_STARTED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REQUIRES_REVIEW';

export type DocType = 'BI_ANGOLA' | 'PASSAPORTE' | 'CARTA_CONDUCAO';

export interface User {
  id: string;
  phone_e164: string;
  phone_national: string;
  country_code: string;
  created_at: string;
  last_login_at: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED';
}

export interface PublicProfile {
  user_id: string;
  username: string; // e.g. "Player-4827" or custom chosen username
  avatar_id: string;
  level: number;
  xp: number;
  rank_points: number;
  win_streak: number;
  badges: string[];
  custom_username_set: boolean;
  ai_free_analyses?: number;
  ai_analyses_count?: number;
}

export interface PrivateIdentity {
  user_id: string;
  full_legal_name: string | null;
  date_of_birth: string | null;
  doc_type: DocType | null;
  doc_number: string | null;
  nationality: string;
  email: string | null;
  email_verified: boolean;
  updated_at: string;
}

export interface KycVerification {
  user_id: string;
  status: KycStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  doc_front_name?: string;
  doc_back_name?: string;
  provider: string;
}

export interface Wallet {
  user_id: string;
  currency: 'AOA'; // Kwanza Angolano (Kz)
  balance: number;
  bonus_balance: number;
  locked_balance: number;
  updated_at: string;
}

export interface SessionData {
  token: string;
  user: User;
  profile: PublicProfile;
  privateIdentity: PrivateIdentity;
  kyc: KycVerification;
  wallet: Wallet;
}

export interface AvatarOption {
  id: string;
  name: string;
  category: 'FIMSER_UNIVERSE' | 'GAMING' | 'GEOMETRIC';
  color: string;
  accent: string;
  svgIcon: string;
}

export interface SmsGatewayStatus {
  activeProvider: string;
  isConfigured: boolean;
  status: 'READY' | 'UNAVAILABLE' | 'TEST_MODE';
  providerName: string;
  lastTestedAt?: string;
  description: string;
}

export interface SecurityEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  ip: string;
  details: string;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  avatar_id: string;
  level: number;
  score: number;
  win_streak: number;
}

export interface LiveMatchEvent {
  id: string;
  matchId: string;
  type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'VAR' | 'HALF_TIME' | 'FULL_TIME' | 'ODDS_UPDATE';
  team?: 'HOME' | 'AWAY';
  teamName?: string;
  player?: string;
  minute: number;
  score?: { home: number; away: number };
  description: string;
  timestamp: string;
}

export interface LiveScoreUpdate {
  matchId: string;
  minute: number;
  score: { home: number; away: number };
  status: 'PRE_MATCH' | 'LIVE' | 'HALFTIME' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
  isLive: boolean;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
  lastEvent?: LiveMatchEvent;
  lastFeedUpdate: string;
}

export interface SportMatch {
  id: string;
  competition: string;
  home_team: string;
  away_team: string;
  start_time: string;
  is_live: boolean;
  minute?: number;
  score?: { home: number; away: number };
  odds: {
    home: number;
    draw: number;
    away: number;
  };
  sport?: string;
  country?: string;
  homeTeam?: string;
  awayTeam?: string;
  isLive?: boolean;
  startTime?: string;
}

export interface BetSelection {
  match_id: string;
  match_title: string;
  selection: 'HOME' | 'DRAW' | 'AWAY';
  selection_label: string;
  odd: number;
}

export interface BetTicket {
  id: string;
  user_id: string;
  placed_at: string;
  stake: number;
  potential_payout: number;
  total_odds: number;
  status: 'PENDING' | 'WON' | 'LOST';
  selections: BetSelection[];
}

export interface MatchPrediction {
  id: string;
  matchId: string;
  competition: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  isLive: boolean;
  minute?: number;
  score?: { home: number; away: number };
  odds: {
    home: number;
    draw: number;
    away: number;
  };
  recommendedTip: {
    title: string;
    marketSelection: 'HOME' | 'DRAW' | 'AWAY';
    odd: number;
    confidencePercent: number;
    riskLevel: 'BAIXO' | 'MÉDIO' | 'ALTO';
    badgeLabel?: string;
  };
  winProbabilities: {
    home: number;
    draw: number;
    away: number;
  };
  keyStats: {
    homeRecentForm: ('V' | 'E' | 'D')[];
    awayRecentForm: ('V' | 'E' | 'D')[];
    headToHead: {
      homeWins: number;
      draws: number;
      awayWins: number;
      lastResult: string;
    };
    averageGoals: number;
    bothTeamsScoredRate: number;
    cleanSheetRate: {
      home: number;
      away: number;
    };
  };
  expertAnalysis: string;
  trendingTag?: string;
  keyPlayers?: {
    name: string;
    team: string;
    stat: string;
  }[];
}

export interface AiClubAnalysisResult {
  clubName: string;
  opponent?: string;
  competition: string;
  winProbability: number;
  drawProbability: number;
  lossProbability: number;
  expectedGoals: number;
  bothTeamsToScoreProbability: number;
  over25Probability: number;
  strengths: string[];
  vulnerabilities: string[];
  recentMomentum: string;
  suggestedMarket: {
    title: string;
    odd: number;
    selectionType: 'HOME' | 'DRAW' | 'AWAY';
    matchId?: string;
  };
  keyStats: {
    label: string;
    value: string;
  }[];
  detailedSummary: string;
  disclaimer: string;
  wasFree: boolean;
  analysesRemaining: number;
}

// ----------------------------------------------------
// PAYMENT PROVIDERS & TRANSACTIONS (ANGOLA)
// ----------------------------------------------------

export type PaymentProviderType = 
  | 'multicaixa_express' 
  | 'multicaixa_gpo' 
  | 'paysuite' 
  | 'appypay' 
  | 'bai_directo'
  | 'pix';

export interface PaymentProviderInfo {
  id: PaymentProviderType;
  name: string;
  category: 'MOBILE_MONEY' | 'REFERENCE_ATM' | 'BANK_TRANSFER';
  currency: 'AOA';
  minAmountKz: number;
  maxAmountKz: number;
  feePercentage: number;
  isActive: boolean;
  description: string;
}

export interface PaymentTransactionRecord {
  id: string;
  userId: string;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  provider: PaymentProviderType;
  amount: number;
  currency: 'AOA';
  status: 'PENDING' | 'WAITING_CUSTOMER_APPROVAL' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  customerPhone?: string;
  customerIban?: string;
  referenceNumber?: string;
  entityCode?: string;
  instructions?: string;
  createdAt: string;
  completedAt?: string;
}

// ----------------------------------------------------
// SPORTS DATA HOLDERS & ODDS FEEDS
// ----------------------------------------------------

export type SportsHolderId = 
  | 'sportradar' 
  | 'betradar' 
  | 'lsports' 
  | 'oddspedia' 
  | 'api_football';

export interface SportsHolderInfo {
  id: SportsHolderId;
  name: string;
  apiVersion: string;
  isActive: boolean;
  isPrimaryFeed: boolean;
  supportedSports: string[];
  latencyMs: number;
  description: string;
}


