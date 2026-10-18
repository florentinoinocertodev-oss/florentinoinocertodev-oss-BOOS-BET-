# BOOS BET — ESPECIFICAÇÃO OFICIAL DE IMPLEMENTAÇÃO E DESIGN SYSTEM
## Sistema Visual, Mascote Oficial e Arquitetura de Identidade

> **Versão**: 1.0.0 — Oficial para Produção  
> **Nome Oficial da Marca**: `BOOS BET` *(Nunca utilizar “BOSS BET”, “BOOSBET”, “Boss Bet” ou variações)*  
> **Slogan**: *A Casa Oficial do Jogador Rei*  
> **Moeda & Território**: Kwanza Angolano (`AOA`), indicativo `+244`  

---

### 1. PRINCÍPIO FUNDAMENTAL
O **BOOS BET** é implementado como uma plataforma de apostas desportivas e entretenimento premium, moderno, focado em alta tecnologia e performance.
- **Valores da Marca**: Confiança, competitividade, riqueza, vitória, energia, futebol, tecnologia, entretenimento e profissionalismo.
- **Caráter do Mascote**: O personagem **BOOS** é uma mascote premium em estilo anime/3D de alta fidelidade — **nunca uma caricatura infantil**.
- **Regra de Ouro**: O conteúdo desportivo, as odds e as operações financeiras são sempre a prioridade máxima da interface. O mascote complementa a experiência nos momentos emocionais e de feedback sem poluir ou obstruir a ação operacional.

---

### 2. IDENTIDADE VISUAL DO BOOS
Todas as representações visuais derivam do modelo mestre oficial aprovado:
- **Características Físicas**: Jovem negro carismático, barba e bigode alinhados e aparados com precisão, corte de cabelo moderno em degradé (*fade*), sorriso radiante com dentes brancos e piscadela confiante com um olho.
- **Acessórios de Assinatura**:
  - Coroa real em ouro maciço com a letra **'B'** gravada no pico central frontal.
  - Corrente de elos grossos em ouro maciço (*Cuban link*).
  - Casaco desportivo técnico nas cores navy e dourado.
  - Anel de sinete em ouro maciço com brasão gravado.
- **Consistência Facial Estrita**: Não gerar novos rostos ou estilos artísticos divergentes. Todas as poses e estados derivam e representam o mesmo indivíduo.

---

### 3. LOGOTIPO OFICIAL E VERSÕES

O logotipo do BOOS BET é estruturado como:  
`[AVATAR BOOS / SÍMBOLO] BOOS BET`

#### Versões Oficiais Disponibilizadas no Repositório:
| Versão | Asset Path | Uso Recomendado |
|---|---|---|
| **Logo Horizontal (Full)** | `/assets/brand/boos_logo_full.svg` ou `boos-logo-horizontal.svg` | Header Desktop, Splash, Rodapé principal |
| **Logo Vertical (Stacked)** | `/assets/brand/boos-logo-vertical.svg` | Telas de boas-vindas, modais verticais |
| **Símbolo Oficial** | `/assets/brand/boos_mascot_symbol.svg` ou `boos-symbol.svg` | Favicon, marcadores, medalhões vetoriais |
| **Avatar Mestre Isolado** | `/assets/character/boos_master.jpg` ou `boos-master.jpg` | Header mobile, perfil do utilizador, assistente IA |
| **Wordmark Isolado** | `/assets/brand/boos_wordmark.svg` ou `boos-wordmark.svg` | Aplicações onde o símbolo já é exibido |
| **Versão Fundo Escuro** | Padrão (vetores com gradiente Dourado & Branco sobre Navy) | Toda a aplicação dark-mode |
| **Versão Monocromática** | Suportada via CSS `grayscale(1) brightness(1.2)` no componente `<BoosLogo theme="monochrome" />` | Recibos de impressão, SMS/PDF térmico |
| **Versão Compacta** | Suportada via `<BoosLogo variant="compact" size="sm" />` | Headers compactos e barras de scroll |

> **Atenção**: Nunca reconstruir o logotipo utilizando texto HTML puro quando o asset oficial existir.

---

### 4. APP ICON
- **Conceito**: Rosto do BOOS com piscadela confiante + coroa real dourada com 'B' + enquadramento circular em medalhão dourado sobre fundo navy profundo.
- **Regra**: Não incluir o texto completo "BOOS BET" em ícones pequenos para manter leitura instantânea (`👑 BOOS`).
- **Dimensões e Arquivos**:
  - Mestre 1024×1024: `/assets/icons/app_icon_1024.jpg`
  - Normalizado: `/assets/icons/app-icon.jpg`
  - Favicon vetorial: `/assets/brand/boos_favicon.svg` e `/assets/icons/favicon.svg`

---

### 5. DESIGN SYSTEM & TOKENS DE COR

```css
:root {
  /* Cores Oficiais BOOS BET */
  --boos-orange: #FF7A00;   /* Energia, ação, call-to-actions principais */
  --boos-gold: #FFC21A;     /* Vitória, coroa real, prémios, saldo e odds de valor */
  --boos-gold-light: #FFE082;
  --boos-navy: #001426;     /* Profundidade, autoridade e contraste primário */
  --boos-navy-surface: #002244;
  --boos-navy-border: #06345A;
  --boos-black: #000B14;    /* Fundo base imersivo */
  --boos-white: #FFFFFF;    /* Textos principais e dados numéricos */
  --boos-success: #10B981;  /* Apostas ganhas e depósitos concluídos */
  --boos-danger: #EF4444;   /* Apostas perdidas e alertas críticos */
}
```

- **Uso do Laranja**: Botões de ação direta (`Apostar`, `Depositar`, `Começar`), tags de eventos Ao Vivo.
- **Uso do Dourado**: Destaques de odds altas, saldo de conta, troféus, bordas VIP e a coroa do BOOS.
- **Uso do Navy & Preto**: Superfícies de cartões e fundo principal para evitar cansaço visual e dar aspecto desportivo premium.

---

### 6. TIPOGRAFIA & HIERARQUIA
- **Interface e Conteúdo**: `Plus Jakarta Sans` para textos corridos, botões e labels.
- **Títulos e Branding**: `Syne` (pesos 700 e 800) para cabeçalhos e chamadas.
- **Dados Operacionais & Odds**: `JetBrains Mono` / Fontes tabulares monospaçadas para:
  - Odds numéricas (`1.85`, `3.40`, `4.10`);
  - Valores monetários (`AOA 150.000,00`);
  - Cronómetros de jogos ao vivo (`74:12`);
  - IDs de bilhetes e códigos OTP.

---

### 7. HEADER E NAVEGAÇÃO
- **Desktop**:
  `[LOGO COMPLETO BOOS BET] ───────── [Saldo AOA] [Depósito] [Notificações] [Perfil com Avatar BOOS]`
- **Mobile**:
  `[AVATAR BOOS 👑] [BOOS BET] ───────── [Saldo Rápido] [Sino] [Menu Hamburguer ☰]`
- Não permitir que o mascote ocupe altura vertical excessiva no mobile (máximo 40px no header).

---

### 8. ESTRUTURA DA HOME
A Home é estritamente orientada para conversão e apostas:
1. **Header com Branding e Saldo**
2. **Barra de Categorias Desportivas** (Futebol, Basquetebol, Ténis, Casino, Fimser Win)
3. **Banner Rotativo BOOS BET** (Bónus de Boas-Vindas, Multiplicador, Jackpots)
4. **Chips Temporais** (Todos, Ao Vivo 🔥, Hoje, Próximas 24h)
5. **Destaques e Eventos Ao Vivo** com odds interativas e actualização de tempo
6. **Assistente de Previsões & Hub IA** com medidor radial de probabilidades
7. **Bet Slip Flutuante / Bottom Navigation** com contagem dinâmica de seleções

---

### 9. BIBLIOTECA DE POSES DO MASCOTE (COMPONENTE `<BoosCharacter />`)

| Pose Enum | Expressão / Estado | Contexto de Uso |
|---|---|---|
| `BOOS_MASTER` | Piscadela, sorriso vencedor e coroa | Header, perfil, identidade mestre |
| `BOOS_IDLE` | Sorriso calmo e atento | Em repouso, páginas estáticas |
| `BOOS_WELCOME` | Gesto acolhedor de mão aberta | Onboarding, modal de boas-vindas |
| `BOOS_WIN` | Troféu dourado em mãos, punho erguido | Vitória de bilhete, bónus creditado |
| `BOOS_CELEBRATION` | Chuva de confetis e pose triunfante | Grande prémio, celebração de aposta |
| `BOOS_LOSS` | Expressão sóbria, respeitosa e analítica | Bilhete não premiado (sem deboche) |
| `BOOS_SERIOUS` | Foco cirúrgico, olhar atento | Análise estatística, verificação de dados |
| `BOOS_ANALYTICS` | Apontando para os gráficos e métricas | Predições de IA, histórico detalhado |
| `BOOS_LIVE` | Alta energia desportiva | Transmissões e apostas em tempo real |
| `BOOS_PROMOTION` | Apresentando oferta especial | Banners de bónus e campanhas VIP |
| `BOOS_FOOTBALL` | Bola de futebol e chuteira de ouro | Secção de apostas de futebol |
| `BOOS_LOADING` | Pulsação suave do mascote | Carregamento de eventos e odds |
| `BOOS_ERROR` | Atenção séria e responsável | Falha de rede, timeout de transação |
| `BOOS_EMPTY` | Mão indicando catálogo de jogos | Bet slip vazio, favoritos vazios |

---

### 10. WELCOME / ONBOARDING (PRIMEIRO ACESSO)
- Modal com entrada suave e presença do `BOOS_WELCOME`:
  - **Título**: *Bem-vindo ao BOOS BET*
  - **Subtítulo**: *A tua experiência de apostas premium em Angola começa aqui.*
  - **Benefícios**: Odds aumentadas, levantamentos rápidos em AOA, segurança de dados.
  - **Botão de Ação**: `[ COMEÇAR APOSTAS ]` (grava estado em storage e não repete desnecessariamente).

---

### 11. LOGIN & AUTENTICAÇÃO LIMPA
- Identificação rápida e sem fricção:
  - Avatar do BOOS centralizado no topo do modal.
  - Campo numérico formatado para telemóveis angolanos (`+244 9XX XXX XXX`).
  - Envio de código OTP via SMS Gateway integrado.
  - Sem poluição visual para garantir taxa máxima de conversão.

---

### 12. BET SLIP OPERACIONAL
- **Estado Vazio**:
  - Exibe `BOOS_EMPTY` com a mensagem:
    > *"O teu Bet Slip está vazio. Escolhe um evento para começar."*
    > Botão `[ VER EVENTOS ]`
- **Estado com Apostas**:
  - **O mascote é recolhido** para dar espaço 100% livre aos dados operacionais: seleções, mercados, odds, campo de stake (AOA), cálculo de ganhos potenciais e botão `Submeter Aposta`.

---

### 13. EXPERIÊNCIA AO VIVO (LIVE BETTING)
- Menor presença figurativa; alta presença de dados.
- Placar dinâmico, cronómetro, cartões amarelos/vermelhos e oscilação de odds (verde para subida, vermelho para descida).

---

### 14. WALLET & TRANSAÇÕES (ASPECTO BANCÁRIO)
- Visual sóbrio e financeiro.
- Saldo disponível com formatação oficial: `AOA 000.000,00`.
- Abas claras de Depósito e Levantamento com métodos locais angolanos (Multicaixa Express, Transferência Bancária IBAN, Referência Multicaixa).
- O mascote só intervém em:
  - Estado vazio de transações (`BOOS_SERIOUS`: *"Ainda não existem transações nesta conta."*).
  - Sucesso de depósito (`BOOS_WIN`: *"Depósito confirmado com sucesso!"*).

---

### 15. ESTADO DE VITÓRIA (CELEBRAÇÃO ELEGANTE)
- Modal ou toast com `BOOS_CELEBRATION` e troféu dourado.
- Texto: `APOSTA VENCEDORA! + AOA XX.XXX`.
- Animação de confetis dourados com duração máxima de 4 segundos e opção de fecho imediato.
- **Proibido**: Sons estridentes de slots de casino brega ou efeitos descontrolados.

---

### 16. ESTADO DE PERDA (RESPEITOSO)
- Utilização de `BOOS_SERIOUS` (nunca o mascote a rir ou em pose cômica).
- Mensagem encorajadora e profissional:
  > *"A aposta não foi vencedora. Consulta outros eventos e continua a acompanhar os teus resultados."*
  > Botão: `[ VER PRÓXIMOS JOGOS ]`

---

### 17. CARREGAMENTO COM FALLBACK
- Componente `<BoosLoading text="A carregar eventos..." />`
- Microanimação do mascote com fallback SVG instantâneo se a imagem falhar.
- Timeout de segurança para nunca congelar a interface.

---

### 18. EMPTY STATES PADRONIZADOS
Componente unificado `<BoosEmptyState />` aplicado em:
- Bilhete de apostas vazio;
- Lista de favoritos vazia;
- Histórico de transações vazio;
- Centro de notificações sem novas mensagens;
- Pesquisa de eventos sem resultados encontrados.

---

### 19. TRATAMENTO DE ERROS
- Componente `<BoosError title="..." message="..." onRetry={...} />`
- Expressão séria e prestativa (`BOOS_ERROR`).
- Instrução acionável e botão `[ TENTAR NOVAMENTE ]`.

---

### 20. BANNERS PROMOCIONAIS DINÂMICOS
- Componente `<BoosBannerCarousel />` e `<BoosBanner />`.
- Conteúdo orientado a dados (título, tag, percentual de bónus, call to action).
- Totalmente compatível com respostas de API, sem mensagens promocionais estáticas difíceis de editar.

---

### 21. MICROANIMAÇÕES E ACESSIBILIDADE
- Transições CSS suaves (`hover:scale-105 active:scale-95`).
- Respeito obrigatório à diretiva `@media (prefers-reduced-motion: reduce)` para desativar pulsações e rotações em utilizadores sensíveis.

---

### 22. ESTRUTURA ORGANIZADA DE DIRETÓRIOS E ASSETS
```
/public/assets/
├── brand/
│   ├── boos_logo_full.svg
│   ├── boos-logo-horizontal.svg
│   ├── boos-logo-vertical.svg
│   ├── boos_mascot_symbol.svg
│   ├── boos-symbol.svg
│   ├── boos_wordmark.svg
│   └── boos_favicon.svg
├── character/
│   ├── boos_master.jpg / boos-master.jpg
│   ├── boos_idle.jpg / boos-idle.jpg
│   ├── boos_welcome.jpg / boos-welcome.jpg
│   ├── boos_win.jpg / boos-win.jpg
│   ├── boos-live.jpg
│   ├── boos_serious.jpg / boos-serious.jpg
│   ├── boos-error.jpg
│   ├── boos-football.jpg
│   └── boos-promotion.jpg
├── icons/
│   ├── app_icon_1024.jpg
│   ├── app-icon.jpg
│   └── favicon.svg
└── ui/
    ├── onboarding.jpg
    ├── splash.jpg
    ├── empty.jpg
    ├── loading.jpg
    └── error.jpg
```

---

### 23. RESPONSIVIDADE E PRIORIDADE MOBILE-FIRST
- Telas < 640px: Conteúdo operacional desportivo tem precedência. Mascote compacto no header e nas abas de navegação.
- Telas > 1024px: Banners heróicos laterais e o Assistente de Previsões com visual estendido e detalhes gráficos completos.

---

### 24. PERFORMANCE & RESILIÊNCIA
- Carregamento de imagens com `loading="lazy"` para assets secundários e `loading="eager"` apenas para o avatar do header.
- `referrerPolicy="no-referrer"` em todas as tags `<img>`.
- Tratamento obrigatório de `onError={() => setImageError(true)}` trocando para o símbolo vetorial SVG correspondente, garantindo integridade visual mesmo em conexões lentas ou instáveis.

---

### 25. INTEGRAÇÃO REAL COM SISTEMAS DE PRODUÇÃO
- Sem mocks que interfiram nas transações reais.
- Saldo sincronizado via API `apiClient.getSession()`, autenticação via SMS Gateway Angolano real, persistência de bilhetes e submissão via endpoints oficiais do backend.

---

### 26. SEPARAÇÃO ESTRITA ENTRE IDENTIDADE E LÓGICA
- Componentes de branding (`BoosCharacter`, `BoosLogo`, `BoosBadge`, `BoosBanner`) são puramente visuais e apresentacionais (*stateless* ou com estado exclusivamente estético).
- Toda a lógica de liquidação de apostas (*settlement*), movimentações de carteira, validação de limites e regras KYC permanece segregada em controladores e serviços dedicados (`api.ts`, `notificationService.ts`, etc.).
