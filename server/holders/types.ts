/**
 * BOOS BET — Sports Betting Data Holders & Odds Providers Architecture
 * Responsabilidade:
 * - Ingestão de feeds de eventos desportivos e odds em tempo real
 * - Conexão com provedores oficiais (Sportradar, Betradar, LSports, Oddspedia, API-Football)
 * - Liquidação de apostas (Settlement Engine) baseada no feed oficial de resultados
 */

export type SportsHolderProviderId = 
  | 'sportradar' 
  | 'betradar' 
  | 'lsports' 
  | 'oddspedia' 
  | 'api_football';

export type MatchStatus = 'PRE_MATCH' | 'LIVE' | 'HALFTIME' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';

export interface SportsHolderConfig {
  id: SportsHolderProviderId;
  name: string;
  apiVersion: string;
  isActive: boolean;
  isPrimaryFeed: boolean;
  supportedSports: string[];
  latencyMs: number;
  description: string;
}

export interface BettingMarket {
  id: string;
  name: string; // '1X2' | 'TOTAL_GOALS' | 'BOTH_TEAMS_SCORE' | 'DOUBLE_CHANCE'
  status: 'ACTIVE' | 'SUSPENDED' | 'SETTLED';
  odds: {
    home: number;
    draw?: number;
    away: number;
    over?: number;
    under?: number;
    yes?: number;
    no?: number;
  };
}

export interface OfficialSportMatch {
  id: string;
  holderMatchId: string;
  holder: SportsHolderProviderId;
  sport: string;
  competition: string;
  country: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: MatchStatus;
  isLive: boolean;
  minute?: number;
  score?: {
    home: number;
    away: number;
    halftimeHome?: number;
    halftimeAway?: number;
  };
  odds: {
    home: number;
    draw: number;
    away: number;
  };
  markets: BettingMarket[];
  lastFeedUpdate: string;
}

export interface IngestFeedPayload {
  holder: SportsHolderProviderId;
  matches: Array<{
    holderMatchId: string;
    competition: string;
    homeTeam: string;
    awayTeam: string;
    startTime: string;
    status: MatchStatus;
    minute?: number;
    score?: { home: number; away: number };
    odds: { home: number; draw: number; away: number };
  }>;
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
  status: MatchStatus;
  isLive: boolean;
  odds: { home: number; draw: number; away: number };
  lastEvent?: LiveMatchEvent;
  lastFeedUpdate: string;
}

export interface ISportsHolderAdapter {
  readonly providerId: SportsHolderProviderId;
  readonly name: string;
  isConfigured(): boolean;
  fetchLiveFixtures(): Promise<OfficialSportMatch[]>;
  fetchUpcomingFixtures(competition?: string): Promise<OfficialSportMatch[]>;
  fetchOdds(matchId: string): Promise<BettingMarket[]>;
  settleResult(matchId: string): Promise<{ winner: 'HOME' | 'DRAW' | 'AWAY'; score: string }>;
}
