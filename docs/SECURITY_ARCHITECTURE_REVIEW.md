# BOOS BET — SECURITY ARCHITECTURE REVIEW (DOCUMENTO C)
## Auditoria Técnica de Segurança, Imutabilidade, IAM e Proteção contra Abusos

> **Status**: Architecture Review — Implementation Frozen  
> **Classificação de Segurança**: Zero Trust & Defense in Depth  
> **Alvo**: L2 Production Baseline

---

### 1. IMUTABILIDADE DO FIRESTORE ALÉM DAS SECURITY RULES

#### 1.1 O Mito das Security Rules
É fundamental esclarecer uma falha conceitual comum: **as Firestore Security Rules aplicam-se estritamente às requisições originadas do cliente Web ou Mobile via SDK do cliente**. O backend administrativo (Cloud Functions, Cloud Run, scripts com Firebase Admin SDK) opera com credenciais privilegiadas de IAM que **ignoram por completo as Security Rules**.

#### 1.2 Mecanismos Arquiteturais de Garantia de Imutabilidade
Para que o Ledger e os registros de auditoria sejam autenticamente imutáveis, a segurança baseia-se em 5 camadas concêntricas:
1. **Regras de Segurança do Cliente**: Bloqueio total (`allow read, write: if false;` ou `write: false`) em `/journal_entries`, `/wallet/ledger`, `/audit_logs` e `/security_events`.
2. **Encapsulamento de Código no Backend**: O Admin SDK é consumido exclusivamente através de módulos de serviço que implementam apenas métodos de inserção (`create` ou `add`), **sem expor nenhum método de `update` ou `delete`** para documentos contábeis.
3. **Controle de Acesso de Privilégio Mínimo (IAM)**: A Service Account das Cloud Functions financeiras possui permissões segregadas, impedindo mutações manuais por operadores.
4. **Point-In-Time Recovery (PITR) & Backups Automáticos**: Ativação de PITR contínuo de 7 dias no Firestore e exportações diárias automáticas para bucket de Google Cloud Storage com *Bucket Lock* (modo retenção WORM - *Write Once, Read Many*).
5. **Auditoria Forense de Mutações**: Verificação contínua da sequência monotónica dos IDs e timestamps do Ledger para detecção imediata de qualquer inserção anômala.

---

### 2. AUTORIDADE DE IDENTIDADE E VERIFICAÇÃO DE STATUS ATIVO

#### 2.1 A Armadilha das Custom Claims Desatualizadas
Quando um utilizador é suspenso por suspeita de fraude ou solicita autoexclusão no âmbito do Jogo Responsável, a alteração das suas Custom Claims no Firebase Auth leva até **60 minutos** para se refletir no token JWT já emitido para o dispositivo do utilizador.

#### 2.2 Protocolo de Dupla Verificação de Identidade
Toda operação que envolva aposta, movimentação financeira ou alteração cadastral sensível deve executar o seguinte fluxo atómico:
```
1. Verificação Criptográfica do ID Token (Assinatura e expiração do JWT)
                    │
                    ▼
2. Leitura Atómica Obrigatória de /users/{uid} na transação
   - status === 'ACTIVE' (Se 'SUSPENDED' ou 'BANNED' -> Aborto imediato com HTTP 403)
   - self_exclusion_until == null || self_exclusion_until < now()
                    │
                    ▼
3. Execução da Operação de Negócio Autorizada
```

---

### 3. PROTEÇÃO DE BORDA: FIREBASE APP CHECK & ANTI-ABUSO

Para proteger a plataforma contra robôs de arbitragem de odds e ataques de repetição:
- **Web SPA**: Integração com **reCAPTCHA Enterprise** configurado com pontuação de risco.
- **Android App**: Integração com **Play Integrity API** para validação de hardware e assinatura genuína do APK.
- **Ambiente de Desenvolvimento**: Tokens de depuração restritos a endereços IP e UIDs de desenvolvedores cadastrados.
- **Rate Limiting em Memória / Redis**:
  - Máximo de 5 submissões de bilhete de aposta por segundo por utilizador.
  - Máximo de 3 tentativas de solicitação de OTP por número em janela de 10 minutos.

---

### 4. GESTÃO SEGURA DE SEGREDOS (SECRETS GOVERNANCE)

Proibição categórica de inclusão de segredos em código, repositórios Git, imagens Docker ou arquivos `.env` commitados.
- **Arquitetura de Segredos**:
  - Os segredos (chaves HMAC de webhooks do PSP, credenciais de API do Sportsbook, credenciais da Gemini API) são armazenados exclusivamente no **Google Cloud Secret Manager**.
  - O acesso é injetado como variáveis de ambiente em tempo de execução das Cloud Functions apenas na conta de serviço autorizada.
  - O frontend consome exclusivamente chaves públicas não confidenciais (App ID, Auth Domain, API Key pública do cliente Firebase).

---

### 5. ESPECIFICAÇÃO TÉCNICA DE `SecurityEvent`

Coleção reservada `/security_events/{id}` para registro de incidentes e anomalias de segurança:
```typescript
export interface SecurityEvent {
  security_event_id: string;        // "sec_{uuid}"
  event_type: 
    | 'IDEMPOTENCY_COLLISION' 
    | 'CONCURRENCY_EXHAUSTION' 
    | 'WEBHOOK_TAMPERING' 
    | 'SUSPICIOUS_PAYOUT' 
    | 'REPEATED_AUTH_FAILURE' 
    | 'ABNORMAL_BETTING_PATTERN'
    | 'VELOCITY_LIMIT_EXCEEDED';
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'FATAL';
  actor_type: 'USER' | 'EXTERNAL_IP' | 'SYSTEM' | 'PSP';
  actor_id: string;                 // UID do utilizador ou IP de origem
  resource_type: 'WALLET' | 'BET' | 'WEBHOOK' | 'AUTH' | 'KYC';
  resource_id: string;              // ID da entidade afetada
  correlation_id: string;           // Rastreabilidade da requisição HTTP
  source: string;                   // Nome da Cloud Function ou serviço
  created_at: string;               // ISO 8601 UTC
  outcome: 'BLOCKED' | 'FLAGGED_FOR_REVIEW' | 'AUTO_REMEDIATED';
  metadata_minimal: {               // Estritamente livre de senhas, OTPs ou segredos
    reason: string;
    observed_value?: number | string;
    expected_value?: number | string;
    fingerprint?: string;
  };
}
```

---

### 6. AML / COMPLIANCE & MONITORAMENTO TRANSACIONAL

O motor de conformidade e prevenção à lavagem de capitais monitora:
1. **Velocidade de Depósito/Retirada**: Depósitos seguidos imediatamente de pedido de retirada sem volume substancial de apostas (tentativa de lavagem de dinheiro) disparam alerta e bloqueio de saque automático para análise manual.
2. **Casamento de Titularidade Bancária**: O nome do titular do IBAN de destino da retirada deve coincidir rigorosamente com os dados validados no documento de KYC.
3. **Padrões de Apostas Suspeitas**: Apostas de volume desproporcional em mercados de baixa liquidez ou apostas repetidas na mesma seleção por contas com mesmo IP/dispositivo são sinalizadas como `SUSPICIOUS_BETTING_PATTERN`.
