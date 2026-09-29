import { Platform } from 'react-native';

export const safeHaptic = {
  light: async () => {
    if (Platform.OS !== 'web') {
      try {
        const Haptics = require('expo-haptics');
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  },
  medium: async () => {
    if (Platform.OS !== 'web') {
      try {
        const Haptics = require('expo-haptics');
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
  },
  heavy: async () => {
    if (Platform.OS !== 'web') {
      try {
        const Haptics = require('expo-haptics');
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch {}
    }
  },
  success: async () => {
    if (Platform.OS !== 'web') {
      try {
        const Haptics = require('expo-haptics');
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }
  },
};
