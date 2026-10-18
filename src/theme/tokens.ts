/**
 * BOOS BET OFFICIAL DESIGN TOKENS
 * Alinhado com o Sistema Oficial BOOS BET Royal Sports Luxury
 */

import { boosColors, boosTypography, boosSpacing, boosRadius, BoosDesignSystem } from '../components/brand/BoosDesignSystem';

export { boosColors, boosTypography, boosSpacing, boosRadius, BoosDesignSystem };

export const boosTokens = {
  color: {
    // Royal Sports Luxury Palette
    background: boosColors.background,
    backgroundSecondary: boosColors.backgroundSecondary,
    card: boosColors.card,
    cardElevated: boosColors.cardElevated,
    border: boosColors.border,
    blueSecondary: boosColors.blueSecondary,
    gold: boosColors.gold,
    goldLight: boosColors.goldLight,
    goldDeep: boosColors.goldDeep,
    textPrimary: boosColors.textPrimary,
    textSecondary: boosColors.textSecondary,
    textTertiary: boosColors.textTertiary,
    green: boosColors.green,
    red: boosColors.red,

    // Aliases compatíveis
    orange: boosColors.gold,
    navy: boosColors.background,
    blue: boosColors.card,
    white: boosColors.textPrimary,
    black: '#000000',
    navySurface: boosColors.backgroundSecondary,
    blueCard: boosColors.card,
    blueCardHover: boosColors.cardElevated,
    blueBorder: boosColors.border,
    goldMuted: 'rgba(247, 181, 0, 0.15)',
    orangeMuted: 'rgba(247, 181, 0, 0.15)'
  },
  typography: {
    fontSans: boosTypography.fonts.sans,
    fontDisplay: boosTypography.fonts.display,
    fontMono: boosTypography.fonts.mono
  },
  gradients: {
    background: boosColors.gradients.backgroundGlow,
    backgroundSubtle: 'linear-gradient(180deg, #030D17 40%, #061827 100%)',
    goldButton: boosColors.gradients.goldMetal,
    cardSurface: boosColors.gradients.cardStandard,
    goldBorder: boosColors.gradients.goldBorder
  },
  radii: {
    sm: boosRadius.sm,
    md: boosRadius.md,
    lg: boosRadius.lg,
    xl: boosRadius.xl,
    '2xl': boosRadius['2xl'],
    full: boosRadius.full
  }
} as const;
