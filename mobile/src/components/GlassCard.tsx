import React from 'react';
import { View, ViewProps, StyleSheet, TouchableOpacity, StyleProp, ViewStyle, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { safeHaptic } from '../utils/haptics';
import { Colors, Shadows, Gradients } from '../constants/theme';

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle' | 'tinted' | 'gradient' | 'glow';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  className?: string;
  enableHaptics?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  onPress,
  style,
  enableHaptics = true,
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
      case 'glow':
        return '#FFFFFF';
      default:
        return Colors.glass;
    }
  };

  const getShadow = () => {
    switch (variant) {
      case 'elevated':
        return Shadows.glass;
      case 'glow':
        return Shadows.glowSubtle;
      case 'subtle':
        return Shadows.sm;
      default:
        return Shadows.card;
    }
  };

  const handlePress = () => {
    if (enableHaptics) {
      safeHaptic.light();
    }
    onPress?.();
  };

  const content = (
    <View
      style={[
        styles.card,
        { backgroundColor: getBackgroundColor() },
        getShadow(),
        variant === 'glow' && styles.glowBorder,
        variant === 'tinted' && styles.tintedBorder,
        style,
      ]}
      {...props}
    >
      {variant === 'gradient' ? (
        <LinearGradient
          colors={Gradients.cardGlass}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handlePress}
        style={styles.touchableWrapper}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  touchableWrapper: {
    borderRadius: 22,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  glowBorder: {
    borderColor: Colors.borderEmerald,
    borderWidth: 1.5,
  },
  tintedBorder: {
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
});

