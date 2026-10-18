import React from 'react';
import { Search, X, Trophy, Filter, SlidersHorizontal } from 'lucide-react';

export interface SportCategory {
  id: string;
  label: string;
  icon: string;
  count: number;
}

interface BoosSportFilterBarProps {
  sports: SportCategory[];
  selectedSport: string;
  onSelectSport: (sportId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalMatchesCount: number;
  filteredMatchesCount: number;
  className?: string;
}

export const BoosSportFilterBar: React.FC<BoosSportFilterBarProps> = ({
  sports,
  selectedSport,
  onSelectSport,
  searchQuery,
  onSearchChange,
  totalMatchesCount,
  filteredMatchesCount,
  className = ''
}) => {
  const isFiltering = selectedSport !== 'all' || searchQuery.trim().length > 0;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 1. Barra de Pesquisa e Indicador de Resultados */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#91A4B5]">
            <Search className="w-4 h-4 text-[#F5B400]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Pesquisar equipa, liga ou país (ex: Petro de Luanda, Real Madrid, Lakers, Girabola)..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#061827] border border-[#143A52] focus:border-[#F5B400] focus:ring-1 focus:ring-[#F5B400]/50 text-[#F5F7FA] text-xs placeholder:text-[#5F7485] transition-all outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#91A4B5] hover:text-[#F5F7FA] transition-colors cursor-pointer"
              title="Limpar pesquisa"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status / Contador de Jogos Filtrados */}
        <div className="flex items-center justify-between sm:justify-end gap-2 px-1 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#092237] border border-[#143A52] text-[#91A4B5] font-mono text-[11px] whitespace-nowrap">
            <span className="text-[#FFD95A] font-black">{filteredMatchesCount}</span>
            <span>de</span>
            <span className="text-[#F5F7FA] font-bold">{totalMatchesCount}</span>
            <span>jogos</span>
          </div>

          {isFiltering && (
            <button
              type="button"
              onClick={() => {
                onSelectSport('all');
                onSearchChange('');
              }}
              className="text-[11px] text-[#FFD95A] hover:text-[#F5B400] font-bold px-2 py-1 rounded-lg hover:bg-[#0D2940] transition-colors whitespace-nowrap cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* 2. Seletor de Modalidades Desportivas (Sport-Category Pills) */}
      <div className="w-full overflow-hidden">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 scroll-smooth snap-x">
          {sports.map(sport => {
            const isSelected = selectedSport === sport.id;

            return (
              <button
                key={sport.id}
                type="button"
                onClick={() => onSelectSport(sport.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer snap-start select-none border ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#FFD95A] via-[#F5B400] to-[#D98A00] text-[#030D17] border-[#FFE58A] shadow-md shadow-[#F5B400]/20 font-black ring-1 ring-[#FFD95A]/40 scale-[1.02]'
                    : 'bg-[#092237] hover:bg-[#0D2940] border-[#143A52] text-[#91A4B5] hover:text-[#F5F7FA] hover:border-[#0D4C73]'
                }`}
              >
                <span className="text-sm">{sport.icon}</span>
                <span>{sport.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-[#030D17] text-[#FFD95A]'
                      : 'bg-[#061827] text-[#91A4B5] border border-[#143A52]'
                  }`}
                >
                  {sport.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
