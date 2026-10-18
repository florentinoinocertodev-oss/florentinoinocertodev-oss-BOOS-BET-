/**
 * BOOS BET — ROYAL SPORTS LUXURY DESIGN SYSTEM
 *
 * Sistema Oficial de Design Tokens e Variáveis Globais da Marca:
 * - Proporção de Cores da Regra de Ouro:
 *   70% Navy / Dark (#030D17, #061827)
 *   20% Azul Estrutural (#092237, #0D2940, #0D4C73, #143A52)
 *   8%  Texto & Neutros (#F5F7FA, #91A4B5, #5F7485)
 *   2%  Dourado Metálico Precioso (#F7B500, #FFD65A, #C88700)
 *
 * - Tipografia:
 *   Principal: Inter (menus, apostas, números, inputs, tabelas, odds, descrições)
 *   Personalidade / Destaque: Space Grotesk (títulos hero, páginas, headers reais)
 *   Monospace: JetBrains Mono (hashes, códigos de bilhetes, odds numéricas)
 *
 * - Espaçamento: Escala rigorosa em incrementos de 4px
 * - Border Radius: Sistema consistente (6px, 10px, 12px, 16px, 20px, 24px, 9999px)
 */

export const boosColors = {
  // 1. Backgrounds & Superfícies (Navy / Dark)
  background: '#030D17',         // Background principal — azul quase preto
  backgroundSecondary: '#061827',// Background secundário / superfícies de profundidade
  card: '#092237',               // Card nível 1 (Standard)
  cardElevated: '#0D2940',       // Card nível 2 (Elevated / Featured)
  border: '#143A52',             // Bordas sutis de luxo
  blueSecondary: '#0D4C73',      // Azul secundário para brilhos e acentos de profundidade

  // 2. Dourado Metálico Real (Metal Gold — Usado com parcimônia nobre ~2%)
  gold: '#F7B500',               // Dourado principal oficial
  goldLight: '#FFD65A',          // Dourado claro metálico
  goldDeep: '#C88700',           // Dourado profundo
  goldGlow: 'rgba(247, 181, 0, 0.25)',
  buttonGlow: 'rgba(247, 181, 0, 0.35)', // Brilho radial sutil no hover do botão primário

  // 3. Tipografia & Contrastes
  textPrimary: '#F5F7FA',        // Texto principal de alto contraste
  textSecondary: '#91A4B5',      // Texto secundário informativo
  textTertiary: '#5F7485',       // Texto terciário / metadados

  // 4. Estados Semânticos
  green: '#19C985',              // Sucesso / Vitórias / Ao vivo favorável
  red: '#F04F5F',                // Alerta / Cancelamentos / Destrutivo
  warning: '#F5A900',            // Atenção
  live: '#F04F5F',               // Indicador pulsante de evento ao vivo

  // 5. Gradientes Oficiais de Realeza
  gradients: {
    goldMetal: 'linear-gradient(135deg, #FFD95A 0%, #F7B500 50%, #C88700 100%)',
    goldSubtle: 'linear-gradient(135deg, #FFD65A 0%, #F7B500 100%)',
    cardStandard: 'linear-gradient(180deg, #092237 0%, #061827 100%)',
    cardVip: 'linear-gradient(135deg, #0D2940 0%, #092237 70%, #143A52 100%)',
    backgroundGlow: 'radial-gradient(circle at 50% 0%, #0D4C73 0%, #030D17 70%)',
    goldBorder: 'linear-gradient(90deg, transparent, #F7B500, transparent)',
  }
} as const;

export const boosTypography = {
  fonts: {
    sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: '"Space Grotesk", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace'
  },
  scale: {
    hero: {
      fontSize: '40px',
      lineHeight: '48px',
      fontWeight: '800',
      letterSpacing: '-0.02em',
      fontFamily: '"Space Grotesk", sans-serif'
    },
    heroSmall: {
      fontSize: '36px',
      lineHeight: '44px',
      fontWeight: '700',
      letterSpacing: '-0.02em',
      fontFamily: '"Space Grotesk", sans-serif'
    },
    pageTitle: {
      fontSize: '26px',
      lineHeight: '34px',
      fontWeight: '700',
      letterSpacing: '-0.01em',
      fontFamily: '"Space Grotesk", sans-serif'
    },
    sectionTitle: {
      fontSize: '20px',
      lineHeight: '28px',
      fontWeight: '700',
      fontFamily: 'Inter, sans-serif'
    },
    cardTitle: {
      fontSize: '17px',
      lineHeight: '24px',
      fontWeight: '700',
      fontFamily: 'Inter, sans-serif'
    },
    odds: {
      fontSize: '17px',
      lineHeight: '24px',
      fontWeight: '700',
      fontFamily: '"JetBrains Mono", monospace'
    },
    body: {
      fontSize: '15px',
      lineHeight: '22px',
      fontWeight: '500',
      fontFamily: 'Inter, sans-serif'
    },
    bodySmall: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: '400',
      fontFamily: 'Inter, sans-serif'
    },
    information: {
      fontSize: '13px',
      lineHeight: '18px',
      fontWeight: '500',
      fontFamily: 'Inter, sans-serif'
    },
    metadata: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: '500',
      fontFamily: 'Inter, sans-serif'
    },
    micro: {
      fontSize: '11px',
      lineHeight: '14px',
      fontWeight: '600',
      letterSpacing: '0.04em',
      fontFamily: 'Inter, sans-serif'
    }
  }
} as const;

/**
 * Escala Oficial de Espaçamento baseada em incrementos rigorosos de 4px
 */
export const boosSpacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px'
} as const;

/**
 * Helper para calcular unidades da escala de 4px
 */
export const getBoosSpace = (multiplier: number): string => `${multiplier * 4}px`;

/**
 * Sistema Consistente de Raios de Borda (Border Radius)
 * 6px: Elementos pequenos / micro badges
 * 10px: Inputs e pequenos controles
 * 12px: Botões de ação (44-48px altura)
 * 16px: Cards padrão (Level 1)
 * 20px: Hero cards & featured banners (Level 2)
 * 24px: Modais e grandes containers (Level 3 / VIP)
 * 9999px: Elementos circulares e pills
 */
export const boosRadius = {
  xs: '6px',
  sm: '10px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px'
} as const;

/**
 * Regra de Ouro da Interface (Visual Weight Ratio)
 */
export const boosVisualRules = {
  proportions: {
    navyDark: '70%',
    blueSecondary: '20%',
    textNeutrals: '8%',
    goldMetal: '2%'
  },
  buttonHeights: {
    compact: '38px',
    standard: '46px',
    prominent: '52px'
  },
  cardBorders: {
    standard: '1px solid #143A52',
    featured: '1px solid #0D4C73',
    vip: '1px solid #F7B500'
  }
} as const;

export const BoosDesignSystem = {
  colors: boosColors,
  typography: boosTypography,
  spacing: boosSpacing,
  radius: boosRadius,
  rules: boosVisualRules,
  getSpace: getBoosSpace
} as const;

export default BoosDesignSystem;
