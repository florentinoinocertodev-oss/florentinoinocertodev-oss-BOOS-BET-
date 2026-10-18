import React, { useState } from 'react';

export type BoosCharacterPose =
  | 'BOOS_MASTER'
  | 'BOOS_IDLE'
  | 'BOOS_WELCOME'
  | 'BOOS_WIN'
  | 'BOOS_LOSS'
  | 'BOOS_SERIOUS'
  | 'BOOS_LIVE'
  | 'BOOS_PROMOTION'
  | 'BOOS_ANALYTICS'
  | 'BOOS_CELEBRATION'
  | 'BOOS_FOOTBALL'
  | 'BOOS_LOADING'
  | 'BOOS_ERROR'
  | 'BOOS_EMPTY';

export interface BoosCharacterProps {
  pose?: BoosCharacterPose;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  customSize?: number | string;
  className?: string;
  glow?: boolean;
  animated?: boolean;
  showCrownBadge?: boolean;
  alt?: string;
  priority?: boolean;
  onClick?: () => void;
}

// Map each pose to its specific master asset and fallback
const POSE_ASSET_MAP: Record<BoosCharacterPose, { src: string; fallbackSrc: string; label: string }> = {
  BOOS_MASTER: {
    src: '/assets/character/boos_master.jpg',
    fallbackSrc: '/assets/brand/boos_mascot_symbol.svg',
    label: 'BOOS BET Mascote Oficial'
  },
  BOOS_IDLE: {
    src: '/assets/character/boos_idle.jpg',
    fallbackSrc: '/assets/brand/boos_mascot_symbol.svg',
    label: 'BOOS em espera'
  },
  BOOS_WELCOME: {
    src: '/assets/character/boos_welcome.jpg',
    fallbackSrc: '/assets/brand/boos_mascot_symbol.svg',
    label: 'BOOS Boas-vindas'
  },
  BOOS_WIN: {
    src: '/assets/character/boos_win.jpg',
    fallbackSrc: '/assets/brand/boos_mascot_symbol.svg',
    label: 'BOOS Vitória e Troféu'
  },
  BOOS_CELEBRATION: {
    src: '/assets/character/boos_win.jpg',
    fallbackSrc: '/assets/brand/boos_mascot_symbol.svg',
    label: 'BOOS Celebração'
  },
  BOOS_LOSS: {
    src: '/assets/character/boos_serious.jpg',
    fallbackSrc: '/assets/brand/boos_mascot_symbol.svg',
    label: 'BOOS Focado no próximo jogo'
  },
  BOOS_SERIOUS: {
    src: '/assets/character/boos_serious.jpg',
    fallbackSrc: '/assets/brand/boos_mascot_symbol.svg',
    label: 'BOOS Análise Séria'
  },
  BOOS_ERROR: {
    src: '/assets/character/boos_serious.jpg',
    fallbackSrc: '/assets/brand/boos_mascot_symbol.svg',
    label: 'BOOS Atenção ao Erro'
  },
  BOOS_LIVE: {
    src: '/assets/character/boos_master.jpg',
    fallbackSrc: '/assets/brand/boos_mascot_symbol.svg',
    label: 'BOOS Ao Vivo'
  },
  BOOS_PROMOTION: {
    src: '/assets/character/boos_welcome.jpg',
    fallbackSrc: '/assets/brand/boos_mascot_symbol.svg',
    label: 'BOOS Promoções Exclusivas'
  },
  BOOS_ANALYTICS: {
    src: '/assets/character/boos_serious.jpg',
    fallbackSrc: '/assets/brand/boos_mascot_symbol.svg',
    label: 'BOOS Analista Estatístico'
  },
  BOOS_FOOTBALL: {
    src: '/assets/character/boos_master.jpg',
    fallbackSrc: '/assets/brand/boos_mascot_symbol.svg',
    label: 'BOOS Futebol'
  },
  BOOS_LOADING: {
    src: '/assets/character/boos_master.jpg',
    fallbackSrc: '/assets/brand/boos_mascot_symbol.svg',
    label: 'BOOS a carregar dados'
  },
  BOOS_EMPTY: {
    src: '/assets/character/boos_serious.jpg',
    fallbackSrc: '/assets/brand/boos_mascot_symbol.svg',
    label: 'BOOS Lista Vazia'
  }
};

// Size presets in Tailwind / CSS dimensions
const SIZE_MAP: Record<string, string> = {
  xs: 'w-8 h-8',
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
  '2xl': 'w-44 h-44',
  full: 'w-full h-auto'
};

export const BoosCharacter: React.FC<BoosCharacterProps> = ({
  pose = 'BOOS_MASTER',
  size = 'md',
  customSize,
  className = '',
  glow = false,
  animated = false,
  showCrownBadge = false,
  alt,
  priority = false,
  onClick
}) => {
  const [imageError, setImageError] = useState(false);
  const poseData = POSE_ASSET_MAP[pose] || POSE_ASSET_MAP.BOOS_MASTER;

  const currentSrc = imageError ? poseData.fallbackSrc : poseData.src;
  const currentAlt = alt || poseData.label;

  const sizeClass = customSize ? '' : SIZE_MAP[size] || SIZE_MAP.md;
  const inlineStyle = customSize
    ? { width: customSize, height: customSize }
    : undefined;

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95 transition-transform' : ''
      } ${className}`}
      style={inlineStyle}
    >
      {/* Optional Gold Ambient Glow */}
      {glow && (
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FFC21A]/30 to-[#FF7A00]/20 blur-md pointer-events-none -z-10 animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* Main Mascot Visual */}
      <div
        className={`relative ${sizeClass} rounded-full overflow-hidden border border-[#FFC21A]/40 shadow-lg bg-[#001426] flex items-center justify-center`}
      >
        <img
          src={currentSrc}
          alt={currentAlt}
          referrerPolicy="no-referrer"
          loading={priority ? 'eager' : 'lazy'}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover transition-transform duration-300 ${
            animated && pose === 'BOOS_LOADING'
              ? 'animate-pulse'
              : animated
              ? 'hover:scale-110'
              : ''
          }`}
          draggable={false}
        />
      </div>

      {/* Optional Mini Crown Badge */}
      {showCrownBadge && (
        <span
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-tr from-[#FFC21A] to-[#F5A900] text-[#001426] text-[9px] font-black flex items-center justify-center shadow-md border border-[#001426]"
          title="Mascote Oficial BOOS BET"
        >
          👑
        </span>
      )}
    </div>
  );
};
