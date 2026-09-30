import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Shadows } from '../constants/theme';
import { GlassCard } from './GlassCard';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  changePercent?: number;
  icon?: React.ReactNode;
  variant?: 'revenue' | 'warning' | 'neutral' | 'info' | 'purple';
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  changePercent,
  icon,
  variant = 'neutral',
  onPress,
}) => {
  const getAccentConfig = () => {
    switch (variant) {
      case 'revenue':
        return { color: Colors.primary, bg: Colors.primarySubtle, border: 'rgba(16, 185, 129, 0.18)' };
      case 'warning':
        return { color: Colors.warning, bg: Colors.warningBg, border: 'rgba(245, 158, 11, 0.18)' };
      case 'info':
        return { color: Colors.info, bg: Colors.infoBg, border: 'rgba(59, 130, 246, 0.18)' };
      case 'purple':
        return { color: Colors.purple, bg: Colors.purpleBg, border: 'rgba(139, 92, 246, 0.18)' };
      default:
        return { color: Colors.textSecondary, bg: Colors.backgroundAlt, border: Colors.borderLight };
    }
  };

  const accent = getAccentConfig();

  return (
    <GlassCard
      style={styles.container}
      variant="elevated"
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <Text style={styles.title}>{title}</Text>
        {icon ? (
          <View style={[styles.iconContainer, { backgroundColor: accent.bg, borderColor: accent.border }]}>
            {icon}
          </View>
        ) : null}
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.valueText} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
      </View>

      <View style={styles.bottomRow}>
        {subtitle ? (
          <Text style={styles.subtitleText} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}

        {typeof changePercent === 'number' ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: changePercent >= 0 ? '#ECFDF5' : '#FEF2F2',
                borderColor: changePercent >= 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: changePercent >= 0 ? '#047857' : '#DC2626' },
              ]}
            >
              {changePercent >= 0 ? `+${changePercent}%` : `${changePercent}%`}
            </Text>
          </View>
        ) : null}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 140,
    margin: 4,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    ...Shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Manrope_700Bold',
  },
  iconContainer: {
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  valueRow: {
    marginBottom: 4,
  },
  valueText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    fontFamily: 'Manrope_800ExtraBold',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    gap: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Manrope_700Bold',
  },
  subtitleText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
    fontFamily: 'Manrope_500Medium',
    flexShrink: 1,
  },
});
