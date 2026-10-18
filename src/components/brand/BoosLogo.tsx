import React, { useState } from 'react';

export type BoosLogoVariant =
  | 'full'
  | 'horizontal'
  | 'vertical'
  | 'symbol'
  | 'avatar'
  | 'wordmark'
  | 'boos'
  | 'bet'
  | 'compact';

export interface BoosLogoProps {
  variant?: BoosLogoVariant;
  theme?: 'dark' | 'light' | 'monochrome';
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  height?: number | string;
  width?: number | string;
  alt?: string;
  onClick?: () => void;
}

export const BoosLogo: React.FC<BoosLogoProps> = ({
  variant = 'horizontal',
  theme = 'dark',
  className = '',
  size = 'md',
  height,
  width,
  alt = 'BOOS BET',
  onClick
}) => {
  const [loadFailed, setLoadFailed] = useState(false);

  // Size presets
  const sizeStyles: Record<string, { height?: string; width?: string }> = {
    xs: { height: variant === 'symbol' || variant === 'avatar' ? '24px' : '20px' },
    sm: { height: variant === 'symbol' || variant === 'avatar' ? '32px' : '26px' },
    md: { height: variant === 'symbol' || variant === 'avatar' ? '44px' : '36px' },
    lg: { height: variant === 'symbol' || variant === 'avatar' ? '60px' : '48px' },
    xl: { height: variant === 'symbol' || variant === 'avatar' ? '88px' : '68px' },
    custom: { height: height?.toString(), width: width?.toString() }
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  // Asset mapping following official BOOS BET brand guidelines
  let assetSrc = '/assets/brand/boos_logo_full.svg';
  let aspectRatio = '1150 / 480';

  switch (variant) {
    case 'symbol':
      assetSrc = '/assets/brand/boos_mascot_symbol.svg';
      aspectRatio = '1 / 1';
      break;

    case 'avatar':
      assetSrc = '/assets/character/boos_master.jpg';
      aspectRatio = '1 / 1';
      break;

    case 'wordmark':
    case 'boos':
    case 'bet':
      assetSrc = '/assets/brand/boos_wordmark.svg';
      aspectRatio = '600 / 360';
      break;

    case 'compact':
      // Compact logo: Mascot Symbol + BOOS BET
      assetSrc = '/assets/brand/boos_logo_full.svg';
      aspectRatio = '1150 / 480';
      break;

    case 'vertical':
      // Stacked logo
      assetSrc = '/assets/brand/boos_logo_full.svg';
      aspectRatio = '1150 / 480';
      break;

    case 'horizontal':
    case 'full':
    default:
      assetSrc = '/assets/brand/boos_logo_full.svg';
      aspectRatio = '1150 / 480';
      break;
  }

  const themeFilter =
    theme === 'monochrome'
      ? 'grayscale(1) brightness(1.2)'
      : theme === 'light'
      ? 'contrast(1.1)'
      : '';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center justify-center shrink-0 select-none ${
        onClick ? 'cursor-pointer hover:opacity-95 active:scale-98 transition-all' : ''
      } ${className}`}
      style={{
        height: height || currentSize.height,
        width: width || currentSize.width
      }}
    >
      <img
        src={assetSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setLoadFailed(true)}
        className={`w-full h-full object-contain filter drop-shadow-sm transition-transform duration-200 ${
          variant === 'avatar' ? 'rounded-full' : ''
        }`}
        style={{
          aspectRatio,
          filter: themeFilter || undefined
        }}
        draggable={false}
      />
    </div>
  );
};
