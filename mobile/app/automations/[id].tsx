import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Zap,
  Bot,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Trash2,
  ChevronRight,
  Shield,
  Layers,
  History,
} from 'lucide-react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors, Shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { automationService, Automation, AutomationRun } from '../../src/services/automationService';

export default function AutomationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || '00000000-0000-0000-0000-000000000002';

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [runs, setRuns] = useState<AutomationRun[]>([]);

  const loadData = async () => {
    if (!id) return;
    try {
      const [autoData, runList] = await Promise.all([
        automationService.getAutomation(id, businessId),
        automationService.getAutomationRuns(id, businessId).catch(() => []),
      ]);
      setAutomation(autoData);
      setRuns(runList);
    } catch (e) {
      console.error('Error loading automation detail:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, businessId]);

  const toggleEnabled = async () => {
    if (!automation) return;
    const newEnabled = !automation.enabled;
    setAutomation({ ...automation, enabled: newEnabled, status: newEnabled ? 'active' : 'paused' });
    try {
      if (newEnabled) {
        await automationService.enableAutomation(automation.id, businessId);
      } else {
        await automationService.disableAutomation(automation.id, businessId);
      }
    } catch (e) {
      console.error('Toggle error:', e);
      loadData();
    }
  };

  const handleRunNow = async () => {
    if (!automation) return;
    setRunning(true);
    try {
      const runRes = await automationService.runAutomationNow(automation.id, businessId);
      Alert.alert(
        'Automation Triggered',
        `Run initiated with status: ${runRes.status.toUpperCase()}`,
        [
          {
            text: 'View Run',
            onPress: () => router.push(`/automations/runs/${runRes.id}` as any),
          },
          { text: 'OK', onPress: () => loadData() },
        ]
      );
    } catch (e: any) {
      Alert.alert('Run Failed', e.message || 'Could not execute automation.');
    } finally {
      setRunning(false);
    }
  };

  const handleDelete = () => {
    if (!automation) return;
    Alert.alert(
      'Delete Automation',
      `Are you sure you want to permanently delete "${automation.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await automationService.deleteAutomation(automation.id, businessId);
              router.replace('/automations' as any);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Could not delete automation.');
            }
          },
        },
      ]
    );
  };

  if (loading || !automation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const successCount = automation.success_count || runs.filter((r) => r.status === 'completed').length || 0;
  const totalRuns = automation.runs_count || runs.length || 0;
  const failedCount = runs.filter((r) => r.status === 'failed').length || 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {automation.name}
        </Text>
        <Switch
          value={automation.enabled}
          onValueChange={toggleEnabled}
          trackColor={{ false: '#E2E8F0', true: '#C7D2FE' }}
          thumbColor={automation.enabled ? '#4F46E5' : '#94A3B8'}
        />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Top Summary / Stats */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statBox}>
            <Text style={styles.statNum}>{totalRuns}</Text>
            <Text style={styles.statLabel}>Total Runs</Text>
          </GlassCard>
          <GlassCard style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#10B981' }]}>{successCount}</Text>
            <Text style={styles.statLabel}>Success</Text>
          </GlassCard>
          <GlassCard style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#EF4444' }]}>{failedCount}</Text>
            <Text style={styles.statLabel}>Failed</Text>
          </GlassCard>
          <GlassCard style={styles.statBox}>
            <Text style={styles.statNum}>2.3s</Text>
            <Text style={styles.statLabel}>Avg Time</Text>
          </GlassCard>
        </View>

        {/* Workflow Nodes Breakdown */}
        <Text style={styles.sectionTitle}>WORKFLOW PIPELINE</Text>
        <GlassCard style={styles.nodesCard}>
          {/* Node 1: Trigger */}
          <View style={styles.nodeItem}>
            <View style={[styles.nodeIconWrap, { backgroundColor: '#EEF2FF' }]}>
              <Zap size={16} color="#4F46E5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nodeRole}>1. TRIGGER</Text>
              <Text style={styles.nodeMainText}>
                {automation.trigger_type === 'lead_inactive'
                  ? 'Lead is inactive for 7 days'
                  : automation.trigger_type === 'invoice_overdue'
                  ? 'Invoice is overdue'
                  : automation.trigger_type === 'website_lead_received'
                  ? 'New website lead arrives'
                  : 'Daily business sweep'}
              </Text>
            </View>
          </View>

          <View style={styles.nodeConnector} />

          {/* Node 2: Condition */}
          <View style={styles.nodeItem}>
            <View style={[styles.nodeIconWrap, { backgroundColor: '#F1F5F9' }]}>
              <Shield size={16} color="#475569" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nodeRole}>2. CONDITION</Text>
              <Text style={styles.nodeMainText}>
                {automation.condition_config?.rules?.length
                  ? `Match ${automation.condition_config.rules.length} safety rule(s)`
                  : 'Always execute when triggered'}
              </Text>
            </View>
          </View>

          <View style={styles.nodeConnector} />

          {/* Node 3: AI Agent */}
          <View style={styles.nodeItem}>
            <View style={[styles.nodeIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Bot size={16} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nodeRole}>3. AI AGENT REASONING</Text>
              <Text style={styles.nodeMainText}>
                {automation.agent_type.toUpperCase()} Agent (Tone: {automation.action_config?.tone || 'professional'})
              </Text>
            </View>
          </View>

          <View style={styles.nodeConnector} />

          {/* Node 4: Action & Channel */}
          <View style={styles.nodeItem}>
            <View style={[styles.nodeIconWrap, { backgroundColor: '#FEF3C7' }]}>
              <Mail size={16} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.nodeRole}>4. ACTION DISPATCH</Text>
              <Text style={styles.nodeMainText}>
                {automation.action_config?.channel?.toUpperCase() || 'EMAIL'} (Requires Approval:{' '}
                {automation.requires_approval ? 'Yes' : 'No'})
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Execution History */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>RECENT EXECUTIONS</Text>
          <Text style={styles.runsCount}>{runs.length} runs</Text>
        </View>

        {runs.length === 0 ? (
          <GlassCard style={styles.emptyRunsCard}>
            <Clock size={20} color={Colors.textMuted} />
            <Text style={styles.emptyRunsText}>No execution history yet.</Text>
          </GlassCard>
        ) : (
          runs.slice(0, 5).map((run) => (
            <TouchableOpacity
              key={run.id}
              activeOpacity={0.8}
              onPress={() => router.push(`/automations/runs/${run.id}` as any)}
            >
              <GlassCard style={styles.runCard}>
                <View style={styles.runLeft}>
                  <View
                    style={[
                      styles.runStatusDot,
                      {
                        backgroundColor:
                          run.status === 'completed'
                            ? '#10B981'
                            : run.status === 'failed'
                            ? '#EF4444'
                            : run.status === 'waiting_approval'
                            ? '#F59E0B'
                            : '#94A3B8',
                      },
                    ]}
                  />
                  <View>
                    <Text style={styles.runStatusText}>{run.status.toUpperCase()}</Text>
                    <Text style={styles.runTimeText}>
                      {new Date(run.started_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color={Colors.textMuted} />
              </GlassCard>
            </TouchableOpacity>
          ))
        )}

        {/* Bottom Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            activeOpacity={0.8}
          >
            <Trash2 size={16} color="#EF4444" />
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.runBtn}
            onPress={handleRunNow}
            disabled={running}
            activeOpacity={0.88}
          >
            {running ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.runBtnText}>Run Now</Text>
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
    flex: 1,
    marginHorizontal: 12,
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
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    ...Shadows.card,
  },
  statNum: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 8,
  },
  runsCount: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  nodesCard: {
    padding: 14,
    ...Shadows.card,
  },
  nodeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nodeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeRole: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  nodeMainText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 1,
  },
  nodeConnector: {
    width: 2,
    height: 12,
    backgroundColor: Colors.border,
    marginLeft: 16,
    marginVertical: 4,
  },
  emptyRunsCard: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  emptyRunsText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  runCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
    ...Shadows.card,
  },
  runLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  runStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  runStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  runTimeText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteBtnText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 13,
  },
  runBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    ...Shadows.card,
  },
  runBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
