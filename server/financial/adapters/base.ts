/**
 * BOOS BET — Adaptadores Base de Provedores de Pagamento (FIN-004.1)
 * Princípio: No evidence, no compliance claim.
 * 
 * Regra Obrigatória: Provedores sem credenciais formais ou documentação verificável
 * devem permanecer estritamente NÃO CONFIGURADOS ou INDISPONÍVEIS.
 * Proibida a geração de códigos Pix falsos ou referências bancárias simuladas.
 */

import {
  PaymentProviderAdapter,
  ProviderConfigurationStatus,
  ProviderCapabilities,
  DepositInitiateIntent,
  DepositInitiationResult,
  WithdrawalInitiateIntent,
  WithdrawalInitiationResult,
  WebhookVerificationResult
} from '../types.js';

export class UnconfiguredProviderAdapter implements PaymentProviderAdapter {
  readonly providerId: string;
  readonly name: string;
  readonly capabilities: ProviderCapabilities;

  constructor(providerId: string, name: string) {
    this.providerId = providerId;
    this.name = name;
    this.capabilities = {
      supportsDeposits: true,
      supportsWithdrawals: true,
      supportsWebhooks: true,
      requiresMtls: true,
      currenciesSupported: ['AOA']
    };
  }

  getStatus(): ProviderConfigurationStatus {
    return 'UNCONFIGURED';
  }

  isConfigured(): boolean {
    return false;
  }

  async initiateDeposit(_intent: DepositInitiateIntent): Promise<DepositInitiationResult> {
    return {
      success: false,
      transactionId: '',
      providerStatus: 'UNAVAILABLE',
      instructions: `O método de pagamento ${this.name} encontra-se temporariamente indisponível. A integração bancária formal encontra-se em fase de homologação regulatória. Por favor, utilize um canal de pagamento homologado.`
    };
  }

  async initiateWithdrawal(_intent: WithdrawalInitiateIntent): Promise<WithdrawalInitiationResult> {
    return {
      success: false,
      transactionId: '',
      providerStatus: 'UNAVAILABLE',
      instructions: `O canal de levantamento via ${this.name} encontra-se indisponível no momento. A liquidação bancária automatizada exige homologação ativa do prestador.`
    };
  }

  async verifyWebhook(_rawBody: string | Buffer, _headers: Record<string, string>): Promise<WebhookVerificationResult> {
    return {
      isValid: false,
      errorCode: 'PROVIDER_NOT_CONFIGURED',
      rawPayload: null
    };
  }
}
