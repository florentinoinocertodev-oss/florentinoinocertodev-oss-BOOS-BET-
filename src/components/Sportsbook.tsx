import React, { useState, useEffect } from 'react';
import { SportMatch, BetSelection, BetTicket, SessionData } from '../types';
import { apiClient } from '../services/api';
import { notificationService } from '../services/notificationService';
import { liveScoreService, useAllLiveScores } from '../services/liveScoreService';
import { BoosBannerCarousel } from './brand/BoosBannerCarousel';
import { BoosCategoriesBar } from './brand/BoosCategoriesBar';
import { BoosSubcategoriesChips } from './brand/BoosSubcategoriesChips';
import { BoosTemporalNav, TemporalFilter } from './brand/BoosTemporalNav';
import { BoosSportFilterBar, SportCategory } from './brand/BoosSportFilterBar';
import { BoosSportsCard } from './brand/BoosSportsCard';
import { BoosBetSlip } from './brand/BoosBetSlip';
import { BoosButton } from './brand/BoosButton';
import { BoosPredictionsHub } from './brand/BoosPredictionsHub';
import { BoosLoading } from './brand/BoosLoading';
import { BoosEmptyState } from './brand/BoosEmptyState';
import {
  Trophy,
  Activity,
  Flame,
  Clock,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface SportsbookProps {
  session: SessionData | null;
  onOpenAuth: () => void;
  onOpenWallet?: () => void;
  onBetPlaced: (ticket: BetTicket, newBalance: number) => void;
  onSelectTab: (tab: string) => void;
  selections: BetSelection[];
  onToggleSelection: (match: SportMatch, type: 'HOME' | 'DRAW' | 'AWAY', odd: number) => void;
  onRemoveSelection: (matchId: string) => void;
  onClearSelections: () => void;
  isMobileBetSlipOpen: boolean;
  setIsMobileBetSlipOpen: (open: boolean) => void;
  initialSubTab?: 'MATCHES' | 'PREDICTIONS' | 'MY_BETS';
}

export const Sportsbook: React.FC<SportsbookProps> = ({
  session,
  onOpenAuth,
  onOpenWallet = () => {},
  onBetPlaced,
  onSelectTab,
  selections,
  onToggleSelection,
  onRemoveSelection,
  onClearSelections,
  isMobileBetSlipOpen,
  setIsMobileBetSlipOpen,
  initialSubTab = 'MATCHES'
}) => {
  const [matches, setMatches] = useState<SportMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myBets, setMyBets] = useState<BetTicket[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'MATCHES' | 'PREDICTIONS' | 'MY_BETS'>(initialSubTab);
  const [error, setError] = useState('');
  const [successTicket, setSuccessTicket] = useState<BetTicket | null>(null);

  // Conexão ao serviço de pontuações e stream em tempo real
  const { connectionState } = useAllLiveScores();

  // Sync initialSubTab if changed
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Prompt V2 Architectural Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('Todos');
  const [temporalFilter, setTemporalFilter] = useState<TemporalFilter>('LIVE');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const availableSports: SportCategory[] = React.useMemo(() => {
    const counts = {
      all: matches.length,
      futebol: 0,
      basquetebol: 0,
      tenis: 0,
      mma: 0
    };

    matches.forEach(m => {
      const s = (m.sport || 'Futebol').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (s.includes('futebol')) counts.futebol++;
      else if (s.includes('basquete')) counts.basquetebol++;
      else if (s.includes('teni')) counts.tenis++;
      else if (s.includes('mma') || s.includes('artes') || s.includes('combate')) counts.mma++;
      else counts.futebol++;
    });

    return [
      { id: 'all', label: 'Todos os Esportes', icon: '🏆', count: counts.all },
      { id: 'futebol', label: 'Futebol', icon: '⚽', count: counts.futebol },
      { id: 'basquetebol', label: 'Basquetebol', icon: '🏀', count: counts.basquetebol },
      { id: 'tenis', label: 'Ténis', icon: '🎾', count: counts.tenis },
      { id: 'mma', label: 'MMA / UFC', icon: '🥊', count: counts.mma }
    ];
  }, [matches]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await apiClient.getMatches();
      setMatches(res.matches);
    } catch (e) {
      console.error('Erro ao carregar jogos:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBets = async () => {
    if (!session) return;
    try {
      const res = await apiClient.getMyBets();
      setMyBets(res.bets);
    } catch (e) {
      console.error('Erro ao carregar boletins:', e);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  // Subscrição em Tempo Real (Real-time Live Score & Event Listener)
  useEffect(() => {
    const unsubScores = liveScoreService.subscribeToAll((allScores) => {
      setMatches(prevMatches => {
        let changed = false;
        const updated = prevMatches.map(m => {
          const live = allScores[m.id];
          if (!live) return m;
          if (m.minute !== live.minute || m.score?.home !== live.score.home || m.score?.away !== live.score.away) {
            changed = true;
          }
          return {
            ...m,
            minute: live.minute,
            score: live.score,
            odds: live.odds,
            is_live: live.isLive,
            isLive: live.isLive
          };
        });
        return changed ? updated : prevMatches;
      });
    });

    const unsubEvents = liveScoreService.subscribeToEvents((event) => {
      if (event.type === 'GOAL') {
        notificationService.notifyGoal(
          event.teamName || 'Equipa',
          event.minute,
          event.score ? `${event.score.home} - ${event.score.away}` : ''
        );
      }
    });

    return () => {
      unsubScores();
      unsubEvents();
    };
  }, []);

  useEffect(() => {
    if (session) {
      fetchMyBets();
    }
  }, [session]);

  const handlePlaceBet = async (stake: number) => {
    setError('');
    setSuccessTicket(null);

    if (!session) {
      onOpenAuth();
      return;
    }

    if (selections.length === 0) {
      setError('Selecione pelo menos um prognóstico para o boletim.');
      return;
    }

    if (stake > session.wallet.balance) {
      setError('Saldo insuficiente na sua carteira BOOS BET.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.placeBet(stake, selections);
      onBetPlaced(res.ticket, res.wallet.balance);
      setSuccessTicket(res.ticket);
      notificationService.notifyBetPlaced(res.ticket.id, res.ticket.potential_payout, stake);
      onClearSelections();
      await fetchMyBets();
    } catch (err: any) {
      setError(err.message || 'Falha ao registar aposta.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter matches based on sport, search query, subcategory & temporal filters
  const filteredMatches = matches.filter(m => {
    // 1. Sport category filter
    if (selectedSport !== 'all') {
      const s = (m.sport || 'Futebol').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (selectedSport === 'futebol' && !s.includes('futebol')) return false;
      if (selectedSport === 'basquetebol' && !s.includes('basquete')) return false;
      if (selectedSport === 'tenis' && !s.includes('teni')) return false;
      if (selectedSport === 'mma' && !s.includes('mma') && !s.includes('artes') && !s.includes('combate')) return false;
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const home = (m.home_team || m.homeTeam || '').toLowerCase();
      const away = (m.away_team || m.awayTeam || '').toLowerCase();
      const comp = (m.competition || '').toLowerCase();
      const country = (m.country || '').toLowerCase();
      const sport = (m.sport || '').toLowerCase();

      const matchFound =
        home.includes(q) ||
        away.includes(q) ||
        comp.includes(q) ||
        country.includes(q) ||
        sport.includes(q);

      if (!matchFound) return false;
    }

    // 3. Temporal filter (applied when user is not directly searching for a specific query)
    if (!searchQuery.trim()) {
      if (temporalFilter === 'LIVE' && !m.is_live && !m.isLive) return false;
      if (temporalFilter === 'NEXT' && (m.is_live || m.isLive)) return false;
    }

    // 4. Subcategory chip filter
    if (activeSubcategory !== 'Todos' && activeSubcategory !== 'Popular 🔥') {
      if (activeSubcategory === 'Girabola ZAP (Angola)' && !m.competition.includes('Girabola')) return false;
      if (activeSubcategory === 'UEFA Champions League' && !m.competition.includes('Champions')) return false;
      if (activeSubcategory === 'Premier League' && !m.competition.includes('Premier League')) return false;
      if (activeSubcategory === 'BAI Basket (Angola)' && !m.competition.includes('BAI Basket')) return false;
      if (activeSubcategory === 'NBA Basquete' && !m.competition.includes('NBA')) return false;
      if (activeSubcategory === 'ATP Masters Ténis' && !m.competition.includes('ATP') && !m.competition.includes('Grand Slam')) return false;
      if (activeSubcategory === 'UFC Artes Marciais' && !m.competition.includes('UFC')) return false;
    }

    return true;
  });

  const liveMatchesCount = matches.filter(m => m.is_live || m.isLive).length;

  return (
    <div className="space-y-5">
      {/* 1. HERO / BANNER CARROSSEL (Visível na visão geral de apostas) */}
      {activeSubTab === 'MATCHES' && (
        <BoosBannerCarousel
          onCtaClick={actionId => {
            if (actionId === 'win') onSelectTab('win');
            else if (actionId === 'predictions') {
              setActiveSubTab('PREDICTIONS');
            } else if (actionId === 'sports') {
              setActiveSubTab('MATCHES');
              setTemporalFilter('LIVE');
            }
          }}
        />
      )}

      {/* 2. Sub Tabs Primárias: Apostas Desportivas vs Previsões IA vs Meus Boletins */}
      <div className="flex items-center justify-between border-b border-[#143A52] pb-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveSubTab('MATCHES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'MATCHES'
                ? 'bg-gradient-to-r from-[#FFD95A] via-[#F7B500] to-[#C88700] text-[#020D18] shadow-md shadow-[#F7B500]/20 font-black'
                : 'text-[#91A4B5] hover:text-[#F5F7FA] hover:bg-[#092237]'
            }`}
          >
            Apostas Desportivas
          </button>

          <button
            onClick={() => setActiveSubTab('PREDICTIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeSubTab === 'PREDICTIONS'
                ? 'bg-gradient-to-r from-[#FFD95A] via-[#F7B500] to-[#C88700] text-[#020D18] shadow-md shadow-[#F7B500]/20 font-black'
                : 'text-[#91A4B5] hover:text-[#F5F7FA] hover:bg-[#092237]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F7B500]" />
            <span>Previsões Inteligentes</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#020D18] text-[#F7B500] text-[9px] font-mono font-black uppercase">
              HOT
            </span>
          </button>

          {session && (
            <button
              onClick={() => setActiveSubTab('MY_BETS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeSubTab === 'MY_BETS'
                  ? 'bg-gradient-to-r from-[#FFD95A] via-[#F7B500] to-[#C88700] text-[#020D18] shadow-md shadow-[#F7B500]/20 font-black'
                  : 'text-[#91A4B5] hover:text-[#F5F7FA] hover:bg-[#092237]'
              }`}
            >
              Meus Boletins
              {myBets.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#020D18] text-[#F7B500] text-[10px] font-mono font-bold">
                  {myBets.length}
                </span>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Real-Time Live Feed Stream Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors ${
              connectionState === 'CONNECTED'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : connectionState === 'CONNECTING'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
            title="Stream de Pontuações em Tempo Real (Betradar & Sportradar Feed)"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectionState === 'CONNECTED'
                  ? 'bg-emerald-400 animate-pulse'
                  : connectionState === 'CONNECTING'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-400'
              }`}
            />
            <span className="hidden sm:inline">
              {connectionState === 'CONNECTED'
                ? 'FEED AO VIVO CONECTADO'
                : connectionState === 'CONNECTING'
                ? 'A CONECTAR AO STREAM...'
                : 'OFFLINE'}
            </span>
            <span className="sm:hidden font-mono">
              {connectionState === 'CONNECTED' ? 'AO VIVO' : 'STREAM'}
            </span>
          </div>

          <button
            type="button"
            onClick={fetchMatches}
            className="text-xs text-[#91A4B5] hover:text-[#F7B500] flex items-center gap-1 py-1.5 px-2.5 rounded-lg hover:bg-[#092237] transition-colors cursor-pointer shrink-0"
            title="Atualizar Odds"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#F7B500]' : ''}`} />
            <span className="hidden sm:inline font-mono text-[11px]">Atualizar</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'MATCHES' ? (
        <>
          {/* 3. BARRA DE PESQUISA & FILTRO POR MODALIDADES DESPORTIVAS */}
          <BoosSportFilterBar
            sports={availableSports}
            selectedSport={selectedSport}
            onSelectSport={sportId => {
              setSelectedSport(sportId);
              if (sportId !== 'all') {
                setActiveSubcategory('Todos');
              }
            }}
            searchQuery={searchQuery}
            onSearchChange={q => setSearchQuery(q)}
            totalMatchesCount={matches.length}
            filteredMatchesCount={filteredMatches.length}
          />

          {/* 4. NAVEGAÇÃO TEMPORAL (Ao Vivo | Próximos | Hoje | Amanhã | Mais tarde) */}
          <BoosTemporalNav
            activeFilter={temporalFilter}
            onSelectFilter={f => setTemporalFilter(f)}
            liveCount={liveMatchesCount}
          />

          {/* 5. CONTEÚDO PRINCIPAL: Grid (Jogos + Bet Slip Sidebar) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Matches List */}
            <div className="lg:col-span-2 space-y-3.5">
              {loading ? (
                <div className="py-12 bg-[#092237] border border-[#143A52] rounded-3xl">
                  <BoosLoading message="A carregar odds em tempo real..." size="md" />
                </div>
              ) : filteredMatches.length === 0 ? (
                <BoosEmptyState
                  type="events"
                  title="Nenhum jogo encontrado com os filtros selecionados"
                  description={
                    searchQuery.trim()
                      ? `Não foram encontrados jogos para a pesquisa "${searchQuery}". Tente pesquisar por outro clube ou limpe os filtros.`
                      : selectedSport !== 'all'
                      ? `Não há eventos para a modalidade "${availableSports.find(s => s.id === selectedSport)?.label || selectedSport}" com os filtros atuais.`
                      : "Experimente alternar para a aba 'Hoje' ou limpar os filtros para ver os jogos disponíveis."
                  }
                  actionText="Limpar Pesquisa e Ver Todos os Jogos"
                  onAction={() => {
                    setSearchQuery('');
                    setSelectedSport('all');
                    setTemporalFilter('TODAY');
                    setActiveSubcategory('Todos');
                  }}
                />
              ) : (
                filteredMatches.map(m => {
                  const isHomeSelected = selections.some(
                    s => s.match_id === m.id && s.selection === 'HOME'
                  );
                  const isDrawSelected = selections.some(
                    s => s.match_id === m.id && s.selection === 'DRAW'
                  );
                  const isAwaySelected = selections.some(
                    s => s.match_id === m.id && s.selection === 'AWAY'
                  );

                  return (
                    <BoosSportsCard
                      key={m.id}
                      match={m}
                      isHomeSelected={isHomeSelected}
                      isDrawSelected={isDrawSelected}
                      isAwaySelected={isAwaySelected}
                      onSelectOdd={(type, odd) => onToggleSelection(m, type, odd)}
                    />
                  );
                })
              )}
            </div>

            {/* Desktop Bet Slip Sidebar */}
            <div className="hidden lg:block lg:col-span-1">
              <BoosBetSlip
                selections={selections}
                onRemoveSelection={onRemoveSelection}
                onClearAll={onClearSelections}
                session={session}
                onOpenAuth={onOpenAuth}
                onOpenWallet={onOpenWallet}
                onPlaceBet={handlePlaceBet}
                submitting={submitting}
                error={error}
                successTicket={successTicket}
                isMobileFloating={false}
              />
            </div>
          </div>
        </>
      ) : activeSubTab === 'PREDICTIONS' ? (
        /* Aba de Previsões & Inteligência BOOS */
        <div className="space-y-6">
          <BoosPredictionsHub
            session={session}
            onOpenAuth={onOpenAuth}
            onOpenWallet={onOpenWallet}
            onToggleSelection={onToggleSelection}
            onGoToBettingZone={matchId => {
              setActiveSubTab('MATCHES');
              if (matchId) {
                // Return to matches
              }
            }}
            selections={selections}
            onOpenBetSlip={() => setIsMobileBetSlipOpen(true)}
          />
        </div>
      ) : (
        /* Aba Meus Boletins */
        <div className="space-y-4">
          {myBets.length === 0 ? (
            <BoosEmptyState
              type="history"
              onAction={() => setActiveSubTab('MATCHES')}
            />
          ) : (
            myBets.map(bet => (
              <div
                key={bet.id}
                className="p-5 bg-[#092237] border border-[#143A52] rounded-2xl shadow-lg text-xs space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#143A52]">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#F5F7FA]">Bilhete #{bet.id}</span>
                    <span className="text-[#91A4B5] text-[11px] font-mono">
                      {new Date(bet.placed_at).toLocaleString('pt-AO')}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-mono font-black text-[10px] ${
                      bet.status === 'WON'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : bet.status === 'LOST'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-[#F7B500]/20 text-[#F7B500] border border-[#F7B500]/40'
                    }`}
                  >
                    {bet.status === 'PENDING' ? 'EM CURSO' : bet.status}
                  </span>
                </div>

                <div className="space-y-2">
                  {bet.selections.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#061827] border border-[#143A52] flex justify-between items-center text-[#F5F7FA]"
                    >
                      <span className="font-medium text-xs">
                        {s.match_title} ({s.selection_label})
                      </span>
                      <span className="font-mono font-bold text-[#F7B500]">
                        {s.odd.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#143A52] flex items-center justify-between font-mono">
                  <span className="text-[#91A4B5]">
                    Aposta: {bet.stake.toLocaleString('pt-AO')} Kz
                  </span>
                  <span className="font-bold text-emerald-400 text-sm">
                    Retorno Potencial: {bet.potential_payout.toLocaleString('pt-AO')} Kz
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Floating / Expandable Bet Slip on Mobile */}
      <BoosBetSlip
        selections={selections}
        onRemoveSelection={onRemoveSelection}
        onClearAll={onClearSelections}
        session={session}
        onOpenAuth={onOpenAuth}
        onOpenWallet={onOpenWallet}
        onPlaceBet={handlePlaceBet}
        submitting={submitting}
        error={error}
        successTicket={successTicket}
        isMobileFloating={true}
        isOpenMobile={isMobileBetSlipOpen}
        onToggleMobileOpen={() => setIsMobileBetSlipOpen(!isMobileBetSlipOpen)}
      />
    </div>
  );
};
