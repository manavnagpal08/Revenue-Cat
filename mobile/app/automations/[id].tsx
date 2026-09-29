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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Zap,
  Bot,
  Play,
  Pause,
  Trash2,
  ChevronRight,
  Sliders,
  FileText,
  Clock,
  Mail,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  History,
  ListOrdered,
  Sparkles,
} from 'lucide-react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors, Shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import {
  automationService,
  Automation,
  AutomationRun,
  AutomationLog,
} from '../../src/services/automationService';

export default function AutomationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || '00000000-0000-0000-0000-000000000002';

  const [activeTab, setActiveTab] = useState<'overview' | 'runs' | 'logs' | 'edit'>('overview');
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editApproval, setEditApproval] = useState(true);

  const loadData = async () => {
    if (!id) return;
    try {
      const [autoData, runList, logList] = await Promise.all([
        automationService.getAutomation(id, businessId),
        automationService.getAutomationRuns(id, businessId).catch(() => []),
        automationService.getLogs(id, businessId).catch(() => []),
      ]);
      setAutomation(autoData);
      setRuns(runList);
      setLogs(logList);
      setEditName(autoData.name);
      setEditDesc(autoData.description || '');
      setEditApproval(autoData.requires_approval);
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
    try {
      if (newEnabled) {
        await automationService.activateAutomation(automation.id, businessId);
      } else {
        await automationService.pauseAutomation(automation.id, businessId);
      }
      loadData();
    } catch (e: any) {
      Alert.alert('Limit Reached', e?.message || 'Failed to toggle status');
    }
  };

  const handleRunNow = async () => {
    if (!automation) return;
    setRunning(true);
    try {
      const runRes = await automationService.runAutomationNow(automation.id, businessId);
      Alert.alert(
        'Execution Started',
        `Run #${runRes.id.substring(0, 8)} status: ${runRes.status.toUpperCase()}`,
        [
          { text: 'View Run Timeline', onPress: () => router.push(`/automations/runs/${runRes.id}` as any) },
          { text: 'OK', onPress: () => loadData() }
        ]
      );
    } catch (e: any) {
      Alert.alert('Run Failed', e?.message || 'Execution error');
    } finally {
      setRunning(false);
    }
  };

  const handleDelete = () => {
    if (!automation) return;
    Alert.alert(
      'Delete Automation',
      `Are you sure you want to delete "${automation.name}"? This action cannot be undone.`,
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
              Alert.alert('Error', e?.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const handleSaveEdit = async () => {
    if (!automation) return;
    setSaving(true);
    try {
      await automationService.updateAutomation(automation.id, businessId, {
        name: editName,
        description: editDesc,
        requires_approval: editApproval,
      });
      Alert.alert('Success', 'Workflow settings updated.');
      setActiveTab('overview');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update workflow');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Loading automation details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!automation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Not Found</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loaderCenter}>
          <Text style={styles.loaderText}>Automation rule could not be found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header matching Screen 5 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{automation.name}</Text>
          <Text style={styles.headerSubtitle}>{automation.description || 'Automatically execute workflow'}</Text>
        </View>
        <Switch
          value={automation.enabled}
          onValueChange={toggleEnabled}
          trackColor={{ false: '#E2E8F0', true: '#059669' }}
        />
      </View>

      {/* Tabs Switcher: Overview | Runs | Logs | Edit */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'overview' && styles.tabItemActive]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'runs' && styles.tabItemActive]}
          onPress={() => setActiveTab('runs')}
        >
          <Text style={[styles.tabText, activeTab === 'runs' && styles.tabTextActive]}>
            Runs ({runs.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'logs' && styles.tabItemActive]}
          onPress={() => setActiveTab('logs')}
        >
          <Text style={[styles.tabText, activeTab === 'logs' && styles.tabTextActive]}>
            Logs ({logs.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'edit' && styles.tabItemActive]}
          onPress={() => setActiveTab('edit')}
        >
          <Text style={[styles.tabText, activeTab === 'edit' && styles.tabTextActive]}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ================= TAB 1: OVERVIEW (SCREEN 5) ================= */}
        {activeTab === 'overview' && (
          <View>
            {/* Status Card */}
            <GlassCard style={styles.statusCard}>
              <View style={styles.statusCardHeader}>
                <View style={[styles.statusDot, automation.enabled ? styles.dotActive : styles.dotPaused]} />
                <View style={styles.statusHeaderText}>
                  <Text style={styles.statusMainTitle}>{automation.enabled ? 'Active' : 'Paused'}</Text>
                  <Text style={styles.statusMainSub}>Runs daily at 9:00 AM</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.statusDetailsRow}>
                <View style={styles.statusDetailCol}>
                  <Text style={styles.detailLabel}>Last run</Text>
                  <Text style={styles.detailValue}>
                    {automation.last_run_at
                      ? new Date(automation.last_run_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Today, 9:02 AM'}
                  </Text>
                  <View style={styles.pillSuccess}>
                    <Text style={styles.pillSuccessText}>Successful</Text>
                  </View>
                </View>
                <View style={styles.statusDetailCol}>
                  <Text style={styles.detailLabel}>Next run</Text>
                  <Text style={styles.detailValue}>Tomorrow, 9:00 AM</Text>
                </View>
              </View>
            </GlassCard>

            {/* Workflow Steps Card */}
            <View style={styles.stepsSectionHeader}>
              <Text style={styles.stepsSectionTitle}>Workflow Steps</Text>
              <Text style={styles.stepsSectionCount}>4 steps</Text>
            </View>

            <View style={styles.stepsSequence}>
              {/* Step 1: Trigger */}
              <GlassCard style={styles.stepItemCard}>
                <View style={styles.stepItemRow}>
                  <View style={[styles.stepNumCircle, { backgroundColor: '#059669' }]}>
                    <Text style={styles.stepNumText}>1</Text>
                  </View>
                  <View style={styles.stepItemContent}>
                    <Text style={styles.stepItemLabel}>Trigger</Text>
                    <Text style={styles.stepItemTitle}>Invoice becomes overdue</Text>
                  </View>
                  <ChevronRight size={16} color="#94A3B8" />
                </View>
              </GlassCard>

              {/* Step 2: Condition */}
              <GlassCard style={styles.stepItemCard}>
                <View style={styles.stepItemRow}>
                  <View style={[styles.stepNumCircle, { backgroundColor: '#059669' }]}>
                    <Text style={styles.stepNumText}>2</Text>
                  </View>
                  <View style={styles.stepItemContent}>
                    <Text style={styles.stepItemLabel}>Condition</Text>
                    <Text style={styles.stepItemTitle}>Amount &gt; ₹10,000</Text>
                  </View>
                  <ChevronRight size={16} color="#94A3B8" />
                </View>
              </GlassCard>

              {/* Step 3: AI Agent */}
              <GlassCard style={styles.stepItemCard}>
                <View style={styles.stepItemRow}>
                  <View style={[styles.stepNumCircle, { backgroundColor: '#059669' }]}>
                    <Text style={styles.stepNumText}>3</Text>
                  </View>
                  <View style={styles.stepItemContent}>
                    <Text style={styles.stepItemLabel}>AI Agent</Text>
                    <Text style={styles.stepItemTitle}>Finance Agent - Generate reminder</Text>
                  </View>
                  <ChevronRight size={16} color="#94A3B8" />
                </View>
              </GlassCard>

              {/* Step 4: Action */}
              <GlassCard style={styles.stepItemCard}>
                <View style={styles.stepItemRow}>
                  <View style={[styles.stepNumCircle, { backgroundColor: '#059669' }]}>
                    <Text style={styles.stepNumText}>4</Text>
                  </View>
                  <View style={styles.stepItemContent}>
                    <Text style={styles.stepItemLabel}>Action</Text>
                    <Text style={styles.stepItemTitle}>
                      Send Email <Text style={{ color: '#D97706', fontSize: 12 }}>(Requires approval)</Text>
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#94A3B8" />
                </View>
              </GlassCard>
            </View>

            {/* Bottom Action Bar */}
            <View style={styles.bottomActionBar}>
              <TouchableOpacity
                style={styles.runNowBtn}
                onPress={handleRunNow}
                disabled={running}
              >
                {running ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                    <Text style={styles.runNowBtnText}>Run Now</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pauseBtn}
                onPress={toggleEnabled}
              >
                <Text style={styles.pauseBtnText}>{automation.enabled ? 'Pause' : 'Activate'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteMiniBtn}
                onPress={handleDelete}
              >
                <Trash2 size={18} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================= TAB 2: RUNS HISTORY ================= */}
        {activeTab === 'runs' && (
          <View>
            {runs.length === 0 ? (
              <GlassCard style={styles.emptyRunsCard}>
                <Clock size={32} color="#9CA3AF" />
                <Text style={styles.emptyRunsTitle}>No Execution Runs Yet</Text>
                <Text style={styles.emptyRunsSub}>
                  Trigger this workflow manually or wait for the scheduled trigger.
                </Text>
                <TouchableOpacity style={styles.emptyRunBtn} onPress={handleRunNow}>
                  <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.emptyRunBtnText}>Run Now</Text>
                </TouchableOpacity>
              </GlassCard>
            ) : (
              runs.map((run) => (
                <TouchableOpacity
                  key={run.id}
                  onPress={() => router.push(`/automations/runs/${run.id}` as any)}
                >
                  <GlassCard style={styles.runCard}>
                    <View style={styles.runCardRow}>
                      <View style={[
                        styles.runStatusDot,
                        run.status === 'completed' ? styles.bgSuccess : run.status === 'failed' ? styles.bgError : styles.bgWarning
                      ]}>
                        {run.status === 'completed' ? (
                          <CheckCircle2 size={14} color="#059669" />
                        ) : run.status === 'failed' ? (
                          <AlertCircle size={14} color="#DC2626" />
                        ) : (
                          <Clock size={14} color="#D97706" />
                        )}
                      </View>
                      <View style={styles.runCardContent}>
                        <View style={styles.runTitleRow}>
                          <Text style={styles.runTimeText}>
                            {new Date(run.started_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </Text>
                          <View style={[
                            styles.runPill,
                            run.status === 'completed' ? styles.pillSuccess : run.status === 'failed' ? styles.pillError : styles.pillWarning
                          ]}>
                            <Text style={styles.runPillText}>{run.status.toUpperCase()}</Text>
                          </View>
                        </View>
                        <Text style={styles.runDetailText}>
                          {run.actions?.length || 1} action(s) evaluated
                        </Text>
                      </View>
                      <ChevronRight size={16} color="#94A3B8" />
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* ================= TAB 3: LOGS ================= */}
        {activeTab === 'logs' && (
          <View style={styles.logsContainer}>
            {logs.length === 0 ? (
              <GlassCard style={styles.emptyRunsCard}>
                <ListOrdered size={32} color="#9CA3AF" />
                <Text style={styles.emptyRunsTitle}>No Audit Logs</Text>
                <Text style={styles.emptyRunsSub}>Events will be recorded as the automation runs.</Text>
              </GlassCard>
            ) : (
              logs.map((log, idx) => (
                <View key={idx} style={styles.logTimelineItem}>
                  <View style={styles.logDot} />
                  <View style={styles.logContent}>
                    <View style={styles.logMetaRow}>
                      <Text style={styles.logEventType}>{log.event_type.replace(/_/g, ' ').toUpperCase()}</Text>
                      <Text style={styles.logTime}>
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={styles.logMessage}>{log.message}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ================= TAB 4: EDIT ================= */}
        {activeTab === 'edit' && (
          <View>
            <GlassCard style={styles.editCard}>
              <Text style={styles.inputLabel}>Workflow Name</Text>
              <TextInput
                style={styles.textInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="Workflow name"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 70 }]}
                value={editDesc}
                onChangeText={setEditDesc}
                multiline
                placeholder="Description"
              />

              <View style={styles.editToggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.editToggleTitle}>Require Confirmation</Text>
                  <Text style={styles.editToggleSub}>Require approval before sending external emails or messages.</Text>
                </View>
                <Switch
                  value={editApproval}
                  onValueChange={setEditApproval}
                  trackColor={{ false: '#E2E8F0', true: '#059669' }}
                />
              </View>

              <TouchableOpacity
                style={styles.saveEditBtn}
                onPress={handleSaveEdit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveEditBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </GlassCard>
          </View>
        )}
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
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#059669',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#059669',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: '#059669',
  },
  dotPaused: {
    backgroundColor: '#DC2626',
  },
  statusHeaderText: {
    flex: 1,
  },
  statusMainTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusMainSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  statusDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusDetailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  pillSuccess: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillSuccessText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  pillError: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pillWarning: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stepsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  stepsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepsSectionCount: {
    fontSize: 12,
    color: '#64748B',
  },
  stepsSequence: {
    gap: 10,
    marginBottom: 24,
  },
  stepItemCard: {
    padding: 14,
    borderRadius: 14,
  },
  stepItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepItemContent: {
    flex: 1,
  },
  stepItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    textTransform: 'uppercase',
  },
  stepItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  bottomActionBar: {
    flexDirection: 'row',
    gap: 10,
  },
  runNowBtn: {
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
  runNowBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pauseBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pauseBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  deleteMiniBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 14,
    color: '#64748B',
  },
  emptyRunsCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
    gap: 8,
  },
  emptyRunsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  emptyRunsSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyRunBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  emptyRunBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  runCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  runCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  runStatusDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgSuccess: {
    backgroundColor: '#ECFDF5',
  },
  bgError: {
    backgroundColor: '#FEF2F2',
  },
  bgWarning: {
    backgroundColor: '#FEF3C7',
  },
  runCardContent: {
    flex: 1,
  },
  runTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  runTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  runPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  runPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  runDetailText: {
    fontSize: 12,
    color: '#64748B',
  },
  logsContainer: {
    gap: 12,
  },
  logTimelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
    marginTop: 6,
  },
  logContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logEventType: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  logTime: {
    fontSize: 10,
    color: '#94A3B8',
  },
  logMessage: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  editCard: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  editToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  editToggleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  editToggleSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  saveEditBtn: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveEditBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
