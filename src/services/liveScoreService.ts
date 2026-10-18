import { useState, useEffect, useRef } from 'react';
import { LiveScoreUpdate, LiveMatchEvent, SportMatch } from '../types';

export type LiveConnectionState = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';

type MatchScoreListener = (update: LiveScoreUpdate) => void;
type AllScoresListener = (scores: Record<string, LiveScoreUpdate>) => void;
type MatchEventListener = (event: LiveMatchEvent) => void;
type ConnectionListener = (state: LiveConnectionState) => void;

class LiveScoreService {
  private eventSource: EventSource | null = null;
  private scoresCache: Map<string, LiveScoreUpdate> = new Map();
  private matchListeners: Map<string, Set<MatchScoreListener>> = new Map();
  private allListeners: Set<AllScoresListener> = new Set();
  private eventListeners: Set<MatchEventListener> = new Set();
  private connectionListeners: Set<ConnectionListener> = new Set();
  private connectionState: LiveConnectionState = 'DISCONNECTED';
  private pollingTimer: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private isExplicitlyStopped = false;

  constructor() {
    // Auto-connect upon module load in browser environment
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  public getConnectionState(): LiveConnectionState {
    return this.connectionState;
  }

  public getCachedScore(matchId: string): LiveScoreUpdate | undefined {
    return this.scoresCache.get(matchId);
  }

  public getAllCachedScores(): Record<string, LiveScoreUpdate> {
    const obj: Record<string, LiveScoreUpdate> = {};
    for (const [id, val] of this.scoresCache.entries()) {
      obj[id] = val;
    }
    return obj;
  }

  private setConnectionState(newState: LiveConnectionState) {
    if (this.connectionState !== newState) {
      this.connectionState = newState;
      this.connectionListeners.forEach(cb => {
        try {
          cb(newState);
        } catch (e) {
          console.error('[LiveScoreService] Connection listener error:', e);
        }
      });
    }
  }

  public connect() {
    this.isExplicitlyStopped = false;
    if (typeof window === 'undefined') return;
    if (this.eventSource) return;

    this.setConnectionState('CONNECTING');

    try {
      this.eventSource = new EventSource('/api/sports/live-scores/stream');

      this.eventSource.onopen = () => {
        this.setConnectionState('CONNECTED');
        this.reconnectAttempts = 0;
        this.stopPollingFallback();
      };

      // 1. Initial snapshot
      this.eventSource.addEventListener('init', (e: MessageEvent) => {
        try {
          const snapshot: Record<string, LiveScoreUpdate> = JSON.parse(e.data);
          Object.values(snapshot).forEach(update => {
            this.scoresCache.set(update.matchId, update);
            this.notifyMatchListeners(update.matchId, update);
          });
          this.notifyAllListeners();
        } catch (err) {
          console.error('[LiveScoreService] Error parsing init payload:', err);
        }
      });

      // 2. Score update
      this.eventSource.addEventListener('score_update', (e: MessageEvent) => {
        try {
          const update: LiveScoreUpdate = JSON.parse(e.data);
          this.scoresCache.set(update.matchId, update);
          this.notifyMatchListeners(update.matchId, update);
          this.notifyAllListeners();
        } catch (err) {
          console.error('[LiveScoreService] Error parsing score_update:', err);
        }
      });

      // 3. Match events (Goals, Cards, Halftime)
      this.eventSource.addEventListener('match_event', (e: MessageEvent) => {
        try {
          const event: LiveMatchEvent = JSON.parse(e.data);
          this.eventListeners.forEach(cb => {
            try {
              cb(event);
            } catch (err) {
              console.error('[LiveScoreService] Event listener error:', err);
            }
          });
        } catch (err) {
          console.error('[LiveScoreService] Error parsing match_event:', err);
        }
      });

      // 4. Heartbeat ping
      this.eventSource.addEventListener('ping', () => {
        if (this.connectionState !== 'CONNECTED') {
          this.setConnectionState('CONNECTED');
        }
      });

      this.eventSource.onerror = () => {
        this.handleDisconnect();
      };
    } catch (err) {
      console.warn('[LiveScoreService] EventSource creation failed, starting polling fallback:', err);
      this.handleDisconnect();
    }
  }

  private handleDisconnect() {
    this.setConnectionState('DISCONNECTED');
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.isExplicitlyStopped) return;

    // Start polling immediately to guarantee uninterrupted real-time updates
    this.startPollingFallback();

    // Schedule SSE reconnect with backoff
    if (!this.reconnectTimeout) {
      const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 12000);
      this.reconnectAttempts++;
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectTimeout = null;
        if (!this.isExplicitlyStopped) {
          this.connect();
        }
      }, delay);
    }
  }

  private startPollingFallback() {
    if (this.pollingTimer) return;
    this.fetchSnapshot(); // Immediate fetch
    this.pollingTimer = setInterval(() => {
      this.fetchSnapshot();
    }, 4000);
  }

  private stopPollingFallback() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  private async fetchSnapshot() {
    try {
      const res = await fetch('/api/sports/live-scores');
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.liveScores) {
        Object.values(data.liveScores as Record<string, LiveScoreUpdate>).forEach(update => {
          this.scoresCache.set(update.matchId, update);
          this.notifyMatchListeners(update.matchId, update);
        });
        this.notifyAllListeners();
      }
    } catch {
      // Ignore background network error during polling
    }
  }

  private notifyMatchListeners(matchId: string, update: LiveScoreUpdate) {
    const listeners = this.matchListeners.get(matchId);
    if (listeners) {
      listeners.forEach(cb => {
        try {
          cb(update);
        } catch (err) {
          console.error('[LiveScoreService] Match listener error:', err);
        }
      });
    }
  }

  private notifyAllListeners() {
    const all = this.getAllCachedScores();
    this.allListeners.forEach(cb => {
      try {
        cb(all);
      } catch (err) {
        console.error('[LiveScoreService] All listener error:', err);
      }
    });
  }

  /**
   * Subscribe to a single match's real-time score updates
   */
  public subscribeToMatch(matchId: string, listener: MatchScoreListener): () => void {
    if (!this.matchListeners.has(matchId)) {
      this.matchListeners.set(matchId, new Set());
    }
    this.matchListeners.get(matchId)!.add(listener);

    // Immediately supply cached score if present
    const cached = this.scoresCache.get(matchId);
    if (cached) {
      try {
        listener(cached);
      } catch (e) {
        console.error(e);
      }
    }

    return () => {
      const set = this.matchListeners.get(matchId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.matchListeners.delete(matchId);
        }
      }
    };
  }

  /**
   * Subscribe to all live scores
   */
  public subscribeToAll(listener: AllScoresListener): () => void {
    this.allListeners.add(listener);

    if (this.scoresCache.size > 0) {
      try {
        listener(this.getAllCachedScores());
      } catch (e) {
        console.error(e);
      }
    }

    return () => {
      this.allListeners.delete(listener);
    };
  }

  /**
   * Subscribe to match events (Goals, Red cards, etc.)
   */
  public subscribeToEvents(listener: MatchEventListener): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  /**
   * Subscribe to connection status changes
   */
  public subscribeToConnection(listener: ConnectionListener): () => void {
    this.connectionListeners.add(listener);
    listener(this.connectionState);
    return () => {
      this.connectionListeners.delete(listener);
    };
  }

  public disconnect() {
    this.isExplicitlyStopped = true;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.stopPollingFallback();
    this.setConnectionState('DISCONNECTED');
  }
}

export const liveScoreService = new LiveScoreService();

// =========================================================================
// REACT HOOKS
// =========================================================================

export interface OddsMovement {
  home: 'UP' | 'DOWN' | 'SAME';
  draw: 'UP' | 'DOWN' | 'SAME';
  away: 'UP' | 'DOWN' | 'SAME';
}

/**
 * Hook to subscribe a single Match Card to dynamic real-time live score updates
 */
export function useMatchLiveScore(matchId: string, initialMatch?: SportMatch) {
  const [liveScore, setLiveScore] = useState<LiveScoreUpdate | null>(() => {
    return liveScoreService.getCachedScore(matchId) || null;
  });
  const [isGoalFlash, setIsGoalFlash] = useState(false);
  const [lastGoalEvent, setLastGoalEvent] = useState<LiveMatchEvent | null>(null);
  const [oddsMovement, setOddsMovement] = useState<OddsMovement>({
    home: 'SAME',
    draw: 'SAME',
    away: 'SAME'
  });

  const prevOddsRef = useRef(initialMatch?.odds);
  const goalTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Subscribe to score updates
    const unsubscribeScore = liveScoreService.subscribeToMatch(matchId, (update) => {
      setLiveScore(update);

      // Track odds direction movement
      if (prevOddsRef.current) {
        const prev = prevOddsRef.current;
        setOddsMovement({
          home: update.odds.home > prev.home ? 'UP' : update.odds.home < prev.home ? 'DOWN' : 'SAME',
          draw: update.odds.draw > prev.draw ? 'UP' : update.odds.draw < prev.draw ? 'DOWN' : 'SAME',
          away: update.odds.away > prev.away ? 'UP' : update.odds.away < prev.away ? 'DOWN' : 'SAME'
        });
      }
      prevOddsRef.current = update.odds;

      // Check if update came with a goal event
      if (update.lastEvent && update.lastEvent.type === 'GOAL') {
        setIsGoalFlash(true);
        setLastGoalEvent(update.lastEvent);
        if (goalTimerRef.current) clearTimeout(goalTimerRef.current);
        goalTimerRef.current = setTimeout(() => {
          setIsGoalFlash(false);
        }, 7000);
      }
    });

    // 2. Subscribe to match events specifically for this match
    const unsubscribeEvents = liveScoreService.subscribeToEvents((event) => {
      if (event.matchId === matchId && event.type === 'GOAL') {
        setIsGoalFlash(true);
        setLastGoalEvent(event);
        if (goalTimerRef.current) clearTimeout(goalTimerRef.current);
        goalTimerRef.current = setTimeout(() => {
          setIsGoalFlash(false);
        }, 7000);
      }
    });

    return () => {
      unsubscribeScore();
      unsubscribeEvents();
      if (goalTimerRef.current) clearTimeout(goalTimerRef.current);
    };
  }, [matchId]);

  const currentScore = liveScore?.score ?? initialMatch?.score;
  const currentMinute = liveScore?.minute ?? initialMatch?.minute;
  const isLive = liveScore?.isLive ?? initialMatch?.is_live ?? initialMatch?.isLive ?? false;
  const currentOdds = liveScore?.odds ?? initialMatch?.odds ?? { home: 1.5, draw: 3.0, away: 4.5 };
  const status = liveScore?.status ?? (isLive ? 'LIVE' : 'PRE_MATCH');

  return {
    liveScore,
    currentScore,
    currentMinute,
    isLive,
    currentOdds,
    status,
    isGoalFlash,
    lastGoalEvent,
    oddsMovement
  };
}

/**
 * Hook to subscribe to all live score updates (e.g. for Sportsbook view)
 */
export function useAllLiveScores() {
  const [allScores, setAllScores] = useState<Record<string, LiveScoreUpdate>>(() => {
    return liveScoreService.getAllCachedScores();
  });
  const [connectionState, setConnectionState] = useState<LiveConnectionState>(() => {
    return liveScoreService.getConnectionState();
  });
  const [latestEvent, setLatestEvent] = useState<LiveMatchEvent | null>(null);

  useEffect(() => {
    const unsubAll = liveScoreService.subscribeToAll((scores) => {
      setAllScores(scores);
    });

    const unsubConn = liveScoreService.subscribeToConnection((state) => {
      setConnectionState(state);
    });

    const unsubEvents = liveScoreService.subscribeToEvents((event) => {
      setLatestEvent(event);
    });

    return () => {
      unsubAll();
      unsubConn();
      unsubEvents();
    };
  }, []);

  return {
    allScores,
    connectionState,
    latestEvent
  };
}
