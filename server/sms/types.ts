export interface SmsSendResult {
  success: boolean;
  status: 'DELIVERED' | 'FAILED' | 'UNAVAILABLE' | 'TEST_MODE' | 'DIRECT_VERIFICATION';
  providerMessageId?: string;
  error?: string;
  details?: string;
}

export interface SmsProviderConfig {
  provider: 'infobip' | 'twilio' | 'africastalking' | 'generic';
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
  infobip?: {
    apiKey: string;
    baseUrl: string;
    senderId: string;
  };
  africastalking?: {
    apiKey: string;
    username: string;
    senderId: string;
  };
  generic?: {
    endpointUrl: string;
    authorizationHeader: string;
    senderId: string;
  };
}

export interface ISmsProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  sendOtp(phoneE164: string, message: string): Promise<SmsSendResult>;
  getStatus(): {
    providerId: string;
    name: string;
    isConfigured: boolean;
    status: 'READY' | 'UNAVAILABLE' | 'TEST_MODE';
    description: string;
  };
}
