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
import { ArrowLeft, TrendingUp, DollarSign, Building, User, Phone, Mail, Save } from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { leadService } from '../../src/services/leadService';
import { useAuthStore } from '../../src/store/authStore';

export default function CreateLeadScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();

  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [value, setValue] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('high');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !value.trim()) {
      Alert.alert('Required', 'Please enter deal title and estimated deal value.');
      return;
    }
    if (!currentBusiness?.id) return;

    setLoading(true);
    try {
      await leadService.createLead({
        business_id: currentBusiness.id,
        title: title.trim(),
        company: company.trim() || undefined,
        contact_name: contactName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        value: parseFloat(value.replace(/[^0-9.]/g, '')) || 0,
        priority,
        status: 'new',
        probability: 20,
      });

      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not create lead');
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
          <Text style={styles.headerTitle}>New Deal</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <GlassCard variant="elevated" style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Deal / Project Title *</Text>
              <View style={styles.inputWrapper}>
                <TrendingUp size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Brand Redesign & App Suite"
                  placeholderTextColor={Colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Deal Value (₹) *</Text>
              <View style={styles.inputWrapper}>
                <DollarSign size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="85000"
                  placeholderTextColor={Colors.textMuted}
                  value={value}
                  onChangeText={setValue}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityRow}>
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.priorityBtn,
                      priority === p && styles.priorityBtnActive,
                    ]}
                    onPress={() => setPriority(p)}
                  >
                    <Text
                      style={[
                        styles.priorityBtnText,
                        priority === p && styles.priorityBtnTextActive,
                      ]}
                    >
                      {p.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Company Name</Text>
              <View style={styles.inputWrapper}>
                <Building size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Acme Interiors"
                  placeholderTextColor={Colors.textMuted}
                  value={company}
                  onChangeText={setCompany}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Person</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color={Colors.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Vikram Mehta"
                  placeholderTextColor={Colors.textMuted}
                  value={contactName}
                  onChangeText={setContactName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contact Email</Text>
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

            <GlassButton
              title="Add Deal to Pipeline"
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
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priorityBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  priorityBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  priorityBtnTextActive: {
    color: '#FFFFFF',
  },
});
