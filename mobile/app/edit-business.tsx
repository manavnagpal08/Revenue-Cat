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
import { ArrowLeft, Building, Globe, Phone, DollarSign, FileText, Check, Save } from 'lucide-react-native';
import { Colors } from '../src/constants/theme';
import { GlassCard } from '../src/components/GlassCard';
import { GlassButton } from '../src/components/GlassButton';
import { useAuthStore } from '../src/store/authStore';

export default function EditBusinessScreen() {
  const router = useRouter();
  const { currentBusiness, updateBusiness } = useAuthStore();

  const [name, setName] = useState(currentBusiness?.name || '');
  const [industry, setIndustry] = useState(currentBusiness?.industry || '');
  const [website, setWebsite] = useState(currentBusiness?.website || '');
  const [phone, setPhone] = useState(currentBusiness?.phone || '');
  const [currencySymbol, setCurrencySymbol] = useState(currentBusiness?.currency_symbol || '₹');
  const [address, setAddress] = useState(currentBusiness?.address || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter business name.');
      return;
    }
    if (!currentBusiness?.id) return;

    setSaving(true);
    setSavedSuccess(false);
    try {
      await updateBusiness(currentBusiness.id, {
        name: name.trim(),
        industry: industry.trim() || undefined,
        website: website.trim() || undefined,
        phone: phone.trim() || undefined,
        currency_symbol: currencySymbol.trim() || '₹',
        address: address.trim() || undefined,
      });

      setSavedSuccess(true);
      setTimeout(() => {
        router.back();
      }, 700);
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Could not update business details');
    } finally {
      setSaving(false);
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
          <Text style={styles.headerTitle}>Business Workspace</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <GlassCard variant="elevated" style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Name</Text>
              <View style={styles.inputWrapper}>
                <Building size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Rivera Studio"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Industry / Sector</Text>
              <View style={styles.inputWrapper}>
                <FileText size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  value={industry}
                  onChangeText={setIndustry}
                  placeholder="Design & Consulting"
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
                  placeholder="https://riverastudio.io"
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
              title={
                savedSuccess
                  ? 'Saved to Supabase!'
                  : saving
                  ? 'Saving Business...'
                  : 'Save Business Details'
              }
              variant={savedSuccess ? 'secondary' : 'primary'}
              size="lg"
              loading={saving}
              icon={
                savedSuccess ? (
                  <Check size={18} color={Colors.success} />
                ) : (
                  <Save size={18} color="#FFFFFF" />
                )
              }
              onPress={handleSave}
              style={{ marginTop: 12 }}
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
  formCard: {
    padding: 20,
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
