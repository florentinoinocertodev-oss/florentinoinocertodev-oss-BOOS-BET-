import React, { useState } from 'react';

export interface BoosAvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showCrown?: boolean;
  showStatus?: boolean;
  statusColor?: 'emerald' | 'gold' | 'sky';
  alt?: string;
  onClick?: () => void;
  borderGlow?: boolean;
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 border',
  sm: 'w-8 h-8 border',
  md: 'w-10 h-10 border-2',
  lg: 'w-14 h-14 border-2',
  xl: 'w-20 h-20 border-2',
  '2xl': 'w-28 h-28 border-3'
};

export const BoosAvatar: React.FC<BoosAvatarProps> = ({
  size = 'md',
  className = '',
  showCrown = false,
  showStatus = false,
  statusColor = 'emerald',
  alt = 'Avatar BOOS BET',
  onClick,
  borderGlow = false
}) => {
  const [imgError, setImgError] = useState(false);

  const statusColorMap = {
    emerald: 'bg-emerald-400 border-[#001426]',
    gold: 'bg-[#FFC21A] border-[#001426]',
    sky: 'bg-sky-400 border-[#001426]'
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        onClick ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all' : ''
      } ${className}`}
    >
      <div
        className={`${SIZE_CLASSES[size]} rounded-full overflow-hidden border-[#FFC21A] bg-[#001426] shadow-md flex items-center justify-center ${
          borderGlow ? 'shadow-lg shadow-[#FFC21A]/20 ring-2 ring-[#FFC21A]/30' : ''
        }`}
      >
        <img
          src={imgError ? '/assets/brand/boos_mascot_symbol.svg' : '/assets/character/boos_master.jpg'}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>

      {showCrown && (
        <span
          className="absolute -top-1 -right-1 text-xs select-none drop-shadow"
          aria-label="Coroa de Ouro BOOS"
        >
          👑
        </span>
      )}

      {showStatus && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${statusColorMap[statusColor]} animate-pulse`}
          aria-hidden="true"
        />
      )}
    </div>
  );
};
