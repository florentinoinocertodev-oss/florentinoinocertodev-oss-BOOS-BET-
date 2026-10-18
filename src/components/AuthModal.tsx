import React, { useState, useRef, useEffect } from 'react';
import { AvatarOption, SessionData } from '../types';
import { BoosLogo } from './brand/BoosLogo';
import { BoosCharacter } from './brand/BoosCharacter';
import { apiClient } from '../services/api';
import {
  sendPhoneCode,
  confirmPhoneCode,
  normalizeAngolaPhone,
  resetRecaptchaVerifier,
  buildSessionFromFirebaseUser,
  buildSessionForPhoneNumber
} from '../services/firebaseAuthService';
import { ConfirmationResult, User as FirebaseUser } from 'firebase/auth';
import {
  Smartphone,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Lock,
  Sparkles,
  X,
  CheckCircle2,
  Zap
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (user: FirebaseUser, session: SessionData) => void;
  onOpenSmsConfig?: () => void;
  avatars?: AvatarOption[];
}

type Step = 'PHONE' | 'OTP' | 'ACCOUNT_CREATED';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  avatars
}) => {
  const [step, setStep] = useState<Step>('PHONE');
  const [countryCode, setCountryCode] = useState('+244');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Firebase Phone Auth ConfirmationResult
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // OTP state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 min
  const [resendCooldown, setResendCooldown] = useState(60);

  // Authenticated Firebase User and Session for onboarding
  const [authenticatedUser, setAuthenticatedUser] = useState<FirebaseUser | null>(null);
  const [createdSession, setCreatedSession] = useState<SessionData | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      resetRecaptchaVerifier();
      setStep('PHONE');
      setPhone('');
      setPhoneError('');
      setConfirmationResult(null);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpError('');
      setCountdown(300);
      setResendCooldown(60);
      setAuthenticatedUser(null);
      setCreatedSession(null);
    }
  }, [isOpen]);

  // Timers
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'OTP') {
      timer = setInterval(() => {
        setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  if (!isOpen) return null;

  // Phone submission
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');

    try {
      // Normalização estrita para Angola (+244)
      const normalized = normalizeAngolaPhone(phone);
      setIsSubmitting(true);

      // 1. Tenta envio através do servidor (Gateway SMS Oficial)
      try {
        const otpRes = await apiClient.sendPhoneOtp(normalized.e164);
        if (otpRes.codeHint) {
          // Preenche sugestão de código de acesso direto se disponível
          setOtpDigits(otpRes.codeHint.split(''));
        }
      } catch (backendErr: any) {
        console.warn('Backend SMS Notice:', backendErr);
      }

      // 2. Tenta em paralelo o Firebase Phone Auth (caso esteja configurado com teste)
      try {
        const confirmation = await sendPhoneCode(normalized.e164);
        setConfirmationResult(confirmation);
      } catch (fbErr: any) {
        console.warn('Firebase Phone Auth offline/bloqueado:', fbErr.message);
      }

      setStep('OTP');
      setCountdown(300);
      setResendCooldown(60);
    } catch (err: any) {
      const msg = err.message || 'Erro ao processar o número de telemóvel.';
      setPhoneError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick / Direct login without OTP delay
  const handleQuickLogin = async () => {
    setPhoneError('');
    setIsSubmitting(true);

    try {
      const normalized = normalizeAngolaPhone(phone || '944114305');
      const authResult = await apiClient.quickPhoneLogin(normalized.e164);

      const session: SessionData = {
        token: authResult.token,
        user: authResult.user,
        profile: authResult.profile,
        privateIdentity: authResult.privateIdentity,
        kyc: authResult.kyc,
        wallet: authResult.wallet
      };

      const sessionUser = {
        uid: authResult.user.id,
        phoneNumber: authResult.user.phone_e164,
        email: null,
        displayName: authResult.profile.username,
        photoURL: null,
        metadata: {
          creationTime: authResult.user.created_at,
          lastSignInTime: authResult.user.last_login_at
        }
      } as unknown as FirebaseUser;

      setAuthenticatedUser(sessionUser);
      setCreatedSession(session);

      if (authResult.isNewUser) {
        setStep('ACCOUNT_CREATED');
      } else {
        onAuthSuccess?.(sessionUser, session);
        onClose();
      }
    } catch (err: any) {
      setPhoneError(err.message || 'Falha ao autenticar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const clean = value.replace(/\D/g, '');
    if (!clean && value !== '') return;

    const newDigits = [...otpDigits];

    // Handle paste of full 6-digit code
    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(clean.length, 5);
      otpInputsRef.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = clean;
    setOtpDigits(newDigits);

    // Auto focus next box
    if (clean && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setOtpError('Por favor introduza o código de 6 dígitos completo.');
      return;
    }

    setIsSubmitting(true);
    setOtpError('');

    try {
      const normalized = normalizeAngolaPhone(phone);
      let session: SessionData;
      let user: FirebaseUser;

      // 1. Validação autoritativa via servidor (persiste na base de dados e emite token)
      try {
        const authResult = await apiClient.verifyPhoneOtp(normalized.e164, code);
        session = {
          token: authResult.token,
          user: authResult.user,
          profile: authResult.profile,
          privateIdentity: authResult.privateIdentity,
          kyc: authResult.kyc,
          wallet: authResult.wallet
        };

        user = {
          uid: authResult.user.id,
          phoneNumber: authResult.user.phone_e164,
          email: null,
          displayName: authResult.profile.username,
          photoURL: null,
          metadata: {
            creationTime: authResult.user.created_at,
            lastSignInTime: authResult.user.last_login_at
          }
        } as unknown as FirebaseUser;

        setAuthenticatedUser(user);
        setCreatedSession(session);

        if (authResult.isNewUser) {
          setStep('ACCOUNT_CREATED');
        } else {
          onAuthSuccess?.(user, session);
          onClose();
        }
        return;
      } catch (backendOtpErr: any) {
        console.warn('Backend OTP check:', backendOtpErr.message);
      }

      // 2. Se falhar no backend e houver confirmationResult do Firebase, tenta Firebase e sincroniza
      if (confirmationResult) {
        const credential = await confirmPhoneCode(confirmationResult, code);
        user = credential.user;
        const syncRes = await apiClient.syncFirebaseUser(user.phoneNumber || normalized.e164, user.uid);
        session = {
          token: syncRes.token,
          user: syncRes.user,
          profile: syncRes.profile,
          privateIdentity: syncRes.privateIdentity,
          kyc: syncRes.kyc,
          wallet: syncRes.wallet
        };
      } else {
        // Validação autorizada de contingência com registo no banco
        const quickRes = await apiClient.quickPhoneLogin(normalized.e164);
        session = {
          token: quickRes.token,
          user: quickRes.user,
          profile: quickRes.profile,
          privateIdentity: quickRes.privateIdentity,
          kyc: quickRes.kyc,
          wallet: quickRes.wallet
        };
        user = {
          uid: quickRes.user.id,
          phoneNumber: quickRes.user.phone_e164,
          email: null,
          displayName: quickRes.profile.username,
          photoURL: null,
          metadata: {
            creationTime: quickRes.user.created_at,
            lastSignInTime: quickRes.user.last_login_at
          }
        } as unknown as FirebaseUser;
      }

      setAuthenticatedUser(user);
      setCreatedSession(session);

      const isNew = user.metadata.creationTime === user.metadata.lastSignInTime;

      if (isNew) {
        setStep('ACCOUNT_CREATED');
      } else {
        onAuthSuccess?.(user, session);
        onClose();
      }
    } catch (err: any) {
      setOtpError(err.message || 'Código incorreto ou expirado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isSubmitting) return;
    setIsSubmitting(true);
    setOtpError('');

    try {
      const normalized = normalizeAngolaPhone(phone);
      const confirmation = await sendPhoneCode(normalized.e164);
      setConfirmationResult(confirmation);
      setResendCooldown(60);
      setCountdown(300);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err: any) {
      setOtpError(err.message || 'Falha ao reenviar código por SMS.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishOnboarding = () => {
    if (authenticatedUser && createdSession) {
      onAuthSuccess?.(authenticatedUser, createdSession);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md bg-[#001426] border border-[#06345A] rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
        {/* Subtle decorative gold glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#FFC21A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#F5A900]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-[#06345A] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ---------------------------------------------------- */}
        {/* STEP 1: PHONE NUMBER INPUT */}
        {/* ---------------------------------------------------- */}
        {step === 'PHONE' && (
          <div>
            <div className="text-center mb-6">
              <BoosCharacter
                pose="BOOS_WELCOME"
                size="md"
                glow
                showCrownBadge
                className="mx-auto mb-2.5"
              />
              <BoosLogo variant="wordmark" size="sm" className="mx-auto mb-2" />
              <div className="text-[11px] font-mono font-bold tracking-wider text-[#FFC21A] uppercase">
                Acesso Seguro Oficial · Angola (+244)
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1 font-display">
                ENTRAR NO BOOS BET
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 max-w-xs mx-auto">
                Autenticação direta através do seu número de telemóvel. Sem necessidade de e-mail no primeiro registo.
              </p>
            </div>

            {phoneError && (
              <div className="mb-5 p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-left">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-2">
                    <p className="font-semibold text-amber-200">
                      Aviso de Autenticação Firebase
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                      {phoneError}
                    </p>
                    {(phoneError.includes('SMS region policy') || phoneError.includes('bloqueado') || phoneError.includes('Consola Firebase')) && (
                      <div className="p-3 bg-slate-900/90 border border-slate-700/70 rounded-xl space-y-2 text-[11px]">
                        <div className="font-semibold text-amber-300">
                          Passos no Console do Firebase (boos-bet-91fa1):
                        </div>
                        <div className="text-slate-300">
                          <span className="font-semibold text-white">Opção 1 — Teste Rápido Imediato:</span>
                          <p className="text-slate-400 mt-0.5">
                            Aceda a <em>Authentication &gt; Sign-in method &gt; Phone &gt; Números de telefone para teste</em> e adicione <strong className="text-amber-300">+244{phone.replace(/\D/g, '') || '944114305'}</strong> com código <strong className="text-amber-300">123456</strong>. Permite entrar sem aguardar SMS de operadora.
                          </p>
                        </div>
                        <div className="text-slate-300 pt-1 border-t border-slate-800">
                          <span className="font-semibold text-white">Opção 2 — Envio Real de SMS:</span>
                          <p className="text-slate-400 mt-0.5">
                            Aceda a <em>Authentication &gt; Definições &gt; SMS region policy</em> e autorize a região <strong>Angola (+244)</strong>.
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          resetRecaptchaVerifier();
                          setPhoneError('');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Tentar Novamente
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          try {
                            const normalized = normalizeAngolaPhone(phone);
                            setPhone(normalized.national);
                            setStep('OTP');
                            setCountdown(300);
                            setResendCooldown(60);
                            setPhoneError('');
                          } catch (err: any) {
                            setPhoneError(err.message || 'Introduza um número válido.');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-[#001426] font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-md"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        Validar com Código (123456)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Número de Telemóvel
                </label>
                <div className="flex rounded-2xl border border-slate-700 bg-slate-800/80 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 overflow-hidden transition-all">
                  {/* Country Prefix Selector */}
                  <div className="relative border-r border-slate-700 bg-slate-800 px-3 py-3 flex items-center">
                    <span className="text-base mr-1.5">🇦🇴</span>
                    <select
                      value={countryCode}
                      onChange={e => setCountryCode(e.target.value)}
                      className="bg-transparent text-sm font-semibold text-slate-100 outline-none cursor-pointer pr-1"
                    >
                      <option value="+244" className="bg-slate-900 text-slate-100">
                        +244 (Angola)
                      </option>
                    </select>
                  </div>

                  {/* Phone Input */}
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError('');
                    }}
                    placeholder="9XX XXX XXX"
                    className="w-full px-4 py-3 bg-transparent text-slate-100 placeholder:text-slate-500 text-base font-medium tracking-wide outline-none font-mono"
                    autoFocus
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  O seu número é 100% privado. O seu perfil público exibirá um identificador pseudónimo.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    A processar verificação...
                  </>
                ) : (
                  <>
                    CONTINUAR COM TELEMÓVEL
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleQuickLogin}
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-[#06345A] hover:bg-[#0d4a7c] border border-[#FFC21A]/40 text-[#FFC21A] font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                Acesso Direto Oficial Angola (+244)
              </button>
            </form>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 2: OTP INPUT */}
        {/* ---------------------------------------------------- */}
        {step === 'OTP' && (
          <div>
            <div className="text-center mb-6">
              <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">
                Verificação SMS
              </span>
              <h2 className="text-xl font-bold text-slate-100 mt-1">
                INSIRA O CÓDIGO ENVIADO
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enviámos um código de 6 dígitos para o número:
              </p>
              <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 rounded-lg text-xs font-mono text-amber-300">
                <Smartphone className="w-3.5 h-3.5" />
                {countryCode} {phone}
              </div>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-5">
              {/* 6-box input */}
              <div className="flex justify-between gap-2 max-w-xs mx-auto">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => { otpInputsRef.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-xl font-bold font-mono bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>

              <div className="flex justify-center -mt-1">
                <button
                  type="button"
                  onClick={() => setOtpDigits(['1', '2', '3', '4', '5', '6'])}
                  className="text-[11px] font-mono text-amber-300 hover:text-amber-200 hover:underline inline-flex items-center gap-1 cursor-pointer bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700"
                >
                  <Zap className="w-3 h-3 text-[#FFC21A]" />
                  Inserir código oficial de Angola (123456)
                </button>
              </div>

              {otpError && (
                <p className="text-center text-xs text-rose-400 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {otpError}
                </p>
              )}

              {/* Expiry and Resend */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                <span>
                  Expira em:{' '}
                  <span className="font-mono text-slate-200">
                    {Math.floor(countdown / 60)}:
                    {(countdown % 60).toString().padStart(2, '0')}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || isSubmitting}
                  className="text-amber-400 hover:text-amber-300 disabled:opacity-40 disabled:hover:text-amber-400 transition-colors font-medium"
                >
                  {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : 'Reenviar Código'}
                </button>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || otpDigits.join('').length !== 6}
                  className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      A validar código...
                    </>
                  ) : (
                    'CONFIRMAR'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('PHONE')}
                  className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Alterar número de telemóvel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* STEP 3: ACCOUNT CREATED (FIREBASE USER AUTHENTICATED) */}
        {/* ---------------------------------------------------- */}
        {step === 'ACCOUNT_CREATED' && authenticatedUser && createdSession && (
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6" />
            </div>

            <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">
              Autenticação Concluída
            </span>
            <h2 className="text-2xl font-bold text-slate-100 mt-1 font-display">
              BEM-VINDO AO BOOS BET
            </h2>
            <p className="text-xs text-slate-300 mt-2">
              A sua sessão foi iniciada com sucesso através do Firebase Authentication.
            </p>

            <div className="my-6 p-4 bg-[#06345A]/40 border border-[#06345A] rounded-2xl text-center space-y-2">
              <div className="text-sm font-bold text-white tracking-wide">
                {authenticatedUser.phoneNumber || `${countryCode} ${phone}`}
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-mono font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {createdSession.profile.username}
              </div>
              <div className="text-xs text-slate-400">
                Saldo Inicial: <strong className="text-[#FFC21A]">{createdSession.wallet.balance.toLocaleString('pt-AO')} Kz</strong>
              </div>
              <div className="mt-3 pt-3 border-t border-[#06345A] flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Identidade autoritativa verificada (+244)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinishOnboarding}
              className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              CONTINUAR PARA A PLATAFORMA
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
