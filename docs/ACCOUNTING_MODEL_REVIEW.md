# BOOS BET — ACCOUNTING MODEL REVIEW (DOCUMENTO B)
## Auditoria Técnica do Plano de Contas, Partida Dobrada e Fluxos Contábeis

> **Status**: Architecture Review — Implementation Frozen  
> **Classificação Contábil**: Sistema de Partida Dobrada Imutável (Double-Entry Bookkeeping)  
> **Escala Canónica**: Moeda `AOA`, Fator $10^2$ (`MONETARY_SCALE = 100`, inteiros em minor units).

---

### 1. AUDITORIA DO CHART OF ACCOUNTS (PLANO DE CONTAS)

A análise contábil das contas propostas revela a necessidade de formalização estrita de suas naturezas econômicas:

#### 1.1 `wallet:{uid}:available`
- **Natureza**: Passivo Exigível da Casa (*Customer Deposit Liability*).
- **Saldo Normal**: Credor ($\ge 0$). Débitos só podem ocorrer se $\text{Saldo} - \text{Débito} \ge 0$.
- **Proprietário**: Utilizador (`owner_uid = uid`).
- **Origem de Movimentação**: Depósitos confirmados, aceitação de apostas (saída), liquidação de prémios (entrada), reserva de saques (saída) e estornos autorizados.

#### 1.2 `wallet:{uid}:locked`
- **Natureza**: Passivo Segregado da Casa (*Pending Withdrawal Escrow*).
- **Saldo Normal**: Credor ($\ge 0$).
- **Proprietário**: Utilizador (`owner_uid = uid`).
- **Regra de Uso**: Reservado **exclusivamente** para o ciclo de retiradas pendentes. É expressamente proibido o seu uso para apostas, bónus ou margem de risco.

#### 1.3 `house:bet_escrow`
- **Natureza**: Passivo Transitório de Terceiros (*Wager Custody / Escrow*).
- **Saldo Normal**: Credor ($\ge 0$).
- **Proprietário**: Institucional / Casa (`owner_uid = null`).
- **Princípio**: *Stake recebido $\neq$ Receita da casa*. O valor permanece sob custódia e só é transferido para receita (`house:revenue`) após confirmação formal da derrota desportiva.

#### 1.4 `psp:clearing:{psp_id}`
- **Natureza**: Ativo Circulante / Direitos a Receber (*Receivables from Payment Gateways*).
- **Saldo Normal**: Devedor.
- **Proprietário**: Institucional (`owner_uid = null`).
- **Significado**: Representa fundos que o PSP atestou como recebidos do jogador, mas que ainda não foram liquidados financeiramente na conta bancária corporativa da casa.

#### 1.5 `psp:outbound:{psp_id}`
- **Natureza**: Ativo Transitório / Conta de Compensação de Saques (*Disbursement Clearing*).
- **Saldo Normal**: Devedor.
- **Proprietário**: Institucional (`owner_uid = null`).
- **Significado**: Fundos retirados do passivo do jogador e encaminhados para ordem de transferência bancária no PSP.

#### 1.6 `house:revenue`
- **Natureza**: Conta de Resultado / Receita Bruta de Jogo (*Gross Gaming Revenue - GGR*).
- **Saldo Normal**: Credor.
- **Proprietário**: Institucional (`owner_uid = null`).
- **Alimentação**: Recebe exclusivamente os stakes de apostas perdedoras e eventuais taxas de serviço regulamentadas.

#### 1.7 `house:refund_pool`
- **Natureza**: Conta Técnica de Compensação (*Clearing Transit*).
- **Saldo Normal**: Saldo Líquido Zero ($= 0$).
- **Finalidade**: Intermediar compensações em apostas declaradas `VOID` ou partidas canceladas.

#### 1.8 `system:adjustment`
- **Natureza**: Conta de Contrapartida Patrimonial (*Equity / Regulatory Adjustment*).
- **Finalidade**: Registrar ajustes autorizados sob protocolo de auditoria e aprovação de supervisores.

---

### 2. AUDITORIA CRÍTICA: A CONTA `house:liability_reserve` E O FINANCIAMENTO DE PAYOUTS

#### 2.1 O Problema Contábil Identificado
No lançamento conceitual de aposta vencedora ($Stake = 10.000$, $Odd = 3.00$, $Payout = 30.000$):
- DÉBITO `house:bet_escrow` = $10.000$
- DÉBITO `house:liability_reserve` = $20.000$
- CRÉDITO `wallet:{uid}:available` = $30.000$

**Inconsistência Técnica**: Se `house:liability_reserve` for tratada simplesmente como um passivo, debitá-la gerará saldo devedor contínuo caso ela não receba aportes contábeis formais.  
Para que um débito em conta de reserva seja contabilmente válido e balanceado, a conta deve representar:
- **Opção A (Conta de Custo / Despesa de Prémio)**: `house:payout_expense` (Conta de Resultado / Despesa Operacional que reduz o GGR da casa).
- **Opção B (Fundo de Caixa Segregado)**: Ativo de reserva pré-constituído com aporte de capital inicial dos sócios (`house:liquidity_asset`).
- **Opção C (Reserva Técnica de Contingência)**: Passivo de provisão de prémios alimentado por alíquota percentual sobre o volume apostado.

*Classificação*: **ACCOUNTING BLOCKER / DECISION REQUIRED**.  
O executor técnico **não pode decidir autonomamente** qual é o regime contábil adotado pela empresa. A estrutura de financiamento de prémios exige parecer formal do contador/auditor humano do projeto.

---

### 3. AUDITORIA DO FLUXO DE RETIRADA (WITHDRAWAL)

#### 3.1 Avaliação do Fluxo Proposto V1.1
- **Fase 1 (Reserva)**:
  - DÉBITO `wallet:{uid}:available` $X$
  - CRÉDITO `wallet:{uid}:locked` $X$
  - *Avaliação*: **Perfeita**. Segrega o passivo sem alterar o patrimônio da casa.
- **Fase 2 (Envio Bancário ao PSP)**:
  - DÉBITO `wallet:{uid}:locked` $X$
  - CRÉDITO `psp:outbound:{psp_id}` $X$
  - *Problema Técnico Detectado*: Se `psp:outbound` for um Ativo devedor, creditá-la aumentará seu saldo credor, atuando como passivo transitório (*Withdrawal Payable*).
- **Fase 3 (Confirmação de Pagamento pelo PSP)**:
  - Se o PSP liquida o valor na conta bancária do jogador, a casa deve dar baixa no seu direito a receber do PSP ou reconhecer o pagamento pela conta bancária corporativa:
  - DÉBITO `psp:outbound:{psp_id}` $X$
  - CRÉDITO `psp:clearing:{psp_id}` $X$ (ou `bank:corporate_cash`)

*Recomendação Técnica*: Formalizar `psp:outbound:{psp_id}` estritamente como **Passivo de Saques a Pagar (*Withdrawal Payable to PSP*)** para que o fluxo obedeça à teoria clássica das contas contábeis.

---

### 4. ESPECIFICAÇÃO TÉCNICA FORMAL DO LEDGER (JOURNAL & JOURNAL_ENTRY)

#### 4.1 Entidade `Journal` (Voucher Contábil Atómico)
```typescript
export interface Journal {
  journal_id: string;               // Identificador primário: "jnl_{uuid}"
  transaction_id: string;          // Vínculo com a FinancialTransaction: "ftx_{uuid}"
  transaction_group_id: string;    // Agrupa operações correlatas (ex: saque pedido + saque pago)
  idempotency_key: string;         // Chave de deduplicação da operação
  correlation_id: string;          // ID de rastreabilidade de ponta a ponta da requisição HTTP
  actor_type: 'USER' | 'SYSTEM' | 'PSP_WEBHOOK' | 'COMPLIANCE';
  actor_id: string;                // UID do utilizador ou identificador do serviço backend
  status: 'COMMITTED' | 'REVERSED';
  total_debit_minor: number;       // Inteiro estrito > 0
  total_credit_minor: number;      // Inteiro estrito > 0 (Igual a total_debit_minor)
  reversal_of_journal_id?: string; // Preenchido se for um lançamento estornador
  reason: string;                  // Descrição formal da operação
  created_at: string;              // ISO 8601 UTC
}
```

#### 4.2 Entidade `JournalEntry` / `LedgerPosting` (Linha do Lançamento)
```typescript
export interface LedgerPosting {
  entry_id: string;                // Identificador primário: "led_{uuid}"
  journal_id: string;              // Chave estrangeira para Journal
  account_id: string;              // Ex: "wallet:usr_123:available", "house:bet_escrow"
  account_type: 'USER_AVAILABLE' | 'USER_LOCKED' | 'HOUSE_ESCROW' | 'HOUSE_REVENUE' | 'PSP_CLEARING' | 'PSP_OUTBOUND' | 'SYSTEM_ADJUSTMENT';
  owner_uid: string | null;        // Preenchido estritamente para contas de usuários
  direction: 'DEBIT' | 'CREDIT';
  amount_minor: number;            // Inteiro estrito > 0
  balance_after_minor: number;     // Snapshot auditável do saldo da conta após o lançamento
  created_at: string;              // ISO 8601 UTC
}
```

*Invariante Absoluta do Journal*:
$$\text{total\_debit\_minor} \equiv \text{total\_credit\_minor} \equiv \sum_{\text{direction} = \text{'DEBIT'}} \text{amount\_minor} \equiv \sum_{\text{direction} = \text{'CREDIT'}} \text{amount\_minor}$$

---

### 5. RECONCILIAÇÃO CONTÁBIL AUTOMATIZADA (LEDGER $\leftrightarrow$ WALLET PROJECTION)

A Wallet não é a autoridade; é uma **projeção materializada de alta velocidade**.
A cada 24 horas (ou sob demanda por gatilho de auditoria), o serviço `financialReconciliationWorker` executa:

$$\text{ExpectedAvailableBalance}(uid) = \sum_{p \in \text{Postings}(uid, \text{'available'})} (\text{Credit} - \text{Debit})$$
$$\text{ExpectedLockedBalance}(uid) = \sum_{p \in \text{Postings}(uid, \text{'locked'})} (\text{Credit} - \text{Debit})$$

- Se $\text{ExpectedAvailableBalance} \neq \text{wallet.available\_minor}$ ou $\text{ExpectedLockedBalance} \neq \text{wallet.locked\_minor}$:
  1. A carteira é imediatamente marcada com `status = 'FROZEN'`.
  2. Um evento crítico é gerado em `/security_events` com código `FINANCIAL_RECONCILIATION_FAILURE`.
  3. Todas as operações de aposta e saque do utilizador são bloqueadas (*Fail-Closed*).
  4. Um operador com claim `COMPLIANCE` ou `ADMIN` deve analisar o extrato forense antes de autorizar o descongelamento.
