import { ISmsProvider, SmsSendResult } from './types.js';

export class AfricasTalkingSmsAdapter implements ISmsProvider {
  readonly id = 'africastalking';
  readonly name = "Africa's Talking SMS Gateway";

  private apiKey: string;
  private username: string;
  private senderId: string;

  constructor(config?: { apiKey?: string; username?: string; senderId?: string }) {
    this.apiKey = config?.apiKey || process.env.AT_API_KEY || '';
    this.username = config?.username || process.env.AT_USERNAME || '';
    this.senderId = config?.senderId || process.env.AT_SENDER_ID || '';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.username);
  }

  getStatus() {
    const configured = this.isConfigured();
    return {
      providerId: this.id,
      name: this.name,
      isConfigured: configured,
      status: configured ? ('READY' as const) : ('UNAVAILABLE' as const),
      description: configured
        ? `Africa's Talking configurado para o utilizador ${this.username}`
        : "Credenciais Africa's Talking não configuradas (AT_API_KEY, AT_USERNAME)."
    };
  }

  async sendOtp(phoneE164: string, message: string): Promise<SmsSendResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        status: 'UNAVAILABLE',
        error: "Africa's Talking não configurado. Por favor forneça a chave de API e utilizador."
      };
    }

    try {
      const url = 'https://api.africastalking.com/version1/messaging';
      const params = new URLSearchParams();
      params.append('username', this.username);
      params.append('to', phoneE164);
      params.append('message', message);
      if (this.senderId) {
        params.append('from', this.senderId);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'apiKey': this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: params.toString()
      });

      const data = await response.json() as any;

      if (!response.ok) {
        return {
          success: false,
          status: 'FAILED',
          error: data.ErrorMessage || `Africa's Talking HTTP ${response.status}`,
          details: JSON.stringify(data)
        };
      }

      const recipient = data.SMSMessageData?.Recipients?.[0];
      if (recipient && recipient.status !== 'Success') {
        return {
          success: false,
          status: 'FAILED',
          error: recipient.status,
          providerMessageId: recipient.messageId
        };
      }

      return {
        success: true,
        status: 'DELIVERED',
        providerMessageId: recipient?.messageId
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'FAILED',
        error: err.message || "Falha na comunicação com o gateway Africa's Talking."
      };
    }
  }
}
