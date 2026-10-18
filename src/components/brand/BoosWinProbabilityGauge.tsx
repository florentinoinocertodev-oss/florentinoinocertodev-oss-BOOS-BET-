import React from 'react';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer
} from 'recharts';
import { Trophy, TrendingUp, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';

interface BoosWinProbabilityGaugeProps {
  winProbability: number;
  drawProbability?: number;
  lossProbability?: number;
  teamName: string;
  opponent?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BoosWinProbabilityGauge: React.FC<BoosWinProbabilityGaugeProps> = ({
  winProbability,
  drawProbability,
  lossProbability,
  teamName,
  opponent,
  size = 'md',
  className = ''
}) => {
  // Ensure probability is clamped between 0 and 100
  const clampedWin = Math.max(0, Math.min(100, Math.round(winProbability)));

  // Gauge data for Recharts RadialBarChart
  const gaugeData = [
    {
      name: 'Probabilidade de Vitória',
      value: clampedWin,
      fill: 'url(#boosWinGrad)'
    }
  ];

  // Qualitative assessment based on probability
  const getVerdict = (prob: number) => {
    if (prob >= 65) {
      return {
        label: 'ALTA PROBABILIDADE',
        subtext: 'Forte Favorito',
        color: 'text-[#FFC21A]',
        bgColor: 'bg-[#FFC21A]/10 border-[#FFC21A]/30',
        icon: Trophy
      };
    } else if (prob >= 48) {
      return {
        label: 'FAVORITO LIGEIRO',
        subtext: 'Vantagem Estatística',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10 border-emerald-500/30',
        icon: TrendingUp
      };
    } else if (prob >= 35) {
      return {
        label: 'CONFRONTO EQUILIBRADO',
        subtext: 'Margem Reduzida',
        color: 'text-sky-400',
        bgColor: 'bg-sky-500/10 border-sky-500/30',
        icon: ShieldCheck
      };
    } else {
      return {
        label: 'RISCO ELEVADO',
        subtext: 'Azarão / Desafiador',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10 border-amber-500/30',
        icon: AlertTriangle
      };
    }
  };

  const verdict = getVerdict(clampedWin);
  const VerdictIcon = verdict.icon;

  const isSmall = size === 'sm';
  const chartHeight = isSmall ? 130 : 160;

  return (
    <div
      className={`relative bg-gradient-to-b from-[#00172b] to-[#011120] border border-[#06345A] hover:border-[#FFC21A]/50 transition-all rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-between shadow-lg overflow-hidden ${className}`}
    >
      {/* Background Decorative Ambient Glow */}
      <div
        className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-32 bg-[#FFC21A]/10 blur-3xl pointer-events-none rounded-full"
        aria-hidden="true"
      />

      {/* Header Info */}
      <div className="w-full flex items-center justify-between gap-2 border-b border-[#06345A]/70 pb-2.5 z-10">
        <div className="flex items-center gap-1.5 min-w-0">
          <Flame className="w-3.5 h-3.5 text-[#FFC21A] shrink-0" />
          <span className="text-[11px] font-black text-white truncate uppercase tracking-wider font-mono">
            {teamName}
          </span>
          {opponent && (
            <span className="text-[10px] text-slate-400 truncate">
              vs {opponent}
            </span>
          )}
        </div>
        <div
          className={`px-2 py-0.5 rounded-full border text-[9px] font-mono font-black flex items-center gap-1 shrink-0 ${verdict.bgColor} ${verdict.color}`}
        >
          <VerdictIcon className="w-2.5 h-2.5" />
          <span>{verdict.label}</span>
        </div>
      </div>

      {/* Radial Gauge Container via Recharts */}
      <div className="relative w-full flex items-center justify-center my-1 z-10" style={{ height: `${chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="80%"
            innerRadius="75%"
            outerRadius="105%"
            barSize={16}
            data={gaugeData}
            startAngle={180}
            endAngle={0}
          >
            <defs>
              <linearGradient id="boosWinGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#E5A600" />
                <stop offset="60%" stopColor="#FFC21A" />
                <stop offset="100%" stopColor="#FFE082" />
              </linearGradient>
            </defs>
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: '#04223b' }}
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center Display: Numeric Percentage & Title */}
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center text-center pointer-events-none">
          <div className="flex items-baseline justify-center">
            <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white drop-shadow-md">
              {clampedWin}
            </span>
            <span className="text-base sm:text-lg font-black text-[#FFC21A] ml-0.5">
              %
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest -mt-0.5 font-mono">
            Probabilidade de Vitória
          </span>
          <span className="text-[9px] text-[#FFC21A] font-medium">
            {verdict.subtext}
          </span>
        </div>
      </div>

      {/* Probability Trio Breakdown (Vitória | Empate | Derrota) */}
      {(drawProbability !== undefined || lossProbability !== undefined) && (
        <div className="w-full grid grid-cols-3 gap-1.5 pt-2 border-t border-[#06345A]/70 text-center z-10">
          <div className="px-2 py-1.5 rounded-lg bg-[#001426] border border-[#FFC21A]/30 flex flex-col items-center">
            <span className="text-[9px] text-slate-400 font-mono uppercase">Vitória</span>
            <span className="text-xs font-black text-[#FFC21A] font-mono">
              {clampedWin}%
            </span>
          </div>

          <div className="px-2 py-1.5 rounded-lg bg-[#001426] border border-[#06345A] flex flex-col items-center">
            <span className="text-[9px] text-slate-400 font-mono uppercase">Empate</span>
            <span className="text-xs font-black text-slate-300 font-mono">
              {drawProbability ?? (100 - clampedWin - (lossProbability ?? 0))}%
            </span>
          </div>

          <div className="px-2 py-1.5 rounded-lg bg-[#001426] border border-blue-500/20 flex flex-col items-center">
            <span className="text-[9px] text-slate-400 font-mono uppercase">Derrota</span>
            <span className="text-xs font-black text-blue-400 font-mono">
              {lossProbability ?? 0}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
