# BOOS BET — IMPLEMENTATION BLOCKERS (DOCUMENTO E)
## Inventário Formal de Bloqueadores e Decisões Pendentes do Núcleo de Arquitetura

> **Status**: Architecture Review — Implementation Frozen  
> **Diretiva Absoluta**: Nenhuma implementação de código pode ser iniciada enquanto estes bloqueadores permanecerem em aberto pelo núcleo de decisão humano.

---

### 1. MATRIZ DE BLOQUEADORES ARQUITETURAIS E DE DECISÃO

| Código | Categoria | Descrição do Bloqueador | Impacto no Projeto | Ação Exigida do Núcleo Humano |
|---|---|---|---|---|
| **BLOCKER-01** | `INTEGRATION BLOCKER` | **DECISION REQUIRED 1: Provedor Concreto de PSP**. Indefinição do gateway bancário angolano para Multicaixa Express e GPO. | Impede a escrita do adapter `IPaymentProviderAdapter`, geração de referências e recepção de webhooks. | Homologação comercial e contratual de AppyPay, ProxyPay ou EMIS GPO direto. |
| **BLOCKER-02** | `INTEGRATION BLOCKER` | **DECISION REQUIRED 2: Provedor Concreto de Odds Desportivas**. Indefinição da API de cotações em tempo real com Girabola ZAP. | Impede a ingestão do catálogo `/events` e obriga o frontend a manter dados estáticos legados. | Seleção e assinatura de contrato com provedor de feed (Sportradar, API-Football, etc.). |
| **BLOCKER-03** | `ACCOUNTING BLOCKER` | **DECISION REQUIRED 3: Modelo de Financiamento da Reserva de Prémios (`house:liability_reserve`)**. Natureza contábil da contrapartida dos payouts. | Impede o fechamento balanceado da partida dobrada na liquidação de apostas vencedoras. | Parecer formal contábil: Despesa Operacional (`house:payout_expense`) ou Fundo de Caixa Segregado (`house:liquidity_asset`). |
| **BLOCKER-04** | `ARCHITECTURAL BLOCKER` | **DECISION REQUIRED 4: Limites Numéricos Concretos da Política de Risco**. Indefinição de valores mínimos e máximos. | Impede a validação das regras de negócio na função atómica `placeBetTicket`. | Aprovação da tabela: aposta mínima (ex: 100 Kz), máxima, payout cap e teto de cotação. |
| **BLOCKER-05** | `ARCHITECTURAL BLOCKER` | **DECISION REQUIRED 5: Política de Exposição da Casa (*House Risk / Exposure Policy*)**. Comportamento sob risco concentrado. | Sem essa política, um influxo massivo de apostas num mesmo desfecho pode ultrapassar a solvência da casa. | Definir: suspensão automática de mercado vs redução progressiva do stake máximo por evento. |
| **BLOCKER-06** | `ARCHITECTURAL BLOCKER` | **DECISION REQUIRED 6: Política de Flutuação de Cotações (*Odds Change / Slippage Policy*)**. Comportamento em variação de odds. | Impede a conclusão do algoritmo de aceite de apostas no backend. | Escolha da estratégia: Rejeitar-e-Confirmar (A), Tolerância/Slippage (B) ou Aceite Inalterado (C). |
| **BLOCKER-07** | `SECURITY BLOCKER` | **Governança de Ajustes Financeiros Administrativos (*Maker/Checker*)**. Alçada de controle interno. | Se qualquer administrador puder postar ajustes no Ledger, há risco severo de fraude interna. | Definir o princípio dos 4 olhos (*Four-Eyes Principle*): criação por um operador e aprovação por supervisor. |
| **BLOCKER-08** | `LEGAL/COMPLIANCE` | **Requisitos Legais de Jogo Responsável e KYC em Angola**. Parâmetros regulamentares obrigatórios. | O sistema pode implementar regras inadequadas ou ausentes em relação às diretivas do regulador (ISJ). | Parecer jurídico formal estabelecendo limites diários obrigatórios, idade mínima e prazos de retenção. |
| **BLOCKER-09** | `ARCHITECTURAL BLOCKER` | **Padrão Formal de Serialização Canônica de Hash (Idempotência)**. Ambiguidade na ordenação de JSON. | Risco de hashes divergentes para requisições com dados equivalentes em plataformas distintas (Web vs Android). | Homologação formal da especificação **RFC 8785 (JSON Canonicalization Scheme - JCS)**. |

---

### 2. DECLARAÇÃO DE PARADA OPERACIONAL (STOP CONDITION)
Em rigoroso cumprimento ao princípio de não-invenção arquitetural, o executor técnico suspende qualquer implementação até que o núcleo humano emita os pareceres e decisões formais para os itens acima catalogados.
