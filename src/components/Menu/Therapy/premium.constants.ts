// =============================================
// 🎨 Premium Design System Constants
// Based on CELESTIAL Mockup Design Tokens
// =============================================

// Color Tokens (Material Design 3 Gold/Dark)
export const COLORS = {
  primary: '#e6c487',
  primaryContainer: '#c9a96e',
  onPrimary: '#412d00',
  onPrimaryContainer: '#543d0c',
  surface: '#131315',
  surfaceDim: '#131315',
  surfaceContainerLowest: '#0e0e10',
  surfaceContainerLow: '#1b1b1d',
  surfaceContainer: '#1f1f21',
  surfaceContainerHigh: '#2a2a2c',
  surfaceContainerHighest: '#353437',
  onSurface: '#e4e2e4',
  onSurfaceVariant: '#d0c5b5',
  outline: '#998f81',
  outlineVariant: '#4d463a',
  secondary: '#ffb597',
  secondaryContainer: '#723518',
  error: '#ffb4ab',
  errorContainer: '#93000a',
} as const;

// Tailwind Class Shorthands (for reuse)
export const TW = {
  bg: 'bg-[#131315]',
  bgLow: 'bg-[#1b1b1d]',
  bgMid: 'bg-[#1f1f21]',
  bgHigh: 'bg-[#2a2a2c]',
  bgHighest: 'bg-[#353437]',
  textPrimary: 'text-[#e6c487]',
  textOnSurface: 'text-[#e4e2e4]',
  textOnSurfaceVariant: 'text-[#d0c5b5]',
  textOutline: 'text-[#998f81]',
  textSecondary: 'text-[#ffb597]',
  textError: 'text-[#ffb4ab]',
  borderOutline: 'border-[#4d463a]',
  borderPrimary: 'border-[#e6c487]',
  bgPrimary: 'bg-[#e6c487]',
  bgPrimaryContainer: 'bg-[#c9a96e]',
  textOnPrimary: 'text-[#412d00]',
} as const;

// Typography
export const FONT = {
  headline: 'font-serif italic', // Noto Serif
  body: 'font-sans', // Manrope / Be Vietnam Pro
  label: 'font-sans',
} as const;
