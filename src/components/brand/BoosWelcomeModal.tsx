import React from 'react';
import { BoosCharacter } from './BoosCharacter';
import { BoosButton } from './BoosButton';
import { ArrowRight, ShieldCheck, Zap, Trophy, X } from 'lucide-react';

export interface BoosWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
}

export const BoosWelcomeModal: React.FC<BoosWelcomeModalProps> = ({
  isOpen,
  onClose,
  onStart
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#00172b] to-[#011120] border-2 border-[#FFC21A]/60 rounded-3xl p-6 sm:p-7 text-center shadow-2xl space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl bg-[#06345A]/60 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ambient Glow */}
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 bg-[#FFC21A]/20 blur-3xl rounded-full pointer-events-none"
          aria-hidden="true"
        />

        {/* Big Mascot Welcome */}
        <div className="relative flex justify-center pt-2">
          <BoosCharacter
            pose="BOOS_WELCOME"
            size="2xl"
            glow
            showCrownBadge
            priority
          />
        </div>

        {/* Welcome Text */}
        <div className="space-y-1.5">
          <span className="inline-block px-3 py-0.5 rounded-full bg-[#FFC21A]/10 text-[#FFC21A] text-[10px] font-mono font-black border border-[#FFC21A]/30 uppercase tracking-widest">
            A CASA DO JOGADOR REI
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Bem-vindo ao <span className="text-[#FFC21A]">BOOS BET</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            A tua experiência premium de apostas desportivas começa aqui. Odds altas no Girabola ZAP, jogos internacionais e IA preditiva.
          </p>
        </div>

        {/* 3 Quick Value Props */}
        <div className="grid grid-cols-3 gap-1.5 py-1 text-center">
          <div className="p-2 rounded-xl bg-[#001426] border border-[#06345A] flex flex-col items-center gap-1">
            <Zap className="w-4 h-4 text-[#FFC21A]" />
            <span className="text-[9px] font-mono text-slate-300">Depósitos Instantâneos</span>
          </div>
          <div className="p-2 rounded-xl bg-[#001426] border border-[#06345A] flex flex-col items-center gap-1">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span className="text-[9px] font-mono text-slate-300">Odds Máximas</span>
          </div>
          <div className="p-2 rounded-xl bg-[#001426] border border-[#06345A] flex flex-col items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span className="text-[9px] font-mono text-slate-300">100% Seguro</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <BoosButton
            variant="primary"
            size="lg"
            onClick={onStart}
            className="w-full shadow-lg shadow-[#FFC21A]/30 text-sm font-black"
          >
            <span>COMEÇAR A JOGAR</span>
            <ArrowRight className="w-4 h-4" />
          </BoosButton>
        </div>
      </div>
    </div>
  );
};
