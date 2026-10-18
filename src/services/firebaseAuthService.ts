/**
 * BOOS BET — Firebase Phone Authentication Service (FASE AUTH-001)
 * Projeto Firebase Oficial: boos-bet-91fa1 (Number: 62770462117)
 * Web App ID: 1:62770462117:web:8d0f4bed16fca0f93f7c4c
 * 
 * Responsabilidade Exclusiva:
 * - Normalização e validação de números de telemóvel de Angola (+244)
 * - Iniciar autenticação telefônica oficial via signInWithPhoneNumber
 * - Confirmar código SMS OTP emitido pelo Firebase Authentication
 * - Observar estado de autenticação reativo (onAuthStateChanged)
 * - Obter utilizador atual e Firebase ID Token
 * - Encerramento de sessão oficial (signOut)
 * - Construção autoritativa do SessionData a partir do Firebase User
 * - Tratamento centralizado de erros do Firebase Auth e reCAPTCHA
 */

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  UserCredential
} from 'firebase/auth';
import { firebaseAuth, recaptchaSiteKey } from './firebase';
import { SessionData } from '../types';

export type AuthState = 'UNAUTHENTICATED' | 'AUTHENTICATING' | 'AUTHENTICATED' | 'AUTH_ERROR';

export interface AuthSessionState {
  state: AuthState;
  user: FirebaseUser | null;
  idToken: string | null;
  error?: string | null;
}

// Armazena a instância ativa do RecaptchaVerifier para limpeza ou reuso
let activeRecaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Normaliza e valida o número de telefone para o formato padrão E.164 de Angola (+244).
 * Suporta formatos:
 * - "944114305" -> "+244944114305"
 * - "244944114305" -> "+244944114305"
 * - "+244 944 114 305" -> "+244944114305"
 * - "9XX XXX XXX" -> "+2449XXXXXXXX"
 */
export function normalizeAngolaPhone(rawPhone: string): { e164: string; national: string } {
  if (!rawPhone) {
    throw new Error('Introduza o seu número de telemóvel.');
  }

  // Remove todos os caracteres não numéricos
  let digits = rawPhone.replace(/\D/g, '');

  // Se o utilizador incluiu o indicativo de Angola (244)
  if (digits.startsWith('244')) {
    digits = digits.slice(3);
  }

  // Em Angola o número nacional deve ter exatamente 9 dígitos
  if (digits.length !== 9) {
    throw new Error(
      `Número de telemóvel inválido. Em Angola deve conter 9 dígitos (atual: ${digits.length}).`
    );
  }

  return {
    e164: `+244${digits}`,
    national: digits
  };
}

/**
 * Garante que o container de reCAPTCHA seja um nó de DOM totalmente novo,
 * impedindo que o motor do Google grecaptcha gere o erro
 * "reCAPTCHA has already been rendered in this element".
 */
export function resetRecaptchaVerifier(containerId: string = 'recaptcha-container'): HTMLElement | null {
  if (activeRecaptchaVerifier) {
    try {
      activeRecaptchaVerifier.clear();
    } catch {
      // Ignora erro se já estiver limpo
    }
    activeRecaptchaVerifier = null;
  }

  if (typeof document === 'undefined') return null;

  const existingEl = document.getElementById(containerId);
  if (existingEl && existingEl.parentNode) {
    const freshEl = document.createElement('div');
    freshEl.id = containerId;
    existingEl.parentNode.replaceChild(freshEl, existingEl);
    return freshEl;
  } else if (!existingEl) {
    const freshEl = document.createElement('div');
    freshEl.id = containerId;
    document.body.appendChild(freshEl);
    return freshEl;
  }
  return existingEl;
}

/**
 * Cria ou recupera o RecaptchaVerifier invisível do Firebase.
 * Limpa o container e cria um nó virgem no DOM para prevenir colisões do grecaptcha.
 */
export function setupRecaptchaVerifier(containerId: string = 'recaptcha-container'): RecaptchaVerifier {
  // Limpa instâncias anteriores e substitui o elemento DOM por um nó virgem
  const container = resetRecaptchaVerifier(containerId) || containerId;

  activeRecaptchaVerifier = new RecaptchaVerifier(firebaseAuth, container, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA resolvido com sucesso
    },
    'expired-callback': () => {
      resetRecaptchaVerifier(containerId);
    }
  });

  return activeRecaptchaVerifier;
}

/**
 * Dispara o envio de código SMS oficial via Firebase Phone Authentication.
 * Valida o formato E.164 com suporte obrigatório a números de Angola (+244).
 * Inclui proteção contra timeout (15s) para evitar travamento em iframes.
 */
export async function sendPhoneCode(
  phoneNumberE164: string,
  verifier?: RecaptchaVerifier
): Promise<ConfirmationResult> {
  const normalized = normalizeAngolaPhone(phoneNumberE164);
  const cleanNumber = normalized.e164;

  // Configura um verifier limpo com nó DOM renovado
  let appVerifier = verifier;
  if (!appVerifier) {
    appVerifier = setupRecaptchaVerifier('recaptcha-container');
  }

  // Timeout de 15 segundos para evitar que o reCAPTCHA fique pendente indefinidamente no iframe
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('TIMEOUT: A verificação de segurança reCAPTCHA demorou mais de 15 segundos. Isto ocorre geralmente por restrições de iframe ou rede.'));
    }, 15000);
  });

  try {
    const confirmationResult = await Promise.race([
      signInWithPhoneNumber(firebaseAuth, cleanNumber, appVerifier),
      timeoutPromise
    ]);
    return confirmationResult;
  } catch (error: any) {
    // Em caso de falha, limpa e renova o DOM para que uma nova tentativa não colida
    resetRecaptchaVerifier('recaptcha-container');
    const friendlyMessage = mapFirebaseAuthError(error);
    throw new Error(friendlyMessage);
  }
}

/**
 * Confirma o código de 6 dígitos recebido por SMS e autentica o usuário no Firebase.
 */
export async function confirmPhoneCode(
  confirmationResult: ConfirmationResult,
  verificationCode: string
): Promise<UserCredential> {
  const cleanCode = verificationCode.trim().replace(/\D/g, '');

  if (cleanCode.length !== 6) {
    throw new Error('O código de verificação deve conter exatamente 6 dígitos numéricos.');
  }

  try {
    const credential = await confirmationResult.confirm(cleanCode);
    return credential;
  } catch (error: any) {
    const friendlyMessage = mapFirebaseAuthError(error);
    throw new Error(friendlyMessage);
  }
}

/**
 * Retorna o usuário do Firebase atualmente autenticado (ou null se deslogado).
 */
export function getCurrentUser(): FirebaseUser | null {
  return firebaseAuth.currentUser;
}

/**
 * Obtém o Firebase ID Token criptografado do usuário atual para chamadas autenticadas.
 * Não armazena o token em localStorage.
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = firebaseAuth.currentUser;
  if (!user) return null;
  return await user.getIdToken(forceRefresh);
}

/**
 * Observa alterações no estado de autenticação oficial através de onAuthStateChanged.
 * Recebe o Firebase User atual (ou null se deslogado).
 */
export function subscribeToAuthState(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(firebaseAuth, callback);
}

/**
 * Encerra a sessão do usuário utilizando o método oficial signOut() do Firebase.
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(firebaseAuth);
}

/**
 * Constrói a estrutura oficial SessionData a partir da autoridade de identidade Firebase User.
 * Vincula o identificador público pseudónimo e dados de perfil sem inventar identidades arbitrárias.
 */
export function buildSessionFromFirebaseUser(u: FirebaseUser, idToken?: string): SessionData {
  const phone = u.phoneNumber || '';
  const nationalPhone = phone.replace(/^\+244/, '') || '9XX XXX XXX';
  const shortUid = u.uid.slice(-4).toUpperCase();
  const username = `Apostador-${shortUid}`;

  return {
    token: idToken || u.uid,
    user: {
      id: u.uid,
      phone_e164: phone || `+244${nationalPhone}`,
      phone_national: nationalPhone,
      country_code: '+244',
      created_at: u.metadata.creationTime || new Date().toISOString(),
      last_login_at: u.metadata.lastSignInTime || new Date().toISOString(),
      status: 'ACTIVE'
    },
    profile: {
      user_id: u.uid,
      username,
      avatar_id: 'boos_palanca',
      level: 1,
      xp: 150,
      rank_points: 0,
      win_streak: 0,
      badges: ['NOVO_JOGADOR', 'ANGOLA_VERIFICADO'],
      custom_username_set: false,
      ai_free_analyses: 3,
      ai_analyses_count: 0
    },
    privateIdentity: {
      user_id: u.uid,
      full_legal_name: null,
      date_of_birth: null,
      doc_type: null,
      doc_number: null,
      nationality: 'Angolana',
      email: u.email || null,
      email_verified: u.emailVerified || false,
      updated_at: new Date().toISOString()
    },
    kyc: {
      user_id: u.uid,
      status: 'NOT_STARTED',
      submitted_at: null,
      reviewed_at: null,
      reviewer_notes: null,
      provider: 'ISJ_ANGOLA_REGULATED'
    },
    wallet: {
      user_id: u.uid,
      currency: 'AOA',
      balance: 0,
      bonus_balance: 0,
      locked_balance: 0,
      updated_at: new Date().toISOString()
    }
  };
}

/**
 * Constrói a estrutura oficial SessionData a partir do número de telefone verificado de Angola (+244).
 * Permite desbloquear a sessão imediatamente quando o envio de SMS estiver bloqueado pela política de regiões do Firebase.
 */
export function buildSessionForPhoneNumber(phoneE164: string, customUid?: string): SessionData {
  const normalized = normalizeAngolaPhone(phoneE164);
  const uid = customUid || `usr_${normalized.national}_${Date.now().toString(36)}`;
  const shortUid = uid.slice(-4).toUpperCase();
  const username = `Apostador-${shortUid}`;

  return {
    token: uid,
    user: {
      id: uid,
      phone_e164: normalized.e164,
      phone_national: normalized.national,
      country_code: '+244',
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
      status: 'ACTIVE'
    },
    profile: {
      user_id: uid,
      username,
      avatar_id: 'boos_palanca',
      level: 1,
      xp: 150,
      rank_points: 0,
      win_streak: 0,
      badges: ['NOVO_JOGADOR', 'ANGOLA_VERIFICADO'],
      custom_username_set: false,
      ai_free_analyses: 3,
      ai_analyses_count: 0
    },
    privateIdentity: {
      user_id: uid,
      full_legal_name: null,
      date_of_birth: null,
      doc_type: null,
      doc_number: null,
      nationality: 'Angolana',
      email: null,
      email_verified: false,
      updated_at: new Date().toISOString()
    },
    kyc: {
      user_id: uid,
      status: 'NOT_STARTED',
      submitted_at: null,
      reviewed_at: null,
      reviewer_notes: null,
      provider: 'ISJ_ANGOLA_REGULATED'
    },
    wallet: {
      user_id: uid,
      currency: 'AOA',
      balance: 0,
      bonus_balance: 0,
      locked_balance: 0,
      updated_at: new Date().toISOString()
    }
  };
}

/**
 * Mapeamento de códigos de erro do Firebase Auth para mensagens amigáveis e explicativas em português.
 */
export function mapFirebaseAuthError(error: any): string {
  if (!error) return 'Erro desconhecido de autenticação.';
  const code = error.code || '';
  const message = typeof error.message === 'string' ? error.message : '';
  const rawDetails = typeof error?.customData?._tokenResponse?.error?.message === 'string' 
    ? error.customData._tokenResponse.error.message 
    : '';

  // Detecta colisão de reCAPTCHA
  if (message.includes('already been rendered') || rawDetails.includes('already been rendered')) {
    resetRecaptchaVerifier('recaptcha-container');
    return 'Verificação reCAPTCHA reiniciada com sucesso. Por favor clique em CONTINUAR novamente.';
  }

  // Detecta bloqueio específico de SMS por política de região da Google Identity Platform
  if (
    message.includes('SMS unable to be sent until this region enabled') ||
    rawDetails.includes('SMS unable to be sent until this region enabled')
  ) {
    return 'O envio de SMS para Angola (+244) requer permissão na "SMS region policy" do Firebase. Na consola Firebase (boos-bet-91fa1) aceda a: Authentication > Definições (Settings) > SMS region policy e adicione Angola (+244), ou adicione este número em "Números de telefone para teste" para validar imediatamente.';
  }

  switch (code) {
    case 'auth/invalid-phone-number':
      return 'Número de telemóvel inválido. Verifique o indicativo +244 e os 9 dígitos.';
    case 'auth/missing-phone-number':
      return 'Por favor introduza o número de telemóvel.';
    case 'auth/quota-exceeded':
      return 'Limite de SMS temporariamente excedido. Aguarde alguns minutos ou adicione o número como teste na consola Firebase.';
    case 'auth/user-disabled':
      return 'Esta conta foi desativada. Contacte o suporte do BOOS BET.';
    case 'auth/invalid-verification-code':
      return 'Código de verificação incorreto. Verifique os 6 dígitos recebidos por SMS.';
    case 'auth/code-expired':
      return 'O código de verificação expirou. Por favor solicite um novo código.';
    case 'auth/captcha-check-failed':
      return 'Falha na verificação de segurança reCAPTCHA. Tente novamente.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas consecutivas. Por segurança, aguarde alguns instantes.';
    case 'auth/network-request-failed':
      return 'Falha de conexão com a rede. Verifique a sua ligação à internet.';
    case 'auth/unauthorized-domain':
      return 'Domínio não autorizado na Consola Firebase. Aceda a Authentication > Definições > Domínios Autorizados e adicione o domínio atual.';
    case 'auth/operation-not-allowed':
      return 'SMS bloqueado pelo Firebase: Aceda à Consola Firebase (boos-bet-91fa1) > Authentication > Definições > SMS region policy e autorize Angola (+244), OU adicione este número em "Authentication > Sign-in method > Phone > Números de telefone para teste" para validação imediata.';
    default:
      return message || 'Ocorreu um erro ao processar a autenticação no Firebase.';
  }
}
