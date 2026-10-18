import React from 'react';
import {
  Flame,
  Trophy,
  Activity,
  Sparkles,
  Gift,
  Layers,
  Crown
} from 'lucide-react';

export interface CategoryItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface BoosCategoriesBarProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  className?: string;
}

export const MAIN_CATEGORIES: CategoryItem[] = [
  { id: 'all', label: 'Todos', icon: <Layers className="w-4 h-4" /> },
  { id: 'sports', label: 'Esportes', icon: <Trophy className="w-4 h-4" />, badge: 'AO VIVO' },
  { id: 'predictions', label: 'Previsões & Destaques', icon: <Sparkles className="w-4 h-4 text-[#FFC21A]" />, badge: 'HOT' },
  { id: 'girabola', label: 'Girabola ZAP', icon: <Flame className="w-4 h-4 text-[#F5A900]" /> },
  { id: 'live', label: 'Ao Vivo', icon: <Activity className="w-4 h-4 text-rose-400" /> },
  { id: 'promos', label: 'Promoções', icon: <Gift className="w-4 h-4" /> }
];

export const BoosCategoriesBar: React.FC<BoosCategoriesBarProps> = ({
  selectedCategory,
  onSelectCategory,
  className = ''
}) => {
  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1 scroll-smooth snap-x">
        {MAIN_CATEGORIES.map(cat => {
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap text-xs font-bold transition-all shrink-0 cursor-pointer snap-start select-none border ${
                isSelected
                  ? 'bg-gradient-to-r from-[#FFC21A] to-[#F5A900] text-[#001426] border-[#FFE885] shadow-md shadow-[#F5A900]/25 font-extrabold scale-[1.02]'
                  : 'bg-[#001426] hover:bg-[#06345A] border-[#06345A] text-slate-200 hover:text-white'
              }`}
            >
              <span className={isSelected ? 'text-[#001426]' : 'text-[#FFC21A]'}>
                {cat.icon}
              </span>
              <span>{cat.label}</span>

              {cat.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-black uppercase tracking-wider ${
                    isSelected
                      ? 'bg-[#001426] text-[#FFC21A]'
                      : 'bg-[#F5A900]/20 text-[#FFC21A] border border-[#F5A900]/40'
                  }`}
                >
                  {cat.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
