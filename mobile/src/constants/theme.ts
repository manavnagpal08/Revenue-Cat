import { Platform } from 'react-native';

export const Colors = {
  // Primary Emerald Accent
  primary: '#059669',
  primaryLight: '#10B981',
  primaryDark: '#047857',
  primarySubtle: '#ECFDF5',
  primaryGlow: 'rgba(16, 185, 129, 0.18)',
  emeraldMint: '#D1FAE5',

  // Secondary Indigo
  indigo: '#4F46E5',
  indigoSubtle: '#EEF2FF',

  // Surfaces & Backgrounds
  background: '#F8FAFC',
  backgroundAlt: '#F1F5F9',
  card: '#FFFFFF',
  glass: '#FFFFFF',
  glassSubtle: '#F8FAFC',
  glassCard: '#FFFFFF',
  glassOverlay: 'rgba(15, 23, 42, 0.4)',

  // Clean Standard Borders
  border: '#E2E8F0',
  borderGlass: '#E2E8F0',
  borderEmerald: 'rgba(16, 185, 129, 0.25)',
  borderLight: '#F1F5F9',

  // Neutral Slate Typography
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverted: '#FFFFFF',

  // Status Indicators
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  info: '#3B82F6',
  infoBg: '#EFF6FF',
  purple: '#8B5CF6',
  purpleBg: '#F5F3FF',
};

export const Shadows = {
  glass: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  glow: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  glowSubtle: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
};

export const Gradients = {
  primary: ['#059669', '#10B981'] as const,
  primaryDark: ['#047857', '#059669'] as const,
  cardGlass: ['#FFFFFF', '#FFFFFF'] as const,
  emeraldHero: ['#ECFDF5', '#F0FDF4', '#FFFFFF'] as const,
  aiGlow: ['#ECFDF5', '#EEF2FF', '#FFFFFF'] as const,
};

export const Typography = {
  fontFamily: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
};
