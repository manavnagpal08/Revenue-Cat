import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Store, ChevronDown, ArrowRight } from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';

export default function SetupBusinessScreen() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('Acme Digital');
  const [businessType, setBusinessType] = useState('Agency');
  const [industry, setIndustry] = useState('Digital Services');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { createBusiness } = useAuthStore();

  const handleNext = async () => {
    setErrorMsg(null);
    if (!businessName.trim()) {
      setErrorMsg('Please enter your business name.');
      return;
    }

    setLoading(true);
    try {
      await createBusiness({
        name: businessName.trim(),
        industry: industry.trim() || 'Digital Services',
        currency: 'INR',
        currency_symbol: '₹',
      });

      router.replace('/(tabs)');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to setup business workspace.');
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
        {/* Top Bar with Step Indicator */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>1/4</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Store size={32} color="#059669" />
            </View>
            <Text style={styles.title}>Let's set up your business</Text>
            <Text style={styles.subtitle}>
              This helps us personalize your SoloCEO experience.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Business Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Acme Digital"
                placeholderTextColor="#94A3B8"
                value={businessName}
                onChangeText={(val) => {
                  setBusinessName(val);
                  if (errorMsg) setErrorMsg(null);
                }}
              />
            </View>

            {/* Business Type Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Type</Text>
              <TouchableOpacity style={styles.dropdownBox} activeOpacity={0.8}>
                <Text style={styles.dropdownText}>{businessType}</Text>
                <ChevronDown size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Industry Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Industry</Text>
              <TouchableOpacity style={styles.dropdownBox} activeOpacity={0.8}>
                <Text style={styles.dropdownText}>{industry}</Text>
                <ChevronDown size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Next Button */}
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={handleNext}
              disabled={loading}
              activeOpacity={0.85}
            >
              <Text style={styles.nextBtnText}>
                {loading ? 'Creating...' : 'Next'}
              </Text>
              {!loading && <ArrowRight size={16} color="#FFFFFF" />}
            </TouchableOpacity>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    padding: 6,
  },
  stepIndicator: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginVertical: 18,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 10,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  dropdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 46,
  },
  dropdownText: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '500',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
