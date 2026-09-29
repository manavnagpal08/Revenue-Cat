import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Mail,
  Calendar,
  MessageCircle,
  Globe,
  Send,
  Tag,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';
import { GoogleButton } from '../../src/components/GoogleButton';
import { Colors } from '../../src/constants/theme';

export default function ProviderConnectScreen() {
  const router = useRouter();
  const { provider } = useLocalSearchParams();
  const [connecting, setConnecting] = useState(false);

  const isGmail = provider === 'gmail' || !provider;

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      Alert.alert(
        'Connected! 🚀',
        'Your Gmail account has been securely connected to your SoloCEO workspace.',
        [{ text: 'Great', onPress: () => router.back() }]
      );
    }, 800);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Logo */}
        <View style={styles.logoBox}>
          <Mail size={44} color="#EA4335" />
        </View>

        <Text style={styles.title}>Connect Your Gmail</Text>
        <Text style={styles.subtitle}>
          Securely connect your Gmail account to sync emails, track conversations, and let AI help you follow up.
        </Text>

        {/* Feature List */}
        <View style={styles.featureCard}>
          <View style={styles.featureItem}>
            <View style={styles.iconCircle}>
              <Mail size={16} color="#059669" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Read your emails</Text>
              <Text style={styles.featureDesc}>To understand customer conversations</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.iconCircle}>
              <Send size={16} color="#059669" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Send emails</Text>
              <Text style={styles.featureDesc}>To reply and send follow-ups</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.iconCircle}>
              <Tag size={16} color="#059669" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Access labels</Text>
              <Text style={styles.featureDesc}>To organize and track important emails</Text>
            </View>
          </View>

          <View style={[styles.featureItem, { borderBottomWidth: 0 }]}>
            <View style={styles.iconCircle}>
              <ShieldCheck size={16} color="#059669" />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Secure & encrypted</Text>
              <Text style={styles.featureDesc}>Your data is protected and never shared</Text>
            </View>
          </View>
        </View>

        {/* Connect Action */}
        <TouchableOpacity
          style={styles.connectBtn}
          onPress={handleConnect}
          disabled={connecting}
          activeOpacity={0.85}
        >
          <Text style={styles.connectBtnText}>
            {connecting ? 'Connecting...' : 'Connect with Google'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.footerNote}>You can disconnect anytime from settings.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: {
    padding: 6,
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
    maxWidth: 300,
    marginBottom: 24,
  },
  featureCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  featureDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  connectBtn: {
    width: '100%',
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  connectBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerNote: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 14,
  },
});
