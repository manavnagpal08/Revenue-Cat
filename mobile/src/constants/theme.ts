export const Colors = {
  // Brand Primary & Accents (Emerald Luxe)
  primary: '#059669', // Emerald 600
  primaryLight: '#10B981', // Emerald 500
  primaryDark: '#047857', // Emerald 700
  primarySubtle: '#ECFDF5', // Emerald 50
  primaryGlow: 'rgba(16, 185, 129, 0.25)',
  emeraldMint: '#D1FAE5',

  // Indigo / Secondary Accent
  indigo: '#4F46E5',
  indigoSubtle: '#EEF2FF',

  // Backgrounds & Glass Surfaces
  background: '#F8FAFC', // Slate 50 ultra clean
  backgroundAlt: '#F1F5F9', // Slate 100
  card: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.92)',
  glassSubtle: 'rgba(255, 255, 255, 0.72)',
  glassCard: 'rgba(255, 255, 255, 0.85)',
  glassOverlay: 'rgba(15, 23, 42, 0.45)',

  // Borders
  border: '#E2E8F0', // Slate 200
  borderGlass: 'rgba(255, 255, 255, 0.85)',
  borderEmerald: 'rgba(16, 185, 129, 0.2)',
  borderLight: '#F1F5F9',

  // Typography
  text: '#0F172A', // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8', // Slate 400
  textInverted: '#FFFFFF',

  // Status & Financial Indicators
  success: '#10B981', // Emerald 500
  successBg: '#ECFDF5',
  warning: '#F59E0B', // Amber 500
  warningBg: '#FFFBEB',
  danger: '#EF4444', // Red 500
  dangerBg: '#FEF2F2',
  info: '#3B82F6', // Blue 500
  infoBg: '#EFF6FF',
  purple: '#8B5CF6',
  purpleBg: '#F5F3FF',
};

export const Shadows = {
  glass: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 3,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  glow: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 5,
  },
  glowSubtle: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
};

export const Gradients = {
  primary: ['#059669', '#10B981'] as const,
  primaryDark: ['#047857', '#059669'] as const,
  cardGlass: ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.75)'] as const,
  emeraldHero: ['#ECFDF5', '#F0FDF4', '#FFFFFF'] as const,
  aiGlow: ['#ECFDF5', '#EEF2FF', '#FFFFFF'] as const,
};
