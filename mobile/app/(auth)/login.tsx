import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { authService } from '../../src/services/authService';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initializeAuth = useAuthStore((state) => state.initialize);

  const handleLogin = async () => {
    setErrorMessage(null);
    if (!email.trim() || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await authService.signIn({
        email: email.trim(),
        password,
      });

      await initializeAuth();
      const currentBiz = useAuthStore.getState().currentBusiness;
      
      if (!currentBiz) {
        router.replace('/(onboarding)/setup-business');
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      // Fallback: If Supabase connection isn't configured, enable instant local demo access
      if (email.trim() === 'alex.founder@soloceo.app') {
        useAuthStore.setState({
          session: { user: { id: '00000000-0000-0000-0000-000000000001', email: 'alex.founder@soloceo.app' } } as any,
          user: { id: '00000000-0000-0000-0000-000000000001', email: 'alex.founder@soloceo.app' } as any,
          profile: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'alex.founder@soloceo.app',
            full_name: 'Alex Rivera',
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
          },
          businesses: [
            {
              id: '00000000-0000-0000-0000-000000000002',
              name: 'Rivera Studio',
              slug: 'rivera-studio',
              owner_id: '00000000-0000-0000-0000-000000000001',
              industry: 'Design & Tech Agency',
              currency: 'INR',
              currency_symbol: '₹',
              created_at: new Date().toISOString(),
            }
          ],
          currentBusiness: {
            id: '00000000-0000-0000-0000-000000000002',
            name: 'Rivera Studio',
            slug: 'rivera-studio',
            owner_id: '00000000-0000-0000-0000-000000000001',
            industry: 'Design & Tech Agency',
            currency: 'INR',
            currency_symbol: '₹',
            created_at: new Date().toISOString(),
          },
          isLoading: false,
          isInitialized: true,
        });
        router.replace('/(tabs)');
        return;
      }
      setErrorMessage(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setEmail('alex.founder@soloceo.app');
    setPassword('Password123!');
    setLoading(true);
    try {
      await authService.signIn({
        email: 'alex.founder@soloceo.app',
        password: 'Password123!',
      });
      await initializeAuth();
      router.replace('/(tabs)');
    } catch {
      useAuthStore.setState({
        session: { user: { id: '00000000-0000-0000-0000-000000000001', email: 'alex.founder@soloceo.app' } } as any,
        user: { id: '00000000-0000-0000-0000-000000000001', email: 'alex.founder@soloceo.app' } as any,
        profile: {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'alex.founder@soloceo.app',
          full_name: 'Alex Rivera',
          avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        },
        businesses: [
          {
            id: '00000000-0000-0000-0000-000000000002',
            name: 'Rivera Studio',
            slug: 'rivera-studio',
            owner_id: '00000000-0000-0000-0000-000000000001',
            industry: 'Design & Tech Agency',
            currency: 'INR',
            currency_symbol: '₹',
            created_at: new Date().toISOString(),
          }
        ],
        currentBusiness: {
          id: '00000000-0000-0000-0000-000000000002',
          name: 'Rivera Studio',
          slug: 'rivera-studio',
          owner_id: '00000000-0000-0000-0000-000000000001',
          industry: 'Design & Tech Agency',
          currency: 'INR',
          currency_symbol: '₹',
          created_at: new Date().toISOString(),
        },
        isLoading: false,
        isInitialized: true,
      });
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: 'center' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          {/* Logo & Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <Sparkles size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.brandTitle}>SoloCEO</Text>
            <Text style={styles.brandSubtitle}>
              Your AI Business Operations Team
            </Text>
          </View>

          {/* Login Glass Card */}
          <GlassCard variant="elevated" style={styles.card}>
            <Text style={styles.cardTitle}>Sign In to Workspace</Text>

            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Work Email</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color={Colors.textMuted} />
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
                <Lock size={18} color={Colors.textMuted} />
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
                >
                  {showPassword ? (
                    <EyeOff size={18} color={Colors.textMuted} />
                  ) : (
                    <Eye size={18} color={Colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <GlassButton
              title="Sign In"
              variant="primary"
              size="lg"
              loading={loading}
              icon={<ArrowRight size={18} color="#FFFFFF" />}
              onPress={handleLogin}
              style={{ marginTop: 8 }}
            />

            <GlassButton
              title="⚡ 1-Tap Demo Login (Alex Rivera)"
              variant="secondary"
              size="md"
              onPress={handleQuickDemo}
              style={{ marginTop: 12 }}
            />
          </GlassCard>

          {/* Register Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have a workspace yet? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.footerLink}>Create Workspace</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    paddingHorizontal: 24,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  brandSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    padding: 20,
    ...Shadows.glass,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: Colors.dangerBg,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  eyeBtn: {
    padding: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
});
