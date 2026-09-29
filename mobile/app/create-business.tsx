import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Building, Globe, Phone, DollarSign, Plus } from 'lucide-react-native';
import { Colors } from '../src/constants/theme';
import { GlassCard } from '../src/components/GlassCard';
import { GlassButton } from '../src/components/GlassButton';
import { useAuthStore } from '../src/store/authStore';

export default function CreateBusinessScreen() {
  const router = useRouter();
  const { createBusiness } = useAuthStore();

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [website, setWebsite] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a workspace or company name.');
      return;
    }

    setLoading(true);
    try {
      await createBusiness({
        name: name.trim(),
        industry: industry.trim() || undefined,
        currency: currencySymbol === '₹' ? 'INR' : 'USD',
        currency_symbol: currencySymbol.trim() || '₹',
        website: website.trim() || undefined,
        phone: phone.trim() || undefined,
      });

      Alert.alert(
        'Workspace Created! 🎉',
        `Switched to ${name.trim()} workspace.`,
        [{ text: 'Continue to Dashboard', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (err: any) {
      Alert.alert('Creation Failed', err.message || 'Could not create workspace');
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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Workspace</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.heroSection}>
            <View style={styles.iconCircle}>
              <Building size={28} color={Colors.primary} />
            </View>
            <Text style={styles.heroTitle}>Create Business Workspace</Text>
            <Text style={styles.heroSub}>
              Manage multiple ventures, agencies, or client brands with dedicated AI agents and segregated financial records.
            </Text>
          </View>

          <GlassCard variant="elevated" style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business / Studio Name *</Text>
              <View style={styles.inputWrapper}>
                <Building size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Apex Marketing Agency"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Industry / Sector</Text>
              <View style={styles.inputWrapper}>
                <Globe size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={industry}
                  onChangeText={setIndustry}
                  placeholder="e.g. Marketing & Digital Media"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Currency Symbol</Text>
              <View style={styles.inputWrapper}>
                <DollarSign size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={currencySymbol}
                  onChangeText={setCurrencySymbol}
                  placeholder="₹ or $"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Website</Text>
              <View style={styles.inputWrapper}>
                <Globe size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={website}
                  onChangeText={setWebsite}
                  placeholder="https://apexagency.com"
                  placeholderTextColor={Colors.textMuted}
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
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 98765 43210"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <GlassButton
              title="Create & Switch Workspace"
              variant="primary"
              size="lg"
              loading={loading}
              icon={<Plus size={18} color="#FFFFFF" />}
              onPress={handleCreate}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
  },
  heroSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  formCard: {
    padding: 20,
    marginTop: 10,
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
