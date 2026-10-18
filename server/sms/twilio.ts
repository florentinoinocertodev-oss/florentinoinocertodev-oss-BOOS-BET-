import { ISmsProvider, SmsSendResult } from './types.js';

export class TwilioSmsAdapter implements ISmsProvider {
  readonly id = 'twilio';
  readonly name = 'Twilio SMS Gateway';

  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor(config?: { accountSid?: string; authToken?: string; fromNumber?: string }) {
    this.accountSid = config?.accountSid || process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = config?.authToken || process.env.TWILIO_AUTH_TOKEN || '';
    this.fromNumber = config?.fromNumber || process.env.TWILIO_FROM_NUMBER || '';
  }

  isConfigured(): boolean {
    return Boolean(this.accountSid && this.authToken && this.fromNumber);
  }

  getStatus() {
    const configured = this.isConfigured();
    return {
      providerId: this.id,
      name: this.name,
      isConfigured: configured,
      status: configured ? ('READY' as const) : ('UNAVAILABLE' as const),
      description: configured
        ? `Twilio configurado com SID ${this.accountSid.slice(0, 6)}... e remetente ${this.fromNumber}`
        : 'Credenciais Twilio não configuradas (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER).'
    };
  }

  async sendOtp(phoneE164: string, message: string): Promise<SmsSendResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        status: 'UNAVAILABLE',
        error: 'Twilio não configurado. Por favor configure as credenciais no servidor.'
      };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const authHeader = 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const params = new URLSearchParams();
      params.append('To', phoneE164);
      params.append('From', this.fromNumber);
      params.append('Body', message);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      const data = await response.json() as any;

      if (!response.ok) {
        return {
          success: false,
          status: 'FAILED',
          error: data.message || `Twilio HTTP ${response.status}`,
          details: JSON.stringify(data)
        };
      }

      return {
        success: true,
        status: 'DELIVERED',
        providerMessageId: data.sid
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'FAILED',
        error: err.message || 'Falha na comunicação de rede com o serviço Twilio.'
      };
    }
  }
}
