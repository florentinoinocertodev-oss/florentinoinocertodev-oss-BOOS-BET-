import { ISmsProvider, SmsSendResult } from './types.js';

export class GenericHttpSmsAdapter implements ISmsProvider {
  readonly id = 'generic';
  readonly name = 'Gateway SMS HTTP / Unitel Direct Integration';

  private endpointUrl: string;
  private authHeader: string;
  private senderId: string;

  constructor(config?: { endpointUrl?: string; authHeader?: string; senderId?: string }) {
    this.endpointUrl = config?.endpointUrl || process.env.SMS_GATEWAY_URL || '';
    this.authHeader = config?.authHeader || process.env.SMS_GATEWAY_AUTH || '';
    this.senderId = config?.senderId || process.env.SMS_SENDER_ID || 'BOOSBET';
  }

  isConfigured(): boolean {
    return Boolean(this.endpointUrl);
  }

  getStatus() {
    const configured = this.isConfigured();
    return {
      providerId: this.id,
      name: this.name,
      isConfigured: configured,
      status: configured ? ('READY' as const) : ('UNAVAILABLE' as const),
      description: configured
        ? `Gateway HTTP configurado no endpoint ${this.endpointUrl}`
        : 'Endpoint SMS HTTP não configurado (SMS_GATEWAY_URL).'
    };
  }

  async sendOtp(phoneE164: string, message: string): Promise<SmsSendResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        status: 'UNAVAILABLE',
        error: 'Gateway SMS HTTP não configurado.'
      };
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (this.authHeader) {
        headers['Authorization'] = this.authHeader;
      }

      const response = await fetch(this.endpointUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          to: phoneE164,
          from: this.senderId,
          text: message
        })
      });

      const data = await response.json() as any;

      if (!response.ok) {
        return {
          success: false,
          status: 'FAILED',
          error: data.message || `Gateway HTTP retornou código ${response.status}`
        };
      }

      return {
        success: true,
        status: 'DELIVERED',
        providerMessageId: data.id || data.messageId
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'FAILED',
        error: err.message || 'Falha na comunicação com o gateway SMS HTTP.'
      };
    }
  }
}
