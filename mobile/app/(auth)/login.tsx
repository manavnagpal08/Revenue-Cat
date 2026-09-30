import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { GoogleButton } from '../../src/components/GoogleButton';
import { authService } from '../../src/services/authService';
import { workspaceService } from '../../src/services/workspaceService';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    setErrorMessage(null);
    if (!email.trim() || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const authData = await authService.signIn({
        email: email.trim(),
        password,
      });

      const user = authData?.user;
      if (!user) throw new Error('Could not retrieve user profile.');

      const userEmail = user.email || email.trim().toLowerCase();
      const userName = user.user_metadata?.full_name || userEmail.split('@')[0];
      const userId = user.id;

      // Fetch user's real businesses
      const userBusinesses = await workspaceService.getUserBusinesses(userId);

      useAuthStore.setState({
        session: authData.session || ({ user: { id: userId, email: userEmail } } as any),
        user: user as any,
        profile: {
          id: userId,
          email: userEmail,
          full_name: userName,
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        },
        businesses: userBusinesses,
        currentBusiness: userBusinesses.length > 0 ? userBusinesses[0] : null,
        isLoading: false,
        isInitialized: true,
      });

      if (userBusinesses.length === 0) {
        router.replace('/(onboarding)/setup-business');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);
    try {
      const authResult: any = await authService.signInWithGoogle();
      const authenticatedUser = authResult?.user;
      if (!authenticatedUser) throw new Error('Google authentication failed.');

      const userEmail = authenticatedUser.email || 'founder@soloceo.app';
      const userName = authenticatedUser.user_metadata?.full_name || userEmail.split('@')[0];
      const userId = authenticatedUser.id;
      const userAvatar = authenticatedUser.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';

      const userBusinesses = await workspaceService.getUserBusinesses(userId);

      useAuthStore.setState({
        session: authResult.session || ({ user: { id: userId, email: userEmail } } as any),
        user: authenticatedUser,
        profile: {
          id: userId,
          email: userEmail,
          full_name: userName,
          avatar_url: userAvatar,
        },
        businesses: userBusinesses,
        currentBusiness: userBusinesses.length > 0 ? userBusinesses[0] : null,
        isLoading: false,
        isInitialized: true,
      });

      if (userBusinesses.length === 0) {
        router.replace('/(onboarding)/setup-business');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setEmail('founder.demo@soloceo.app');
    setPassword('Password123!');
    setLoading(true);
    const userId = 'usr-demo-alex-rivera';
    const bizId = '00000000-0000-0000-0000-000000000002';

    useAuthStore.setState({
      session: { user: { id: userId, email: 'founder.demo@soloceo.app' } } as any,
      user: { id: userId, email: 'founder.demo@soloceo.app' } as any,
      profile: {
        id: userId,
        email: 'founder.demo@soloceo.app',
        full_name: 'Alex Rivera',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      },
      businesses: [
        {
          id: bizId,
          name: 'Rivera Studio',
          slug: 'rivera-studio',
          owner_id: userId,
          industry: 'Design & Tech Agency',
          currency: 'INR',
          currency_symbol: '₹',
          created_at: new Date().toISOString(),
        },
      ],
      currentBusiness: {
        id: bizId,
        name: 'Rivera Studio',
        slug: 'rivera-studio',
        owner_id: userId,
        industry: 'Design & Tech Agency',
        currency: 'INR',
        currency_symbol: '₹',
        created_at: new Date().toISOString(),
      },
      isLoading: false,
      isInitialized: true,
    });
    router.replace('/(tabs)');
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.container}>
            {/* Header Brand */}
            <View style={styles.brandHeader}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.brandTitle}>SoloCEO</Text>
              <Text style={styles.brandSubtitle}>
                AI Operations & Business Management
              </Text>
            </View>

            {/* Auth Card */}
            <GlassCard variant="elevated" style={styles.card}>
              <Text style={styles.cardTitle}>Sign in to your workspace</Text>

              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {/* 1-Click Google Sign In */}
              <GoogleButton
                title="Continue with Google"
                loading={googleLoading}
                onPress={handleGoogleSignIn}
                style={{ marginBottom: 14 }}
              />

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with email</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Inputs */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Work Email</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={16} color={Colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="alex.founder@soloceo.app"
                    placeholderTextColor={Colors.textMuted}
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={16} color={Colors.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••••••"
                    placeholderTextColor={Colors.textMuted}
                    value={password}
                    onChangeText={(val) => {
                      setPassword(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    activeOpacity={0.7}
                  >
                    {showPassword ? (
                      <EyeOff size={16} color={Colors.textMuted} />
                    ) : (
                      <Eye size={16} color={Colors.textMuted} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <GlassButton
                title="Sign In"
                variant="primary"
                size="md"
                loading={loading}
                icon={<ArrowRight size={16} color="#FFFFFF" />}
                onPress={handleLogin}
                style={{ marginTop: 8 }}
              />

              <GlassButton
                title="⚡ 1-Tap Founder Demo"
                variant="secondary"
                size="md"
                onPress={handleQuickDemo}
                style={{ marginTop: 10 }}
              />
            </GlassCard>

            {/* Footer */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>New to SoloCEO? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.footerLink}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: Colors.text,
  },
  brandSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
    fontFamily: 'Manrope_500Medium',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    backgroundColor: '#FFFFFF',
    ...Shadows.card,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: Colors.text,
    marginBottom: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginHorizontal: 8,
    fontWeight: '500',
    fontFamily: 'Manrope_500Medium',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    fontFamily: 'Manrope_500Medium',
  },
  eyeBtn: {
    padding: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  footerText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    fontFamily: 'Manrope_500Medium',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: Colors.primary,
  },
});
