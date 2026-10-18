import React from 'react';
import { BoosCharacter } from './BoosCharacter';
import { BoosButton } from './BoosButton';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export interface BoosErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
}

export const BoosError: React.FC<BoosErrorProps> = ({
  title = 'Não foi possível concluir esta operação',
  message = 'Ocorreu uma instabilidade na conexão ou o serviço está momentaneamente ocupado. Tenta novamente.',
  onRetry,
  retryText = 'TENTAR NOVAMENTE',
  className = ''
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-3xl bg-[#001426] border border-amber-500/40 space-y-3.5 max-w-md mx-auto ${className}`}
    >
      <div className="relative">
        <BoosCharacter
          pose="BOOS_SERIOUS"
          size="lg"
          showCrownBadge
        />
        <span
          className="absolute -bottom-1 -right-1 p-1 rounded-full bg-amber-500 text-[#001426] shadow-md border-2 border-[#001426]"
          title="Alerta de Erro"
        >
          <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
        </span>
      </div>

      <div className="space-y-1">
        <h4 className="text-sm sm:text-base font-black text-white tracking-tight">
          {title}
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          {message}
        </p>
      </div>

      {onRetry && (
        <div className="pt-2">
          <BoosButton
            variant="primary"
            size="md"
            onClick={onRetry}
            className="shadow-lg shadow-[#FFC21A]/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{retryText}</span>
          </BoosButton>
        </div>
      )}
    </div>
  );
};
