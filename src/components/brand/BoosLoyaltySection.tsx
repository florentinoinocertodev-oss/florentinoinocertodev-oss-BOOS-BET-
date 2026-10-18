import React, { useState } from 'react';
import { PublicProfile, Wallet } from '../../types';
import { BoosButton } from './BoosButton';
import { BoosBadge } from './BoosBadge';
import { notificationService } from '../../services/notificationService';
import {
  Crown,
  Sparkles,
  Award,
  ShieldCheck,
  TrendingUp,
  Gift,
  CheckCircle2,
  Lock,
  ChevronRight,
  Flame,
  Zap,
  ArrowUpRight
} from 'lucide-react';

export interface LoyaltyTier {
  id: string;
  name: string;
  minVolume: number;
  maxVolume: number;
  cashbackPct: number;
  perks: string[];
  color: string;
  badge: string;
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: 'bronze',
    name: 'Bronze Rei',
    minVolume: 0,
    maxVolume: 100000,
    cashbackPct: 1,
    perks: ['Acesso ao Giro da Sorte Diário', 'Suporte oficial 24/7', 'Depósitos Multicaixa sem taxas'],
    color: '#CD7F32',
    badge: 'INICIANTE'
  },
  {
    id: 'prata',
    name: 'Prata Real',
    minVolume: 100000,
    maxVolume: 500000,
    cashbackPct: 3,
    perks: ['3% de Cashback Semanal', 'Bónus de +5% em Apostas Múltiplas', 'Levantamentos acelerados'],
    color: '#C0C0C0',
    badge: 'PRATA'
  },
  {
    id: 'ouro',
    name: 'Ouro Imperial',
    minVolume: 500000,
    maxVolume: 2000000,
    cashbackPct: 6,
    perks: ['6% de Cashback Semanal', 'Super Odds Turbinadas no Girabola', 'Bónus de Aniversário em Kz'],
    color: '#FFC21A',
    badge: 'OURO'
  },
  {
    id: 'diamante',
    name: 'Diamante Soberano',
    minVolume: 2000000,
    maxVolume: 10000000,
    cashbackPct: 9,
    perks: ['9% de Cashback Semanal', 'Gestor de Conta VIP Dedicado', 'Levantamentos instantâneos prioritários'],
    color: '#00D2FF',
    badge: 'DIAMANTE'
  },
  {
    id: 'supremo',
    name: 'Rei Supremo BOOS',
    minVolume: 10000000,
    maxVolume: Infinity,
    cashbackPct: 12,
    perks: ['12% de Cashback Semanal Imediato', 'Bilhetes VIP para Clássicos do Girabola', 'Bónus sem Rollover'],
    color: '#F5A900',
    badge: 'ELITE VIP'
  }
];

interface BoosLoyaltySectionProps {
  profile: PublicProfile;
  wallet?: Wallet;
  onBonusClaimed?: (bonusKz: number) => void;
  className?: string;
}

export const BoosLoyaltySection: React.FC<BoosLoyaltySectionProps> = ({
  profile,
  wallet,
  onBonusClaimed,
  className = ''
}) => {
  // Volume de apostas acumulado estimado a partir do nível, experiência e pontuação de fidelidade
  const simulatedVolume = Math.max(
    85000,
    (profile.xp * 1800) + (profile.rank_points * 3500) + (profile.level * 45000)
  );

  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Determinar o tier atual
  const currentTierIndex = LOYALTY_TIERS.findIndex(
    tier => simulatedVolume >= tier.minVolume && simulatedVolume < tier.maxVolume
  );
  const activeTierIndex = currentTierIndex === -1 ? LOYALTY_TIERS.length - 1 : currentTierIndex;
  const currentTier = LOYALTY_TIERS[activeTierIndex];
  const nextTier = activeTierIndex < LOYALTY_TIERS.length - 1 ? LOYALTY_TIERS[activeTierIndex + 1] : null;

  // Cálculo da percentagem de progresso para a barra de gradiente
  let progressPct = 100;
  let remainingKz = 0;

  if (nextTier) {
    const range = nextTier.minVolume - currentTier.minVolume;
    const currentInRange = simulatedVolume - currentTier.minVolume;
    progressPct = Math.min(100, Math.max(0, Math.round((currentInRange / range) * 100)));
    remainingKz = Math.max(0, nextTier.minVolume - simulatedVolume);
  }

  // Recompensa semanal calculada (ex: cashback proporcional)
  const availableBonusKz = Math.round((simulatedVolume * currentTier.cashbackPct) / 100);

  const handleClaimReward = () => {
    if (claimed || claiming) return;
    setClaiming(true);

    setTimeout(() => {
      setClaiming(false);
      setClaimed(true);
      onBonusClaimed?.(availableBonusKz);
      notificationService.sendNotification({
        title: `👑 Bónus de Lealdade Resgatado! (+${availableBonusKz.toLocaleString('pt-AO')} Kz)`,
        body: `Parabéns Jogador Rei! O seu bónus semanal do escalão ${currentTier.name} foi creditado na sua carteira.`,
        category: 'PROMOTION',
        linkTab: 'profile'
      });
    }, 900);
  };

  return (
    <div
      className={`p-6 sm:p-7 bg-[#001426] border border-[#06345A] rounded-3xl shadow-2xl space-y-6 relative overflow-hidden ${className}`}
    >
      {/* Background ambient lighting */}
      <div
        className="absolute -right-24 -top-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: '#FFC21A' }}
      />
      <div
        className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-15"
        style={{ background: '#06345A' }}
      />

      {/* 1. Header do Programa de Lealdade */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#06345A]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFC21A] to-[#F5A900] text-[#001426] flex items-center justify-center shadow-lg shadow-[#F5A900]/30 shrink-0">
            <Crown className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-black text-white tracking-tight font-display">
                BOOS LOYALTY CLUB
              </h3>
              <BoosBadge variant="gold" icon={<Sparkles className="w-3 h-3" />}>
                {currentTier.badge}
              </BoosBadge>
            </div>
            <p className="text-xs text-slate-300 font-sans mt-0.5">
              Escalão de Lealdade do Jogador Rei baseado em volume de apostas em Angola.
            </p>
          </div>
        </div>

        {/* Status rápido do Tier atual */}
        <div className="flex items-center gap-2 p-2 rounded-2xl bg-[#06345A]/50 border border-[#0d4a7c] w-fit">
          <div className="px-3 py-1 rounded-xl bg-[#001426] border border-[#06345A] text-right">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">
              Escalão Atual
            </span>
            <span className="text-sm font-extrabold text-[#FFC21A] font-display">
              {currentTier.name}
            </span>
          </div>
          <div className="px-3 py-1 rounded-xl bg-[#001426] border border-[#06345A] text-right">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">
              Cashback
            </span>
            <span className="text-sm font-black text-emerald-400 font-mono">
              {currentTier.cashbackPct}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Barra de Progresso com Gradiente Oficial BOOS Gold/Orange */}
      <div className="relative z-10 space-y-3 p-4 sm:p-5 bg-gradient-to-br from-[#06345A]/60 via-[#001426] to-[#06345A]/40 border border-[#0d4a7c] rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#FFC21A]" />
            <span className="font-extrabold text-white">Volume de Apostas Acumulado:</span>
            <span className="font-mono font-black text-[#FFC21A] text-sm">
              {simulatedVolume.toLocaleString('pt-AO')} Kz
            </span>
          </div>

          {nextTier ? (
            <span className="text-slate-300 font-medium text-[11px]">
              Próximo Nível:{' '}
              <strong className="text-white font-bold">{nextTier.name}</strong> ({nextTier.minVolume.toLocaleString('pt-AO')} Kz)
            </span>
          ) : (
            <span className="text-[#FFC21A] font-black text-xs">
              👑 NÍVEL MÁXIMO ATINGIDO
            </span>
          )}
        </div>

        {/* Progress Bar Container */}
        <div className="relative w-full h-5 rounded-full bg-[#001426] border-2 border-[#06345A] overflow-hidden p-0.5 shadow-inner">
          {/* Official BOOS Gold/Orange Gradient Bar */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FFC21A] via-[#F5A900] to-[#E08500] shadow-lg shadow-[#F5A900]/40 transition-all duration-1000 ease-out relative flex items-center justify-end pr-1"
            style={{ width: `${Math.max(6, progressPct)}%` }}
          >
            {/* Shimmer light effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-pulse" />
          </div>
        </div>

        {/* Bottom Details of Progress */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>{currentTier.minVolume.toLocaleString('pt-AO')} Kz ({currentTier.name})</span>
          <span className="font-black text-[#FFC21A]">{progressPct}% Concluído</span>
          {nextTier && (
            <span>{nextTier.minVolume.toLocaleString('pt-AO')} Kz ({nextTier.name})</span>
          )}
        </div>

        {nextTier && remainingKz > 0 && (
          <div className="pt-2 border-t border-[#06345A]/70 flex items-center justify-between text-xs text-slate-300">
            <span>
              Faltam apenas{' '}
              <strong className="text-[#FFC21A] font-mono font-black">
                {remainingKz.toLocaleString('pt-AO')} Kz
              </strong>{' '}
              em apostas para desbloquear o escalão{' '}
              <strong className="text-white">{nextTier.name}</strong> com {nextTier.cashbackPct}% de cashback!
            </span>
          </div>
        )}
      </div>

      {/* 3. Recompensas & Vantagens do Escalão Atual */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card de Benefícios Ativos */}
        <div className="md:col-span-2 p-4 bg-[#06345A]/30 border border-[#0d4a7c] rounded-2xl space-y-2.5">
          <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#F5A900]" />
            Privilégios do seu Escalão ({currentTier.name})
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {currentTier.perks.map((perk, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-[#001426]/70 border border-[#06345A] flex items-center gap-2 text-slate-200"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-medium leading-tight">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card de Resgate de Bónus Semanal */}
        <div className="p-4 bg-gradient-to-br from-[#06345A]/80 to-[#001426] border border-[#FFC21A]/40 rounded-2xl flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                Cashback Semanal VIP
              </span>
              <Gift className="w-4 h-4 text-[#FFC21A]" />
            </div>
            <div className="text-2xl font-black font-mono text-[#FFC21A] mt-1">
              {availableBonusKz.toLocaleString('pt-AO')} Kz
            </div>
            <span className="text-[11px] text-slate-300 block mt-0.5">
              Recompensa acumulada pelas suas apostas na BOOS BET.
            </span>
          </div>

          <BoosButton
            variant="primary"
            size="sm"
            onClick={handleClaimReward}
            disabled={claimed || claiming}
            fullWidth
          >
            {claimed ? (
              <span className="flex items-center justify-center gap-1.5 text-emerald-950 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                BÓNUS RESGATADO
              </span>
            ) : claiming ? (
              'A CREDITAR...'
            ) : (
              'RESGATAR RECOMPENSA'
            )}
          </BoosButton>
        </div>
      </div>

      {/* 4. Rota dos Escalões de Lealdade (Tier Roadmap) */}
      <div className="relative z-10 pt-2 border-t border-[#06345A] space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
          Níveis do Boos Loyalty Club Angola
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {LOYALTY_TIERS.map((tier, idx) => {
            const isCompleted = idx < activeTierIndex;
            const isCurrent = idx === activeTierIndex;
            const isLocked = idx > activeTierIndex;

            return (
              <div
                key={tier.id}
                className={`p-3 rounded-2xl border transition-all select-none text-center flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-[#06345A] border-[#FFC21A] shadow-lg shadow-[#FFC21A]/20 ring-1 ring-[#FFC21A]'
                    : isCompleted
                    ? 'bg-[#06345A]/30 border-emerald-800/60 opacity-85'
                    : 'bg-[#001426] border-[#06345A]/60 opacity-55'
                }`}
              >
                <div>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-1.5 shadow"
                    style={{ backgroundColor: `${tier.color}25`, color: tier.color }}
                  >
                    {isCurrent ? (
                      <Crown className="w-4 h-4" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>

                  <h5 className="font-extrabold text-white text-xs truncate">
                    {tier.name}
                  </h5>

                  <span className="text-[10px] font-mono text-[#FFC21A] block font-bold mt-0.5">
                    {tier.cashbackPct}% Cashback
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-white/10 text-[9px] font-mono text-slate-400">
                  {tier.minVolume === 0 ? 'Início' : `${tier.minVolume / 1000}k Kz`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
