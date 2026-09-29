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
  variant?: 'revenue' | 'warning' | 'neutral' | 'info';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  changePercent,
  icon,
  variant = 'neutral',
}) => {
  const getAccentColor = () => {
    switch (variant) {
      case 'revenue':
        return Colors.success;
      case 'warning':
        return Colors.warning;
      case 'info':
        return Colors.info;
      default:
        return Colors.primary;
    }
  };

  return (
    <GlassCard style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{title}</Text>
        {icon ? <View style={[styles.iconContainer, { backgroundColor: getAccentColor() + '15' }]}>{icon}</View> : null}
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.valueText}>{value}</Text>
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
                { color: changePercent >= 0 ? Colors.success : Colors.danger },
              ]}
            >
              {changePercent >= 0 ? `+${changePercent}%` : `${changePercent}%`}
            </Text>
          </View>
        ) : null}
      </View>

      {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 150,
    margin: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconContainer: {
    padding: 6,
    borderRadius: 10,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  valueText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subtitleText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
});
