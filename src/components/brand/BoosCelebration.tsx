import React from 'react';
import { BoosCharacter } from './BoosCharacter';
import { BoosButton } from './BoosButton';
import { Sparkles, Trophy, CheckCircle } from 'lucide-react';

export interface BoosCelebrationProps {
  isOpen: boolean;
  payoutAmount: number;
  betTicketId?: string;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const BoosCelebration: React.FC<BoosCelebrationProps> = ({
  isOpen,
  payoutAmount,
  betTicketId,
  onClose,
  title = 'APOSTA VENCEDORA',
  subtitle = 'Parabéns! Os teus ganhos já foram creditados na tua carteira BOOS BET.'
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      <div className="relative w-full max-w-sm bg-gradient-to-b from-[#00172b] to-[#011120] border-2 border-[#FFC21A] rounded-3xl p-6 sm:p-7 text-center shadow-2xl space-y-4">
        {/* Subtle Ambient Gold Radiance */}
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#FFC21A]/20 blur-3xl rounded-full pointer-events-none"
          aria-hidden="true"
        />

        {/* Mascot Celebration Pose */}
        <div className="relative flex justify-center">
          <BoosCharacter
            pose="BOOS_CELEBRATION"
            size="xl"
            glow
            animated
            showCrownBadge
          />
        </div>

        {/* Victory Header */}
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFC21A]/20 text-[#FFC21A] text-[10px] font-mono font-black border border-[#FFC21A]/40 uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 fill-[#FFC21A]" />
            {title}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-[#FFC21A]" />
            <span>VITÓRIA REAL</span>
          </h3>
        </div>

        {/* Payout Display */}
        <div className="p-3.5 rounded-2xl bg-[#001426] border border-[#FFC21A]/50 space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            Total Ganho Creditado
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-[#FFC21A] drop-shadow-md">
            + {payoutAmount.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KZ
          </div>
          {betTicketId && (
            <div className="text-[10px] font-mono text-slate-400">
              Bilhete: #{betTicketId.slice(-8)}
            </div>
          )}
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          {subtitle}
        </p>

        {/* Action Button */}
        <div className="pt-2">
          <BoosButton
            variant="primary"
            size="lg"
            onClick={onClose}
            className="w-full shadow-lg shadow-[#FFC21A]/30"
          >
            <CheckCircle className="w-4 h-4" />
            <span>CONTINUAR</span>
          </BoosButton>
        </div>
      </div>
    </div>
  );
};
