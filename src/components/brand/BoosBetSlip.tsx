import React, { useState, useEffect, useRef } from 'react';
import { BetSelection, BetTicket, SessionData } from '../../types';
import { BoosButton } from './BoosButton';
import { BoosBadge } from './BoosBadge';
import { BoosCharacter } from './BoosCharacter';
import { BoosEmptyState } from './BoosEmptyState';
import { BoosBetConfirmation } from './BoosBetConfirmation';
import {
  Flame,
  Trash2,
  CheckCircle,
  X,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Wallet as WalletIcon,
  ShieldCheck,
  Trophy,
  Sparkles,
  Ticket,
  ArrowRight,
  TrendingUp,
  Share2,
  Copy,
  Check,
  SlidersHorizontal,
  Plus
} from 'lucide-react';

export interface BoosBetSlipProps {
  selections: BetSelection[];
  onRemoveSelection: (matchId: string) => void;
  onClearAll: () => void;
  session: SessionData | null;
  onOpenAuth: () => void;
  onPlaceBet: (stake: number) => Promise<void>;
  submitting: boolean;
  error?: string;
  successTicket?: BetTicket | null;
  isMobileFloating?: boolean;
  isOpenMobile?: boolean;
  onToggleMobileOpen?: () => void;
  onOpenWallet?: () => void;
  className?: string;
}

const QUICK_STAKES = [500, 1000, 2500, 5000, 10000];

export const BoosBetSlip: React.FC<BoosBetSlipProps> = ({
  selections,
  onRemoveSelection,
  onClearAll,
  session,
  onOpenAuth,
  onPlaceBet,
  submitting,
  error,
  successTicket,
  isMobileFloating = false,
  isOpenMobile = false,
  onToggleMobileOpen,
  onOpenWallet,
  className = ''
}) => {
  const [stake, setStake] = useState('1000');
  const [betType, setBetType] = useState<'single' | 'multiple'>('multiple');
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [copiedTicketId, setCopiedTicketId] = useState(false);
  const [activeCelebrationTicket, setActiveCelebrationTicket] = useState<BetTicket | null>(null);
  const [showCelebrationBanner, setShowCelebrationBanner] = useState(false);
  const celebrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Automatically switch betType to single when only 1 selection, or multiple when > 1
  useEffect(() => {
    if (selections.length <= 1) {
      setBetType('single');
    } else {
      setBetType('multiple');
    }
  }, [selections.length]);

  // When a bet is successfully confirmed via successTicket prop
  useEffect(() => {
    if (successTicket) {
      setActiveCelebrationTicket(successTicket);
      setShowCelebrationBanner(true);

      // Auto-scroll or pulse non-obtrusively
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
      }
      celebrationTimeoutRef.current = setTimeout(() => {
        setShowCelebrationBanner(false);
      }, 7000);
    }
    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
      }
    };
  }, [successTicket]);

  // Multiplier bonus for accumulators (BOOS Multi-Boost)
  const getAccumulatorBonusPercent = (count: number) => {
    if (count < 3) return 0;
    if (count === 3) return 5;
    if (count === 4) return 10;
    if (count === 5) return 15;
    return 20; // 6+ games = +20% bonus
  };

  const multiBonusPercent = selections.length >= 3 ? getAccumulatorBonusPercent(selections.length) : 0;
  const rawOdds = selections.reduce((acc, s) => acc * s.odd, 1);
  const totalOdds = multiBonusPercent > 0 ? rawOdds * (1 + multiBonusPercent / 100) : rawOdds;
  const stakeNum = Math.max(0, Number(stake) || 0);
  const potentialPayout = Math.round(stakeNum * totalOdds);
  const netProfit = Math.max(0, potentialPayout - stakeNum);

  const currentBalance = session?.wallet?.balance || 0;
  const hasInsufficientBalance = session ? currentBalance < stakeNum : false;

  const handleCopyTicket = (ticketId: string) => {
    navigator.clipboard?.writeText(ticketId);
    setCopiedTicketId(true);
    setTimeout(() => setCopiedTicketId(false), 2000);
  };

  const handleDismissCelebration = () => {
    setActiveCelebrationTicket(null);
    setShowCelebrationBanner(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      onOpenAuth();
      return;
    }
    if (stakeNum >= 100) {
      setIsConfirmationOpen(true);
    }
  };

  // =========================================================================
  // CELEBRATION TICKET RECEIPT DISPLAY (BOOS_CELEBRATION ANIMATION TRIGGER)
  // Non-obstructive: embedded directly within ticket view or compact drawer
  // =========================================================================
  const renderCelebrationTicket = (ticket: BetTicket) => (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#00172b] via-[#001426] to-[#010c17] border-2 border-[#FFC21A] p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-300">
      {/* Golden Ambient Glow Behind Mascot */}
      <div
        className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#FFC21A]/20 blur-3xl rounded-full pointer-events-none"
        aria-hidden="true"
      />

      {/* Confetti Micro-particles Effect (CSS non-blocking) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <span className="absolute top-2 left-6 text-xs text-[#FFC21A] animate-bounce">✦</span>
        <span className="absolute top-6 right-8 text-xs text-[#FF7A00] animate-pulse">★</span>
        <span className="absolute top-14 left-10 text-[10px] text-white opacity-80">●</span>
        <span className="absolute top-10 right-16 text-[10px] text-[#FFC21A] animate-ping">✦</span>
        <span className="absolute bottom-16 right-6 text-xs text-[#FFC21A]">★</span>
      </div>

      {/* Mascot Celebration Header */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-2">
        <div className="relative">
          <BoosCharacter
            pose="BOOS_CELEBRATION"
            size="lg"
            glow
            animated
            showCrownBadge
            alt="BOOS Bet Celebração Oficial"
          />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFC21A]/20 border border-[#FFC21A]/50 text-[#FFC21A] text-[10px] font-mono font-black uppercase tracking-widest shadow-sm">
            <Sparkles className="w-3.5 h-3.5 fill-[#FFC21A]" />
            APOSTA REGISTADA COM SUCESSO!
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white font-display flex items-center justify-center gap-1.5 pt-1">
            <Trophy className="w-5 h-5 text-[#FFC21A]" />
            <span>BOLETIM CONFIRMADO</span>
          </h3>
          <p className="text-[11px] text-slate-300 max-w-xs">
            A tua aposta já está ativa no sistema oficial BOOS BET Angola.
          </p>
        </div>
      </div>

      {/* Luxury Perforated Ticket Stub */}
      <div className="relative z-10 my-4 bg-[#00101f] border border-[#06345A] rounded-2xl p-4 space-y-3 font-mono">
        {/* Ticket Perforations (Visual Notches) */}
        <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#001426] rounded-full border-r border-[#06345A]" />
        <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#001426] rounded-full border-l border-[#06345A]" />

        {/* Ticket Top Meta */}
        <div className="flex items-center justify-between pb-2 border-b border-dashed border-[#06345A] text-[11px]">
          <span className="text-slate-400">BILHETE OFICIAL</span>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white">#{ticket.id}</span>
            <button
              type="button"
              onClick={() => handleCopyTicket(ticket.id)}
              className="text-slate-400 hover:text-[#FFC21A] p-0.5 rounded cursor-pointer transition-colors"
              title="Copiar Código do Bilhete"
            >
              {copiedTicketId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Ticket Stake and Potential Win */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Montante Apostado:</span>
            <span className="font-bold text-white">
              {ticket.stake.toLocaleString('pt-AO')} Kz
            </span>
          </div>

          <div className="p-2.5 bg-[#001c33] rounded-xl border border-[#FFC21A]/30 flex justify-between items-center">
            <div>
              <span className="text-[10px] text-[#FFE082] block font-sans font-bold uppercase tracking-wider">
                Retorno Potencial Estimado
              </span>
              <span className="text-lg sm:text-xl font-black text-[#FFC21A]">
                {ticket.potential_payout.toLocaleString('pt-AO')} Kz
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-700/50 font-bold">
              ATIVO
            </span>
          </div>
        </div>

        {/* Legal Regulatory Stamp */}
        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-sans border-t border-dashed border-[#06345A]">
          <span className="flex items-center gap-1 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ISJ Angola Licença #044
          </span>
          <span className="text-slate-500 font-mono">
            {ticket.placed_at ? new Date(ticket.placed_at).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Celebration Actions without layout disruption */}
      <div className="relative z-10 grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={handleDismissCelebration}
          className="py-2.5 px-3 rounded-xl border border-[#06345A] hover:bg-[#06345A]/60 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer text-center"
        >
          Fechar Recibo
        </button>

        <BoosButton
          variant="primary"
          size="sm"
          onClick={() => {
            handleDismissCelebration();
            if (isMobileFloating && onToggleMobileOpen) {
              onToggleMobileOpen();
            }
          }}
          className="w-full text-center"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>NOVA APOSTA</span>
        </BoosButton>
      </div>
    </div>
  );

  // =========================================================================
  // MAIN BET SLIP OPERATIONAL CONTENT
  // =========================================================================
  const mainSlipContent = (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#143A52]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#FFD95A] to-[#F7B500] flex items-center justify-center text-[#020D18] shadow-md shadow-[#F7B500]/20 font-black">
            <Ticket className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-extrabold text-[#F5F7FA] tracking-wide font-display">
                BOLETIM DE APOSTAS
              </h3>
              {selections.length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-black bg-[#F7B500] text-[#020D18] rounded-md">
                  {selections.length}
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#91A4B5] font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#19C985] animate-pulse" />
              BOOS BET OFICIAL · ANGOLA
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {selections.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[11px] text-[#91A4B5] hover:text-[#F04F5F] transition-colors flex items-center gap-1 cursor-pointer px-2 py-1 rounded-lg hover:bg-[#F04F5F]/10"
              title="Limpar todas as seleções"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}

          {isMobileFloating && onToggleMobileOpen && (
            <button
              type="button"
              onClick={onToggleMobileOpen}
              className="p-1.5 text-[#91A4B5] hover:text-[#F5F7FA] rounded-lg hover:bg-[#0D2940] cursor-pointer transition-colors"
              aria-label="Minimizar Boletim"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Notification Banner when Bet was placed successfully */}
      {showCelebrationBanner && activeCelebrationTicket && (
        <div className="p-3 rounded-2xl bg-[#061827] border border-[#19C985] text-emerald-200 text-xs shadow-lg animate-in slide-in-from-top duration-300">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#19C985]/20 text-[#19C985] flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-[#F5F7FA] text-[12px] flex items-center gap-1">
                  <span>Bilhete #{activeCelebrationTicket.id} Confirmado!</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#F7B500]" />
                </div>
                <div className="font-mono text-[11px] text-[#19C985]">
                  Retorno: {activeCelebrationTicket.potential_payout.toLocaleString('pt-AO')} Kz
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCelebrationBanner(false)}
              className="text-[#91A4B5] hover:text-[#F5F7FA] p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="p-3 rounded-2xl bg-[#F04F5F]/10 border border-[#F04F5F]/40 text-[#F04F5F] text-xs flex items-center gap-2">
          <X className="w-4 h-4 text-[#F04F5F] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Conditional Rendering: Celebratory Ticket or Empty State or Selections */}
      {activeCelebrationTicket && selections.length === 0 ? (
        renderCelebrationTicket(activeCelebrationTicket)
      ) : selections.length === 0 ? (
        <BoosEmptyState
          type="betslip"
          size="sm"
          onAction={isMobileFloating && onToggleMobileOpen ? onToggleMobileOpen : undefined}
          actionText="VER JOGOS AO VIVO"
          className="border-0 bg-transparent py-4"
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bet Type Tabs: Simples vs Múltipla */}
          <div className="grid grid-cols-2 p-1 bg-[#061827] border border-[#143A52] rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setBetType('single')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer ${
                betType === 'single'
                  ? 'bg-[#0D2940] text-[#F5F7FA] shadow border border-[#143A52]'
                  : 'text-[#91A4B5] hover:text-[#F5F7FA]'
              }`}
            >
              Simples ({selections.length})
            </button>
            <button
              type="button"
              onClick={() => setBetType('multiple')}
              className={`py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                betType === 'multiple'
                  ? 'bg-gradient-to-r from-[#FFD95A] via-[#F7B500] to-[#C88700] text-[#020D18] shadow font-black'
                  : 'text-[#91A4B5] hover:text-[#F5F7FA]'
              }`}
            >
              <span>Múltipla</span>
              {multiBonusPercent > 0 && (
                <span className="text-[9px] px-1 py-0.2 bg-[#020D18] text-[#F7B500] rounded font-mono font-black">
                  +{multiBonusPercent}%
                </span>
              )}
            </button>
          </div>

          {/* BOOS Multi-Boost Notice */}
          {selections.length >= 3 && betType === 'multiple' && (
            <div className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#F7B500]/10 via-[#0D4C73]/20 to-transparent border border-[#F7B500]/30 flex items-center justify-between text-[11px]">
              <span className="text-[#F7B500] font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Super Bónus Acumulador BOOS
              </span>
              <span className="font-mono font-black text-[#F7B500] bg-[#061827] px-1.5 py-0.5 rounded border border-[#F7B500]/40">
                +{multiBonusPercent}% Ganhos
              </span>
            </div>
          )}

          {/* Selections List */}
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 no-scrollbar">
            {selections.map(sel => (
              <div
                key={sel.match_id}
                className="group p-3 bg-[#061827] hover:bg-[#0D2940] rounded-2xl border border-[#143A52] flex items-center justify-between gap-3 text-xs transition-colors"
              >
                <div className="overflow-hidden space-y-0.5">
                  <div className="text-[11px] text-[#91A4B5] truncate font-medium">
                    {sel.match_title}
                  </div>
                  <div className="font-bold text-[#F5F7FA] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F7B500] shrink-0" />
                    <span className="truncate">{sel.selection_label}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono font-black text-[#F7B500] text-sm px-2.5 py-1 rounded-xl bg-[#0D2940] border border-[#143A52] shadow-inner">
                    {sel.odd.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveSelection(sel.match_id)}
                    className="p-1.5 text-[#5F7485] hover:text-[#F04F5F] rounded-lg hover:bg-[#F04F5F]/10 transition-colors cursor-pointer"
                    title="Remover prognóstico"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stake Buttons & Stake Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] text-[#91A4B5] font-semibold flex items-center gap-1">
                <span>Montante da Aposta</span>
              </label>
              {session && (
                <span className="text-[10px] font-mono text-[#91A4B5]">
                  Saldo: <strong className="text-[#F5F7FA]">{currentBalance.toLocaleString('pt-AO')} Kz</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1.5 mb-2">
              {QUICK_STAKES.map(amount => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setStake(amount.toString())}
                  className={`py-1.5 px-1 rounded-xl text-[10px] font-mono font-bold transition-all border cursor-pointer ${
                    stake === amount.toString()
                      ? 'bg-gradient-to-r from-[#FFD95A] to-[#F7B500] text-[#020D18] border-[#FFE58A] font-black shadow-sm'
                      : 'bg-[#061827] hover:bg-[#0D2940] border-[#143A52] text-[#91A4B5]'
                  }`}
                >
                  +{amount >= 1000 ? `${amount / 1000}k` : amount}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="number"
                min="100"
                step="100"
                value={stake}
                onChange={e => setStake(e.target.value)}
                placeholder="Ex: 1000"
                className={`w-full pl-3 pr-12 py-2.5 bg-[#061827] border rounded-xl text-sm font-bold font-mono text-[#F5F7FA] outline-none transition-colors ${
                  hasInsufficientBalance
                    ? 'border-[#F04F5F] focus:border-[#F04F5F]'
                    : 'border-[#143A52] focus:border-[#F7B500] focus:ring-1 focus:ring-[#F7B500]'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-[#F7B500]">
                KZ
              </span>
            </div>

            {hasInsufficientBalance && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#F04F5F]">
                <span>Saldo insuficiente para este montante.</span>
                {onOpenWallet && (
                  <button
                    type="button"
                    onClick={onOpenWallet}
                    className="underline text-[#F7B500] font-bold hover:text-white cursor-pointer"
                  >
                    Depositar +
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Odds & Calculations Summary Ticket Section */}
          <div className="pt-2 border-t border-[#143A52] space-y-2 text-xs">
            <div className="flex justify-between items-center text-[#91A4B5]">
              <span className="text-[11px]">Cota Total (Odds):</span>
              <div className="flex items-center gap-1.5 font-mono">
                {multiBonusPercent > 0 && (
                  <span className="text-[10px] line-through text-[#5F7485]">
                    {rawOdds.toFixed(2)}
                  </span>
                )}
                <span className="font-black text-[#F7B500] text-sm">
                  {totalOdds.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Potential Payout Ticket Box */}
            <div className="p-3 bg-[#061827] rounded-2xl border border-[#143A52] flex justify-between items-center shadow-inner">
              <div>
                <span className="text-[10px] text-[#91A4B5] font-semibold block uppercase tracking-wider">
                  Ganhos Potenciais Estimados
                </span>
                <span className="text-base sm:text-lg font-black font-mono text-[#F7B500] drop-shadow-sm">
                  {potentialPayout.toLocaleString('pt-AO')} Kz
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] text-[#5F7485] block font-mono">Lucro Líquido</span>
                <span className="text-xs font-mono font-bold text-[#19C985]">
                  +{netProfit.toLocaleString('pt-AO')} Kz
                </span>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <BoosButton
            variant="primary"
            size="md"
            fullWidth
            onClick={handleSubmit}
            disabled={submitting || (session !== null && hasInsufficientBalance)}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-1.5">
                <RefreshCw className="w-4 h-4 animate-spin" />
                A REGISTAR BOLETIM...
              </span>
            ) : !session ? (
              'ENTRAR COM TELEMÓVEL PARA APOSTAR'
            ) : hasInsufficientBalance ? (
              'SALDO INSUFICIENTE NA CARTEIRA'
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <span>CONFIRMAR BOLETIM</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </BoosButton>

          {/* Legal Regulatory ISJ Note */}
          <div className="text-[10px] text-center text-slate-400 flex items-center justify-center gap-1 pt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Regulado pelo Instituto de Supervisão de Jogos (ISJ Angola)</span>
          </div>
        </form>
      )}
    </div>
  );

  // =========================================================================
  // DESKTOP EMBEDDED SIDEBAR
  // =========================================================================
  if (!isMobileFloating) {
    return (
      <div className={`p-5 bg-[#092237] border border-[#143A52] rounded-3xl sticky top-20 shadow-2xl ${className}`}>
        {mainSlipContent}

        <BoosBetConfirmation
          isOpen={isConfirmationOpen}
          onClose={() => setIsConfirmationOpen(false)}
          selections={selections}
          stake={stakeNum}
          session={session}
          onConfirm={async () => {
            await onPlaceBet(stakeNum);
            setIsConfirmationOpen(false);
          }}
          submitting={submitting}
          error={error}
          successTicket={successTicket}
        />
      </div>
    );
  }

  // =========================================================================
  // MOBILE FLOATING SHEET & BAR (Does not obstruct top/bottom navigation)
  // =========================================================================
  return (
    <>
      {/* Mobile Floating Bar above bottom navigation tabs */}
      {selections.length > 0 && !isOpenMobile && (
        <div className="fixed bottom-16 sm:bottom-4 left-3 right-3 z-30 lg:hidden animate-in slide-in-from-bottom duration-200">
          <div
            onClick={onToggleMobileOpen}
            className="p-3 bg-gradient-to-r from-[#061827] via-[#092237] to-[#061827] border border-[#F7B500] rounded-2xl shadow-2xl flex items-center justify-between gap-3 cursor-pointer hover:border-[#FFE58A] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#FFD95A] to-[#F7B500] text-[#020D18] font-black font-mono text-xs flex items-center justify-center shadow">
                {selections.length}
              </span>
              <div>
                <span className="text-xs font-bold text-[#F5F7FA] block">
                  Boletim ({selections.length})
                </span>
                <span className="text-[11px] font-mono text-[#F7B500] font-bold">
                  Retorno: {potentialPayout.toLocaleString('pt-AO')} Kz
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FFD95A] to-[#F7B500] text-[#020D18] font-black text-xs shadow-md">
              <span>Abrir</span>
              <ChevronUp className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Expanded Bottom Sheet on Mobile */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
          {/* Non-obstructive Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onToggleMobileOpen}
          />

          {/* Drawer Sheet (leaves header and safe areas accessible) */}
          <div className="relative w-full max-w-lg bg-[#092237] border-t border-x border-[#143A52] rounded-t-3xl p-5 shadow-2xl z-10 max-h-[85vh] overflow-y-auto">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-[#143A52] rounded-full mx-auto mb-4" />
            {mainSlipContent}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <BoosBetConfirmation
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        selections={selections}
        stake={stakeNum}
        session={session}
        onConfirm={async () => {
          await onPlaceBet(stakeNum);
          setIsConfirmationOpen(false);
        }}
        submitting={submitting}
        error={error}
        successTicket={successTicket}
      />
    </>
  );
};
