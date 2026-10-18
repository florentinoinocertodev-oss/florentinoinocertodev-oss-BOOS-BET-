import React from 'react';
import { Activity, Clock } from 'lucide-react';

export type TemporalFilter = 'LIVE' | 'NEXT' | 'TODAY' | 'TOMORROW' | 'LATER';

interface BoosTemporalNavProps {
  activeFilter: TemporalFilter;
  onSelectFilter: (filter: TemporalFilter) => void;
  liveCount?: number;
  className?: string;
}

interface TemporalOption {
  id: TemporalFilter;
  label: string;
  isLive?: boolean;
}

const TEMPORAL_OPTIONS: TemporalOption[] = [
  { id: 'LIVE', label: 'Ao Vivo', isLive: true },
  { id: 'NEXT', label: 'Próximos (60 Min)' },
  { id: 'TODAY', label: 'Hoje' },
  { id: 'TOMORROW', label: 'Amanhã' },
  { id: 'LATER', label: 'Mais Tarde' }
];

/**
 * BOOS BET Temporal Navigation
 * Prompt V2: Ao Vivo | Próximos | Hoje | Amanhã | Mais tarde
 * Item ativo: orange, gold, indicador inferior, contraste elevado.
 */
export const BoosTemporalNav: React.FC<BoosTemporalNavProps> = ({
  activeFilter,
  onSelectFilter,
  liveCount = 1,
  className = ''
}) => {
  return (
    <div className={`w-full border-b border-[#143A52] ${className}`}>
      <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth">
        {TEMPORAL_OPTIONS.map(opt => {
          const isActive = activeFilter === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectFilter(opt.id)}
              className={`relative py-3 px-3 sm:px-4 text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 select-none ${
                isActive
                  ? 'text-[#F7B500]'
                  : 'text-[#91A4B5] hover:text-[#F5F7FA]'
              }`}
            >
              {opt.isLive ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F04F5F] animate-pulse" />
                  <span className={isActive ? 'text-[#F04F5F] font-extrabold' : 'text-[#91A4B5]'}>
                    {opt.label}
                  </span>
                  {liveCount > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#F04F5F]/15 border border-[#F04F5F]/30 text-[#F04F5F] text-[10px] font-mono">
                      {liveCount}
                    </span>
                  )}
                </span>
              ) : (
                <span>{opt.label}</span>
              )}

              {/* Indicador Inferior (Metal Gold) */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#FFD65A] via-[#F7B500] to-[#C88700] rounded-t-full shadow-sm shadow-[#F7B500]/50" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
