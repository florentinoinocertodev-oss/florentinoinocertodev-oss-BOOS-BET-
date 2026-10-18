# BOOS BET — IMPLEMENTATION READINESS REPORT (DOCUMENTO F)
## Inventário de Código Existente, Descontaminação de Marca e Matriz de Maturidade

> **Status**: Architecture Review — Implementation Frozen  
> **Classificação de Prontidão**: **NOT READY FOR PRODUCTION IMPLEMENTATION**  
> **Alvo Obrigatório**: L2 Production Baseline

---

### 1. INVENTÁRIO DO CÓDIGO ATUAL E PLANO DE DISPOSIÇÃO

| Componente / Arquivo | Classificação | Justificativa Arquitetural | Ação de Disposição Futura |
|---|---|---|---|
| `server/db/store.ts` | **REMOVE** | Monólito em memória com persistência em JSON (`db.json`) e saldo inicial fictício (`balance: 10000`). Contradiz o Ledger e a autoridade do Firestore. | Preservar estático durante auditoria; descontinuar integralmente na migração das Functions. |
| `server/data/db.json` | **REMOVE** | Base de dados em arquivo local com dados sintéticos e credenciais inseguras em texto plano. | Preservar estático durante auditoria; excluir do ambiente de produção. |
| `server/routes/api.ts` | **REPLACE** | Rotas Express com lógica financeira mockada (`/wallet/deposit`, `/wallet/withdraw`), dados fictícios (`SAMPLE_MATCHES`) e Crash game. | Substituir progressivamente por HTTPS Callables e webhooks isolados no Cloud Functions. |
| `server/auth/controller.ts` | **REMOVE** | Gerador caseiro de OTPs e sessões manuais de autenticação. Viola a autoridade do Firebase Phone Auth. | Descontinuar e substituir integralmente pelo SDK oficial do Firebase Authentication. |
| `server/sms/*` (6 arquivos) | **REMOVE** | Provedores SMS legados (Twilio, Infobip, Africa's Talking) e simulador local sem homologação. | Descontinuar; a entrega de SMS é autoridade nativa do Firebase Phone Auth. |
| `server/predictions/aiPredictor.ts` | **REFACTOR** | Lógica analítica com Google GenAI. Possui valor técnico, mas continha fallbacks fictícios (`fakeMatch`). | Refatorar para atuar como função serveless pura de consulta a dados desportivos verificados. |
| `src/services/api.ts` | **REPLACE** | Camada de transporte HTTP consumindo o servidor Express legado e tokens manuais de `localStorage`. | Substituir por chamadas diretas ao SDK do Firestore e `httpsCallable` do Firebase. |
| `src/components/WalletModal.tsx` | **REFACTOR** | Camada visual de depósito e saque rica, mas chamando endpoints de simulação local. | Adaptar a interface para renderizar referências Multicaixa Express reais geradas pelo PSP. |
| `src/components/BoosBetSlip.tsx` | **REFACTOR** | Excelente componente de composição de apostas no cliente. | Manter como montador de intenção (BetSlip) e conectar ao contrato `placeBetTicket` no backend. |
| `src/components/Sportsbook.tsx` | **REFACTOR** | Vitrine desportiva visualmente madura, consumindo partidas estáticas de `SAMPLE_MATCHES`. | Conectar ao listener reativo da coleção `/events` populada pelo `SportsProviderAdapter`. |
| `src/components/AuthModal.tsx` | **REFACTOR** | Modal de autenticação funcional. | Integrar diretamente com `signInWithPhoneNumber` e `RecaptchaVerifier` já preparados no repositório. |
| `src/components/KycSection.tsx` | **REFACTOR** | Formulário de upload visualmente adequado, mas simulando envio com nomes de arquivos cosméticos. | Conectar ao fluxo em 2 fases: upload para bucket privado do Storage + Callable `requestKycSubmission`. |
| `src/services/notificationService.ts` | **REPLACE** | Persistência de notificações em `localStorage`. | Substituir por subcoleção `/users/{uid}/notifications` atualizada exclusivamente pelo backend. |
| `src/components/FimserWin.tsx` | **REMOVE** | Jogo de Crash herdado do projeto anterior. Completamente fora do escopo de apostas desportivas. | Desativar da árvore de rotas e remover permanentemente na fase de limpeza. |
| `src/components/brand/BoosCasinoArea.tsx` | **REMOVE** | Vitrine de jogos fictícios de casino (Roleta, Slots, Blackjack). Fora do escopo da V1. | Desativar da árvore de rotas e remover permanentemente. |
| `src/components/SmsGatewayModal.tsx` | **REMOVE** | Simulador administrativo de SMS. | Desativar e remover permanentemente. |

---

### 2. DESCONTAMINAÇÃO CONCEITUAL E DE MARCA
O **BOOS BET** é uma plataforma e marca independente. Fica formalmente estabelecida a purificação completa de qualquer dependência ou referência a:
- `FIMSER WIN`: Descontinuado e isolado.
- `FIMSER Bet`: Descontinuado.
- `FIMX` e `INOLINK`: Desvinculados.
- **Alegações Regulatórias Fictícias**: Removidas ou neutralizadas todas as menções a *"Licença #044 do ISJ"* e certificações não emitidas oficialmente pelo órgão regulador angolano.

---

### 3. SEPARAÇÃO ESTRITA DE AMBIENTES

| Dimensão | Desenvolvimento (DEV / Local) | Homologação (STAGING) | Produção (PRODUCTION) |
|---|---|---|---|
| **Ambiente de Banco** | Firebase Emulators / Projeto Dev | Projeto Firebase Staging | Projeto `boos-bet-91fa1` isolado |
| **Identidade / Auth** | Telefones de teste registrados no console | Telefones de teste controlados | Números reais de Angola (+244) |
| **PSP / Pagamentos** | Sandbox / Mock controlado no adapter | Sandbox oficial do PSP | Gateway bancário real em produção |
| **Odds / Dados** | Fixtures estáticas isoladas de teste | Feed de testes do fornecedor | Feed em tempo real homologado |
| **App Check** | Debug Token Provider | Debug Token Provider | reCAPTCHA Enterprise & Play Integrity ativo |
| **Garantia Anti-Poluição** | Fixtures nunca entram em Staging | Dados de teste nunca entram em Prod | **Zero Mock / Zero Fake Data** |

---

### 4. MATRIZ FINAL DE READINESS POR ÁREA (SEÇÃO 33)

| Área Funcional | Estado Atual | Problema Identificado | Impacto Operacional | Decisão Necessária |
|---|:---:|---|---|---|
| **Identity** | `APPROVED WITH CORRECTION` | Tokens JWT podem manter validade por até 60 min após suspensão do utilizador. | Risco de jogador suspenso ou autoexcluído continuar apostando durante a janela do token. | Dupla verificação atómica de `status === 'ACTIVE'` no Firestore em toda operação sensível. |
| **Wallet** | `APPROVED WITH CORRECTION` | Visão materializada precisa de protocolo de fail-closed caso divirja do histórico do Ledger. | Inconsistência de saldo se uma transação for interrompida de forma anômala. | Congelamento automático (`FROZEN`) da carteira e emissão de alerta em caso de divergência com o Ledger. |
| **Ledger** | `APPROVED WITH CORRECTION` | Imutabilidade não pode depender exclusivamente de Security Rules devido aos privilégios do Admin SDK. | Operador mal-intencionado ou bug no backend poderia teoricamente alterar registros contábeis. | Encapsulamento de código sem métodos de update/delete, IAM restrito e exportação diária com Bucket Lock. |
| **Accounting** | `BLOCKED` | A conta `house:liability_reserve` não tem natureza contábil definida (Despesa vs Fundo de Ativo). | Impossibilita o fechamento da partida dobrada na liquidação de prémios vencedores. | **DECISION REQUIRED 3**: Parecer contábil definindo a contrapartida dos payouts de jogadores. |
| **Deposits** | `BLOCKED` | O provedor concreto de pagamentos (PSP) em Angola não está contratado nem homologado. | Impossibilita a geração de referências bancárias reais e a escrita do receptor de webhooks. | **DECISION REQUIRED 1**: Homologação contratual de AppyPay, ProxyPay ou EMIS GPO. |
| **Withdrawals** | `BLOCKED` | O fluxo de envio bancário depende do gateway PSP e da política de taxas de transferência. | Risco de falha de conciliação bancária ou absorção indevida de taxas pela casa. | **DECISION REQUIRED 1**: Homologação do PSP e definição de titularidade de custos de saque. |
| **Odds** | `BLOCKED` | Provedor de feeds desportivos não está contratado; política de slippage não definida. | Impossibilita a exibição de partidas reais e a resolução de flutuações de cotação no aceite. | **DECISION REQUIRED 2 e 6**: Contrato do feed desportivo e escolha da estratégia de slippage. |
| **Bets** | `BLOCKED` | Limites numéricos concretos de risco (stake mín/máx, payout cap) não estão aprovados. | O motor de validação não pode calibrar as regras de rejeição de bilhetes. | **DECISION REQUIRED 4**: Aprovação formal da matriz de limites da `BettingRiskPolicy`. |
| **Settlement** | `BLOCKED` | Política de exposição da casa e modelo de tratamento de adiamentos não estão calibrados. | Risco de solvência em caso de concentração excessiva de apostas num único mercado. | **DECISION REQUIRED 5**: Definição da política de exposição máxima e teto por evento. |
| **KYC** | `APPROVED WITH CORRECTION` | Identificadores de documentos e validação de magic bytes exigiam independência de extensões. | Potencial upload de arquivos maliciosos mascarados com cabeçalho de imagem. | Padronização de caminho `kyc/{uid}/{case_id}/{doc_id}` e validação binária pelo worker. |
| **Responsible Gaming** | `DECISION REQUIRED` | Limites obrigatórios e regras legais de autoexclusão dependem de homologação jurídica. | Não conformidade regulatória com a legislação angolana de jogos de fortuna e azar. | Parecer jurídico formal do responsável de compliance com os prazos e limites legais aplicáveis. |
| **Security** | `APPROVED WITH CORRECTION` | App Check deve ser implantado inicialmente em modo de monitoramento antes do bloqueio estrito. | Risco de bloquear utilizadores legítimos com conexões lentas ou navegadores antigos. | Faseamento do App Check: monitoramento de métricas antes de enforcement pleno em produção. |
| **PSP** | `BLOCKED` | Dependência total da contratação do fornecedor comercial e chaves HMAC. | Bloqueio total da camada financeira de depósitos e retiradas. | **DECISION REQUIRED 1**: Assinatura de contrato comercial e obtenção de credenciais de produção. |
| **Sports Provider** | `BLOCKED` | Dependência total da contratação da API de dados com cobertura do Girabola ZAP. | Bloqueio total da ingestão de eventos e mercados de apostas. | **DECISION REQUIRED 2**: Assinatura de contrato comercial com o fornecedor de odds. |
| **AI (BOOS AI)** | `APPROVED WITH CORRECTION` | Rate limiting e isolamento total do Ledger e das cotações oficiais documentados. | Risco mitigado: a IA atua puramente como suporte consultivo e estatístico. | Nenhuma pendência; fronteira de contenção 100% blindada e especificada. |
| **Notifications** | `APPROVED WITH CORRECTION` | Risco de falhas no FCM duplicarem ou abortarem operações financeiras síncronas. | Inconsistência operacional na experiência do jogador em caso de retry de rede. | Adoção do padrão Transactional Outbox Pattern com despacho assíncrono idempotente. |
| **Audit** | `APPROVED WITH CORRECTION` | Armazenamento de dados sensíveis e falsificação de IP precisavam de blindagem estrita. | Vazamento de dados em logs forenses ou adulteração de cabeçalhos de auditoria. | Princípio de Minimização de Dados (hashes) e captura de IP observada exclusivamente pelo backend. |
| **Operations** | `DECISION REQUIRED` | Políticas de RPO, RTO e procedimentos de Disaster Recovery ainda não formalizados. | Indefinição do tempo máximo de restauração aceitável pela diretoria em caso de falha de nuvem. | Definição formal pela equipe de infraestrutura dos tempos alvo de recuperação de desastres. |

---

### 5. CONCLUSÃO DE PRONTIDÃO
A arquitetura do **BOOS BET V1.1** está **matematicamente, contabilmente e conceitualmente endurecida**. Não existem mais premissas tácitas de mock ou criação de dinheiro fictício.  
Contudo, a passagem para a fase de implementação técnica de código está **formalmente bloqueada** até que o núcleo humano emita os pareceres das 6 Decisões Requeridas principais (`DECISION REQUIRED 1 a 6`).
