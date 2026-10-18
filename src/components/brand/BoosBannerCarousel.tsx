import React, { useState, useEffect, useRef } from 'react';
import { BoosButton } from './BoosButton';
import { BoosBadge } from './BoosBadge';
import { BoosCharacter, BoosCharacterPose } from './BoosCharacter';
import { ChevronLeft, ChevronRight, Trophy, Rocket, ShieldCheck, Flame, ArrowRight, Sparkles } from 'lucide-react';

export interface BannerSlide {
  id: string;
  badge: string;
  badgeIcon: React.ReactNode;
  badgeVariant?: 'gold' | 'orange' | 'blue';
  title: string;
  highlightText: string;
  subtitle: string;
  ctaText: string;
  ctaAction: () => void;
  accentColor: string;
  bgGradient: string;
  illustrationType: 'sports' | 'crash' | 'deposit';
}

interface BoosBannerCarouselProps {
  onCtaClick?: (actionId: string) => void;
  className?: string;
}

export const BoosBannerCarousel: React.FC<BoosBannerCarouselProps> = ({
  onCtaClick,
  className = ''
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const slides: BannerSlide[] = [
    {
      id: 'girabola_super_odds',
      badge: 'GIRABOLA ZAP · FUTEBOL NACIONAL',
      badgeIcon: <Flame className="w-3.5 h-3.5 text-[#F5A900]" />,
      badgeVariant: 'gold',
      title: 'DESPORTO EM ANGOLA:',
      highlightText: 'GIRABOLA ZAP & COMPETIÇÕES DE TOPO',
      subtitle: 'Acompanhe as maiores disputas e apoie as suas equipas favoritas na plataforma BOOS BET.',
      ctaText: 'VER EVENTOS DESPORTIVOS',
      ctaAction: () => onCtaClick?.('sports'),
      accentColor: '#FFC21A',
      bgGradient: 'linear-gradient(135deg, #001426 0%, #06345A 60%, #0d4a7c 100%)',
      illustrationType: 'sports'
    },
    {
      id: 'holders_official_feeds',
      badge: 'SPORTSBOOK BOOS BET',
      badgeIcon: <Trophy className="w-3.5 h-3.5 text-[#FFC21A]" />,
      badgeVariant: 'gold',
      title: 'MERCADOS DESPORTIVOS:',
      highlightText: 'FUTEBOL, BASQUETEBOL & MAIS',
      subtitle: 'Navegue por dezenas de mercados desportivos com boletim de apostas simplificado e transparente.',
      ctaText: 'EXPLORAR MERCADOS',
      ctaAction: () => onCtaClick?.('sports'),
      accentColor: '#FFC21A',
      bgGradient: 'linear-gradient(135deg, #001426 0%, #06345A 55%, #0b3d68 100%)',
      illustrationType: 'sports'
    },
    {
      id: 'multicaixa_bonus',
      badge: 'PAGAMENTOS NACIONAIS · ANGOLA',
      badgeIcon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
      badgeVariant: 'gold',
      title: 'PAGAMENTOS MULTICAIXA EXPRESS:',
      highlightText: 'TRANSAÇÕES EM KWANZA (KZ)',
      subtitle: 'Gestão de conta integrada para depósitos e levantamentos em moeda nacional através de telemóvel (+244).',
      ctaText: 'CONSULTAR CARTEIRA',
      ctaAction: () => onCtaClick?.('wallet'),
      accentColor: '#FFC21A',
      bgGradient: 'linear-gradient(135deg, #001426 0%, #083860 65%, #2a2004 100%)',
      illustrationType: 'deposit'
    },
    {
      id: 'predictions_hub',
      badge: 'ANÁLISE ESTATÍSTICA · BOOS BET',
      badgeIcon: <Sparkles className="w-3.5 h-3.5 text-[#FFC21A]" />,
      badgeVariant: 'gold',
      title: 'PROGNÓSTICOS & ESTATÍSTICAS:',
      highlightText: 'ANÁLISE ESTATÍSTICA DE JOGOS',
      subtitle: 'Consulte probabilidades matemáticas e métricas táticas para apoiar as suas escolhas desportivas.',
      ctaText: 'VER PREVISÕES',
      ctaAction: () => onCtaClick?.('predictions'),
      accentColor: '#FFC21A',
      bgGradient: 'linear-gradient(135deg, #001426 0%, #032d52 60%, #084c82 100%)',
      illustrationType: 'sports'
    }
  ];

  // Auto-play timer
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const goToSlide = (idx: number) => {
    setCurrentSlide(idx);
  };

  const nextSlide = () => {
    setCurrentSlide((currentSlide + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((currentSlide - 1 + slides.length) % slides.length);
  };

  // Touch Swipe Handlers for mobile snap
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const active = slides[currentSlide];

  const getSlidePose = (slideId: string): BoosCharacterPose => {
    switch (slideId) {
      case 'girabola_super_odds':
        return 'BOOS_MASTER';
      case 'holders_official_feeds':
        return 'BOOS_WIN';
      case 'multicaixa_bonus':
        return 'BOOS_WELCOME';
      case 'predictions_hub':
        return 'BOOS_ANALYTICS';
      default:
        return 'BOOS_MASTER';
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl select-none group border border-[#06345A] shadow-2xl transition-all ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        background: active.bgGradient,
        minHeight: '190px'
      }}
    >
      {/* Background ambient radial glow */}
      <div
        className="absolute -right-16 -top-16 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-25 transition-all duration-700"
        style={{ background: active.accentColor }}
      />
      <div
        className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-15"
        style={{ background: '#06345A' }}
      />

      {/* Slide Content */}
      <div className="relative z-10 px-5 sm:px-8 py-5 sm:py-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Text Area */}
        <div className="max-w-xl text-center md:text-left space-y-2 sm:space-y-3">
          <BoosBadge variant={active.badgeVariant || 'gold'} icon={active.badgeIcon}>
            {active.badge}
          </BoosBadge>

          <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight font-display">
            {active.title}{' '}
            <span className="text-[#FFC21A] block sm:inline font-black">
              {active.highlightText}
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans line-clamp-2 sm:line-clamp-none max-w-lg">
            {active.subtitle}
          </p>

          <div className="pt-1 flex items-center justify-center md:justify-start gap-3">
            <BoosButton
              variant="primary"
              size="sm"
              onClick={active.ctaAction}
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              {active.ctaText}
            </BoosButton>

            <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400">
              Regulado pelo ISJ Angola
            </span>
          </div>
        </div>

        {/* Mascot / Asset Emblem Illustration on the Right */}
        <div className="relative shrink-0 flex items-center justify-center">
          <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
            {/* Outer golden crown ring glow */}
            <div className="absolute inset-0 rounded-full border border-[#FFC21A]/30 bg-gradient-to-b from-[#06345A]/60 to-[#001426]/90 shadow-2xl backdrop-blur-sm" />
            <BoosCharacter
              pose={getSlidePose(active.id)}
              size="lg"
              glow
              animated
              showCrownBadge
            />
          </div>
        </div>
      </div>

      {/* Navigation Arrows (discreet on hover) */}
      <button
        type="button"
        onClick={prevSlide}
        className="hidden md:flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#001426]/80 hover:bg-[#06345A] border border-[#06345A] text-slate-300 hover:text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-20"
        aria-label="Slide anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        className="hidden md:flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#001426]/80 hover:bg-[#06345A] border border-[#06345A] text-slate-300 hover:text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-20"
        aria-label="Próximo slide"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Carousel Dots Pagination */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => goToSlide(idx)}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              idx === currentSlide
                ? 'w-6 h-1.5 bg-[#FFC21A] shadow-sm shadow-[#FFC21A]/50'
                : 'w-1.5 h-1.5 bg-slate-600 hover:bg-slate-400'
            }`}
            aria-label={`Ir para banner ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
