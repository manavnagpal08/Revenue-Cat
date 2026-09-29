import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, Shadows } from '../constants/theme';

interface GlassButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'glass' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  style,
  disabled,
  ...props
}) => {
  const getContainerStyle = (): ViewStyle => {
    switch (variant) {
      case 'primary':
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
      case 'danger':
        return { color: Colors.textInverted, fontWeight: '700' };
      case 'secondary':
      case 'glass':
        return { color: Colors.text, fontWeight: '600' };
      case 'ghost':
        return { color: Colors.primary, fontWeight: '600' };
    }
  };

  const getSizeStyle = (): { container: ViewStyle; text: TextStyle } => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
          text: { fontSize: 13 },
        };
      case 'lg':
        return {
          container: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 18 },
          text: { fontSize: 16 },
        };
      default:
        return {
          container: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14 },
          text: { fontSize: 14 },
        };
    }
  };

  const { container: sizeContainer, text: sizeText } = getSizeStyle();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={[
        styles.baseButton,
        getContainerStyle(),
        sizeContainer,
        disabled && styles.disabledButton,
        style as ViewStyle,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : Colors.primary}
        />
      ) : (
        <>
          {icon ? <>{icon}</> : null}
          <Text style={[styles.baseText, getTextStyle(), sizeText, icon ? { marginLeft: 8 } : null]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  baseText: {
    letterSpacing: -0.2,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
