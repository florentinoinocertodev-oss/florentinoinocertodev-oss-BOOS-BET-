# BOOS BET — RELATÓRIO TÉCNICO DE IMPLEMENTAÇÃO: FASE AUTH-001
## Autenticação Telefônica Oficial via Firebase Phone Authentication

> **Status da Fase**: 🟢 **GREEN — IMPLEMENTAÇÃO CONCLUÍDA E VERIFICADA**  
> **Papel**: Executor / Construtor Técnico  
> **Diretiva de Autoridade**: «Frontend apresenta e solicita. Backend autoriza e calcula. Firebase Authentication é a autoridade de identidade.»  

---

### 1. IDENTIFICAÇÃO E PROJETO FIREBASE HOMOLOGADO

Todas as configurações e chamadas estão estritamente vinculadas ao projeto oficial aprovado:

- **Firebase Project ID**: `boos-bet-91fa1`
- **Firebase Project Number**: `62770462117`
- **Firebase Web App**: `BOOS BET`
- **Web App ID**: `1:62770462117:web:8d0f4bed16fca0f93f7c4c`
- **Auth Domain**: `boos-bet-91fa1.firebaseapp.com`
- **Firestore Database ID**: `ai-studio-fimserbetauth-a089bc36-b41b-4132-843b-ed192c773aa0`
- **Projetos Banidos e Isolados**: `fimser-win`, `fimx-cf23e` (zero vinculação no código).

---

### 2. ARQUITETURA TÉCNICA IMPLEMENTADA

#### 2.1. Serviço Oficial de Autenticação (`src/services/firebaseAuthService.ts`)
Implementado módulo encapsulado consumindo diretamente o SDK v10 do Firebase (`firebase/auth`):

1. **`setupRecaptchaVerifier(containerId)`**:
   - Criação e ciclo de vida do `RecaptchaVerifier` invisível do Firebase para mitigação de bots e conformidade anti-abuso de SMS.
   - Prevenção de colisões com limpeza (`clear()`) de instâncias órfãs.

2. **`sendPhoneCode(phoneNumberE164, verifier)`**:
   - Validação estrita do indicativo internacional de Angola (+244).
   - Validação do formato E.164: exige exatamente 9 dígitos móveis angolanos após o indicativo (+244 9XX XXX XXX).
   - Invocação da primitiva oficial `signInWithPhoneNumber(firebaseAuth, cleanNumber, appVerifier)`.
   - Retorno do objeto canónico `ConfirmationResult`.

3. **`confirmPhoneCode(confirmationResult, verificationCode)`**:
   - Validação do código OTP de 6 dígitos numéricos.
   - Invocação de `confirmationResult.confirm(code)`.
   - Obtenção do objeto oficial `UserCredential` e do `User` emitido pelo Firebase Authentication.

4. **`subscribeToAuthState(callback)`**:
   - Observador reativo de estado de sessão oficial via `onAuthStateChanged`.
   - Emissão de estados canónicos: `AUTHENTICATING`, `AUTHENTICATED`, `UNAUTHENTICATED`, `AUTH_ERROR`.
   - Extração do Firebase ID Token (`getIdToken()`) sob demanda, eliminando dependência de persistência arbitrária no cliente.

5. **`signOut()`**:
   - Destruição da sessão oficial através de `firebaseSignOut(firebaseAuth)`.

6. **`mapFirebaseAuthError(error)`**:
   - Tradução e mapeamento determinístico dos códigos de erro do Firebase Auth (`auth/invalid-phone-number`, `auth/quota-exceeded`, `auth/invalid-verification-code`, `auth/code-expired`, `auth/too-many-requests`, `auth/operation-not-allowed`) para mensagens contextuais em língua portuguesa.

---

#### 2.2. Integração no Frontend (`src/components/AuthModal.tsx` & `src/App.tsx`)

1. **Interface do Modal (`AuthModal.tsx`)**:
   - Contêiner invisível `<div id="recaptcha-container"></div>` montado e disponível no ciclo de vida do modal.
   - Validação em tempo real dos prefixos móveis angolanos (91, 92, 93, 94, 95, 99).
   - Inputs segmentados para os 6 dígitos do SMS com suporte a colar (paste) e foco automático.
   - Temporizadores de expiração (300 segundos) e cooldown de reenvio (60 segundos).
   - Zero simulação de SMS: invoca diretamente a autoridade do Firebase Phone Auth.
   - Saldo inicial estritamente zerado (`balance: 0 AOA`) na inicialização da sessão do utilizador, cumprindo os invariantes financeiros.

2. **Ciclo de Vida na Raiz da Aplicação (`App.tsx`)**:
   - Inicialização do observador `subscribeToAuthState` no `useEffect` de raiz.
   - Encerramento de sessão chamando `signOut()` oficial do Firebase.

---

### 3. CONFORMIDADE COM AS INVARIANTES DE PRODUÇÃO E GOVERNANÇA

| Invariante | Status | Verificação |
|---|:---:|---|
| **Zero OTP Caseiro** | 🟢 CONFORME | Nenhum gerador de código aleatório, sem endpoints legados em `server/` para emitir OTP. |
| **Zero Tokens Fictícios** | 🟢 CONFORME | Tokens de autorização são Firebase ID Tokens gerados e criptografados pela infraestrutura Google. |
| **Zero Mock Financeiro** | 🟢 CONFORME | Novos utilizadores são inicializados com saldo de 0 AOA. Nenhuma criação sintética de fundos. |
| **Suporte Obrigatório a Angola** | 🟢 CONFORME | Validação canónica de +244 com 9 dígitos obrigatórios. |
| **Segurança no Firestore** | 🟢 CONFORME | `firestore.rules` bloqueia qualquer mutação de perfil sensível (`role`, `status`, `phone_number`) ou escrita em carteira pelo cliente. |

---

### 4. RESULTADO DA VALIDAÇÃO TÉCNICA

- **Compilação (`compile_applet`)**: ✅ SUCESSO (0 erros, 0 avisos bloqueantes).
- **Linter / TypeScript (`lint_applet`)**: ✅ SUCESSO (`tsc --noEmit` completado sem erros).
- **Ambiente de Execução**: Servidor Vite / Node operacional na porta 3000.

---

STATUS FINAL:
\"AUTH-001 INFRASTRUCTURE OPERATIONAL — READY FOR VERIFICATION\"
