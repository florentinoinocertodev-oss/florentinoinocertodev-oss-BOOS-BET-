# BOOS BET — AUTHORITY CONTRACT V1.1 AUDIT (DOCUMENTO A)
## Auditoria Técnica e Refinamento de Especificação de Autoridade

> **Status**: Architecture Review — Implementation Frozen  
> **Papel**: Executor Técnico  
> **Princípio Central**: *O Frontend solicita e apresenta. O Backend autoriza e calcula. O Firestore regista. Sistemas externos confirmam fatos externos.*

---

### 1. SÍNTESE DA AUDITORIA DO AUTHORITY CONTRACT V1.1
A revisão técnica do documento **Authority Contract V1.1** confirma sua robustez conceitual ao dissociar a autoridade do cliente da autoridade do servidor e ao banir práticas anti-padrão de dinheiro fictício. No entanto, foram identificadas **7 áreas críticas de ambiguidade técnica** que devem ser congeladas antes que qualquer linha de código executável seja escrita:

1. **Ambiguidade entre Visão Materializada e Fonte Primária de Verdade**:
   - *Achado*: Seções anteriores poderiam induzir à crença de que `/users/{uid}/wallet/current` é a autoridade financeira primária.
   - *Correção*: O **Ledger (JournalEntry + LedgerEntry)** é a única fonte sagrada de verdade (*Source of Truth*). O documento da Wallet é estritamente uma **projeção materializada de leitura otimizada**. Toda mutação da Wallet é secundária e derivada do somatório estrito dos lançamentos no Ledger.
2. **Defasagem entre Custom Claims e Status Ativo do Utilizador**:
   - *Achado*: Tokens JWT do Firebase Auth possuem validade de até 60 minutos. Um utilizador bloqueado (`status = 'SUSPENDED'` ou `self_excluded`) ainda possui um token criptograficamente válido até sua expiração.
   - *Correção*: Toda Cloud Function executando operações sensíveis (apostar, depositar, solicitar saque) deve consultar obrigatoriamente o documento `/users/{uid}` dentro da transação atómica para verificar `status === 'ACTIVE'` e flags de Jogo Responsável, nunca confiando cegamente apenas no token decodificado.
3. **Escala Numérica e Limitações do Firestore para BigInt**:
   - *Achado*: O Firestore nativo **não suporta** o tipo primitivo `BigInt` de 64/128 bits do JavaScript.
   - *Correção*: Os cálculos de acumuladores no backend utilizam `BigInt` em memória, mas o valor serializado para o Firestore é validado com `Number.isSafeInteger(val)` ($\le 2^{53} - 1 = 9.007.199.254.740.991$) e armazenado como inteiro de 64 bits suportado pela API do Firestore. Valores que ultrapassarem os tetos configurados na `BettingRiskPolicy` são truncados ou rejeitados.
4. **Armazenamento de Snapshot de Resposta em Idempotência**:
   - *Achado*: O mecanismo de idempotência previa o retorno da resposta original para requisições repetidas, mas não definia o local e schema da resposta persistida.
   - *Correção*: A coleção `/idempotency/{scope_key}` armazena formalmente um objeto tipado `cached_response: { status_code, body_receipt }`. Quando uma requisição com a mesma chave e o mesmo hash canónico (SHA-256) chega, a função retorna `body_receipt` sem reexecutar a lógica contábil.
5. **Leg Snapshot Completo na Aposta Aceita**:
   - *Achado*: Depender de referências para o catálogo de Odds no momento do settlement cria dependência de documentos mutáveis.
   - *Correção*: Cada seleção do bilhete (`BetLeg`) grava uma fotografia estática contendo: `odds_milli`, `selection_label`, `market_type`, `provider_id`, `provider_version`, `market_status_at_acceptance`, `settlement_rule_id` e `rule_version`.
6. **Mapeamento de IP Observado pelo Backend**:
   - *Achado*: Confiar em cabeçalhos fornecidos pelo cliente (`client_ip`) permite falsificação de auditoria (*spoofing*).
   - *Correção*: O IP registrado no `AuditLog` é exclusivamente extraído dos cabeçalhos confiáveis injetados pelo Cloud Run / Google Cloud Load Balancer (`x-forwarded-for` na posição validada de borda).
7. **Eliminação de Dependência de Extensões Cosméticas em KYC**:
   - *Achado*: Caminhos com extensão `.jpg` ou `.enc` sugeriam falsamente encriptação de aplicação ou vinculavam o identificador ao formato do cliente.
   - *Correção*: O caminho canónico no Storage é `kyc/{uid}/{case_id}/{document_id}` sem extensão forçada; tipo MIME e hash SHA-256 são metadados autenticados no Firestore.
