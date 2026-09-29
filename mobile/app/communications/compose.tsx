import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
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
} from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';

export default function ComposeFollowUpScreen() {
  const router = useRouter();
  const [tone, setTone] = useState('Friendly & Professional');
  const [message, setMessage] = useState(
    "Hi {name},\n\nI hope you're doing well!\n\nI wanted to follow up on our discussion about the {project}. Do you have any questions or would you like to schedule a quick call to discuss the next steps?\n\nBest regards,"
  );
  const [sending, setSending] = useState(false);

  const handleSendAll = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      Alert.alert(
        'Campaign Sent! 🚀',
        'Personalized follow-up messages delivered to 3 customers (Acme Interiors, Rahul Designs, Vertex Media).',
        [{ text: 'Great', onPress: () => router.back() }]
      );
    }, 600);
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
          <Text style={styles.headerSubtitle}>AI will help you create a personalized follow-up message.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Recipients Card */}
        <Text style={styles.sectionLabel}>Recipients</Text>
        <TouchableOpacity style={styles.recipientCard} activeOpacity={0.8}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarMiniText}>AI</Text>
          </View>
          <View style={styles.recipientInfo}>
            <Text style={styles.recipientTitle}>3 customers selected</Text>
            <Text style={styles.recipientList}>Acme Interiors • Rahul Designs • Vertex Media</Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Message Context */}
        <Text style={styles.sectionLabel}>Message Context</Text>
        <View style={styles.contextBox}>
          <Text style={styles.contextText}>
            These customers haven't replied in the last 7 days. They showed high interest in their respective projects.
          </Text>
        </View>

        {/* AI Generated Message */}
        <View style={styles.aiGenHeader}>
          <Text style={styles.sectionLabel}>AI Generated Message</Text>
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
                "Hey {name},\n\nJust checking in regarding {project}. We have some openings next week to kick things off. Let me know if you'd like to reserve your spot!\n\nCheers,"
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
            <Send size={15} color="#FFFFFF" />
            <Text style={styles.sendBtnText}>{sending ? 'Sending...' : 'Send to 3 Customers'}</Text>
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
    marginTop: 12,
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
  contextBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
  },
  contextText: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
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
    minHeight: 140,
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
