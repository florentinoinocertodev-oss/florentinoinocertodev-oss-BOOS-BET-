import React from 'react';
import { boosTokens } from '../../theme/tokens';

export type BoosCardVariant = 'navy' | 'blue' | 'accent' | 'elevated';

interface BoosCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BoosCardVariant;
  highlightGold?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const BoosCard: React.FC<BoosCardProps> = ({
  variant = 'navy',
  highlightGold = false,
  children,
  className = '',
  ...props
}) => {
  const getStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'blue':
        return {
          backgroundColor: boosTokens.color.blue,
          borderColor: boosTokens.color.blueBorder,
          color: boosTokens.color.white
        };
      case 'elevated':
        return {
          background: boosTokens.gradients.cardSurface,
          borderColor: highlightGold ? boosTokens.color.gold : boosTokens.color.blueBorder,
          boxShadow: '0 8px 24px rgba(0, 12, 23, 0.45)',
          color: boosTokens.color.white
        };
      case 'accent':
        return {
          backgroundColor: 'rgba(6, 52, 90, 0.5)',
          borderColor: boosTokens.color.gold,
          color: boosTokens.color.white
        };
      case 'navy':
      default:
        return {
          backgroundColor: boosTokens.color.navy,
          borderColor: highlightGold ? boosTokens.color.gold : 'rgba(6, 52, 90, 0.8)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          color: boosTokens.color.white
        };
    }
  };

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl p-5 sm:p-6 border transition-all duration-200 ${className}`}
      style={getStyles()}
      {...props}
    >
      {children}
    </div>
  );
};
