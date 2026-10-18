import { ISmsProvider, SmsSendResult } from './types.js';

export class InfobipSmsAdapter implements ISmsProvider {
  readonly id = 'infobip';
  readonly name = 'Infobip Global SMS Gateway (Angola Unitel/Africell Direct Route)';

  private apiKey: string;
  private baseUrl: string;
  private senderId: string;

  constructor(config?: { apiKey?: string; baseUrl?: string; senderId?: string }) {
    this.apiKey = config?.apiKey || process.env.INFOBIP_API_KEY || '';
    this.baseUrl = config?.baseUrl || process.env.INFOBIP_BASE_URL || '';
    this.senderId = config?.senderId || process.env.INFOBIP_SENDER_ID || 'BOOSBET';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.baseUrl);
  }

  getStatus() {
    const configured = this.isConfigured();
    return {
      providerId: this.id,
      name: this.name,
      isConfigured: configured,
      status: configured ? ('READY' as const) : ('UNAVAILABLE' as const),
      description: configured
        ? `Infobip configurado com host ${this.baseUrl} e remetente ${this.senderId}`
        : 'Credenciais Infobip não configuradas (INFOBIP_API_KEY, INFOBIP_BASE_URL).'
    };
  }

  async sendOtp(phoneE164: string, message: string): Promise<SmsSendResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        status: 'UNAVAILABLE',
        error: 'Infobip não configurado. Por favor forneça a chave de API e URL base.'
      };
    }

    try {
      // Normalize baseUrl to remove trailing slashes or protocols
      let cleanBase = this.baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const url = `https://${cleanBase}/sms/2/text/advanced`;

      const payload = {
        messages: [
          {
            destinations: [{ to: phoneE164 }],
            from: this.senderId,
            text: message
          }
        ]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `App ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json() as any;

      if (!response.ok) {
        return {
          success: false,
          status: 'FAILED',
          error: data.requestError?.serviceException?.text || `Infobip HTTP ${response.status}`,
          details: JSON.stringify(data)
        };
      }

      const msgStatus = data.messages?.[0]?.status?.groupName;
      const msgId = data.messages?.[0]?.messageId;

      if (msgStatus === 'REJECTED' || msgStatus === 'FAILED') {
        return {
          success: false,
          status: 'FAILED',
          error: data.messages?.[0]?.status?.description || 'SMS rejeitado pela operadora móvel',
          providerMessageId: msgId
        };
      }

      return {
        success: true,
        status: 'DELIVERED',
        providerMessageId: msgId
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'FAILED',
        error: err.message || 'Falha na comunicação com o gateway Infobip.'
      };
    }
  }
}
