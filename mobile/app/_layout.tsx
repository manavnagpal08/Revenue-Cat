import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { Colors, Shadows } from '../src/constants/theme';
import { Sparkles } from 'lucide-react-native';
import { AnimatedSplashScreen } from '../src/components/AnimatedSplashScreen';

import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';

export default function RootLayout() {
  const { isInitialized, session, currentBusiness, businesses, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const [timedOut, setTimedOut] = React.useState(false);

  useEffect(() => {
    initialize();
    const timer = setTimeout(() => {
      setTimedOut(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const isReady = (isInitialized && (fontsLoaded || !!fontError)) || timedOut;

  useEffect(() => {
    if (!isReady) return;

    const timer = setTimeout(() => {
      try {
        const inAuthGroup = segments[0] === '(auth)';
        const inOnboardingGroup = segments[0] === '(onboarding)';

        if (!session) {
          if (!inAuthGroup) {
            router.replace('/(auth)/login');
          }
        } else if (businesses.length === 0 && !currentBusiness) {
          if (!inOnboardingGroup) {
            router.replace('/(onboarding)/setup-business');
          }
        } else {
          if (inAuthGroup || inOnboardingGroup) {
            router.replace('/(tabs)');
          }
        }
      } catch (navErr) {
        console.warn('Navigation redirect notice:', navErr);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isReady, session, currentBusiness, businesses, segments]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <View style={styles.outerFrame}>
        <View style={styles.appContainer}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#F8FAFC' },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen
              name="paywall"
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="edit-profile"
              options={{
                presentation: 'card',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="edit-business"
              options={{
                presentation: 'card',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="create-business"
              options={{
                presentation: 'card',
                headerShown: false,
              }}
            />
          </Stack>

          {!isReady && (
            <View style={StyleSheet.absoluteFillObject}>
              <AnimatedSplashScreen message="Restoring business session..." />
            </View>
          )}
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outerFrame: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? '#0F172A' : '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : undefined,
    backgroundColor: '#F8FAFC',
    ...(Platform.OS === 'web'
      ? {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.35,
          shadowRadius: 32,
          elevation: 20,
          borderLeftWidth: 1,
          borderRightWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.12)',
          minHeight: '100vh' as any,
          height: '100%',
          overflow: 'hidden' as any,
        }
      : {}),
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...Shadows.glow,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.6,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
  },
});
