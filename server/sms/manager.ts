import { ISmsProvider, SmsProviderConfig, SmsSendResult } from './types.js';
import { TwilioSmsAdapter } from './twilio.js';
import { InfobipSmsAdapter } from './infobip.js';
import { AfricasTalkingSmsAdapter } from './africastalking.js';
import { GenericHttpSmsAdapter } from './generic.js';

export class SmsGatewayManager {
  private activeProviderType: string = 'infobip';
  private twilioAdapter: TwilioSmsAdapter;
  private infobipAdapter: InfobipSmsAdapter;
  private atAdapter: AfricasTalkingSmsAdapter;
  private genericAdapter: GenericHttpSmsAdapter;
  private recentDispatches: Array<{
    timestamp: string;
    phoneE164: string;
    provider: string;
    status: string;
    messageId?: string;
    error?: string;
  }> = [];

  constructor() {
    this.twilioAdapter = new TwilioSmsAdapter();
    this.infobipAdapter = new InfobipSmsAdapter();
    this.atAdapter = new AfricasTalkingSmsAdapter();
    this.genericAdapter = new GenericHttpSmsAdapter();

    // Auto-detect which provider is configured from environment
    if (this.infobipAdapter.isConfigured()) {
      this.activeProviderType = 'infobip';
    } else if (this.twilioAdapter.isConfigured()) {
      this.activeProviderType = 'twilio';
    } else if (this.atAdapter.isConfigured()) {
      this.activeProviderType = 'africastalking';
    } else if (this.genericAdapter.isConfigured()) {
      this.activeProviderType = 'generic';
    } else {
      this.activeProviderType = 'unconfigured';
    }
  }

  getActiveProvider(): ISmsProvider | null {
    switch (this.activeProviderType) {
      case 'infobip':
        return this.infobipAdapter;
      case 'twilio':
        return this.twilioAdapter;
      case 'africastalking':
        return this.atAdapter;
      case 'generic':
        return this.genericAdapter;
      default:
        return null;
    }
  }

  isConfigured(): boolean {
    const provider = this.getActiveProvider();
    return provider ? provider.isConfigured() : false;
  }

  getStatus() {
    const provider = this.getActiveProvider();
    const isConf = this.isConfigured();

    return {
      activeProvider: this.activeProviderType,
      isConfigured: isConf,
      status: isConf ? ('READY' as const) : ('UNAVAILABLE' as const),
      providerName: provider ? provider.name : 'Nenhum Provedor Configurado',
      description: provider
        ? provider.getStatus().description
        : 'O servidor não possui chaves de API configuradas para envio de SMS. Configure as variáveis de ambiente ou atualize as credenciais no painel de gestão do Gateway.',
      supportedProviders: [
        { id: 'infobip', name: 'Infobip (Recomendado Angola - Unitel/Africell)', configured: this.infobipAdapter.isConfigured() },
        { id: 'twilio', name: 'Twilio Programmable SMS', configured: this.twilioAdapter.isConfigured() },
        { id: 'africastalking', name: "Africa's Talking Gateway", configured: this.atAdapter.isConfigured() },
        { id: 'generic', name: 'Gateway HTTP Personalizado / Unitel Direct', configured: this.genericAdapter.isConfigured() }
      ],
      recentDispatches: this.recentDispatches.slice(-10)
    };
  }

  updateConfig(config: SmsProviderConfig) {
    if (config.provider) {
      this.activeProviderType = config.provider;
    }

    if (config.twilio) {
      this.twilioAdapter = new TwilioSmsAdapter(config.twilio);
    }
    if (config.infobip) {
      this.infobipAdapter = new InfobipSmsAdapter(config.infobip);
    }
    if (config.africastalking) {
      this.atAdapter = new AfricasTalkingSmsAdapter(config.africastalking);
    }
    if (config.generic) {
      this.genericAdapter = new GenericHttpSmsAdapter(config.generic);
    }

    return this.getStatus();
  }

  async sendOtp(phoneE164: string, otpCode: string): Promise<SmsSendResult> {
    const message = `BOOS BET: O seu codigo de verificacao de acesso e ${otpCode}. Valido por 5 minutos. Nao partilhe este codigo com ninguem.`;

    const provider = this.getActiveProvider();
    if (!provider || !provider.isConfigured()) {
      const unavailResult: SmsSendResult = {
        success: false,
        status: 'UNAVAILABLE',
        error: 'O fornecedor de SMS não está configurado no servidor. Nenhuma mensagem fictícia foi simulada.',
        details: 'Para enviar SMS reais para números de Angola (+244), configure as credenciais do Infobip, Twilio ou AfricasTalking nas configurações do Gateway.'
      };

      this.recentDispatches.push({
        timestamp: new Date().toISOString(),
        phoneE164,
        provider: this.activeProviderType,
        status: 'UNAVAILABLE_BLOCKED',
        error: unavailResult.error
      });

      return unavailResult;
    }

    const result = await provider.sendOtp(phoneE164, message);
    this.recentDispatches.push({
      timestamp: new Date().toISOString(),
      phoneE164,
      provider: provider.id,
      status: result.status,
      messageId: result.providerMessageId,
      error: result.error
    });

    return result;
  }
}

export const smsGateway = new SmsGatewayManager();
