import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { Colors, Shadows } from '../constants/theme';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle' | 'tinted';
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  style,
  ...props
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'elevated':
        return Colors.card;
      case 'subtle':
        return Colors.glassSubtle;
      case 'tinted':
        return Colors.primarySubtle;
      default:
        return Colors.glass;
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: getBackgroundColor() },
        variant === 'elevated' ? Shadows.glass : Shadows.card,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    padding: 18,
    overflow: 'hidden',
  },
});
