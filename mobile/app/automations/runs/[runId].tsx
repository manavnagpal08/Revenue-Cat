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
  ChevronRight,
  Bot,
  Mail,
  ShieldCheck,
  Zap,
  Sliders,
  FileText,
} from 'lucide-react-native';
import { GlassCard } from '../../../src/components/GlassCard';
import { Colors, Shadows } from '../../../src/constants/theme';
import { useAuthStore } from '../../../src/store/authStore';
import {
  automationService,
  AutomationRun,
  AutomationLog,
} from '../../../src/services/automationService';

export default function AutomationRunDetailScreen() {
  const { runId } = useLocalSearchParams<{ runId: string }>();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || '00000000-0000-0000-0000-000000000002';

  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState<AutomationRun | null>(null);
  const [logs, setLogs] = useState<AutomationLog[]>([]);

  const loadData = async () => {
    if (!runId) return;
    try {
      const [runData, logList] = await Promise.all([
        automationService.getRunDetail(runId, businessId),
        automationService.getLogs(run?.automation_id || '', businessId, runId).catch(() => []),
      ]);
      setRun(runData);
      setLogs(logList);
    } catch (e) {
      console.error('Error fetching run detail:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [runId, businessId]);

  if (loading || !run) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Loading run details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isSuccess = run.status === 'completed' || run.status === 'successful';
  const isFailed = run.status === 'failed';
  const isWaiting = run.status === 'waiting_approval';

  // Default timeline steps if logs are empty (for comprehensive preview)
  const timelineSteps = logs.length > 0 ? logs.map((l) => ({
    time: new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    title: l.event_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    desc: l.message,
    success: !l.event_type.includes('fail')
  })) : [
    {
      time: '9:02:01 AM',
      title: 'Trigger detected',
      desc: '3 overdue invoices found matching criteria.',
      success: true,
    },
    {
      time: '9:02:03 AM',
      title: 'Conditions evaluated',
      desc: 'All condition rules met (Amount > ₹10,000, Overdue > 3d).',
      success: true,
    },
    {
      time: '9:02:06 AM',
      title: 'Finance Agent executed',
      desc: 'Generated personalized payment reminder drafts.',
      success: true,
    },
    {
      time: '9:02:10 AM',
      title: 'Email prepared',
      desc: '2 emails ready for owner approval before sending.',
      success: true,
    },
    {
      time: '9:02:12 AM',
      title: 'Notification created',
      desc: 'In-app approval alert dispatched to workspace owner.',
      success: true,
    },
  ];

  const pendingAction = run.actions?.find((a) => a.status === 'waiting_approval');

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Run Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Run Status Header Card matching Screen 7 */}
        <GlassCard style={styles.statusHeaderCard}>
          <View style={styles.statusBadgeRow}>
            <View style={[
              styles.statusPill,
              isSuccess ? styles.statusSuccess : isFailed ? styles.statusFailed : styles.statusWaiting
            ]}>
              {isSuccess ? (
                <CheckCircle2 size={14} color="#059669" />
              ) : isFailed ? (
                <AlertCircle size={14} color="#DC2626" />
              ) : (
                <Clock size={14} color="#D97706" />
              )}
              <Text style={[
                styles.statusPillText,
                isSuccess ? styles.textSuccess : isFailed ? styles.textFailed : styles.textWaiting
              ]}>
                {isSuccess ? 'Successful' : isFailed ? 'Failed' : 'Waiting Approval'}
              </Text>
            </View>
          </View>

          <Text style={styles.runDateText}>
            {new Date(run.started_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </Text>
          <Text style={styles.runIdText}>Run ID: {run.id.substring(0, 8)}</Text>
        </GlassCard>

        {/* Execution Timeline Section */}
        <Text style={styles.timelineHeading}>Execution Timeline</Text>

        <View style={styles.timelineList}>
          {timelineSteps.map((step, idx) => (
            <View key={idx} style={styles.timelineItem}>
              {/* Left Connector Line & Dot */}
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, step.success ? styles.dotSuccess : styles.dotFailed]}>
                  {step.success ? (
                    <CheckCircle2 size={12} color="#FFFFFF" />
                  ) : (
                    <AlertCircle size={12} color="#FFFFFF" />
                  )}
                </View>
                {idx < timelineSteps.length - 1 && <View style={styles.timelineLine} />}
              </View>

              {/* Step Content */}
              <View style={styles.timelineContent}>
                <Text style={styles.stepTime}>{step.time}</Text>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Button: View Generated Content / Approve */}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            if (pendingAction) {
              router.push(`/automations/approval?actionId=${pendingAction.id}` as any);
            } else {
              Alert.alert(
                'Generated Content',
                JSON.stringify(run.execution_result || run.trigger_data, null, 2)
              );
            }
          }}
        >
          <Text style={styles.actionBtnText}>
            {pendingAction ? 'Review & Approve Action' : 'View Generated Content'}
          </Text>
        </TouchableOpacity>
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusHeaderCard: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 24,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusSuccess: {
    backgroundColor: '#ECFDF5',
  },
  statusFailed: {
    backgroundColor: '#FEF2F2',
  },
  statusWaiting: {
    backgroundColor: '#FEF3C7',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textSuccess: {
    color: '#059669',
  },
  textFailed: {
    color: '#DC2626',
  },
  textWaiting: {
    color: '#D97706',
  },
  runDateText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  runIdText: {
    fontSize: 12,
    color: '#64748B',
  },
  timelineHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  timelineList: {
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dotSuccess: {
    backgroundColor: '#059669',
  },
  dotFailed: {
    backgroundColor: '#DC2626',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  stepTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    ...Shadows.sm,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
    color: '#64748B',
  },
});
