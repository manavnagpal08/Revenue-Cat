import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  History,
} from 'lucide-react-native';
import { GlassCard } from '../../../src/components/GlassCard';
import { Colors } from '../../../src/constants/theme';
import { useAuthStore } from '../../../src/store/authStore';
import { automationService, AutomationRun } from '../../../src/services/automationService';

export default function AutomationRunHistoryScreen() {
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || '00000000-0000-0000-0000-000000000002';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'successful' | 'failed' | 'running'>('all');
  const [runs, setRuns] = useState<AutomationRun[]>([]);

  const loadData = async () => {
    try {
      const data = await automationService.getAllRuns(businessId, filter);
      setRuns(data);
    } catch (e) {
      console.error('Error loading runs history:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId, filter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'successful':
        return <CheckCircle2 size={16} color="#059669" />;
      case 'failed':
        return <AlertCircle size={16} color="#DC2626" />;
      default:
        return <Clock size={16} color="#D97706" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'successful':
        return '#ECFDF5';
      case 'failed':
        return '#FEF2F2';
      default:
        return '#FEF3C7';
    }
  };

  const formatSummary = (run: AutomationRun) => {
    if (run.error_message) return run.error_message;
    if (run.status === 'completed' || run.status === 'successful') {
      const actionCount = run.actions?.length || 1;
      return `${actionCount} operation(s) processed successfully.`;
    }
    if (run.status === 'waiting_approval') {
      return '1 action generated (awaiting owner approval).';
    }
    return 'Run in progress.';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Run History</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs matching Screen 6 */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'successful' && styles.filterPillActive]}
          onPress={() => setFilter('successful')}
        >
          <Text style={[styles.filterText, filter === 'successful' && styles.filterTextActive]}>Successful</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'failed' && styles.filterPillActive]}
          onPress={() => setFilter('failed')}
        >
          <Text style={[styles.filterText, filter === 'failed' && styles.filterTextActive]}>Failed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, filter === 'running' && styles.filterPillActive]}
          onPress={() => setFilter('running')}
        >
          <Text style={[styles.filterText, filter === 'running' && styles.filterTextActive]}>Running</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>Loading execution history...</Text>
          </View>
        ) : runs.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <History size={36} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Execution Runs</Text>
            <Text style={styles.emptySub}>
              Runs will be recorded here whenever an automation trigger fires or is manually executed.
            </Text>
          </GlassCard>
        ) : (
          runs.map((run) => (
            <TouchableOpacity
              key={run.id}
              activeOpacity={0.85}
              onPress={() => router.push(`/automations/runs/${run.id}` as any)}
            >
              <GlassCard style={styles.runCard}>
                <View style={styles.cardRow}>
                  <View style={[styles.iconCircle, { backgroundColor: getStatusBg(run.status) }]}>
                    {getStatusIcon(run.status)}
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.timeRow}>
                      <Text style={styles.timeText}>
                        {new Date(run.started_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </Text>
                      <View style={[
                        styles.statusPill,
                        run.status === 'completed' || run.status === 'successful'
                          ? styles.statusPillSuccess
                          : run.status === 'failed'
                          ? styles.statusPillFailed
                          : styles.statusPillWarning
                      ]}>
                        <Text style={[
                          styles.statusPillText,
                          run.status === 'completed' || run.status === 'successful'
                            ? styles.statusTextSuccess
                            : run.status === 'failed'
                            ? styles.statusTextFailed
                            : styles.statusTextWarning
                        ]}>
                          {run.status === 'completed' ? 'Successful' : run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.summaryText} numberOfLines={2}>
                      {formatSummary(run)}
                    </Text>
                  </View>
                  <ChevronRight size={16} color="#94A3B8" />
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterPillActive: {
    backgroundColor: '#059669',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  runCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusPillSuccess: {
    backgroundColor: '#ECFDF5',
  },
  statusPillFailed: {
    backgroundColor: '#FEF2F2',
  },
  statusPillWarning: {
    backgroundColor: '#FEF3C7',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextSuccess: {
    color: '#059669',
  },
  statusTextFailed: {
    color: '#DC2626',
  },
  statusTextWarning: {
    color: '#D97706',
  },
  summaryText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  loaderCenter: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loaderText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 16,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
