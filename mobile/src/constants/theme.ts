import { Platform } from 'react-native';

export const Colors = {
  // Brand Primary & Accents (Luxe Emerald & Slate)
  primary: '#059669', // Emerald 600
  primaryLight: '#10B981', // Emerald 500
  primaryDark: '#047857', // Emerald 700
  primarySubtle: '#F0FDF4', // Emerald 50
  primaryGlow: 'rgba(16, 185, 129, 0.2)',
  emeraldMint: '#D1FAE5',

  // Accent & Secondary
  indigo: '#4F46E5',
  indigoSubtle: '#EEF2FF',

  // Backgrounds & Glass Surfaces
  background: '#F8FAFC', // Slate 50
  backgroundAlt: '#F1F5F9', // Slate 100
  card: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.94)',
  glassSubtle: 'rgba(255, 255, 255, 0.8)',
  glassCard: 'rgba(255, 255, 255, 0.9)',
  glassOverlay: 'rgba(15, 23, 42, 0.4)',

  // Subtle Refined Micro-Borders
  border: '#E2E8F0', // Slate 200
  borderGlass: 'rgba(226, 232, 240, 0.8)',
  borderEmerald: 'rgba(16, 185, 129, 0.25)',
  borderLight: '#F1F5F9',

  // Typography
  text: '#0F172A', // Slate 900
  textSecondary: '#475569', // Slate 600
  textMuted: '#94A3B8', // Slate 400
  textInverted: '#FFFFFF',

  // Status & Financial Indicators
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
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  glow: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 3,
  },
  glowSubtle: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
};

export const Gradients = {
  primary: ['#059669', '#10B981'] as const,
  primaryDark: ['#047857', '#059669'] as const,
  cardGlass: ['rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.88)'] as const,
  emeraldHero: ['#ECFDF5', '#F0FDF4', '#FFFFFF'] as const,
  aiGlow: ['#ECFDF5', '#EEF2FF', '#FFFFFF'] as const,
};

export const Typography = {
  fontFamily: Platform.select({
    ios: '-apple-system',
    android: 'Roboto',
    web: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    default: 'System',
  }),
};
