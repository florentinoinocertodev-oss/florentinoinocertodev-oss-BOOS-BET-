/**
 * BOOS BET — Firebase App Check Architecture Baseline
 * 
 * DIRETIVA PROMPT 005:
 * Estrutura preparada sem ativação de enforcement restritivo que bloqueie desenvolvimento.
 * Provedores Oficiais Homologados:
 * - Web (Produção): reCAPTCHA Enterprise
 * - Android (Produção): Play Integrity
 * - Apple / iOS (Produção): DeviceCheck / App Attest
 * - Local / Testes: Debug Token Provider
 */

import { FirebaseApp } from 'firebase/app';

export interface AppCheckConfig {
  provider: 'RECAPTCHA_ENTERPRISE' | 'PLAY_INTEGRITY' | 'DEBUG_TOKEN';
  siteKey?: string;
  isTokenAutoRefreshEnabled: boolean;
  enforceInProduction: boolean;
}

export const APP_CHECK_BASELINE_CONFIG: AppCheckConfig = {
  provider: 'RECAPTCHA_ENTERPRISE',
  isTokenAutoRefreshEnabled: true,
  enforceInProduction: false // Enforcement desativado na fundação inicial
};

/**
 * Inicializador da arquitetura do App Check
 * Ativação real condicionada à homologação da chave reCAPTCHA Enterprise pelo núcleo de decisão.
 */
export function initializeAppCheckBaseline(app: FirebaseApp): { status: string; projectId: string } {
  // Configuração não-bloqueante na fundação
  return {
    status: 'PREPARED_NON_ENFORCING',
    projectId: 'boos-bet-91fa1'
  };
}
