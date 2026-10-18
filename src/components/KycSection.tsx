import React, { useState } from 'react';
import { PrivateIdentity, KycVerification, KycStatus, DocType } from '../types';
import { apiClient } from '../services/api';
import { BoosButton } from './brand/BoosButton';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Upload,
  UserCheck,
  Lock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface KycSectionProps {
  privateIdentity: PrivateIdentity;
  kyc: KycVerification;
  onKycUpdated: (identity: PrivateIdentity, kyc: KycVerification) => void;
}

export const KycSection: React.FC<KycSectionProps> = ({
  privateIdentity,
  kyc,
  onKycUpdated
}) => {
  const [fullName, setFullName] = useState(privateIdentity.full_legal_name || '');
  const [dob, setDob] = useState(privateIdentity.date_of_birth || '');
  const [docType, setDocType] = useState<DocType>(privateIdentity.doc_type || 'BI_ANGOLA');
  const [docNumber, setDocNumber] = useState(privateIdentity.doc_number || '');
  const [frontDocName, setFrontDocName] = useState(kyc.doc_front_name || '');
  const [backDocName, setBackDocName] = useState(kyc.doc_back_name || '');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const getStatusBadge = (status: KycStatus) => {
    switch (status) {
      case 'VERIFIED':
        return {
          label: 'IDENTIDADE VERIFICADA (KYC APROVADO)',
          color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          icon: <CheckCircle className="w-4 h-4 text-emerald-400" />
        };
      case 'PENDING':
        return {
          label: 'EM ANÁLISE DE CONFORMIDADE',
          color: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          icon: <Clock className="w-4 h-4 text-amber-400" />
        };
      case 'REJECTED':
        return {
          label: 'DOCUMENTAÇÃO REJEITADA',
          color: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          icon: <XCircle className="w-4 h-4 text-rose-400" />
        };
      case 'REQUIRES_REVIEW':
        return {
          label: 'REQUER REVISÃO ADICIONAL',
          color: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
          icon: <AlertTriangle className="w-4 h-4 text-purple-400" />
        };
      case 'NOT_STARTED':
      default:
        return {
          label: 'NÃO INICIADO',
          color: 'bg-slate-800 border-slate-700 text-slate-400',
          icon: <FileText className="w-4 h-4 text-slate-400" />
        };
    }
  };

  const badge = getStatusBadge(kyc.status);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!fullName.trim() || fullName.trim().split(' ').length < 2) {
      setError('Por favor introduza o nome legal completo (pelo menos nome e apelido).');
      return;
    }

    if (!dob) {
      setError('Data de nascimento é obrigatória.');
      return;
    }

    if (!docNumber.trim()) {
      setError('Número de documento é obrigatório.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.submitKyc({
        full_legal_name: fullName,
        date_of_birth: dob,
        doc_type: docType,
        doc_number: docNumber,
        doc_front_name: frontDocName || 'bi_angola_frente.pdf',
        doc_back_name: backDocName || 'bi_angola_verso.pdf'
      });

      setSuccessMsg(res.message);
      onKycUpdated(res.privateIdentity, res.kyc);
    } catch (err: any) {
      setError(err.message || 'Erro ao submeter verificação de identidade.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Separation of Identity Architecture */}
      <div className="p-6 bg-[#001426] border border-[#06345A] rounded-3xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#06345A]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#FFC21A] uppercase tracking-wider font-mono">
                Área de Conformidade Regulatória
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-[#06345A] text-slate-200 border border-[#0d4a7c] font-mono">
                ISJ Angola Reg. 2026
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1 font-display">
              Verificação de Identidade (KYC Privado)
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Arquitetura de Privacidade Estrita: Os seus dados legais e B.I. são encriptados e nunca serão visíveis para terceiros ou em qualquer área pública da plataforma.
            </p>
          </div>

          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 text-xs font-semibold shrink-0 ${badge.color}`}>
            {badge.icon}
            <span>{badge.label}</span>
          </div>
        </div>

        {/* Sensitive Operations Eligibility Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-1">
          <div className="p-3 bg-[#06345A]/30 rounded-2xl border border-[#0d4a7c]">
            <span className="text-[11px] text-slate-300 block mb-1">Navegação & Exploração</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Autorizado (Conta Ativa)</span>
            </div>
          </div>

          <div className="p-3 bg-[#06345A]/30 rounded-2xl border border-[#0d4a7c]">
            <span className="text-[11px] text-slate-300 block mb-1">Apostas Desportivas</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Autorizado (Nível Básico)</span>
            </div>
          </div>

          <div className={`p-3 rounded-2xl border transition-all ${
            kyc.status === 'VERIFIED'
              ? 'bg-emerald-950/30 border-emerald-700/60'
              : 'bg-amber-950/30 border-amber-700/60'
          }`}>
            <span className="text-[11px] text-slate-300 block mb-1">Levantamentos Bancários</span>
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {kyc.status === 'VERIFIED' ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Totalmente Habilitado</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-[#FFC21A]" />
                  <span className="text-[#FFC21A]">Requer KYC Aprovado</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KYC Form & Document Upload */}
      <div className="p-6 bg-[#001426] border border-[#06345A] rounded-3xl shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FFC21A]" />
            <h3 className="text-base font-bold text-white font-display">
              Dados da Identidade Privada
            </h3>
          </div>
          {kyc.status === 'VERIFIED' && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Identidade Validada Oficialmente
            </span>
          )}
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            {successMsg}
          </div>
        )}

        {kyc.reviewer_notes && (
          <div className="p-3 mb-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 text-xs">
            <span className="font-semibold text-slate-200">Nota do Oficial de Conformidade: </span>
            {kyc.reviewer_notes}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nome Legal Completo (Conforme Documento)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                disabled={kyc.status === 'VERIFIED'}
                placeholder="Ex: Manuel António da Silva"
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-amber-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Data de Nascimento (Idade $\ge$ 18 anos)
              </label>
              <input
                type="date"
                value={dob}
                onChange={e => setDob(e.target.value)}
                disabled={kyc.status === 'VERIFIED'}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-100 outline-none focus:border-amber-500 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Tipo de Documento de Identificação
              </label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value as DocType)}
                disabled={kyc.status === 'VERIFIED'}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 outline-none focus:border-amber-500 disabled:opacity-60"
              >
                <option value="BI_ANGOLA">Bilhete de Identidade Nacional (B.I. Angola)</option>
                <option value="PASSAPORTE">Passaporte Internacional</option>
                <option value="CARTA_CONDUCAO">Carta de Condução de Angola</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Número do Documento
              </label>
              <input
                type="text"
                value={docNumber}
                onChange={e => setDocNumber(e.target.value)}
                disabled={kyc.status === 'VERIFIED'}
                placeholder="Ex: 004829104LA042"
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-amber-500 uppercase font-mono disabled:opacity-60"
              />
            </div>
          </div>

          {/* Document Attachment Upload Simulation */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Cópias Digitais do Documento (Frente e Verso)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/40 text-center hover:border-slate-600 transition-colors">
                <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                <span className="text-xs font-medium text-slate-200 block">Frente do B.I. / Documento</span>
                <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                  {frontDocName || 'Nenhum ficheiro selecionado (PDF/JPG)'}
                </span>
                {kyc.status !== 'VERIFIED' && (
                  <button
                    type="button"
                    onClick={() => setFrontDocName(`bi_frente_${Date.now().toString().slice(-4)}.jpg`)}
                    className="mt-2 text-[11px] text-amber-400 hover:underline"
                  >
                    Anexar Frente
                  </button>
                )}
              </div>

              <div className="p-4 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/40 text-center hover:border-slate-600 transition-colors">
                <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                <span className="text-xs font-medium text-slate-200 block">Verso do B.I. / Documento</span>
                <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
                  {backDocName || 'Nenhum ficheiro selecionado (PDF/JPG)'}
                </span>
                {kyc.status !== 'VERIFIED' && (
                  <button
                    type="button"
                    onClick={() => setBackDocName(`bi_verso_${Date.now().toString().slice(-4)}.jpg`)}
                    className="mt-2 text-[11px] text-amber-400 hover:underline"
                  >
                    Anexar Verso
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-slate-400">
              Os dados são validados pelo departamento de conformidade antes de conceder o estatuto de <strong className="text-slate-300">VERIFIED</strong>.
            </p>

            {kyc.status !== 'VERIFIED' && (
              <BoosButton
                type="submit"
                variant="primary"
                size="md"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    A submeter...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Submeter para Validação
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </BoosButton>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
