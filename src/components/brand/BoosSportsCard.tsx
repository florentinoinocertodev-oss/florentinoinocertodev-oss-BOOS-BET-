import React from 'react';
import { SportMatch } from '../../types';
import { BoosOddCard } from './BoosOddCard';
import { useMatchLiveScore } from '../../services/liveScoreService';
import { Clock, Radio, Activity, Zap } from 'lucide-react';

interface BoosSportsCardProps {
  match: SportMatch;
  isHomeSelected: boolean;
  isDrawSelected: boolean;
  isAwaySelected: boolean;
  onSelectOdd: (type: 'HOME' | 'DRAW' | 'AWAY', odd: number) => void;
  className?: string;
}

export const BoosSportsCard: React.FC<BoosSportsCardProps> = ({
  match,
  isHomeSelected,
  isDrawSelected,
  isAwaySelected,
  onSelectOdd,
  className = ''
}) => {
  // Conexão ao serviço dedicado de pontuações em tempo real (Real-time Live Score Listener)
  const {
    currentScore,
    currentMinute,
    isLive,
    currentOdds,
    status,
    isGoalFlash,
    lastGoalEvent,
    oddsMovement
  } = useMatchLiveScore(match.id, match);

  const homeName = match.home_team || match.homeTeam || 'Equipa Casa';
  const awayName = match.away_team || match.awayTeam || 'Equipa Fora';

  return (
    <div
      className={`relative p-3.5 sm:p-4 bg-[#092237] border rounded-2xl transition-all duration-300 shadow-md space-y-3 ${
        isGoalFlash
          ? 'border-[#F7B500] ring-2 ring-[#F7B500]/50 shadow-xl shadow-[#F7B500]/20 bg-gradient-to-b from-[#092237] to-[#0d2a45]'
          : 'border-[#143A52] hover:border-[#0D4C73]'
      } ${className}`}
    >
      {/* Dynamic Goal Flash Banner */}
      {isGoalFlash && lastGoalEvent && (
        <div className="bg-gradient-to-r from-[#F7B500] via-[#FFD84A] to-[#F7B500] text-[#020D18] px-3 py-1.5 rounded-xl font-black text-xs flex items-center justify-between shadow-lg shadow-[#F7B500]/30 animate-pulse">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-sm">⚽</span>
            <span className="tracking-wide uppercase font-extrabold truncate">
              GOOOLO! {lastGoalEvent.teamName} {lastGoalEvent.player ? `(${lastGoalEvent.player})` : ''}
            </span>
          </div>
          <span className="font-mono bg-[#020D18] text-[#F7B500] px-2 py-0.5 rounded text-[11px] font-black shrink-0 ml-2">
            {currentScore ? `${currentScore.home} - ${currentScore.away}` : ''} · {currentMinute}'
          </span>
        </div>
      )}

      {/* 1. Header: Competição + Horário / Status Ao Vivo */}
      <div className="flex items-center justify-between pb-2 border-b border-[#143A52]/70 text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-[#F7B500]'}`} />
          {match.sport && (
            <span className="text-[10px] font-bold tracking-wider text-[#91A4B5] bg-[#061827] px-2 py-0.5 rounded-md border border-[#143A52] shrink-0">
              {match.sport === 'Futebol' ? '⚽ Futebol' :
               match.sport === 'Basquetebol' ? '🏀 Basquete' :
               match.sport === 'Ténis' ? '🎾 Ténis' :
               match.sport === 'MMA' ? '🥊 MMA' : match.sport}
            </span>
          )}
          <span className="text-[#F5F7FA] font-bold tracking-tight truncate max-w-[200px] sm:max-w-xs">
            {match.competition}
          </span>
        </div>

        {isLive ? (
          <div className="flex items-center gap-1.5 text-[#F04F5F] font-bold font-mono text-[11px] shrink-0 bg-[#F04F5F]/10 border border-[#F04F5F]/30 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F04F5F] animate-pulse" />
            <span>
              {status === 'HALFTIME' ? 'INTERVALO (HT)' : `AO VIVO · ${currentMinute}'`}
            </span>
          </div>
        ) : (
          <div className="text-[#91A4B5] font-mono text-[11px] flex items-center gap-1 shrink-0">
            <Clock className="w-3.5 h-3.5 text-[#F7B500]" />
            <span>Hoje 19:45</span>
          </div>
        )}
      </div>

      {/* 2. Evento / Times + Dynamic Real-Time Score */}
      <div className="flex items-center justify-between gap-3 py-1">
        {/* Home Team */}
        <div className="flex-1 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-[#0D2940] border border-[#143A52] flex items-center justify-center font-black text-xs text-[#F5F7FA] shrink-0 shadow-inner">
            {homeName.charAt(0)}
          </div>
          <span className="font-bold text-[#F5F7FA] text-sm sm:text-base leading-tight">
            {homeName}
          </span>
        </div>

        {/* Dynamic Live Score or VS Badge */}
        <div
          className={`shrink-0 text-center px-3 py-1 rounded-xl bg-[#061827] border transition-all duration-300 ${
            isGoalFlash
              ? 'border-[#F7B500] ring-2 ring-[#F7B500]/50 scale-105 bg-[#F7B500]/10'
              : 'border-[#143A52]'
          }`}
        >
          {isLive && currentScore ? (
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-black text-[#F7B500] text-sm sm:text-base tracking-widest">
                {currentScore.home} - {currentScore.away}
              </span>
            </div>
          ) : (
            <span className="text-[10px] font-black text-[#5F7485] uppercase tracking-widest font-mono">
              VS
            </span>
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 flex items-center justify-end gap-2.5 text-right">
          <span className="font-bold text-[#F5F7FA] text-sm sm:text-base leading-tight">
            {awayName}
          </span>
          <div className="w-7 h-7 rounded-full bg-[#0D2940] border border-[#143A52] flex items-center justify-center font-black text-xs text-[#F5F7FA] shrink-0 shadow-inner">
            {awayName.charAt(0)}
          </div>
        </div>
      </div>

      {/* 3. Mercados 1X2 com OddCards dinâmicos e indicadores de volatilidade */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <BoosOddCard
          label="1 (Casa)"
          odd={currentOdds.home}
          selected={isHomeSelected}
          oddsMovement={oddsMovement.home}
          onClick={() => onSelectOdd('HOME', currentOdds.home)}
        />

        <BoosOddCard
          label="X (Empate)"
          odd={currentOdds.draw}
          selected={isDrawSelected}
          oddsMovement={oddsMovement.draw}
          onClick={() => onSelectOdd('DRAW', currentOdds.draw)}
        />

        <BoosOddCard
          label="2 (Fora)"
          odd={currentOdds.away}
          selected={isAwaySelected}
          oddsMovement={oddsMovement.away}
          onClick={() => onSelectOdd('AWAY', currentOdds.away)}
        />
      </div>
    </div>
  );
};
