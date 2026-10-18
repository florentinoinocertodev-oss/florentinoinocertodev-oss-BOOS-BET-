import React from 'react';
import { BoosCharacter } from './BoosCharacter';

export interface BoosLoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

export const BoosLoading: React.FC<BoosLoadingProps> = ({
  message = 'A carregar eventos...',
  size = 'md',
  fullScreen = false,
  className = ''
}) => {
  const content = (
    <div
      className={`flex flex-col items-center justify-center p-6 space-y-3 select-none text-center ${className}`}
    >
      <div className="relative">
        <BoosCharacter
          pose="BOOS_LOADING"
          size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'}
          glow
          animated
          showCrownBadge
        />
        {/* Subtle rotating gold spinner border */}
        <div
          className="absolute -inset-1.5 rounded-full border-2 border-transparent border-t-[#FFC21A] animate-spin pointer-events-none"
          aria-hidden="true"
        />
      </div>

      <div className="space-y-1">
        <p className="text-xs sm:text-sm font-bold text-white tracking-wide font-mono flex items-center justify-center gap-1.5">
          <span>{message}</span>
        </p>
        <div className="flex items-center justify-center gap-1 pt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFC21A] animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFC21A] animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFC21A] animate-bounce" />
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000e1c]/80 backdrop-blur-sm animate-in fade-in duration-200">
        {content}
      </div>
    );
  }

  return content;
};
