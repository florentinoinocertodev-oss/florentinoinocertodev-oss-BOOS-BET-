import React, { useState, useEffect, useMemo } from 'react';
import { MatchPrediction, SportMatch, BetSelection, SessionData } from '../../types';
import { apiClient } from '../../services/api';
import { notificationService } from '../../services/notificationService';
import { BoosButton } from './BoosButton';
import { BoosBadge } from './BoosBadge';
import { BoosAiPredictionsChatbot } from './BoosAiPredictionsChatbot';
import { BoosWinProbabilityGauge } from './BoosWinProbabilityGauge';
import {
  Search,
  Flame,
  Trophy,
  Sparkles,
  TrendingUp,
  Percent,
  CheckCircle,
  Clock,
  Radio,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  BarChart3,
  SlidersHorizontal,
  X,
  Target,
  ArrowRight,
  Info,
  Layers,
  Bot
} from 'lucide-react';

interface BoosPredictionsHubProps {
  session?: SessionData | null;
  onOpenAuth?: () => void;
  onOpenWallet?: () => void;
  onToggleSelection: (match: SportMatch, type: 'HOME' | 'DRAW' | 'AWAY', odd: number) => void;
  onGoToBettingZone: (matchId?: string) => void;
  selections: BetSelection[];
  onOpenBetSlip?: () => void;
  isCompact?: boolean;
}

export const BoosPredictionsHub: React.FC<BoosPredictionsHubProps> = ({
  session = null,
  onOpenAuth = () => {},
  onOpenWallet = () => {},
  onToggleSelection,
  onGoToBettingZone,
  selections,
  onOpenBetSlip,
  isCompact = false
}) => {
  const [hubTab, setHubTab] = useState<'DESTACADOS' | 'AI_CHATBOT'>('DESTACADOS');
  const [predictions, setPredictions] = useState<MatchPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('all');
  const [filterMinConfidence, setFilterMinConfidence] = useState<number>(0);
  const [selectedPredictionForModal, setSelectedPredictionForModal] = useState<MatchPrediction | null>(null);

  // Load predictions
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await apiClient.getPredictions();
        setPredictions(res.predictions || []);
      } catch (err) {
        console.error('Falha ao carregar previsões:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter predictions
  const filteredPredictions = useMemo(() => {
    return predictions.filter(pred => {
      // Search query (team name, competition, tip, tags)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchHome = pred.homeTeam.toLowerCase().includes(q);
        const matchAway = pred.awayTeam.toLowerCase().includes(q);
        const matchComp = pred.competition.toLowerCase().includes(q);
        const matchTip = pred.recommendedTip.title.toLowerCase().includes(q);
        const matchTag = pred.trendingTag?.toLowerCase().includes(q);
        if (!matchHome && !matchAway && !matchComp && !matchTip && !matchTag) {
          return false;
        }
      }

      // Competition filter
      if (selectedCompetition === 'girabola' && !pred.competition.toLowerCase().includes('girabola')) {
        return false;
      }
      if (selectedCompetition === 'ucl' && !pred.competition.toLowerCase().includes('champions')) {
        return false;
      }

      // Confidence filter
      if (filterMinConfidence > 0 && pred.recommendedTip.confidencePercent < filterMinConfidence) {
        return false;
      }

      return true;
    });
  }, [predictions, searchQuery, selectedCompetition, filterMinConfidence]);

  // Featured / Hot prediction of the day (e.g. Petro vs 1º de Agosto or highest confidence)
  const featuredPrediction = useMemo(() => {
    if (predictions.length === 0) return null;
    return predictions.find(p => p.trendingTag?.includes('#1')) || predictions[0];
  }, [predictions]);

  // Handle adding recommendation directly to bet slip
  const handleAddTipToBetSlip = (pred: MatchPrediction) => {
    // Map prediction to SportMatch
    const mappedMatch: SportMatch = {
      id: pred.matchId,
      competition: pred.competition,
      home_team: pred.homeTeam,
      away_team: pred.awayTeam,
      start_time: pred.startTime,
      is_live: pred.isLive,
      minute: pred.minute,
      score: pred.score,
      odds: pred.odds
    };

    const type = pred.recommendedTip.marketSelection;
    const odd = pred.recommendedTip.odd;

    onToggleSelection(mappedMatch, type, odd);
    notificationService.notifyPredictionAdded(
      `${pred.homeTeam} vs ${pred.awayTeam}`,
      pred.recommendedTip.title,
      odd
    );
  };

  const handleBetNow = (pred: MatchPrediction) => {
    const isAlreadySelected = selections.some(
      s => s.match_id === pred.matchId && s.selection === pred.recommendedTip.marketSelection
    );

    if (!isAlreadySelected) {
      handleAddTipToBetSlip(pred);
    }

    if (onOpenBetSlip) {
      onOpenBetSlip();
    } else {
      onGoToBettingZone(pred.matchId);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header do Hub de Previsões */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#001426] via-[#052848] to-[#001426] border border-[#06345A] p-5 sm:p-7 shadow-xl">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-[#FFC21A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wider bg-gradient-to-r from-[#FFC21A] to-[#F5A900] text-[#001426] shadow-sm uppercase">
                <Sparkles className="w-3.5 h-3.5 fill-[#001426]" />
                Inteligência de Apostas BOOS
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Modelos Preditivos Não Determinísticos · ISJ Angola
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Pesquisa de Previsões & Jogos em Alta
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Explore os prognósticos estatísticos dos jogos em destaque de hoje, avalie as probabilidades reais de vitória e transite instantaneamente para a zona de apostas com 1 toque.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onGoToBettingZone()}
              className="px-4 py-2.5 bg-[#06345A] hover:bg-[#083d6a] border border-[#0d4a7c] rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow active:scale-95"
            >
              <span>Terminal de Apostas</span>
              <ArrowRight className="w-4 h-4 text-[#FFC21A]" />
            </button>
          </div>
        </div>
      </div>

      {/* Switcher: Catálogo de Previsões vs Chatbot IA Inteligente */}
      <div className="flex items-center gap-2 border-b border-[#143A52] pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setHubTab('DESTACADOS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            hubTab === 'DESTACADOS'
              ? 'bg-gradient-to-r from-[#FFD95A] via-[#F7B500] to-[#C88700] text-[#020D18] shadow-md shadow-[#F7B500]/20 font-black'
              : 'text-[#91A4B5] hover:text-[#F5F7FA] hover:bg-[#092237]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Jogos em Destaque & Previsões ({predictions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setHubTab('AI_CHATBOT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            hubTab === 'AI_CHATBOT'
              ? 'bg-gradient-to-r from-[#FFD95A] via-[#F7B500] to-[#C88700] text-[#020D18] shadow-md shadow-[#F7B500]/20 font-black'
              : 'text-[#91A4B5] hover:text-[#F5F7FA] hover:bg-[#092237]'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-[#F7B500]" />
          <span>Chatbot IA Predictor</span>
          <span className="px-1.5 py-0.2 rounded-full bg-[#020D18] text-[#F7B500] text-[9px] font-mono font-black uppercase">
            1 GRÁTIS
          </span>
        </button>
      </div>

      {hubTab === 'AI_CHATBOT' ? (
        <BoosAiPredictionsChatbot
          session={session}
          onOpenAuth={onOpenAuth}
          onOpenWallet={onOpenWallet}
          onToggleSelection={onToggleSelection}
          onGoToBettingZone={onGoToBettingZone}
          selections={selections}
          onOpenBetSlip={onOpenBetSlip}
        />
      ) : (
        <>
          {/* 2. Destaque Principal de Hoje (Super Clássico ou Jogo em Alta) */}
          {featuredPrediction && (
            <div className="relative overflow-hidden rounded-2xl bg-[#092237] border border-[#143A52] hover:border-[#0D4C73] p-5 shadow-xl transition-all">
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#143A52] mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-[#F7B500] text-[#020D18]">
                    <Flame className="w-4 h-4 fill-[#020D18]" />
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-[#F7B500]">
                    {featuredPrediction.trendingTag || 'SUPER DESTAQUE DE HOJE'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#91A4B5] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#F7B500]" />
                  {featuredPrediction.isLive ? (
                    <span className="text-[#F04F5F] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F04F5F] animate-pulse" />
                      AO VIVO {featuredPrediction.minute}'
                    </span>
                  ) : (
                    new Date(featuredPrediction.startTime).toLocaleTimeString('pt-AO', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  )}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                {/* Equipas & Probabilidades */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="text-[11px] font-bold text-[#91A4B5] uppercase tracking-wider">
                    {featuredPrediction.competition}
                  </div>

                  <div className="flex items-center justify-between gap-3 text-base sm:text-lg font-black text-[#F5F7FA]">
                    <span className="truncate flex-1">{featuredPrediction.homeTeam}</span>
                    <span className="px-2 py-0.5 rounded bg-[#061827] text-[#F7B500] text-xs font-mono font-bold border border-[#143A52]">
                      VS
                    </span>
                    <span className="truncate flex-1 text-right">{featuredPrediction.awayTeam}</span>
                  </div>

                  {/* Barra de Probabilidades Reais */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono font-bold text-[#91A4B5]">
                      <span className="text-[#F7B500]">{featuredPrediction.winProbabilities.home}% Casa</span>
                      <span className="text-[#5F7485]">{featuredPrediction.winProbabilities.draw}% Empate</span>
                      <span className="text-[#009EFF]">{featuredPrediction.winProbabilities.away}% Fora</span>
                    </div>
                    <div className="h-2.5 w-full bg-[#061827] rounded-full overflow-hidden flex p-0.5 gap-0.5 border border-[#143A52]">
                      <div
                        style={{ width: `${featuredPrediction.winProbabilities.home}%` }}
                        className="bg-gradient-to-r from-[#FFD95A] to-[#F7B500] rounded-l-full"
                        title={`Vitória Casa: ${featuredPrediction.winProbabilities.home}%`}
                      />
                      <div
                        style={{ width: `${featuredPrediction.winProbabilities.draw}%` }}
                        className="bg-[#5F7485]"
                        title={`Empate: ${featuredPrediction.winProbabilities.draw}%`}
                      />
                      <div
                        style={{ width: `${featuredPrediction.winProbabilities.away}%` }}
                        className="bg-[#009EFF] rounded-r-full"
                        title={`Vitória Fora: ${featuredPrediction.winProbabilities.away}%`}
                      />
                    </div>
                  </div>

                  {/* Análise Exclusiva Resumida */}
                  <p className="text-xs text-[#91A4B5] leading-relaxed italic border-l-2 border-[#F7B500] pl-3 py-0.5">
                    "{featuredPrediction.expertAnalysis}"
                  </p>
                </div>

                {/* Caixa de Aposta / Prognóstico Recomendado */}
                <div className="lg:col-span-5 bg-[#061827] border border-[#143A52] rounded-2xl p-4 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-[#F7B500] tracking-wider flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      Previsão Recomendada
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#19C985]/15 text-[#19C985] border border-[#19C985]/30">
                      {featuredPrediction.recommendedTip.confidencePercent}% Confiança
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-[#F5F7FA] text-sm">
                      {featuredPrediction.recommendedTip.title}
                    </span>
                    <span className="font-mono font-black text-xl text-[#F7B500]">
                      {featuredPrediction.recommendedTip.odd.toFixed(2)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {(() => {
                      const isSelected = selections.some(
                        s =>
                          s.match_id === featuredPrediction.matchId &&
                          s.selection === featuredPrediction.recommendedTip.marketSelection
                      );
                      return (
                        <button
                          type="button"
                          onClick={() => handleAddTipToBetSlip(featuredPrediction)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow ${
                            isSelected
                              ? 'bg-[#19C985] text-[#020D18] font-black'
                              : 'bg-[#0D2940] hover:bg-[#103352] text-[#F5F7FA] border border-[#143A52]'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>No Boletim</span>
                            </>
                          ) : (
                            <>
                              <span>+ Boletim</span>
                            </>
                          )}
                        </button>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={() => handleBetNow(featuredPrediction)}
                      className="py-2 px-3 rounded-xl text-xs font-black bg-gradient-to-r from-[#FFD95A] via-[#F7B500] to-[#C88700] text-[#020D18] hover:brightness-110 transition-all flex items-center justify-center gap-1 shadow cursor-pointer active:scale-95"
                    >
                      <Flame className="w-3.5 h-3.5 fill-[#020D18]" />
                      <span>Apostar Agora</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPredictionForModal(featuredPrediction)}
                    className="w-full text-center text-[11px] font-semibold text-[#F7B500] hover:underline pt-1 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Ver histórico H2H & estatísticas completas</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          )}

      {/* 3. Barra de Pesquisa Preditiva de Previsões & Filtros Rápidos */}
      <div className="space-y-3 bg-[#092237] border border-[#143A52] rounded-2xl p-4 shadow-md">
        <div className="relative">
          <Search className="w-4 h-4 text-[#91A4B5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Pesquise previsões por equipa (ex: Petro, Real Madrid, City, Interclube), liga ou dica..."
            className="w-full pl-10 pr-10 py-2.5 bg-[#061827] border border-[#143A52] focus:border-[#F7B500] rounded-xl text-xs text-[#F5F7FA] placeholder-[#5F7485] focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#91A4B5] hover:text-[#F5F7FA] p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Chips de Filtragem Rápida */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => {
              setSelectedCompetition('all');
              setFilterMinConfidence(0);
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer border ${
              selectedCompetition === 'all' && filterMinConfidence === 0
                ? 'bg-gradient-to-r from-[#FFD95A] via-[#F7B500] to-[#C88700] text-[#020D18] font-black border-[#FFE58A] shadow'
                : 'bg-[#061827] text-[#91A4B5] hover:bg-[#0D2940] hover:text-[#F5F7FA] border-[#143A52]'
            }`}
          >
            Todos os Destaques ({predictions.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedCompetition('girabola');
              setFilterMinConfidence(0);
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer border ${
              selectedCompetition === 'girabola'
                ? 'bg-gradient-to-r from-[#FFD95A] via-[#F7B500] to-[#C88700] text-[#020D18] font-black border-[#FFE58A] shadow'
                : 'bg-[#061827] text-[#91A4B5] hover:bg-[#0D2940] hover:text-[#F5F7FA] border-[#143A52]'
            }`}
          >
            <span>🇦🇴 Girabola ZAP</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedCompetition('ucl');
              setFilterMinConfidence(0);
            }}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer border ${
              selectedCompetition === 'ucl'
                ? 'bg-gradient-to-r from-[#FFD95A] via-[#F7B500] to-[#C88700] text-[#020D18] font-black border-[#FFE58A] shadow'
                : 'bg-[#061827] text-[#91A4B5] hover:bg-[#0D2940] hover:text-[#F5F7FA] border-[#143A52]'
            }`}
          >
            <span>🏆 Champions League</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMinConfidence(filterMinConfidence === 80 ? 0 : 80)}
            className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer border ${
              filterMinConfidence === 80
                ? 'bg-[#19C985] text-[#020D18] font-black border-[#19C985] shadow'
                : 'bg-[#061827] text-[#91A4B5] hover:bg-[#0D2940] hover:text-[#F5F7FA] border-[#143A52]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F7B500]" />
            <span>Dicas de Ouro (+80% Confiança)</span>
          </button>
        </div>
      </div>

      {/* 4. Lista dos Jogos em Destaque & Previsões */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-[#91A4B5] px-1">
          <span className="font-bold text-[#F5F7FA] uppercase tracking-wider">
            Previsões dos Jogos de Hoje ({filteredPredictions.length})
          </span>
          <span className="text-[11px] font-mono">
            {filteredPredictions.length} partidas disponíveis
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-[#91A4B5] bg-[#092237] border border-[#143A52] rounded-2xl">
            <Sparkles className="w-7 h-7 text-[#F7B500] animate-spin mx-auto mb-2" />
            <p className="text-sm font-bold text-[#F5F7FA]">A processar previsões e probabilidades estatísticas...</p>
          </div>
        ) : filteredPredictions.length === 0 ? (
          <div className="p-8 text-center bg-[#092237] border border-[#143A52] rounded-2xl text-[#91A4B5] text-xs space-y-2">
            <Search className="w-8 h-8 mx-auto text-[#F7B500] opacity-40" />
            <p className="font-bold text-[#F5F7FA] text-sm">Nenhuma previsão encontrada para a pesquisa.</p>
            <p className="text-[#91A4B5]">Experimente pesquisar por outra equipa ou limpar os filtros.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCompetition('all');
                setFilterMinConfidence(0);
              }}
              className="mt-2 px-3 py-1.5 rounded-xl bg-[#0D2940] text-[#F7B500] font-bold text-xs hover:bg-[#103352] cursor-pointer border border-[#143A52]"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPredictions.map(pred => {
              const isSelected = selections.some(
                s =>
                  s.match_id === pred.matchId &&
                  s.selection === pred.recommendedTip.marketSelection
              );

              return (
                <div
                  key={pred.id}
                  className="bg-[#092237] border border-[#143A52] hover:border-[#0D4C73] rounded-2xl p-4.5 space-y-3.5 transition-all shadow-lg flex flex-col justify-between"
                >
                  {/* Header: Competição + Horário */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="font-bold text-[#91A4B5] truncate font-mono">
                        {pred.competition}
                      </span>
                      {pred.isLive ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#F04F5F]/15 border border-[#F04F5F]/30 text-[#F04F5F] font-bold font-mono text-[10px] flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F04F5F] animate-pulse" />
                          AO VIVO {pred.minute}'
                        </span>
                      ) : (
                        <span className="text-[#91A4B5] font-mono text-[10px] shrink-0">
                          {new Date(pred.startTime).toLocaleTimeString('pt-AO', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>

                    {/* Equipas & Forma Recente */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm font-bold text-[#F5F7FA]">
                        <span className="truncate">{pred.homeTeam}</span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {pred.keyStats.homeRecentForm.map((f, i) => (
                            <span
                              key={i}
                              className={`w-3.5 h-3.5 rounded text-[8px] font-bold flex items-center justify-center font-mono ${
                                f === 'V'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : f === 'E'
                                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              }`}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm font-bold text-[#F5F7FA]">
                        <span className="truncate">{pred.awayTeam}</span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {pred.keyStats.awayRecentForm.map((f, i) => (
                            <span
                              key={i}
                              className={`w-3.5 h-3.5 rounded text-[8px] font-bold flex items-center justify-center font-mono ${
                                f === 'V'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : f === 'E'
                                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              }`}
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Barra de Probabilidades */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] font-mono text-[#91A4B5]">
                        <span>Casa: {pred.winProbabilities.home}%</span>
                        <span>Empate: {pred.winProbabilities.draw}%</span>
                        <span>Fora: {pred.winProbabilities.away}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#061827] rounded-full overflow-hidden flex gap-0.5 border border-[#143A52]">
                        <div
                          style={{ width: `${pred.winProbabilities.home}%` }}
                          className="bg-[#F7B500]"
                        />
                        <div
                          style={{ width: `${pred.winProbabilities.draw}%` }}
                          className="bg-[#5F7485]"
                        />
                        <div
                          style={{ width: `${pred.winProbabilities.away}%` }}
                          className="bg-[#009EFF]"
                        />
                      </div>
                    </div>

                    {/* Caixa de Previsão Destaque */}
                    <div className="bg-[#061827] border border-[#143A52] rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-[#F7B500] flex items-center gap-1 uppercase tracking-wide">
                          <Target className="w-3 h-3" />
                          {pred.recommendedTip.badgeLabel || 'DICA BOOS'}
                        </span>
                        <span className="font-mono text-[#19C985] font-bold">
                          {pred.recommendedTip.confidencePercent}% Confiança
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#F5F7FA]">
                          {pred.recommendedTip.title}
                        </span>
                        <span className="font-mono font-black text-sm text-[#F7B500] bg-[#0D2940] px-2 py-0.5 rounded border border-[#143A52]">
                          {pred.recommendedTip.odd.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações Híbridas: Boletim / Apostar Agora / Ver Análise */}
                  <div className="space-y-2 pt-2 border-t border-[#143A52]">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddTipToBetSlip(pred)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-[#19C985] text-[#020D18] font-black'
                            : 'bg-[#0D2940] hover:bg-[#103352] text-[#F5F7FA] border border-[#143A52]'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>No Boletim</span>
                          </>
                        ) : (
                          <>
                            <span>+ Boletim</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBetNow(pred)}
                        className="py-2 px-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-[#FFD95A] via-[#F7B500] to-[#C88700] text-[#020D18] hover:brightness-110 transition-all flex items-center justify-center gap-1 shadow cursor-pointer active:scale-95"
                      >
                        <Flame className="w-3.5 h-3.5 fill-[#020D18]" />
                        <span>Apostar</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedPredictionForModal(pred)}
                        className="text-[#F7B500] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        <BarChart3 className="w-3 h-3" />
                        <span>H2H & Estatísticas</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onGoToBettingZone(pred.matchId)}
                        className="text-[#91A4B5] hover:text-[#F5F7FA] flex items-center gap-1 cursor-pointer"
                        title="Ver no terminal de apostas"
                      >
                        <span>Terminal</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>
      )}

      {/* 5. Modal Detalhado de Estatísticas H2H & Previsão */}
      {selectedPredictionForModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg bg-[#001426] border border-[#06345A] rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            {/* Fechar */}
            <button
              type="button"
              onClick={() => setSelectedPredictionForModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-[#06345A] text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Cabeçalho */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#FFC21A] uppercase tracking-wider">
                {selectedPredictionForModal.competition}
              </span>
              <h3 className="text-lg font-black text-white">
                {selectedPredictionForModal.homeTeam} vs {selectedPredictionForModal.awayTeam}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Kickoff: {new Date(selectedPredictionForModal.startTime).toLocaleString('pt-AO')}
              </p>
            </div>

            {/* Medidor Radial de Probabilidade de Vitória (Recharts) */}
            <BoosWinProbabilityGauge
              winProbability={selectedPredictionForModal.winProbabilities.home}
              drawProbability={selectedPredictionForModal.winProbabilities.draw}
              lossProbability={selectedPredictionForModal.winProbabilities.away}
              teamName={selectedPredictionForModal.homeTeam}
              opponent={selectedPredictionForModal.awayTeam}
            />

            {/* Previsão & Confiança */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#02182b] to-[#052848] border border-[#FFC21A]/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#FFC21A] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Prognóstico do Especialista BOOS
                </span>
                <span className="font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]">
                  {selectedPredictionForModal.recommendedTip.confidencePercent}% Confiança
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-black text-white">
                  {selectedPredictionForModal.recommendedTip.title}
                </span>
                <span className="text-xl font-black font-mono text-[#FFC21A]">
                  {selectedPredictionForModal.recommendedTip.odd.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic pt-1">
                "{selectedPredictionForModal.expertAnalysis}"
              </p>
            </div>

            {/* Confronto Direto (H2H) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#FFC21A]" />
                Confronto Direto (Últimos Jogos)
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-[#06345A]/40 border border-[#0d4a7c]">
                  <div className="font-mono font-black text-lg text-white">
                    {selectedPredictionForModal.keyStats.headToHead.homeWins}
                  </div>
                  <div className="text-[10px] text-slate-400">Vitórias Casa</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#06345A]/40 border border-[#0d4a7c]">
                  <div className="font-mono font-black text-lg text-slate-300">
                    {selectedPredictionForModal.keyStats.headToHead.draws}
                  </div>
                  <div className="text-[10px] text-slate-400">Empates</div>
                </div>
                <div className="p-2.5 rounded-xl bg-[#06345A]/40 border border-[#0d4a7c]">
                  <div className="font-mono font-black text-lg text-white">
                    {selectedPredictionForModal.keyStats.headToHead.awayWins}
                  </div>
                  <div className="text-[10px] text-slate-400">Vitórias Fora</div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 text-center font-mono">
                Último confronto: {selectedPredictionForModal.keyStats.headToHead.lastResult}
              </p>
            </div>

            {/* Estatísticas Chave */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-[#02182b] border border-[#06345A] space-y-1">
                <span className="text-[10px] text-slate-400">Média de Golos/Jogo</span>
                <div className="font-mono font-bold text-white text-base">
                  {selectedPredictionForModal.keyStats.averageGoals} Golos
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#02182b] border border-[#06345A] space-y-1">
                <span className="text-[10px] text-slate-400">Ambas Marcam (BTTS)</span>
                <div className="font-mono font-bold text-emerald-400 text-base">
                  {selectedPredictionForModal.keyStats.bothTeamsScoredRate}%
                </div>
              </div>
            </div>

            {/* Jogadores Chave */}
            {selectedPredictionForModal.keyPlayers && selectedPredictionForModal.keyPlayers.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Jogadores em Destaque
                </h4>
                <div className="space-y-1.5">
                  {selectedPredictionForModal.keyPlayers.map((player, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#02182b] border border-[#06345A] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{player.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#06345A] text-slate-300">
                          {player.team}
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-[#FFC21A] text-[11px]">
                        {player.stat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botões de Ação do Modal */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  handleBetNow(selectedPredictionForModal);
                  setSelectedPredictionForModal(null);
                }}
                className="w-full py-3 bg-gradient-to-r from-[#FFC21A] to-[#F5A900] text-[#001426] font-black text-xs rounded-xl shadow cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <Flame className="w-4 h-4 fill-[#001426]" />
                <span>Apostar nesta Previsão Agora (Odd {selectedPredictionForModal.recommendedTip.odd.toFixed(2)})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onGoToBettingZone(selectedPredictionForModal.matchId);
                  setSelectedPredictionForModal(null);
                }}
                className="w-full py-2.5 bg-[#06345A] hover:bg-[#083d6a] text-white font-bold text-xs rounded-xl border border-[#0d4a7c] flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Ver Todos os Mercados no Terminal de Apostas</span>
                <ArrowRight className="w-4 h-4 text-[#FFC21A]" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
