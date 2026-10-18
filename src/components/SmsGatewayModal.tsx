import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { BoosButton } from './brand/BoosButton';
import {
  Server,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Smartphone,
  RefreshCw,
  Send,
  X,
  ExternalLink,
  Sliders
} from 'lucide-react';

interface SmsGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export const SmsGatewayModal: React.FC<SmsGatewayModalProps> = ({
  isOpen,
  onClose,
  onStatusUpdated
}) => {
  const [gatewayData, setGatewayData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState('923456789');
  const [testResult, setTestResult] = useState<any>(null);

  // Form State
  const [selectedProvider, setSelectedProvider] = useState<'infobip' | 'twilio' | 'africastalking' | 'generic'>('infobip');
  const [infobipKey, setInfobipKey] = useState('');
  const [infobipBaseUrl, setInfobipBaseUrl] = useState('');
  const [infobipSenderId, setInfobipSenderId] = useState('BOOSBET');

  const [twilioSid, setTwilioSid] = useState('');
  const [twilioToken, setTwilioToken] = useState('');
  const [twilioFrom, setTwilioFrom] = useState('');

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getSmsGatewayStatus();
      setGatewayData(data);
    } catch (e) {
      console.error('Erro ao buscar status do gateway SMS:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        provider: selectedProvider
      };

      if (selectedProvider === 'infobip') {
        payload.infobip = {
          apiKey: infobipKey,
          baseUrl: infobipBaseUrl,
          senderId: infobipSenderId
        };
      } else if (selectedProvider === 'twilio') {
        payload.twilio = {
          accountSid: twilioSid,
          authToken: twilioToken,
          fromNumber: twilioFrom
        };
      }

      await apiClient.updateSmsConfig(payload);
      await fetchStatus();
      if (onStatusUpdated) onStatusUpdated();
    } catch (err: any) {
      alert(err.message || 'Erro ao guardar configurações.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestDispatch = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiClient.testSmsDispatch(testPhone, '+244');
      setTestResult(res);
      await fetchStatus();
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl bg-[#001426] border border-[#06345A] rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#06345A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFC21A]/10 border border-[#FFC21A]/30 text-[#FFC21A] flex items-center justify-center">
              <Server className="w-5 h-5 text-[#F5A900]" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">
                Arquitetura Real de Gateway SMS (Angola +244)
              </h3>
              <p className="text-xs text-slate-300">
                Gestão e auditoria dos adaptadores de entrega de OTP para produção.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#06345A] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
            A carregar estado do gateway...
          </div>
        ) : (
          <div className="space-y-6 pt-5">
            {/* Status Card */}
            <div className={`p-4 rounded-2xl border ${
              gatewayData?.status === 'READY'
                ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                : gatewayData?.status === 'TEST_MODE'
                ? 'bg-blue-950/30 border-blue-800/80 text-blue-200'
                : 'bg-rose-950/30 border-rose-800/80 text-rose-200'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  {gatewayData?.status === 'READY' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : gatewayData?.status === 'TEST_MODE' ? (
                    <Sliders className="w-5 h-5 text-blue-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider">
                      Estado Atual: {gatewayData?.status}
                    </div>
                    <div className="text-sm font-semibold text-slate-100 mt-0.5">
                      {gatewayData?.providerName}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900/60 text-slate-300 border border-slate-700">
                  {gatewayData?.isConfigured ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}
                </span>
              </div>
              <p className="text-xs mt-2.5 text-slate-300 leading-relaxed">
                {gatewayData?.description}
              </p>
            </div>

            {/* Provider Switcher Tabs */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Selecionar Provedor de SMS
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'infobip', label: 'Infobip (Angola)', rec: true },
                  { id: 'twilio', label: 'Twilio SMS' },
                  { id: 'africastalking', label: "Africa's Talking" },
                  { id: 'generic', label: 'Gateway HTTP' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProvider(p.id as any)}
                    className={`py-2 px-3 rounded-xl border text-xs font-medium text-left transition-all ${
                      selectedProvider === p.id
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold">{p.label}</div>
                    {p.rec && <span className="text-[10px] text-amber-400">Recomendado</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Config Fields */}
            <form onSubmit={handleSaveConfig} className="p-4 bg-slate-800/50 rounded-2xl border border-slate-800 space-y-4">
              {selectedProvider === 'infobip' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">
                      Credenciais Infobip Global
                    </span>
                    <a
                      href="https://portal.infobip.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-amber-400 hover:underline inline-flex items-center gap-1"
                    >
                      Infobip Portal <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Chave de API (API Key)
                    </label>
                    <input
                      type="password"
                      value={infobipKey}
                      onChange={e => setInfobipKey(e.target.value)}
                      placeholder="Ex: c7849f2b1897d8..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      URL Base da API (Host Dedicado)
                    </label>
                    <input
                      type="text"
                      value={infobipBaseUrl}
                      onChange={e => setInfobipBaseUrl(e.target.value)}
                      placeholder="Ex: 8y194m.api.infobip.com"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Remetente (Sender ID)
                    </label>
                    <input
                      type="text"
                      value={infobipSenderId}
                      onChange={e => setInfobipSenderId(e.target.value)}
                      placeholder="BOOSBET"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {selectedProvider === 'twilio' && (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-200 block">
                    Credenciais Twilio REST API
                  </span>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Account SID
                    </label>
                    <input
                      type="text"
                      value={twilioSid}
                      onChange={e => setTwilioSid(e.target.value)}
                      placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Auth Token
                    </label>
                    <input
                      type="password"
                      value={twilioToken}
                      onChange={e => setTwilioToken(e.target.value)}
                      placeholder="Token secreto de autenticação"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Número de Origem (From Number / Sender)
                    </label>
                    <input
                      type="text"
                      value={twilioFrom}
                      onChange={e => setTwilioFrom(e.target.value)}
                      placeholder="+1XXXXXXXXXX ou BOOSBET"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 font-mono outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <BoosButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={saving}
                >
                  {saving ? 'A Guardar...' : 'Guardar e Aplicar ao Servidor'}
                </BoosButton>
              </div>
            </form>

            {/* Test Phone Dispatch Section */}
            <div className="p-4 bg-[#06345A]/30 rounded-2xl border border-[#0d4a7c] space-y-3">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
                <Smartphone className="w-4 h-4 text-[#FFC21A]" />
                Testar Envio Real para Número de Angola (+244)
              </span>

              <div className="flex gap-2">
                <div className="px-3 py-2 bg-[#001426] border border-[#06345A] rounded-xl text-xs font-mono text-[#FFC21A] flex items-center font-bold">
                  +244
                </div>
                <input
                  type="tel"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  placeholder="9XXXXXXXX"
                  className="flex-1 px-3 py-2 bg-[#001426] border border-[#06345A] rounded-xl text-xs text-white font-mono outline-none focus:border-[#F5A900]"
                />
                <BoosButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleTestDispatch}
                  disabled={testing}
                  icon={testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                >
                  Disparar Teste
                </BoosButton>
              </div>

              {testResult && (
                <div className={`p-3 rounded-xl border text-xs font-mono ${
                  testResult.success
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800 text-rose-300'
                }`}>
                  <div className="font-bold mb-1">
                    {testResult.success ? '✓ Resposta do Provedor: SUCESSO' : '✗ Falha no Disparo'}
                  </div>
                  <div>Status: {testResult.status}</div>
                  {testResult.providerMessageId && (
                    <div>Message ID: {testResult.providerMessageId}</div>
                  )}
                  {testResult.error && (
                    <div className="text-rose-400">Erro: {testResult.error}</div>
                  )}
                  {testResult.details && (
                    <div className="text-[11px] text-slate-400 mt-1">{testResult.details}</div>
                  )}
                </div>
              )}
            </div>

            {/* Recent Dispatches Audit Table */}
            {gatewayData?.recentDispatches && gatewayData.recentDispatches.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Últimos Disparos Registados
                </span>
                <div className="border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Data/Hora</th>
                        <th className="py-2 px-3">Destino</th>
                        <th className="py-2 px-3">Provedor</th>
                        <th className="py-2 px-3">Resultado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
                      {gatewayData.recentDispatches.map((d: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          <td className="py-2 px-3 text-slate-400">
                            {new Date(d.timestamp).toLocaleTimeString('pt-AO')}
                          </td>
                          <td className="py-2 px-3">{d.phoneE164}</td>
                          <td className="py-2 px-3 uppercase text-slate-400">{d.provider}</td>
                          <td className="py-2 px-3">
                            <span className={d.status === 'DELIVERED' || d.status === 'TEST_MODE_LOGGED' ? 'text-emerald-400' : 'text-rose-400'}>
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
