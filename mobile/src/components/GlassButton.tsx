import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  View,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { safeHaptic } from '../utils/haptics';
import { Colors, Shadows, Gradients } from '../constants/theme';

interface GlassButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'glass' | 'danger' | 'ghost' | 'emerald';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  enableHaptics?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  style,
  disabled,
  enableHaptics = true,
  onPress,
  ...props
}) => {
  const handlePress = (e: any) => {
    if (enableHaptics) {
      safeHaptic.medium();
    }
    onPress?.(e);
  };

  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
      case 'emerald':
        return {
          backgroundColor: Colors.primary,
          borderColor: Colors.primaryDark,
          ...Shadows.glow,
        };
      case 'secondary':
        return {
          backgroundColor: Colors.card,
          borderColor: Colors.border,
          ...Shadows.card,
        };
      case 'glass':
        return {
          backgroundColor: Colors.glass,
          borderColor: Colors.borderGlass,
          ...Shadows.glass,
        };
      case 'danger':
        return {
          backgroundColor: Colors.danger,
          borderColor: Colors.danger,
          ...Shadows.card,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case 'primary':
      case 'emerald':
      case 'danger':
        return { color: Colors.textInverted, fontWeight: '700', fontFamily: 'Manrope_700Bold' };
      case 'secondary':
      case 'glass':
        return { color: Colors.text, fontWeight: '600', fontFamily: 'Manrope_600SemiBold' };
      case 'ghost':
        return { color: Colors.primary, fontWeight: '700', fontFamily: 'Manrope_700Bold' };
    }
  };

  const getSizeStyle = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 14 },
          text: { fontSize: 13, fontFamily: 'Manrope_600SemiBold' },
        };
      case 'lg':
        return {
          container: { paddingVertical: 16, paddingHorizontal: 26, borderRadius: 20 },
          text: { fontSize: 16, fontFamily: 'Manrope_700Bold' },
        };
      default:
        return {
          container: { paddingVertical: 13, paddingHorizontal: 22, borderRadius: 16 },
          text: { fontSize: 14, fontFamily: 'Manrope_600SemiBold' },
        };
    }
  };

  const { container: sizeContainer, text: sizeText } = getSizeStyle();
  const isGradient = variant === 'primary' || variant === 'emerald';

  return (
    <TouchableOpacity
      activeOpacity={0.84}
      disabled={disabled || loading}
      onPress={handlePress}
      style={[
        styles.baseButton,
        getContainerStyle(),
        sizeContainer,
        disabled && styles.disabledButton,
        style as ViewStyle,
      ]}
      {...props}
    >
      {isGradient ? (
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.8 }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}

      {loading ? (
        <ActivityIndicator
          size="small"
          color={isGradient || variant === 'danger' ? '#FFFFFF' : Colors.primary}
        />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text style={[styles.baseText, getTextStyle(), sizeText]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    marginRight: 8,
  },
  baseText: {
    letterSpacing: -0.2,
    fontFamily: 'Manrope_600SemiBold',
  },
  disabledButton: {
    opacity: 0.45,
  },
});

