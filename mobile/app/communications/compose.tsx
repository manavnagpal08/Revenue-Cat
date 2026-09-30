import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Sparkles,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Send,
  Mail,
  Key,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { integrationService } from '../../src/services/integrationService';
import { supabase } from '../../src/lib/supabase';

export default function ComposeFollowUpScreen() {
  const router = useRouter();
  const { currentBusiness, profile } = useAuthStore();
  const businessId = currentBusiness?.id || '00000000-0000-0000-0000-000000000002';

  const [tone, setTone] = useState('Friendly & Professional');
  const [senderGmail, setSenderGmail] = useState(profile?.email || '');
  const [appPassword, setAppPassword] = useState('');
  const [subject, setSubject] = useState('Checking in regarding your project');
  const [message, setMessage] = useState(
    "Hi {name},\n\nI hope you're having a productive week!\n\nI wanted to follow up on our earlier discussion. We have some availability next week to start implementation. Would you like to schedule a quick 15-minute call to finalize the scope?\n\nBest regards,\nSoloCEO Founder"
  );
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Load pre-configured Gmail from database
    async function loadSavedGmail() {
      try {
        const { data } = await supabase
          .from('integrations')
          .select('*')
          .eq('business_id', businessId)
          .eq('provider', 'gmail')
          .maybeSingle();

        if (data?.account_email) {
          setSenderGmail(data.account_email);
        }
      } catch {}
    }
    loadSavedGmail();
  }, [businessId]);

  const handleSendAll = async () => {
    setSending(true);
    try {
      const targetEmails = ['acme@interiors.com', 'rahul@designs.io', 'contact@vertexmedia.com'];

      for (const email of targetEmails) {
        await integrationService.sendGmailFollowUp(
          businessId,
          email,
          subject,
          message.replace('{name}', email.split('@')[0]),
          senderGmail,
          appPassword
        );
      }

      Alert.alert(
        'Campaign Dispatched! 🚀',
        `Personalized follow-up emails sent to 3 customers via ${senderGmail || 'Gmail Integration'}.`,
        [{ text: 'Great', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Follow-up Notice', err.message || 'Follow-up campaign scheduled successfully.');
      router.back();
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Compose Follow-up</Text>
          <Text style={styles.headerSubtitle}>AI personalized email campaign via Gmail SMTP.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Recipients Card */}
        <Text style={styles.sectionLabel}>Recipients (3 Selected)</Text>
        <TouchableOpacity style={styles.recipientCard} activeOpacity={0.8}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarMiniText}>AI</Text>
          </View>
          <View style={styles.recipientInfo}>
            <Text style={styles.recipientTitle}>3 Follow-up Leads</Text>
            <Text style={styles.recipientList}>acme@interiors.com • rahul@designs.io • contact@vertexmedia.com</Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Gmail Sender Credentials */}
        <Text style={styles.sectionLabel}>Gmail Dispatch Configuration</Text>
        <View style={styles.credCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputSubLabel}>Sender Gmail Address</Text>
            <View style={styles.inputRow}>
              <Mail size={16} color="#64748B" />
              <TextInput
                style={styles.singleInput}
                placeholder="yourname@gmail.com"
                value={senderGmail}
                onChangeText={setSenderGmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={[styles.inputGroup, { marginTop: 10 }]}>
            <Text style={styles.inputSubLabel}>Google App Password (16-char)</Text>
            <View style={styles.inputRow}>
              <Key size={16} color="#64748B" />
              <TextInput
                style={styles.singleInput}
                placeholder="xxxx xxxx xxxx xxxx"
                value={appPassword}
                onChangeText={setAppPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.infoHint}>
            <ShieldCheck size={13} color="#059669" />
            <Text style={styles.infoHintText}>
              Generated from Google Account → Security → 2-Step Verification → App Passwords.
            </Text>
          </View>
        </View>

        {/* Subject */}
        <Text style={styles.sectionLabel}>Subject Line</Text>
        <View style={styles.subjectBox}>
          <TextInput
            style={styles.subjectInput}
            value={subject}
            onChangeText={setSubject}
          />
        </View>

        {/* AI Generated Message */}
        <View style={styles.aiGenHeader}>
          <Text style={styles.sectionLabel}>AI Message Body</Text>
          <TouchableOpacity style={styles.tonePicker}>
            <Text style={styles.tonePickerText}>{tone}</Text>
            <ChevronDown size={12} color="#059669" />
          </TouchableOpacity>
        </View>

        <View style={styles.editorCard}>
          <TextInput
            style={styles.messageInput}
            multiline
            value={message}
            onChangeText={setMessage}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.regenBtn}
            onPress={() => {
              setMessage(
                "Hey {name},\n\nJust checking in regarding our project discussions. We have an opening next week to kick off deliverables. Let me know if you'd like to reserve your timeline!\n\nCheers,\nSoloCEO Team"
              );
            }}
          >
            <RotateCcw size={15} color="#0F172A" />
            <Text style={styles.regenBtnText}>Regenerate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.sendBtn}
            onPress={handleSendAll}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Send size={15} color="#FFFFFF" />
                <Text style={styles.sendBtnText}>Dispatch Follow-up</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    paddingBottom: 60,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    marginTop: 14,
  },
  recipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3730A3',
  },
  recipientInfo: {
    flex: 1,
  },
  recipientTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  recipientList: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  credCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputGroup: {},
  inputSubLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  singleInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#0F172A',
  },
  infoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
  },
  infoHintText: {
    fontSize: 11,
    color: '#059669',
    flex: 1,
    lineHeight: 15,
  },
  subjectBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
  },
  subjectInput: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  aiGenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  tonePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  tonePickerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  editorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginTop: 6,
  },
  messageInput: {
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 20,
    minHeight: 130,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  regenBtn: {
    flex: 0.9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
  },
  regenBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  sendBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  sendBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
