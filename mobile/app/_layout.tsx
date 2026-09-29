import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { Colors, Shadows } from '../src/constants/theme';
import { Sparkles } from 'lucide-react-native';

export default function RootLayout() {
  const { isInitialized, session, currentBusiness, businesses, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    if (!session) {
      // Not logged in -> go to login
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else if (businesses.length === 0 && !currentBusiness) {
      // Logged in but no business -> go to onboarding
      if (!inOnboardingGroup) {
        router.replace('/(onboarding)/setup-business');
      }
    } else {
      // Logged in with business -> if on auth or onboarding, go to tabs
      if (inAuthGroup || inOnboardingGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [isInitialized, session, currentBusiness, businesses, segments]);

  if (!isInitialized) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <View style={styles.logoBadge}>
            <Sparkles size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.brandTitle}>SoloCEO</Text>
          <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 16 }} />
          <Text style={styles.loadingText}>Restoring business session...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
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
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
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
