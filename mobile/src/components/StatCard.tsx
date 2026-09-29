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
        return { color: Colors.primary, bg: Colors.primarySubtle, border: 'rgba(16, 185, 129, 0.2)' };
      case 'warning':
        return { color: Colors.warning, bg: Colors.warningBg, border: 'rgba(245, 158, 11, 0.2)' };
      case 'info':
        return { color: Colors.info, bg: Colors.infoBg, border: 'rgba(59, 130, 246, 0.2)' };
      case 'purple':
        return { color: Colors.purple, bg: Colors.purpleBg, border: 'rgba(139, 92, 246, 0.2)' };
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
              { backgroundColor: changePercent >= 0 ? Colors.successBg : Colors.dangerBg },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: changePercent >= 0 ? Colors.primaryDark : Colors.danger },
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
    minWidth: 145,
    margin: 4,
    padding: 16,
    borderRadius: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  iconContainer: {
    padding: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  valueRow: {
    marginBottom: 4,
  },
  valueText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    gap: 4,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  subtitleText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
    flex: 1,
  },
});

