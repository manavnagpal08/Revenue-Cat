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
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { authService } from '../../src/services/authService';
import { useAuthStore } from '../../src/store/authStore';

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initializeAuth = useAuthStore((state) => state.initialize);

  const handleRegister = async () => {
    setErrorMessage(null);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await authService.signUp({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });

      await initializeAuth();
      router.replace('/(onboarding)/setup-business');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
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
          <View style={styles.brandHeader}>
            <View style={styles.logoBadge}>
              <Sparkles size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.brandTitle}>Create Account</Text>
            <Text style={styles.brandSubtitle}>
              Join SoloCEO and automate your business operations
            </Text>
          </View>

          <GlassCard variant="elevated" style={styles.card}>
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Alex Rivera"
                  placeholderTextColor={Colors.textMuted}
                  value={fullName}
                  onChangeText={(val) => {
                    setFullName(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                />
              </View>
            </View>

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
                  placeholder="At least 6 characters"
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

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Repeat your password"
                  placeholderTextColor={Colors.textMuted}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            <GlassButton
              title="Create Account"
              variant="primary"
              size="lg"
              loading={loading}
              icon={<ArrowRight size={18} color="#FFFFFF" />}
              onPress={handleRegister}
              style={{ marginTop: 8 }}
            />
          </GlassCard>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have a workspace? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>Sign In</Text>
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
    marginBottom: 20,
  },
  logoBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...Shadows.glow,
  },
  brandTitle: {
    fontSize: 26,
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
    marginBottom: 14,
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
