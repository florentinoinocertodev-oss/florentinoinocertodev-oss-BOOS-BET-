import React, { useState } from 'react';
import { BetSelection, BetTicket, SessionData } from '../../types';
import { BoosButton } from './BoosButton';
import { BoosBadge } from './BoosBadge';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Flame,
  Wallet as WalletIcon,
  X,
  ArrowRight,
  RefreshCw,
  Trophy,
  Sparkles,
  HelpCircle,
  Clock
} from 'lucide-react';

interface BoosBetConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  selections: BetSelection[];
  stake: number;
  session: SessionData | null;
  onConfirm: () => Promise<void>;
  submitting: boolean;
  error?: string;
  successTicket?: BetTicket | null;
}

/**
 * BOOS BET — BoosBetConfirmation
 * Apresenta um sumário visual detalhado antes do envio final da aposta,
 * com animações de transição no estilo oficial BOOS BET para elevar a confiança do utilizador.
 */
export const BoosBetConfirmation: React.FC<BoosBetConfirmationProps> = ({
  isOpen,
  onClose,
  selections,
  stake,
  session,
  onConfirm,
  submitting,
  error,
  successTicket
}) => {
  if (!isOpen) return null;

  const totalOdds = selections.reduce((acc, s) => acc * s.odd, 1);
  const potentialPayout = Math.round(stake * totalOdds);
  const netProfit = potentialPayout - stake;

  const currentBalance = session?.wallet.balance || 0;
  const remainingBalance = Math.max(0, currentBalance - stake);
  const isInsufficient = currentBalance < stake;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#001426] border border-[#06345A] rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300">
        {/* Subtle golden crown aura in the background */}
        <div
          className="absolute -right-20 -top-20 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ background: '#FFC21A' }}
        />
        <div
          className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-15"
          style={{ background: '#06345A' }}
        />

        {/* Mascot watermark in corner */}
        <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
          <img
            src="/assets/brand/boos_mascot_symbol.svg"
            alt=""
            className="w-32 h-32 object-contain"
          />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-[#06345A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FFC21A] to-[#F5A900] text-[#001426] flex items-center justify-center shadow-lg shadow-[#F5A900]/30 shrink-0">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight font-display">
                  CONFIRMAÇÃO DO BOLETIM
                </h3>
              </div>
              <span className="text-[11px] text-[#FFC21A] font-mono font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Revisão do Boletim · BOOS BET
              </span>
            </div>
          </div>

          {!submitting && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#06345A] transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Success State Overlay */}
        {successTicket ? (
          <div className="relative z-10 py-8 px-4 text-center space-y-4 my-auto animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-[#001426] flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <BoosBadge variant="gold" icon={<Trophy className="w-3.5 h-3.5" />}>
                BILHETE #{successTicket.id} REGISTADO
              </BoosBadge>
              <h4 className="text-xl sm:text-2xl font-black text-white font-display pt-1">
                Aposta Confirmada com Sucesso!
              </h4>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                O seu boletim foi processado e liquidado na rede oficial BOOS BET. Acompanhe o resultado em tempo real.
              </p>
            </div>

            <div className="p-4 bg-[#06345A]/60 border border-[#0d4a7c] rounded-2xl max-w-xs mx-auto space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Montante Apostado:</span>
                <span className="font-mono font-bold text-white">{stake.toLocaleString('pt-AO')} Kz</span>
              </div>
              <div className="flex justify-between text-[#FFC21A]">
                <span className="font-bold">Retorno Potencial:</span>
                <span className="font-mono font-black text-base">
                  {successTicket.potential_payout.toLocaleString('pt-AO')} Kz
                </span>
              </div>
            </div>

            <BoosButton
              variant="primary"
              size="md"
              fullWidth
              onClick={onClose}
              className="max-w-xs mx-auto"
            >
              CONCLUIR E VER JOGOS
            </BoosButton>
          </div>
        ) : (
          /* Review Content Area */
          <div className="relative z-10 flex-1 overflow-y-auto space-y-4 py-4 pr-1 no-scrollbar">
            {/* Error banner if any */}
            {error && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-2xl text-xs flex items-center gap-2 animate-in shake duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Lista Resumida de Seleções com Badges */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5 text-white">
                  <Flame className="w-4 h-4 text-[#F5A900]" />
                  Seleções no Boletim ({selections.length})
                </span>
                <span className="font-mono text-[#FFC21A] text-[11px]">
                  {selections.length > 1 ? 'Aposta Múltipla' : 'Aposta Simples'}
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                {selections.map((sel, idx) => (
                  <div
                    key={sel.match_id || idx}
                    className="p-3 bg-[#06345A]/40 rounded-2xl border border-[#0d4a7c] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="overflow-hidden">
                      <span className="text-[10px] text-slate-400 truncate block font-medium">
                        {sel.match_title}
                      </span>
                      <span className="font-extrabold text-white text-xs mt-0.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#FFC21A]" />
                        {sel.selection_label}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block font-mono">Cota</span>
                      <span className="font-mono font-black text-[#FFC21A] text-sm px-2 py-0.5 rounded-lg bg-[#001426] border border-[#06345A]">
                        {sel.odd.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Cartão de Análise Financeira (Cota, Aposta, Retorno e Lucro) */}
            <div className="p-4 bg-gradient-to-br from-[#06345A]/60 via-[#001426] to-[#06345A]/40 border border-[#0d4a7c] rounded-2xl space-y-3">
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[#06345A]/80 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Cota Total Acumulada
                  </span>
                  <span className="text-lg font-mono font-black text-[#FFC21A]">
                    {totalOdds.toFixed(2)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Montante a Debitar
                  </span>
                  <span className="text-lg font-mono font-black text-white">
                    {stake.toLocaleString('pt-AO')} Kz
                  </span>
                </div>
              </div>

              {/* Retorno Potencial Destaque */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide block">
                    Retorno Potencial (Bruto)
                  </span>
                  <span className="text-xl sm:text-2xl font-mono font-black text-[#FFC21A]">
                    {potentialPayout.toLocaleString('pt-AO')} Kz
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Lucro Líquido Estimado</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-lg">
                    +{netProfit.toLocaleString('pt-AO')} Kz
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Balanço da Carteira BOOS BET */}
            {session && (
              <div className="p-3 bg-[#06345A]/30 border border-[#06345A] rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <WalletIcon className="w-4 h-4 text-[#FFC21A]" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Saldo da Carteira</span>
                    <span className="font-mono font-bold text-white">
                      {currentBalance.toLocaleString('pt-AO')} Kz
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Saldo Após Confirmação</span>
                  <span
                    className={`font-mono font-bold ${
                      isInsufficient ? 'text-rose-400' : 'text-slate-300'
                    }`}
                  >
                    {remainingBalance.toLocaleString('pt-AO')} Kz
                  </span>
                </div>
              </div>
            )}

            {/* Aviso de Confirmação */}
            <div className="p-2.5 bg-[#001426] border border-[#06345A] rounded-xl flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Liquidação Autorizada · Provedores Homologados
              </span>
              <span className="font-mono text-slate-500">+18 Jogo Responsável</span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        {!successTicket && (
          <div className="relative z-10 pt-4 border-t border-[#06345A] grid grid-cols-2 gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="py-3 px-4 rounded-xl border border-[#06345A] hover:bg-[#06345A]/60 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer text-center disabled:opacity-50"
            >
              Rever Seleções
            </button>

            <BoosButton
              variant="primary"
              size="md"
              onClick={onConfirm}
              disabled={submitting || isInsufficient}
              className="w-full text-center"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  A CONFIRMAR...
                </span>
              ) : isInsufficient ? (
                'SALDO INSUFICIENTE'
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  CONFIRMAR AGORA
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </BoosButton>
          </div>
        )}
      </div>
    </div>
  );
};
