import React, { useState, useEffect, useMemo } from 'react';
import { Wallet, KycStatus, PaymentProviderType } from '../types';
import { apiClient } from '../services/api';
import { BoosButton } from './brand/BoosButton';
import {
  Wallet as WalletIcon,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  Lock,
  X,
  CreditCard,
  Building2,
  RefreshCw,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  Zap,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  Clock,
  CheckCircle
} from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet;
  kycStatus: KycStatus;
  onWalletUpdated: (wallet: Wallet) => void;
  onGoToKyc: () => void;
}

// Renderizador visual de QR Code SVG para Pix Instantâneo
const PixQrCodeSvg: React.FC<{ value: string; size?: number }> = ({ value, size = 180 }) => {
  const grid = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash) + value.charCodeAt(i);
      hash |= 0;
    }
    const matrix: boolean[][] = Array(21).fill(null).map(() => Array(21).fill(false));

    const setFinder = (startR: number, startC: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[startR + r][startC + c] = true;
          }
        }
      }
    };
    setFinder(0, 0);
    setFinder(0, 14);
    setFinder(14, 0);

    for (let i = 8; i < 13; i++) {
      if (i % 2 === 0) {
        matrix[6][i] = true;
        matrix[i][6] = true;
      }
    }

    let seed = Math.abs(hash);
    for (let r = 0; r < 21; r++) {
      for (let c = 0; c < 21; c++) {
        if ((r < 8 && c < 8) || (r < 8 && c >= 13) || (r >= 13 && c < 8)) continue;
        if (r >= 8 && r <= 12 && c >= 8 && c <= 12) continue;
        seed = (seed * 9301 + 49297) % 233280;
        matrix[r][c] = seed / 233280 > 0.45;
      }
    }
    return matrix;
  }, [value]);

  return (
    <div className="relative inline-block p-3 bg-white rounded-2xl shadow-xl" style={{ width: size + 24, height: size + 24 }}>
      <svg width={size} height={size} viewBox="0 0 21 21" className="w-full h-full">
        {grid.map((row, r) =>
          row.map((cell, c) => {
            if (!cell) return null;
            return <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#001426" />;
          })
        )}
      </svg>
      {/* Central Pix Badge */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-9 h-9 rounded-lg bg-[#32BCAD] border-2 border-white flex items-center justify-center shadow-md">
          <svg viewBox="0 0 512 512" className="w-5 h-5 fill-white">
            <path d="M112.5 124.7l93.3 93.3c13.7 13.7 13.7 35.8 0 49.5l-93.3 93.3c-14.8 14.8-38.8 4.3-38.8-16.6V141.3c0-20.9 24-31.4 38.8-16.6zm287 0l-93.3 93.3c-13.7 13.7-13.7 35.8 0 49.5l93.3 93.3c14.8 14.8 38.8 4.3 38.8-16.6V141.3c0-20.9-24-31.4-38.8-16.6zM256 182.2l73.8 73.8-73.8 73.8-73.8-73.8 73.8-73.8z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  wallet,
  kycStatus,
  onWalletUpdated,
  onGoToKyc
}) => {
  const [activeTab, setActiveTab] = useState<'QUICK' | 'DEPOSIT' | 'WITHDRAW'>('QUICK');

  // Quick Deposit states
  const [quickMethod, setQuickMethod] = useState<'multicaixa_express' | 'pix'>('multicaixa_express');
  const [quickAmount, setQuickAmount] = useState('5000');
  const [quickPhone, setQuickPhone] = useState('944114305');
  const [quickStage, setQuickStage] = useState<'CONFIG' | 'SIMULATING' | 'SUCCESS'>('CONFIG');
  const [simTimer, setSimTimer] = useState(15);
  const [quickTxData, setQuickTxData] = useState<{
    txId: string;
    amount: number;
    methodLabel: string;
    date: string;
    newBalance: number;
  } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  // Standard Deposit states
  const [depositAmount, setDepositAmount] = useState('5000');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProviderType>('multicaixa_express');
  const [mcxPhone, setMcxPhone] = useState('944114305');

  // Withdrawal states
  const [withdrawAmount, setWithdrawAmount] = useState('5000');
  const [iban, setIban] = useState('AO0600000000000000000');

  // Transaction result
  const [referenceVoucher, setReferenceVoucher] = useState<{
    entity: string;
    reference: string;
    amount: number;
    expiresInMinutes: number;
  } | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedEnt, setCopiedEnt] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Pix code payload gerado dinamicamente para o montante escolhido
  const pixPayloadCode = useMemo(() => {
    const val = Number(quickAmount) || 5000;
    return `00020126580014BR.GOV.BCB.PIX0136pix-boosbet-express@boosbet.ao520400005303986540${val.toFixed(2)}5802BR5916BOOS BET OFICIAL6009SAO PAULO62070503***6304E8A2`;
  }, [quickAmount]);

  // Contagem regressiva durante a simulação do Quick Deposit
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (quickStage === 'SIMULATING' && simTimer > 0) {
      interval = setInterval(() => {
        setSimTimer(prev => {
          if (prev <= 1) {
            handleCompleteQuickDeposit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quickStage, simTimer]);

  if (!isOpen) return null;

  // Iniciar fluxo do Quick Deposit
  const handleStartQuickDeposit = () => {
    setError('');
    setSuccessMsg('');
    const val = Number(quickAmount);
    if (isNaN(val) || val < 500) {
      setError('O valor mínimo para Quick Deposit é de 500 Kz.');
      return;
    }
    setSimTimer(quickMethod === 'multicaixa_express' ? 12 : 15);
    setQuickStage('SIMULATING');
  };

  // Iniciação segura e registo do Quick Deposit no gateway
  const handleCompleteQuickDeposit = async () => {
    setLoading(true);
    const val = Number(quickAmount);
    const methodLabel = quickMethod === 'multicaixa_express' ? 'Multicaixa Express' : 'Pix Instantâneo';

    try {
      const res = await apiClient.initiatePaymentDeposit(val, quickMethod, quickPhone);
      setQuickTxData({
        txId: res.transaction?.id || `TX-BOOS-EXP-${Date.now().toString().slice(-6)}`,
        amount: val,
        methodLabel: methodLabel === 'Multicaixa Express' ? 'Multicaixa Express (🇦🇴)' : 'Pix Instantâneo (🇧🇷)',
        date: new Date().toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        newBalance: wallet.balance
      });
      setSuccessMsg(res.instructions || 'Pedido de depósito registado. O saldo será creditado após confirmação do prestador financeiro.');
      setQuickStage('SUCCESS');
    } catch (err: any) {
      setError(err.message || 'Falha ao comunicar com o gateway de pagamento.');
      setQuickStage('CONFIG');
    } finally {
      setLoading(false);
    }
  };

  // Depósito padrão via formulário bancário
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setReferenceVoucher(null);

    const val = Number(depositAmount);
    if (isNaN(val) || val < 500) {
      setError('Valor mínimo para depósito é 500 Kz.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.initiatePaymentDeposit(val, selectedProvider, mcxPhone);
      if (res.referenceData) {
        setReferenceVoucher(res.referenceData);
      }
      setSuccessMsg(res.instructions || 'Pedido de depósito registado. O saldo será creditado assim que a confirmação bancária for autenticada.');
    } catch (err: any) {
      setError(err.message || 'Falha ao comunicar com o gateway de pagamento.');
    } finally {
      setLoading(false);
    }
  };

  // Levantamento Bancário com Guardião KYC
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (kycStatus !== 'VERIFIED') {
      setError('Operação bloqueada pelo regulador (ISJ): A sua conta necessita de verificação KYC de identidade aprovada para efetuar levantamentos.');
      return;
    }

    const val = Number(withdrawAmount);
    if (isNaN(val) || val < 1000) {
      setError('Valor mínimo para levantamento é 1.000 Kz.');
      return;
    }

    if (val > wallet.balance) {
      setError('Saldo insuficiente para efetuar este levantamento.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.withdraw(val, iban);
      onWalletUpdated(res.wallet);
      setSuccessMsg(res.message);
    } catch (err: any) {
      setError(err.message || 'Falha ao processar levantamento bancário.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: 'REF' | 'ENT' | 'PIX') => {
    navigator.clipboard?.writeText(text);
    if (type === 'REF') {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } else if (type === 'ENT') {
      setCopiedEnt(true);
      setTimeout(() => setCopiedEnt(false), 2000);
    } else {
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-[#001426] border border-[#06345A] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FFC21A]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#06345A]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFC21A]/10 border border-[#FFC21A]/30 text-[#FFC21A] flex items-center justify-center">
              <WalletIcon className="w-5 h-5 text-[#F5A900]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-display">
                  Carteira Oficial BOOS BET
                </h3>
                <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5 fill-amber-400" />
                  Quick
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Gateway de Pagamentos Angola · Licenciado pelo ISJ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-[#06345A] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Card com Botão de Ação Rápida */}
        <div className="my-5 p-5 bg-[#06345A]/40 border border-[#0d4a7c] rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Saldo Disponível
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Kwanza Angolano (AOA)
            </span>
          </div>

          <div className="text-3xl font-extrabold text-slate-100 mt-2 font-mono flex items-baseline gap-2">
            <span>{wallet.balance.toLocaleString('pt-AO')}</span>
            <span className="text-amber-400 text-xl font-bold">Kz</span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <span>Bónus de Boas-Vindas: {wallet.bonus_balance.toLocaleString('pt-AO')} Kz</span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-400" />
              Conta Segura ISJ
            </span>
          </div>

          {/* Quick Deposit Action Button no Balance Card */}
          <div className="mt-4 pt-3 border-t border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setActiveTab('QUICK');
                setQuickStage('CONFIG');
                setError('');
                setSuccessMsg('');
              }}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>⚡ Quick Deposit (Pix ou Multicaixa Express)</span>
              <Sparkles className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-[#06345A]/50 rounded-xl border border-[#06345A] mb-5 gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('QUICK');
              setQuickStage('CONFIG');
              setError('');
              setSuccessMsg('');
              setReferenceVoucher(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'QUICK'
                ? 'bg-[#F5A900] text-[#001426] font-bold shadow-md shadow-[#F5A900]/20'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            Quick Deposit
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('DEPOSIT');
              setError('');
              setSuccessMsg('');
              setReferenceVoucher(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'DEPOSIT'
                ? 'bg-[#F5A900] text-[#001426] font-bold shadow-md shadow-[#F5A900]/20'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            Depositar Fundos
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('WITHDRAW');
              setError('');
              setSuccessMsg('');
              setReferenceVoucher(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'WITHDRAW'
                ? 'bg-[#F5A900] text-[#001426] font-bold shadow-md shadow-[#F5A900]/20'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Levantamento
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 mb-4 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-emerald-200">Operação Submetida com Sucesso</p>
              <p className="text-slate-300 leading-relaxed">{successMsg}</p>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 1: QUICK DEPOSIT FLOW (SIMULAÇÃO PIX & MCX)       */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'QUICK' && (
          <div className="space-y-4">
            {quickStage === 'CONFIG' && (
              <>
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-[#06345A]/50 to-[#001426] border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center">
                      <Zap className="w-4 h-4 fill-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Depósito Instantâneo em 3s</h4>
                      <p className="text-[11px] text-slate-300">Escolha entre Pix 🇧🇷 ou Multicaixa Express 🇦🇴</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                    Taxa 0%
                  </span>
                </div>

                {/* Seletor de Método de Quick Deposit */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-2">
                    Selecione o Método Expresso
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Multicaixa Express */}
                    <button
                      type="button"
                      onClick={() => setQuickMethod('multicaixa_express')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        quickMethod === 'multicaixa_express'
                          ? 'bg-[#F5A900]/15 border-[#F5A900] shadow-md shadow-[#F5A900]/10 ring-1 ring-[#F5A900]'
                          : 'bg-[#06345A]/30 border-[#0d4a7c] hover:bg-[#06345A]/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <span className="text-sm">🇦🇴</span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Multicaixa Express</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Aprovação PIN telemóvel</div>
                      </div>
                    </button>

                    {/* Pix Instantâneo */}
                    <button
                      type="button"
                      onClick={() => setQuickMethod('pix')}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        quickMethod === 'pix'
                          ? 'bg-[#32BCAD]/15 border-[#32BCAD] shadow-md shadow-[#32BCAD]/10 ring-1 ring-[#32BCAD]'
                          : 'bg-[#06345A]/30 border-[#0d4a7c] hover:bg-[#06345A]/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-xl bg-[#32BCAD]/20 border border-[#32BCAD]/40 flex items-center justify-center text-[#32BCAD]">
                          <Zap className="w-4 h-4 fill-[#32BCAD]" />
                        </div>
                        <span className="text-sm">🇧🇷</span>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Pix Instantâneo</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">QR Code & Copia e Cola</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Se Multicaixa Express, campo de telemóvel */}
                {quickMethod === 'multicaixa_express' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Número do Telemóvel Multicaixa
                    </label>
                    <div className="flex rounded-xl border border-[#0d4a7c] bg-[#06345A]/50 overflow-hidden">
                      <span className="px-3 py-2 bg-[#06345A] text-xs font-bold text-slate-300 border-r border-[#0d4a7c] flex items-center gap-1">
                        🇦🇴 +244
                      </span>
                      <input
                        type="tel"
                        value={quickPhone}
                        onChange={e => setQuickPhone(e.target.value)}
                        placeholder="9XX XXX XXX"
                        className="w-full px-3 py-2 bg-transparent text-white font-mono text-sm outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Se Pix, nota de conversão e praticidade */}
                {quickMethod === 'pix' && (
                  <div className="p-2.5 rounded-xl bg-[#32BCAD]/10 border border-[#32BCAD]/30 text-xs flex items-center justify-between">
                    <span className="text-slate-300 text-[11px]">Cotação oficial de conversão:</span>
                    <span className="font-mono font-bold text-[#32BCAD] text-[11px]">
                      1 AOA ≈ R$ 0,0065 | R$ {(Number(quickAmount || 0) * 0.0065).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Montante do Quick Deposit */}
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Montante a Depositar (Kz)
                  </label>
                  <input
                    type="number"
                    step="500"
                    min="500"
                    value={quickAmount}
                    onChange={e => setQuickAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#06345A]/50 border border-[#0d4a7c] rounded-xl text-base font-bold text-white font-mono outline-none focus:border-[#F5A900] focus:ring-1 focus:ring-[#F5A900]"
                  />

                  {/* Botões de valor pré-definido */}
                  <div className="grid grid-cols-4 gap-1.5 mt-2">
                    {[
                      { val: '1000', label: '1.000' },
                      { val: '2500', label: '2.500' },
                      { val: '5000', label: '5.000', popular: true },
                      { val: '10000', label: '10.000' }
                    ].map(item => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setQuickAmount(item.val)}
                        className={`py-1.5 px-1 text-[11px] font-mono rounded-lg border transition-all cursor-pointer relative ${
                          quickAmount === item.val
                            ? 'bg-[#F5A900] text-[#001426] font-bold border-[#F5A900]'
                            : 'bg-[#06345A]/60 text-slate-200 border-[#0d4a7c] hover:bg-[#06345A]'
                        }`}
                      >
                        {item.popular && (
                          <span className="absolute -top-2 right-1 bg-amber-500 text-[8px] text-slate-950 font-black px-1 rounded-full uppercase">
                            Top
                          </span>
                        )}
                        +{item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Botão de Disparo do Quick Deposit */}
                <BoosButton
                  type="button"
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={handleStartQuickDeposit}
                  disabled={loading}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4 fill-current" />
                    <span>Iniciar Quick Deposit de {Number(quickAmount || 0).toLocaleString('pt-AO')} Kz</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </BoosButton>
              </>
            )}

            {/* ETAPA DE SIMULAÇÃO INTERATIVA (MCX OU PIX) */}
            {quickStage === 'SIMULATING' && (
              <div className="space-y-4">
                {/* Visualização de Simulação Multicaixa Express */}
                {quickMethod === 'multicaixa_express' && (
                  <div className="p-4 rounded-2xl bg-[#06345A]/70 border-2 border-[#F5A900] space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#0d4a7c] pb-2">
                      <span className="text-xs font-bold text-[#F5A900] uppercase tracking-wider flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4" />
                        Simulação Multicaixa Express (MCX)
                      </span>
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800 flex items-center gap-1">
                        <Clock className="w-3 h-3 animate-pulse" />
                        {simTimer}s
                      </span>
                    </div>

                    {/* Notificação no Telemóvel */}
                    <div className="p-3 bg-[#001426] rounded-xl border border-[#0d4a7c] space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="font-semibold text-emerald-400">Push de Autorização Enviado</span>
                      </div>
                      <div className="text-xs text-slate-200">
                        Um pedido de débito de <strong className="text-amber-400 font-mono text-sm">{Number(quickAmount).toLocaleString('pt-AO')} Kz</strong> foi despachado para o número <strong>+244 {quickPhone}</strong>.
                      </div>
                      <div className="p-2 bg-[#06345A]/50 rounded-lg text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Entidade: BOOS BET (00142)</span>
                        <span className="font-mono text-slate-300">PIN: ****</span>
                      </div>
                    </div>

                    {/* Barra de Progresso da Simulação */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Aguardando resposta do gateway...</span>
                        <span>Auto-aprovação em {simTimer}s</span>
                      </div>
                      <div className="w-full bg-[#001426] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-400 to-yellow-500 h-full transition-all duration-1000"
                          style={{ width: `${((12 - simTimer) / 12) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Botão de Simulação Imediata */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleCompleteQuickDeposit}
                        disabled={loading}
                        className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        {loading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Simular Aprovação de PIN Imediata</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Visualização de Simulação Pix Instantâneo */}
                {quickMethod === 'pix' && (
                  <div className="p-4 rounded-2xl bg-[#06345A]/70 border-2 border-[#32BCAD] space-y-3.5 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-[#0d4a7c] pb-2">
                      <span className="text-xs font-bold text-[#32BCAD] uppercase tracking-wider flex items-center gap-1.5">
                        <Zap className="w-4 h-4 fill-[#32BCAD]" />
                        Simulação Pix Instantâneo (Banco Central)
                      </span>
                      <span className="text-[10px] font-mono text-[#32BCAD] bg-[#32BCAD]/10 px-2 py-0.5 rounded border border-[#32BCAD]/30 flex items-center gap-1">
                        <Clock className="w-3 h-3 animate-pulse" />
                        {simTimer}s
                      </span>
                    </div>

                    {/* QR Code Pix e Dados */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#001426] p-3 rounded-xl border border-[#0d4a7c]">
                      <PixQrCodeSvg value={pixPayloadCode} size={130} />

                      <div className="flex-1 space-y-2 text-center sm:text-left">
                        <div className="text-xs text-slate-300">
                          Valor: <strong className="text-white font-mono text-sm">{Number(quickAmount).toLocaleString('pt-AO')} Kz</strong>
                          <span className="block text-[11px] text-[#32BCAD] font-mono">
                            ≈ R$ {(Number(quickAmount) * 0.0065).toFixed(2)} BRL
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug">
                          Aponte a câmara do aplicativo do seu banco para o QR Code acima ou use a chave Copia e Cola.
                        </p>
                      </div>
                    </div>

                    {/* Caixa Copia e Cola */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                        <span>Código Pix Copia e Cola:</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(pixPayloadCode, 'PIX')}
                          className="text-[#32BCAD] hover:underline flex items-center gap-1 text-[11px]"
                        >
                          {copiedPix ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedPix ? 'Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <div className="p-2 bg-[#001426] rounded-lg border border-[#0d4a7c] font-mono text-[10px] text-slate-300 truncate">
                        {pixPayloadCode}
                      </div>
                    </div>

                    {/* Barra de Progresso da Simulação Pix */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Aguardando liquidação SPI / BCB...</span>
                        <span>Auto-confirmação em {simTimer}s</span>
                      </div>
                      <div className="w-full bg-[#001426] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#32BCAD] to-emerald-400 h-full transition-all duration-1000"
                          style={{ width: `${((15 - simTimer) / 15) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Botão de Simulação Imediata Pix */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleCompleteQuickDeposit}
                        disabled={loading}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-[#32BCAD] to-teal-400 hover:opacity-95 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-[#32BCAD]/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        {loading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>Simular Pagamento Pix Realizado</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Botão Voltar para Configuração */}
                <button
                  type="button"
                  onClick={() => setQuickStage('CONFIG')}
                  className="w-full py-1.5 text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Voltar e alterar valor ou método
                </button>
              </div>
            )}

            {/* ETAPA DE SUCESSO DO QUICK DEPOSIT */}
            {quickStage === 'SUCCESS' && quickTxData && (
              <div className="p-5 rounded-2xl bg-gradient-to-b from-[#06345A]/80 to-[#001426] border-2 border-emerald-500/80 shadow-2xl space-y-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="text-base font-black text-white font-display">
                    Quick Deposit Creditado com Sucesso!
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    Os fundos já se encontram disponíveis na sua conta para apostas desportivas.
                  </p>
                </div>

                {/* Resumo da Transação Creditada */}
                <div className="p-3.5 bg-[#001426] rounded-xl border border-[#0d4a7c] text-xs space-y-2 text-left font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Montante Creditado:</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      + {quickTxData.amount.toLocaleString('pt-AO')} Kz
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Novo Saldo Total:</span>
                    <span className="text-amber-400 font-bold text-sm">
                      {quickTxData.newBalance.toLocaleString('pt-AO')} Kz
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Método Utilizado:</span>
                    <span className="text-white font-medium">{quickTxData.methodLabel}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">ID da Transação:</span>
                    <span className="text-slate-300">{quickTxData.txId}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuickStage('CONFIG');
                      setError('');
                    }}
                    className="py-2.5 px-3 bg-[#06345A] hover:bg-[#0d4a7c] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Novo Quick Deposit
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-3 bg-[#F5A900] hover:bg-[#FFC21A] text-slate-950 text-xs font-black rounded-xl shadow-md shadow-amber-500/20 transition-colors cursor-pointer"
                  >
                    Apostar Agora
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: DEPOSIT FLOW (PROVEDORES BANCÁRIOS ANGOLA)      */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'DEPOSIT' && (
          <form onSubmit={handleDeposit} className="space-y-4">
            {/* Atalho para Quick Deposit */}
            <div className="p-3 bg-gradient-to-r from-[#FFC21A]/20 via-[#06345A] to-[#001426] border border-[#FFC21A]/40 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FFC21A] fill-[#FFC21A]" />
                <span className="text-xs font-bold text-white">Prefere crédito em 3 segundos?</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('QUICK');
                  setQuickStage('CONFIG');
                }}
                className="px-2.5 py-1 bg-[#FFC21A] text-slate-950 text-xs font-bold rounded-lg hover:bg-amber-300 transition-colors cursor-pointer"
              >
                Quick Deposit ⚡
              </button>
            </div>

            {/* Voucher de Pagamento por Referência Multicaixa se existir */}
            {referenceVoucher && (
              <div className="mb-4 p-4 rounded-2xl bg-[#06345A]/70 border-2 border-[#FFC21A]/60 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-[#0d4a7c] pb-2">
                  <span className="text-xs font-bold text-[#FFC21A] uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4" />
                    Talão Multicaixa (EMIS)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    Válido por 24h
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#001426] p-2.5 rounded-xl border border-[#0d4a7c]">
                    <div className="text-[10px] text-slate-400">Entidade:</div>
                    <div className="font-mono font-black text-white text-base mt-0.5 flex items-center justify-between">
                      <span>{referenceVoucher.entity}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(referenceVoucher.entity, 'ENT')}
                        className="text-slate-400 hover:text-white p-1"
                        title="Copiar Entidade"
                      >
                        {copiedEnt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#001426] p-2.5 rounded-xl border border-[#0d4a7c]">
                    <div className="text-[10px] text-slate-400">Referência:</div>
                    <div className="font-mono font-black text-amber-300 text-base mt-0.5 flex items-center justify-between">
                      <span>{referenceVoucher.reference}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(referenceVoucher.reference.replace(/\s+/g, ''), 'REF')}
                        className="text-slate-400 hover:text-white p-1"
                        title="Copiar Referência"
                      >
                        {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-[#001426]/70 rounded-xl border border-[#0d4a7c] flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Valor a Pagar:</span>
                  <span className="font-bold text-white text-sm">{referenceVoucher.amount.toLocaleString('pt-AO')} Kz</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-2">
                Provedor de Pagamento Oficial (Angola)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    id: 'multicaixa_express' as PaymentProviderType,
                    label: 'Multicaixa Express',
                    sub: 'Aprovação por PIN no Telemóvel',
                    icon: <Smartphone className="w-4 h-4 text-[#FFC21A]" />
                  },
                  {
                    id: 'multicaixa_gpo' as PaymentProviderType,
                    label: 'Referência Multicaixa',
                    sub: 'Caixa ATM / Internet Banking',
                    icon: <CreditCard className="w-4 h-4 text-[#FFC21A]" />
                  },
                  {
                    id: 'paysuite' as PaymentProviderType,
                    label: 'PaySuite Angola',
                    sub: 'Gateway Fintech Imediato',
                    icon: <Building2 className="w-4 h-4 text-[#FFC21A]" />
                  },
                  {
                    id: 'bai_directo' as PaymentProviderType,
                    label: 'BAI Directo / IBAN',
                    sub: 'Transferência Interbancária',
                    icon: <Building2 className="w-4 h-4 text-[#FFC21A]" />
                  }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSelectedProvider(m.id);
                      setReferenceVoucher(null);
                      setError('');
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedProvider === m.id
                        ? 'bg-[#F5A900]/15 border-[#F5A900] text-white shadow-md'
                        : 'bg-[#06345A]/40 border-[#0d4a7c] text-slate-300 hover:bg-[#06345A]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {m.icon}
                      <span className="text-xs font-bold text-white">{m.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{m.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedProvider === 'multicaixa_express' && (
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Número de Telemóvel Associado ao Multicaixa Express
                </label>
                <div className="flex rounded-xl border border-[#0d4a7c] bg-[#06345A]/50 overflow-hidden">
                  <span className="px-3 py-2.5 bg-[#06345A] text-xs font-bold text-slate-300 border-r border-[#0d4a7c]">
                    🇦🇴 +244
                  </span>
                  <input
                    type="tel"
                    value={mcxPhone}
                    onChange={e => setMcxPhone(e.target.value)}
                    placeholder="9XX XXX XXX"
                    className="w-full px-3 py-2.5 bg-transparent text-white font-mono text-sm outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                Montante a Depositar (Kz)
              </label>
              <input
                type="number"
                step="500"
                min="500"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#06345A]/50 border border-[#0d4a7c] rounded-xl text-base font-bold text-white font-mono outline-none focus:border-[#F5A900] focus:ring-1 focus:ring-[#F5A900]"
              />
              <div className="flex gap-2 mt-2">
                {['1000', '2000', '5000', '10000'].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDepositAmount(val)}
                    className="flex-1 py-1 bg-[#06345A]/60 hover:bg-[#06345A] text-slate-200 text-[11px] font-mono rounded-lg border border-[#0d4a7c] transition-colors cursor-pointer"
                  >
                    +{Number(val).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <BoosButton
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  A contactar Gateway de Pagamento...
                </span>
              ) : (
                `Confirmar Depósito de ${Number(depositAmount || 0).toLocaleString('pt-AO')} Kz`
              )}
            </BoosButton>
          </form>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: LEVANTAMENTO BANCÁRIO (COM REQUISITO KYC)       */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'WITHDRAW' && (
          <form onSubmit={handleWithdraw} className="space-y-4">
            {kycStatus !== 'VERIFIED' ? (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800 text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  Conformidade Regulatória ISJ
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Para cumprir as diretrizes anti-branqueamento de capitais do Instituto de Supervisão de Jogos de Angola (ISJ), os levantamentos bancários exigem titularidade confirmada via B.I. ou Passaporte.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToKyc();
                  }}
                  className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-[#F5A900] text-[#001426] font-bold rounded-lg text-xs hover:bg-[#FFC21A] transition-colors cursor-pointer"
                >
                  Concluir Verificação KYC Agora
                </button>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    IBAN Bancário Angolano (AO06...)
                  </label>
                  <input
                    type="text"
                    value={iban}
                    onChange={e => setIban(e.target.value)}
                    placeholder="AO06 0000 0000 0000 0000 0000 0"
                    className="w-full px-3.5 py-2.5 bg-[#06345A]/50 border border-[#0d4a7c] rounded-xl text-sm font-mono text-white outline-none focus:border-[#F5A900]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Montante de Levantamento (Kz)
                  </label>
                  <input
                    type="number"
                    step="500"
                    min="1000"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#06345A]/50 border border-[#0d4a7c] rounded-xl text-base font-bold text-white font-mono outline-none focus:border-[#F5A900]"
                  />
                </div>

                <BoosButton
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      A processar ordem bancária...
                    </span>
                  ) : (
                    `Solicitar Levantamento de ${Number(withdrawAmount || 0).toLocaleString('pt-AO')} Kz`
                  )}
                </BoosButton>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
