import React from 'react';

interface BoosOddCardProps {
  label: string;
  sublabel?: string;
  odd: number;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  oddsMovement?: 'UP' | 'DOWN' | 'SAME';
}

/**
 * BOOS BET Official OddCard
 * Proporções conforme Prompt V2: ~90–105px de largura, ~70–85px de altura
 * Responsivo, área de toque confortável (>48px), transição clara entre normal e selected.
 */
export const BoosOddCard: React.FC<BoosOddCardProps> = ({
  label,
  sublabel,
  odd,
  selected,
  onClick,
  disabled = false,
  className = '',
  oddsMovement = 'SAME'
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative min-w-[84px] sm:min-w-[96px] h-[68px] sm:h-[76px] p-2 rounded-xl flex flex-col items-center justify-center transition-all duration-150 select-none cursor-pointer border ${
        disabled
          ? 'opacity-40 cursor-not-allowed bg-[#061827] border-[#143A52]/40 text-[#5F7485]'
          : selected
          ? 'bg-gradient-to-br from-[#FFD95A] via-[#F7B500] to-[#C88700] text-[#020D18] border-[#FFE58A] shadow-lg shadow-[#F7B500]/25 font-black scale-[1.02] ring-1 ring-[#FFD65A]'
          : 'bg-[#0D2940] hover:bg-[#103352] border-[#143A52] hover:border-[#009EFF]/60 text-[#F5F7FA] shadow-sm'
      } ${className}`}
    >
      {/* Selected Indicator Corner Dot */}
      {selected && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#020D18] animate-pulse" />
      )}

      {/* Label (ex: Casa / 1, X, 2) */}
      <span
        className={`text-[10px] sm:text-[11px] font-sans uppercase tracking-wider font-semibold truncate max-w-full ${
          selected ? 'text-[#020D18]/90 font-extrabold' : 'text-[#91A4B5]'
        }`}
      >
        {label}
      </span>

      {sublabel && (
        <span
          className={`text-[9px] truncate max-w-full -mt-0.5 ${
            selected ? 'text-[#020D18]/80' : 'text-[#5F7485]'
          }`}
        >
          {sublabel}
        </span>
      )}

      {/* Odd Value with Dynamic Movement Arrow */}
      <div className="flex items-center gap-1 mt-0.5">
        <span
          className={`font-mono text-sm sm:text-base font-bold tracking-tight ${
            selected ? 'text-[#020D18] font-black' : 'text-[#F5F7FA]'
          }`}
        >
          {odd.toFixed(2)}
        </span>
        {oddsMovement === 'UP' && (
          <span className="text-[10px] text-emerald-400 font-bold animate-pulse" title="Odd em subida">
            ▲
          </span>
        )}
        {oddsMovement === 'DOWN' && (
          <span className="text-[10px] text-rose-400 font-bold animate-pulse" title="Odd em descida">
            ▼
          </span>
        )}
      </div>
    </button>
  );
};
