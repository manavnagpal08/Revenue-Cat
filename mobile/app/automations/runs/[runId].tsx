import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  Shield,
  Bot,
  Send,
  XCircle,
} from 'lucide-react-native';
import { GlassCard } from '../../../src/components/GlassCard';
import { Colors, Shadows } from '../../../src/constants/theme';
import { useAuthStore } from '../../../src/store/authStore';
import { automationService, AutomationRun } from '../../../src/services/automationService';

export default function AutomationRunDetailScreen() {
  const { runId } = useLocalSearchParams<{ runId: string }>();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || '00000000-0000-0000-0000-000000000002';

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [run, setRun] = useState<AutomationRun | null>(null);

  const loadRun = async () => {
    if (!runId) return;
    try {
      const data = await automationService.getRunDetail(runId, businessId);
      setRun(data);
    } catch (e) {
      console.error('Error fetching run detail:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRun();
  }, [runId, businessId]);

  const handleApprove = async (actionId: string) => {
    setProcessing(true);
    try {
      await automationService.approveAction(actionId, businessId, 'Approved in SoloCEO Mobile');
      Alert.alert('Action Approved', 'Action successfully approved and executed.');
      loadRun();
    } catch (e: any) {
      Alert.alert('Approval Error', e.message || 'Could not approve action.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (actionId: string) => {
    setProcessing(true);
    try {
      await automationService.rejectAction(actionId, businessId, 'Rejected in SoloCEO Mobile');
      Alert.alert('Action Rejected', 'Action was successfully rejected.');
      loadRun();
    } catch (e: any) {
      Alert.alert('Rejection Error', e.message || 'Could not reject action.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !run) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isWaitingApproval = run.status === 'waiting_approval';
  const pendingAction = run.actions?.find((a) => a.status === 'waiting_approval');

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Run Execution Details</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Run Status Banner */}
        <GlassCard style={styles.statusCard}>
          <View style={styles.statusLeft}>
            <View
              style={[
                styles.statusIconWrap,
                {
                  backgroundColor:
                    run.status === 'completed'
                      ? '#ECFDF5'
                      : run.status === 'failed'
                      ? '#FEF2F2'
                      : run.status === 'waiting_approval'
                      ? '#FFFBEB'
                      : '#F1F5F9',
                },
              ]}
            >
              {run.status === 'completed' ? (
                <CheckCircle2 size={20} color="#10B981" />
              ) : run.status === 'failed' ? (
                <AlertCircle size={20} color="#EF4444" />
              ) : run.status === 'waiting_approval' ? (
                <Shield size={20} color="#D97706" />
              ) : (
                <Clock size={20} color="#64748B" />
              )}
            </View>
            <View>
              <Text style={styles.statusTitle}>
                {run.status === 'waiting_approval'
                  ? 'Waiting for Your Approval'
                  : run.status.toUpperCase()}
              </Text>
              <Text style={styles.statusSub}>
                Started {new Date(run.started_at).toLocaleString()}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Human Approval Required Card */}
        {isWaitingApproval && pendingAction ? (
          <GlassCard style={styles.approvalCard}>
            <View style={styles.approvalHeader}>
              <Shield size={18} color="#D97706" />
              <Text style={styles.approvalHeading}>Approval Required</Text>
            </View>

            <Text style={styles.approvalDesc}>
              AI prepared an automated {pendingAction.output_data?.channel || 'email'} for{' '}
              <Text style={{ fontWeight: '800' }}>
                {pendingAction.output_data?.entity_name || 'Client'}
              </Text>
              . Review the generated content before sending:
            </Text>

            {/* Content Preview Box */}
            <View style={styles.previewBox}>
              <Text style={styles.previewSubject}>
                {pendingAction.output_data?.subject || 'Subject: Follow-up'}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.previewBody}>
                {pendingAction.output_data?.body || pendingAction.output_data?.raw_response}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.approvalActionsRow}>
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleReject(pendingAction.id)}
                disabled={processing}
              >
                <XCircle size={16} color="#EF4444" />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => handleApprove(pendingAction.id)}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={16} color="#FFFFFF" />
                    <Text style={styles.approveBtnText}>Approve &amp; Execute</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </GlassCard>
        ) : null}

        {/* Execution Timeline */}
        <Text style={styles.sectionTitle}>EXECUTION TIMELINE</Text>
        <GlassCard style={styles.timelineCard}>
          {/* Step 1 */}
          <View style={styles.timelineStep}>
            <View style={styles.timelineDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>Trigger Detected</Text>
              <Text style={styles.stepDesc}>Automation workflow criteria matched.</Text>
            </View>
          </View>

          <View style={styles.timelineLine} />

          {/* Step 2 */}
          <View style={styles.timelineStep}>
            <View style={[styles.timelineDot, { backgroundColor: Colors.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>AI Agent Reasoning</Text>
              <Text style={styles.stepDesc}>
                Structured draft and action parameters prepared.
              </Text>
            </View>
          </View>

          <View style={styles.timelineLine} />

          {/* Step 3 */}
          <View style={styles.timelineStep}>
            <View
              style={[
                styles.timelineDot,
                {
                  backgroundColor:
                    run.status === 'completed'
                      ? '#10B981'
                      : run.status === 'waiting_approval'
                      ? '#D97706'
                      : '#EF4444',
                },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>
                {run.status === 'completed'
                  ? 'Workflow Completed'
                  : run.status === 'waiting_approval'
                  ? 'Awaiting Approval'
                  : 'Execution Status'}
              </Text>
              <Text style={styles.stepDesc}>
                {run.execution_result?.details ||
                  run.error_message ||
                  (run.status === 'waiting_approval'
                    ? 'Waiting for manual approval.'
                    : 'Action recorded.')}
              </Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>
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
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCard: {
    padding: 16,
    marginBottom: 16,
    ...Shadows.card,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statusIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  statusSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  approvalCard: {
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
    ...Shadows.glass,
  },
  approvalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  approvalHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#D97706',
  },
  approvalDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  previewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  previewSubject: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 8,
  },
  previewBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  approvalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 13,
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#10B981',
    ...Shadows.card,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  timelineCard: {
    padding: 16,
    ...Shadows.card,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#64748B',
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.border,
    marginLeft: 4,
    marginVertical: 2,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  stepDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
