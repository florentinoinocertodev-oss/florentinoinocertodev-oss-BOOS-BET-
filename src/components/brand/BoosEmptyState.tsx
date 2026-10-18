import React from 'react';
import { BoosCharacter, BoosCharacterPose } from './BoosCharacter';
import { BoosButton } from './BoosButton';
import { ArrowRight } from 'lucide-react';

export type BoosEmptyStateType =
  | 'betslip'
  | 'favorites'
  | 'history'
  | 'notifications'
  | 'promotions'
  | 'events'
  | 'wallet'
  | 'custom';

export interface BoosEmptyStateProps {
  type?: BoosEmptyStateType;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PRESET_MESSAGES: Record<
  BoosEmptyStateType,
  { title: string; description: string; actionText?: string; pose: BoosCharacterPose }
> = {
  betslip: {
    title: 'O teu Bet Slip está vazio',
    description: 'Escolhe um evento desportivo para começar o teu boletim de apostas.',
    actionText: 'VER EVENTOS',
    pose: 'BOOS_IDLE'
  },
  favorites: {
    title: 'Sem jogos favoritos',
    description: 'Guarda as tuas equipas e partidas preferidas para acesso rápido.',
    actionText: 'EXPLORAR JOGOS',
    pose: 'BOOS_IDLE'
  },
  history: {
    title: 'Ainda não tens apostas no histórico',
    description: 'Assim que confirmares os teus palpites, eles aparecerão aqui com os resultados em tempo real.',
    actionText: 'FAZER PRIMEIRA APOSTA',
    pose: 'BOOS_IDLE'
  },
  notifications: {
    title: 'Nenhuma notificação nova',
    description: 'Estás a par de tudo! Avisaremos quando houver bónus, golos ou resultados.',
    pose: 'BOOS_IDLE'
  },
  promotions: {
    title: 'Novas promoções a caminho',
    description: 'Fica atento às ofertas de recarga e boosts de odds da BOOS BET.',
    actionText: 'VER JOGOS DO DIA',
    pose: 'BOOS_WELCOME'
  },
  events: {
    title: 'Nenhum evento disponível no momento',
    description: 'Estamos a atualizar as odds e os mercados com os próximos confrontos.',
    actionText: 'ATUALIZAR',
    pose: 'BOOS_SERIOUS'
  },
  wallet: {
    title: 'Ainda não existem transações',
    description: 'Os teus depósitos, levantamentos e prémios ficarão registados aqui com total transparência.',
    actionText: 'DEPOSITAR AGORA',
    pose: 'BOOS_IDLE'
  },
  custom: {
    title: 'Sem registos',
    description: 'Não foram encontrados dados para esta secção.',
    pose: 'BOOS_IDLE'
  }
};

export const BoosEmptyState: React.FC<BoosEmptyStateProps> = ({
  type = 'custom',
  title,
  description,
  actionText,
  onAction,
  actionIcon = <ArrowRight className="w-4 h-4" />,
  size = 'md',
  className = ''
}) => {
  const preset = PRESET_MESSAGES[type] || PRESET_MESSAGES.custom;

  const finalTitle = title || preset.title;
  const finalDesc = description || preset.description;
  const finalActionText = actionText || preset.actionText;

  const characterSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md';

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-6 sm:p-8 rounded-3xl bg-[#001426]/60 border border-[#06345A] space-y-3.5 ${className}`}
    >
      <div className="relative">
        <BoosCharacter
          pose={preset.pose}
          size={characterSize}
          glow
          showCrownBadge
        />
      </div>

      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm sm:text-base font-black text-white tracking-tight">
          {finalTitle}
        </h4>
        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          {finalDesc}
        </p>
      </div>

      {finalActionText && onAction && (
        <div className="pt-2">
          <BoosButton
            variant="primary"
            size={size === 'sm' ? 'sm' : 'md'}
            onClick={onAction}
            className="shadow-lg shadow-[#FFC21A]/20"
          >
            <span>{finalActionText}</span>
            {actionIcon}
          </BoosButton>
        </div>
      )}
    </div>
  );
};
