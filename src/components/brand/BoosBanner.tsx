import React from 'react';
import { boosTokens } from '../../theme/tokens';
import { BoosLogo } from './BoosLogo';
import { BoosButton } from './BoosButton';
import { BoosBadge } from './BoosBadge';
import { ArrowRight, Trophy } from 'lucide-react';

interface BoosBannerProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  badgeText?: string;
  className?: string;
}

export const BoosBanner: React.FC<BoosBannerProps> = ({
  title = 'A CASA OFICIAL DO JOGADOR REI',
  subtitle = 'Apostas desportivas no Girabola ZAP e jogos rápidos com odds premium, liquidação instantânea em Kwanzas (Kz) e segurança por telemóvel.',
  ctaText = 'APOSTAR AGORA',
  onCtaClick,
  badgeText = 'PLATAFORMA OFICIAL BOOS BET',
  className = ''
}) => {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl p-6 sm:p-8 border border-[#06345A] shadow-2xl ${className}`}
      style={{
        background: 'linear-gradient(135deg, #001426 0%, #06345A 65%, #082d4c 100%)'
      }}
    >
      {/* Subtle radial golden aura behind mascot */}
      <div
        className="absolute -right-16 -top-16 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: boosTokens.color.gold }}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="max-w-xl text-center md:text-left space-y-3">
          <BoosBadge variant="gold" icon={<Trophy className="w-3.5 h-3.5" />}>
            {badgeText}
          </BoosBadge>

          <h1
            className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight font-display"
          >
            {title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            {subtitle}
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
            {onCtaClick && (
              <BoosButton
                variant="primary"
                size="md"
                onClick={onCtaClick}
                iconRight={<ArrowRight className="w-4 h-4" />}
              >
                {ctaText}
              </BoosButton>
            )}

            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#001426]/70 border border-[#06345A]">
              <span className="w-2 h-2 rounded-full bg-[#FFC21A] animate-pulse" />
              <span>Odds Premium · Suporte Angola +244</span>
            </div>
          </div>
        </div>

        {/* Official Mascote Symbol Frame */}
        <div className="relative shrink-0 flex items-center justify-center">
          <div className="w-36 h-36 sm:w-48 sm:h-48 drop-shadow-2xl">
            <BoosLogo variant="symbol" size="custom" height="100%" width="100%" />
          </div>
        </div>
      </div>
    </div>
  );
};
