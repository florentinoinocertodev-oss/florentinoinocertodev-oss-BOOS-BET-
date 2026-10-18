import React from 'react';

interface BoosSubcategoriesChipsProps {
  chips?: string[];
  activeChip: string;
  onSelectChip: (chip: string) => void;
  className?: string;
}

export const DEFAULT_SUBCATEGORIES = [
  'Todos',
  'Popular 🔥',
  'Girabola ZAP (Angola)',
  'UEFA Champions League',
  'Premier League',
  'BAI Basket (Angola)',
  'NBA Basquete',
  'ATP Masters Ténis',
  'UFC Artes Marciais'
];

/**
 * BOOS BET Subcategories Chips (Segunda camada de filtros)
 * Dimensões conforme Prompt V2:
 * Altura: 40–48px
 * Padding horizontal: 16–20px
 * Border-radius: 20–24px (rounded-full)
 */
export const BoosSubcategoriesChips: React.FC<BoosSubcategoriesChipsProps> = ({
  chips = DEFAULT_SUBCATEGORIES,
  activeChip,
  onSelectChip,
  className = ''
}) => {
  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth snap-x">
        {chips.map(chip => {
          const isActive = activeChip === chip;

          return (
            <button
              key={chip}
              type="button"
              onClick={() => onSelectChip(chip)}
              className={`h-[42px] px-[18px] rounded-full whitespace-nowrap text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer snap-start select-none border flex items-center justify-center ${
                isActive
                  ? 'bg-[#06345A] text-[#FFC21A] border-[#FFC21A] shadow-md shadow-[#FFC21A]/20 font-extrabold ring-1 ring-[#FFC21A]/40'
                  : 'bg-[#001426]/80 hover:bg-[#06345A]/60 border-[#06345A] text-slate-300 hover:text-white'
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>
    </div>
  );
};
