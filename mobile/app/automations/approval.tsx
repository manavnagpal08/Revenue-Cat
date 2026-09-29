import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  X,
  Send,
  XCircle,
  Mail,
  AlertCircle,
  FileText,
  User,
} from 'lucide-react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors, Shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { automationService } from '../../src/services/automationService';

export default function AutomationApprovalScreen() {
  const { actionId } = useLocalSearchParams<{ actionId?: string }>();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || '00000000-0000-0000-0000-000000000002';
  const businessName = currentBusiness?.name || 'Acme Studio';

  const [recipient, setRecipient] = useState('Acme Interiors (hello@acmeinteriors.in)');
  const [subject, setSubject] = useState('Payment Reminder - Invoice #INV-1042');
  const [content, setContent] = useState(
    `Hi Team,\n\nThis is a friendly reminder that invoice #INV-1042 for ₹24,500 is overdue by 8 days.\n\nPlease let me know if you need any additional information.\n\nBest regards,\n${businessName}`
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (actionId) {
      loadPendingAction();
    }
  }, [actionId]);

  const loadPendingAction = async () => {
    try {
      const actions = await automationService.getPendingApprovals(businessId);
      const target = actions.find((a) => a.id === actionId);
      if (target && target.output_data) {
        const out = target.output_data;
        if (out.entity_name && out.recipient) {
          setRecipient(`${out.entity_name} (${out.recipient})`);
        }
        if (out.subject) setSubject(out.subject);
        if (out.body) setContent(out.body);
      }
    } catch (e) {
      console.warn('Error loading pending action details:', e);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      if (actionId) {
        await automationService.approveAction(actionId, businessId, 'Approved in SoloCEO Mobile');
      }
      Alert.alert('Success', 'Action approved and sent successfully!', [
        { text: 'Done', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Approval Failed', e?.message || 'Error executing action');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      if (actionId) {
        await automationService.rejectAction(actionId, businessId, 'Rejected in SoloCEO Mobile');
      }
      Alert.alert('Action Rejected', 'Action has been dismissed and will not be executed.', [
        { text: 'Done', onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert('Rejection Failed', e?.message || 'Error rejecting action');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header matching Screen 8 */}
      <View style={styles.header}>
        <View style={{ width: 36 }} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Approve Action</Text>
          <Text style={styles.headerSubtitle}>Review the email content before sending.</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <X size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Action Title Card */}
        <GlassCard style={styles.actionTypeCard}>
          <View style={styles.actionTypeRow}>
            <View style={styles.actionIconBox}>
              <AlertCircle size={18} color="#D97706" />
            </View>
            <View style={styles.actionTypeContent}>
              <Text style={styles.actionTypeTitle}>Send Payment Reminder</Text>
              <Text style={styles.actionTypeSub}>Drafted by Finance Agent</Text>
            </View>
          </View>
        </GlassCard>

        {/* Recipient */}
        <Text style={styles.fieldLabel}>Recipient</Text>
        <GlassCard style={styles.fieldCard}>
          <View style={styles.recipientRow}>
            <View style={styles.avatarInitials}>
              <Text style={styles.avatarText}>RA</Text>
            </View>
            <Text style={styles.recipientText}>{recipient}</Text>
          </View>
        </GlassCard>

        {/* Email Subject */}
        <Text style={styles.fieldLabel}>Email Subject</Text>
        <GlassCard style={styles.fieldCard}>
          <TextInput
            style={styles.subjectInput}
            value={subject}
            onChangeText={setSubject}
          />
        </GlassCard>

        {/* Email Content */}
        <Text style={styles.fieldLabel}>Email Content</Text>
        <GlassCard style={styles.contentCard}>
          <TextInput
            style={styles.contentInput}
            multiline
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
          />
        </GlassCard>

        {/* Action Buttons: Reject & Approve/Send */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={handleReject}
            disabled={loading}
          >
            <Text style={styles.rejectBtnText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.approveBtn}
            onPress={handleApprove}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Send size={16} color="#FFFFFF" />
                <Text style={styles.approveBtnText}>Approve & Send</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  actionTypeCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  actionTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTypeContent: {
    flex: 1,
  },
  actionTypeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionTypeSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  fieldCard: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarInitials: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  recipientText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  subjectInput: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0F172A',
    padding: 0,
  },
  contentCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 24,
  },
  contentInput: {
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 20,
    minHeight: 140,
    padding: 0,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    ...Shadows.sm,
  },
  approveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
