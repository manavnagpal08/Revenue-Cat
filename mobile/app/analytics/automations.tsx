import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Zap,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  ChevronRight,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { analyticsService, AutomationAnalytics } from '../../src/services/analyticsService';
import { GlassCard } from '../../src/components/GlassCard';

export default function AutomationAnalyticsScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'default';

  const [data, setData] = useState<AutomationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAutomationAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getAutomations(businessId, '30d');
      setData(res);
    } catch (err) {
      console.warn('Error loading automation analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchAutomationAnalytics();
  }, [fetchAutomationAnalytics]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAutomationAnalytics();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Automation & Ops Velocity</Text>
        <TouchableOpacity
          style={styles.manageBtn}
          onPress={() => router.push('/(tabs)/automations')}
        >
          <Zap size={14} color="#059669" />
          <Text style={styles.manageBtnText}>Workflows</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>Loading Automation Metrics...</Text>
          </View>
        ) : (
          <>
            {/* Top Stat Cards */}
            <View style={styles.statGrid}>
              <GlassCard style={styles.statCard} variant="elevated">
                <Text style={styles.statLabel}>Success Rate</Text>
                <Text style={[styles.statValue, { color: '#059669' }]}>
                  {data?.success_rate_percent || 100}%
                </Text>
                <Text style={styles.statSub}>
                  {data?.successful_executions || 0} / {data?.total_executions || 0} runs
                </Text>
              </GlassCard>

              <GlassCard style={styles.statCard} variant="elevated">
                <Text style={styles.statLabel}>Time Saved</Text>
                <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                  ~{data?.time_saved_hours_estimated || 0} <Text style={{ fontSize: 13 }}>hrs</Text>
                </Text>
                <Text style={styles.statSub}>Admin work eliminated</Text>
              </GlassCard>
            </View>

            {/* Workflow Performance Ranking */}
            <GlassCard style={styles.sectionCard} variant="elevated">
              <Text style={styles.sectionTitle}>Workflow Performance</Text>
              <Text style={styles.sectionSubtitle}>Reliability & execution latency</Text>

              {data?.workflow_performance && data.workflow_performance.length > 0 ? (
                data.workflow_performance.map((wf) => (
                  <View key={wf.id} style={styles.wfRow}>
                    <View style={styles.wfMain}>
                      <Text style={styles.wfName}>{wf.name}</Text>
                      <Text style={styles.wfStats}>
                        {wf.total_runs} executions • {wf.avg_duration_ms}ms avg
                      </Text>
                    </View>
                    <View style={styles.wfBadge}>
                      <Text style={styles.wfBadgeText}>{wf.success_rate}% Success</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No automation history available.</Text>
              )}
            </GlassCard>

            {/* Timeline Activity */}
            <GlassCard style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Trigger History</Text>
              <Text style={styles.sectionSubtitle}>Execution distribution over 30 days</Text>

              {data?.executions_timeline && data.executions_timeline.length > 0 ? (
                data.executions_timeline.map((item, idx) => (
                  <View key={idx} style={styles.timeRow}>
                    <Text style={styles.timeDate}>{item.date}</Text>
                    <View style={styles.timeRight}>
                      <Text style={styles.timeSuccess}>✓ {item.success} passed</Text>
                      {item.failed > 0 && (
                        <Text style={styles.timeFailed}>✗ {item.failed} failed</Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No triggers logged yet.</Text>
              )}
            </GlassCard>
          </>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  manageBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  statGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  statSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  wfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  wfMain: {
    flex: 1,
  },
  wfName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  wfStats: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  wfBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  wfBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  timeDate: {
    fontSize: 13,
    color: '#334155',
  },
  timeRight: {
    flexDirection: 'row',
    gap: 8,
  },
  timeSuccess: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  timeFailed: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 14,
  },
});
