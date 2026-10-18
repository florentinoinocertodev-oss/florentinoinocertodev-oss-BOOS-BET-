import React from 'react';
import { boosTokens } from '../../theme/tokens';

export type BoosBadgeVariant = 'gold' | 'orange' | 'navy' | 'blue' | 'white';

interface BoosBadgeProps {
  children: React.ReactNode;
  variant?: BoosBadgeVariant;
  className?: string;
  icon?: React.ReactNode;
}

export const BoosBadge: React.FC<BoosBadgeProps> = ({
  children,
  variant = 'gold',
  className = '',
  icon
}) => {
  const variantStyles: Record<BoosBadgeVariant, React.CSSProperties> = {
    gold: {
      backgroundColor: 'rgba(255, 194, 26, 0.12)',
      color: boosTokens.color.gold,
      border: '1px solid rgba(255, 194, 26, 0.3)'
    },
    orange: {
      backgroundColor: 'rgba(245, 169, 0, 0.12)',
      color: boosTokens.color.orange,
      border: '1px solid rgba(245, 169, 0, 0.3)'
    },
    navy: {
      backgroundColor: boosTokens.color.navy,
      color: boosTokens.color.white,
      border: `1px solid ${boosTokens.color.blue}`
    },
    blue: {
      backgroundColor: boosTokens.color.blue,
      color: boosTokens.color.white,
      border: `1px solid ${boosTokens.color.blueBorder}`
    },
    white: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      color: boosTokens.color.white,
      border: '1px solid rgba(255, 255, 255, 0.15)'
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-mono font-semibold tracking-wide uppercase select-none ${className}`}
      style={variantStyles[variant]}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
