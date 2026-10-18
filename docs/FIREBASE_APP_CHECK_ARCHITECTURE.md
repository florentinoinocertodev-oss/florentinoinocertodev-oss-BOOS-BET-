# BOOS BET — ARQUITETURA DO FIREBASE APP CHECK
## Proteção de Borda, Prevenção de Bots e Raspagem de Odds

> **Projeto Firebase Oficial**: `boos-bet-91fa1` (Número: `62770462117`)  
> **Status**: Arquitetura Preparada (Non-Enforcing / Sem Bloqueio Ativo)

---

### 1. OBJETIVO DO APP CHECK NO BOOS BET
Garantir que todas as requisições destinadas ao Firestore, Cloud Functions e Firebase Storage provenham exclusivamente da aplicação oficial do BOOS BET (SPA Web e futuramente App Android nativo), bloqueando:
- Scripts automatizados de raspagem (*scraping*) de odds em tempo real;
- Chamadas diretas de emuladores ou ferramentas HTTP (Postman/Curl) às Cloud Functions;
- Ataques de força bruta a endpoints de autenticação e verificação.

---

### 2. PROVEDORES DE ATESTAÇÃO POR PLATAFORMA

| Plataforma | Provedor Oficial Firebase | Mecanismo de Atestação |
|---|---|---|
| **Web SPA (Produção)** | **reCAPTCHA Enterprise** | Atestação baseada em pontuação de risco invisível do Google Cloud |
| **Android (Produção)** | **Play Integrity** | Atestação de integridade de hardware e assinatura criptográfica do APK |
| **Ambiente de Testes / CI** | **Debug Token Provider** | Token temporário registrado no console do Firebase para emuladores |

---

### 3. FASES DE ATIVAÇÃO E ENFORCEMENT
1. **Fase 1 (Atual - Baseline)**: Configuração registrada em código sem enforcement ativo no console do Firebase. Nenhuma requisição de desenvolvedor ou utilizador é bloqueada.
2. **Fase 2 (Monitoramento / Métricas)**: Registro de métricas no console do Firebase para aferir a porcentagem de tráfego verificado vs não verificado.
3. **Fase 3 (Enforcement Pleno)**: Ativação formal do bloqueio no console do Firebase após validação de todos os domínios de produção.
