import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Building, Globe, Phone, DollarSign, ArrowRight } from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/authStore';

export default function SetupBusinessScreen() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const { session, initialize } = useAuthStore();

  const handleCreateBusiness = async () => {
    if (!businessName.trim()) {
      Alert.alert('Required Field', 'Please enter your business or studio name.');
      return;
    }

    setLoading(true);
    try {
      const userId = session?.user?.id;
      if (!userId) {
        Alert.alert('Session Expired', 'Please sign in first.');
        router.replace('/(auth)/login');
        return;
      }

      const { data: biz, error } = await supabase
        .from('businesses')
        .insert({
          owner_id: userId,
          name: businessName.trim(),
          industry: industry.trim() || 'Consulting & Services',
          currency: currencySymbol === '₹' ? 'INR' : 'USD',
          currency_symbol: currencySymbol,
          website: website.trim() || null,
          phone: phone.trim() || null,
        })
        .select()
        .single();

      if (error) {
        Alert.alert('Error', error.message);
        setLoading(false);
        return;
      }

      // Add as owner member
      await supabase.from('business_members').insert({
        business_id: biz.id,
        user_id: userId,
        role: 'owner',
      });

      // Business settings
      await supabase.from('business_settings').insert({
        business_id: biz.id,
      });

      await initialize();
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to setup business workspace');
    } finally {
      setLoading(false);
    }
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
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Building size={32} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Set Up Workspace</Text>
            <Text style={styles.subtitle}>
              Configure your business operations hub. SoloCEO will tailor AI insights to your business profile.
            </Text>
          </View>

          <GlassCard variant="elevated" style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business / Studio Name *</Text>
              <View style={styles.inputWrapper}>
                <Building size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Rivera Design & Tech Studio"
                  placeholderTextColor={Colors.textMuted}
                  value={businessName}
                  onChangeText={setBusinessName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Industry / Specialization</Text>
              <View style={styles.inputWrapper}>
                <Globe size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Design & Technology Consulting"
                  placeholderTextColor={Colors.textMuted}
                  value={industry}
                  onChangeText={setIndustry}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Currency Symbol</Text>
              <View style={styles.inputWrapper}>
                <DollarSign size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="₹ (INR) or $ (USD)"
                  placeholderTextColor={Colors.textMuted}
                  value={currencySymbol}
                  onChangeText={setCurrencySymbol}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Website</Text>
              <View style={styles.inputWrapper}>
                <Globe size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="https://riverastudio.io"
                  placeholderTextColor={Colors.textMuted}
                  value={website}
                  onChangeText={setWebsite}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Phone</Text>
              <View style={styles.inputWrapper}>
                <Phone size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={Colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <GlassButton
              title="Launch Business Command Center"
              variant="primary"
              size="lg"
              loading={loading}
              icon={<ArrowRight size={18} color="#FFFFFF" />}
              onPress={handleCreateBusiness}
              style={{ marginTop: 8 }}
            />
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    paddingHorizontal: 12,
  },
  card: {
    padding: 20,
    ...Shadows.glass,
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
});
