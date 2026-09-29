export const Colors = {
  // Brand Primary & Accents
  primary: '#4F46E5', // Indigo 600
  primaryLight: '#6366F1', // Indigo 500
  primaryDark: '#3730A3', // Indigo 800
  primarySubtle: '#EEF2FF', // Indigo 50

  // Backgrounds & Glass Surfaces
  background: '#F8FAFC', // Slate 50
  backgroundAlt: '#F1F5F9', // Slate 100
  card: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.88)',
  glassSubtle: 'rgba(255, 255, 255, 0.65)',
  glassOverlay: 'rgba(15, 23, 42, 0.4)',

  // Borders
  border: '#E2E8F0', // Slate 200
  borderGlass: 'rgba(255, 255, 255, 0.75)',
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
};

export const Shadows = {
  glass: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  glow: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
};
