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
import { ArrowLeft, User, Building, Mail, Phone, Globe, Save, Check } from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { customerService } from '../../src/services/customerService';
import { useAuthStore } from '../../src/store/authStore';

export default function CreateCustomerScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter customer or contact name.');
      return;
    }
    if (!currentBusiness?.id) return;

    setLoading(true);
    try {
      await customerService.createCustomer({
        business_id: currentBusiness.id,
        name: name.trim(),
        company_name: company.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        notes: notes.trim() || undefined,
        status: 'active',
      });

      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not create customer');
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
          <Text style={styles.headerTitle}>New Customer</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <GlassCard variant="elevated" style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Name *</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Vikram Mehta"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Company / Organization</Text>
              <View style={styles.inputWrapper}>
                <Building size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Acme Interiors"
                  placeholderTextColor={Colors.textMuted}
                  value={company}
                  onChangeText={setCompany}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="vikram@acmeinteriors.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Phone size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="+91 98201 11223"
                  placeholderTextColor={Colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Website</Text>
              <View style={styles.inputWrapper}>
                <Globe size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="https://acmeinteriors.com"
                  placeholderTextColor={Colors.textMuted}
                  value={website}
                  onChangeText={setWebsite}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <GlassButton
              title="Save Customer"
              variant="primary"
              size="lg"
              loading={loading}
              icon={<Save size={18} color="#FFFFFF" />}
              onPress={handleCreate}
              style={{ marginTop: 10 }}
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
    paddingBottom: 14,
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
  card: {
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
