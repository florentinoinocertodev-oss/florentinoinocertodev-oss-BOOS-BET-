import React, { useState, useEffect } from 'react';
import { PrivateIdentity, SecurityEvent } from '../types';
import { apiClient } from '../services/api';
import { BoosButton } from './brand/BoosButton';
import {
  ShieldCheck,
  Mail,
  Smartphone,
  Lock,
  History,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  KeyRound
} from 'lucide-react';

interface SecuritySectionProps {
  privateIdentity: PrivateIdentity;
  onIdentityUpdated: (identity: PrivateIdentity) => void;
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  privateIdentity,
  onIdentityUpdated
}) => {
  const [emailInput, setEmailInput] = useState(privateIdentity.email || '');
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState('');
  const [emailError, setEmailError] = useState('');

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const res = await apiClient.getSecurityEvents();
      setEvents(res.events);
    } catch (e) {
      console.error('Erro ao carregar logs de segurança:', e);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleLinkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');

    if (!emailInput || !emailInput.includes('@')) {
      setEmailError('Introduza um endereço de e-mail válido.');
      return;
    }

    setSavingEmail(true);
    try {
      const res = await apiClient.linkEmail(emailInput);
      onIdentityUpdated(res.privateIdentity);
      setEmailSuccess('E-mail associado com sucesso para segurança e recuperação de conta.');
      await fetchEvents();
    } catch (err: any) {
      setEmailError(err.message || 'Falha ao associar e-mail.');
    } finally {
      setSavingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="p-6 bg-[#001426] border border-[#06345A] rounded-3xl shadow-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-[#FFC21A] uppercase tracking-wider mb-2 font-mono">
          <ShieldCheck className="w-4 h-4 text-[#F5A900]" />
          Segurança da Conta & Recuperação
        </div>
        <h2 className="text-xl font-bold text-white font-display">
          Identificadores de Acesso & Métodos de Autenticação
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-xl">
          O número de telemóvel é o seu identificador principal de login via SMS OTP. O e-mail é opcional e serve exclusivamente para recuperação e segurança reforçada.
        </p>
      </div>

      {/* Grid: Primary Auth vs Secondary Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary Identifier: Phone */}
        <div className="p-6 bg-[#001426] border border-[#06345A] rounded-3xl space-y-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#06345A]">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white font-display">
                Identificador Principal (Telemóvel)
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
              ATIVO & VERIFICADO
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            O seu número de telemóvel autentica as suas sessões através de OTP criptográfico gerado pelo servidor e enviado por SMS.
          </p>

          <div className="p-3 bg-[#06345A]/40 rounded-xl border border-[#0d4a7c] flex items-center justify-between">
            <span className="text-xs text-slate-300">Método de Login:</span>
            <span className="text-xs font-bold text-white font-mono">
              Telemóvel + OTP (Angola +244)
            </span>
          </div>

          <div className="p-3 bg-[#06345A]/20 rounded-xl border border-[#06345A] text-[11px] text-slate-300 flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-[#FFC21A] shrink-0" />
            <span>O seu número de telefone NUNCA é visível a outros jogadores.</span>
          </div>
        </div>

        {/* Secondary Attribute: Email */}
        <div className="p-6 bg-[#001426] border border-[#06345A] rounded-3xl space-y-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#06345A]">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#FFC21A]" />
              <h3 className="text-sm font-bold text-white font-display">
                E-mail Secundário (Opcional)
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#06345A] text-slate-300 border border-[#0d4a7c] font-bold">
              {privateIdentity.email ? 'ASSOCIADO' : 'NÃO CONFIGURADO'}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Adicione um endereço de e-mail para receber comprovativos de apostas, notificações de segurança e recuperação de conta.
          </p>

          {emailSuccess && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              {emailSuccess}
            </div>
          )}

          {emailError && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              {emailError}
            </div>
          )}

          <form onSubmit={handleLinkEmail} className="space-y-3">
            <div>
              <label className="block text-[11px] text-slate-300 mb-1 font-semibold">
                Endereço de E-mail
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full px-3 py-2 bg-[#06345A]/50 border border-[#0d4a7c] rounded-xl text-xs text-white outline-none focus:border-[#F5A900] font-mono"
              />
            </div>

            <BoosButton
              type="submit"
              variant="primary"
              size="sm"
              fullWidth
              disabled={savingEmail}
            >
              {savingEmail ? 'A Guardar...' : privateIdentity.email ? 'Atualizar E-mail' : 'Associar E-mail'}
            </BoosButton>
          </form>
        </div>
      </div>

      {/* Security Audit Events */}
      <div className="p-6 bg-[#001426] border border-[#06345A] rounded-3xl space-y-4 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Registo de Auditoria de Segurança (Audit Log)
            </h3>
          </div>
          <button
            type="button"
            onClick={fetchEvents}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar
          </button>
        </div>

        {loadingEvents ? (
          <div className="py-6 text-center text-slate-500 text-xs">
            A carregar eventos de segurança...
          </div>
        ) : events.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs">
            Nenhum evento de segurança registado para esta conta.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Data e Hora</th>
                  <th className="py-2.5 px-3">Evento</th>
                  <th className="py-2.5 px-3">Detalhes</th>
                  <th className="py-2.5 px-3 text-right">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                {events.map(ev => (
                  <tr key={ev.id} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-slate-400 whitespace-nowrap">
                      {new Date(ev.created_at).toLocaleString('pt-AO')}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 text-[10px]">
                        {ev.event_type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-300 font-sans text-xs">
                      {ev.details}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400">
                      {ev.ip}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
