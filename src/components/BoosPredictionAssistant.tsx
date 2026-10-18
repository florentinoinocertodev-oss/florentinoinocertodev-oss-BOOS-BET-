import React from 'react';
import { BoosAiPredictionsChatbot } from './brand/BoosAiPredictionsChatbot';
import { SessionData, SportMatch, BetSelection } from '../types';

export interface BoosPredictionAssistantProps {
  session: SessionData | null;
  onOpenAuth: () => void;
  onOpenWallet: () => void;
  onToggleSelection: (match: SportMatch, type: 'HOME' | 'DRAW' | 'AWAY', odd: number) => void;
  onGoToBettingZone: (matchId?: string) => void;
  selections: BetSelection[];
  onOpenBetSlip?: () => void;
  className?: string;
}

/**
 * BoosPredictionAssistant
 * 
 * Component featuring a chat-like interface where users can select a sports team (Girabola ZAP or European clubs),
 * and the AI returns statistical probabilities (Win/Draw/Loss, xG, Over 2.5, BTTS) and deep tactical analysis.
 * Implements a 'Free' vs 'Paid' model tracking based on the user's account state (1 free analysis for new users,
 * subsequent analyses deducted from wallet balance with clear responsible gaming disclaimers).
 */
export const BoosPredictionAssistant: React.FC<BoosPredictionAssistantProps> = (props) => {
  return <BoosAiPredictionsChatbot {...props} />;
};

export { BoosWinProbabilityGauge } from './brand/BoosWinProbabilityGauge';
export default BoosPredictionAssistant;

