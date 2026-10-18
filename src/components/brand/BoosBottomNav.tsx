import React from 'react';
import {
  Trophy,
  Activity,
  Crown,
  Flame,
  User as UserIcon,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { SessionData } from '../../types';
import { User } from 'firebase/auth';

interface BoosBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  selectionsCount: number;
  onOpenBetSlip: () => void;
  session: SessionData | null;
  firebaseUser?: User | null;
  onOpenAuth: () => void;
  className?: string;
}

export const BoosBottomNav: React.FC<BoosBottomNavProps> = ({
  activeTab,
  onSelectTab,
  selectionsCount,
  onOpenBetSlip,
  session,
  firebaseUser,
  onOpenAuth,
  className = ''
}) => {
  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 bg-[#001426]/95 backdrop-blur-md border-t border-[#06345A] lg:hidden select-none safe-area-inset-bottom ${className}`}
    >
      <div className="flex items-center justify-around h-15 px-2 max-w-md mx-auto">
        {/* 1. Esportes */}
        <button
          type="button"
          onClick={() => onSelectTab('sports')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            activeTab === 'sports' ? 'text-[#FFC21A]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-semibold tracking-tight">Esportes</span>
        </button>

        {/* 2. Previsões & Inteligência */}
        <button
          type="button"
          onClick={() => onSelectTab('predictions')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer relative ${
            activeTab === 'predictions' ? 'text-[#FFC21A]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 mb-0.5 text-[#FFC21A]" />
            <span className="absolute -top-1 -right-2 px-1 py-0 rounded-full bg-[#FFC21A] text-[#001426] text-[8px] font-mono font-black">
              HOT
            </span>
          </div>
          <span className="text-[10px] font-semibold tracking-tight">Previsões</span>
        </button>

        {/* 3. Boletim (com badge) */}
        <button
          type="button"
          onClick={onOpenBetSlip}
          className="flex flex-col items-center justify-center flex-1 py-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer relative"
        >
          <div className="relative">
            <Flame className="w-5 h-5 mb-0.5 text-[#F5A900]" />
            {selectionsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1.5 min-w-[16px] h-4 rounded-full bg-gradient-to-r from-[#FFC21A] to-[#F5A900] text-[#001426] font-mono font-black text-[10px] flex items-center justify-center shadow">
                {selectionsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold tracking-tight text-slate-300">Boletim</span>
        </button>

        {/* 5. Perfil / Entrar */}
        <button
          type="button"
          onClick={() => {
            if (session || firebaseUser) {
              onSelectTab('profile');
            } else {
              onOpenAuth();
            }
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
            activeTab === 'profile' ? 'text-[#FFC21A]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-semibold tracking-tight">
            {session || firebaseUser ? 'Minha Conta' : 'Entrar'}
          </span>
        </button>
      </div>
    </nav>
  );
};
