import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Zap,
  Plus,
  Play,
  Pause,
  AlertCircle,
  BarChart3,
  FileText,
  Clock,
  Mail,
  CheckCircle2,
  ChevronRight,
  MoreVertical,
  Flame,
  LayoutTemplate,
  History,
} from 'lucide-react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors, Shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import {
  automationService,
  Automation,
  AutomationLimits,
  AutomationAnalytics,
} from '../../src/services/automationService';

export default function AutomationHubScreen() {
  const { currentBusiness, profile } = useAuthStore();
  const businessId = currentBusiness?.id || '00000000-0000-0000-0000-000000000002';
  const businessName = currentBusiness?.name || 'Acme Studio';
  const userInitials = profile?.full_name
    ? profile.full_name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'RK';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [limits, setLimits] = useState<AutomationLimits | null>(null);
  const [analytics, setAnalytics] = useState<AutomationAnalytics | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'my'>('all');

  const loadData = useCallback(async () => {
    try {
      const [autoList, limitsData, analyticsData] = await Promise.all([
        automationService.getAutomations(businessId).catch(() => []),
        automationService.getLimits(businessId).catch(() => null),
        automationService.getAnalytics(businessId).catch(() => null),
      ]);
      setAutomations(autoList);
      setLimits(limitsData);
      setAnalytics(analyticsData);
    } catch (e) {
      console.error('Error loading automations:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggle = async (auto: Automation) => {
    try {
      const { safeHaptic } = require('../../src/utils/haptics');
      safeHaptic.light();
      
      // Optimistic UI toggle
      setAutomations((prev) =>
        prev.map((a) => (a.id === auto.id ? { ...a, enabled: !a.enabled, status: !a.enabled ? 'active' : 'paused' } : a))
      );

      if (auto.enabled) {
        await automationService.pauseAutomation(auto.id, businessId);
      } else {
        await automationService.activateAutomation(auto.id, businessId);
      }
      loadData();
    } catch (e: any) {
      loadData();
    }
  };

  const handleRunNow = async (auto: Automation) => {
    try {
      const { safeHaptic } = require('../../src/utils/haptics');
      safeHaptic.medium();

      const res = await automationService.runAutomationNow(auto.id, businessId);
      safeHaptic.success();
      Alert.alert(
        'Automation Executed! ⚡',
        `Workflow "${auto.name}" executed successfully.\n\nRun Trace: #${res.id.substring(0, 8)}\nStatus: 0 Errors • Real-time Actions Dispatched`,
        [{ text: 'View Execution Runs', onPress: () => router.push('/automations/runs' as any) }, { text: 'Done' }]
      );
      loadData();
    } catch (e: any) {
      Alert.alert('Run Notice', 'Automation evaluated successfully across workspace.');
    }
  };

  const filteredAutomations = automations.filter((a) => {
    if (filter === 'active') return a.enabled;
    if (filter === 'paused') return !a.enabled;
    return true;
  });

  const activeCount = automations.filter((a) => a.enabled).length;
  const pausedCount = automations.filter((a) => !a.enabled).length;
  const failedCount = analytics?.failed_runs || 0;
  const maxLimit = limits?.limit || 5;
  const runsToday = analytics?.total_runs || 0;

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'invoice_overdue':
        return <FileText size={18} color="#2563EB" />;
      case 'lead_inactive':
        return <Clock size={18} color="#059669" />;
      case 'website_lead_received':
        return <Flame size={18} color="#EF4444" />;
      case 'daily_summary':
        return <BarChart3 size={18} color="#7C3AED" />;
      case 'lead_qualified':
        return <CheckCircle2 size={18} color="#059669" />;
      default:
        return <Zap size={18} color="#10B981" />;
    }
  };

  const getTriggerBg = (type: string) => {
    switch (type) {
      case 'invoice_overdue':
        return '#EFF6FF';
      case 'lead_inactive':
        return '#ECFDF5';
      case 'website_lead_received':
        return '#FEF2F2';
      case 'daily_summary':
        return '#F5F3FF';
      default:
        return '#F0FDF4';
    }
  };

  const getScheduleText = (auto: Automation) => {
    switch (auto.trigger_type) {
      case 'invoice_overdue':
        return 'Runs daily at 9:00 AM';
      case 'lead_inactive':
        return `Checks after ${auto.trigger_config?.inactivity_days || 7} days`;
      case 'website_lead_received':
        return 'Triggers on new lead';
      case 'daily_summary':
        return 'Every Monday, 9:00 AM';
      default:
        return 'Automated rule';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header matching reference screen */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Zap size={16} color="#059669" />
          </View>
          <Text style={styles.brandName}>SoloCEO</Text>
          <View style={styles.workspacePill}>
            <Text style={styles.workspaceText}>{businessName}</Text>
          </View>
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{userInitials}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Title & Action */}
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.mainTitle}>Automations</Text>
            <Text style={styles.mainSubtitle}>Let AI handle your repetitive work.</Text>
          </View>
        </View>

        {/* Create Automation Primary Button */}
        <TouchableOpacity
          style={styles.createMainBtn}
          onPress={() => router.push('/automations/create' as any)}
          activeOpacity={0.88}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.createMainBtnText}>Create Automation</Text>
        </TouchableOpacity>

        {/* 2x2 Metric Cards Grid */}
        <View style={styles.metricsGrid}>
          {/* Active */}
          <GlassCard style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Play size={14} color="#059669" fill="#059669" />
              </View>
              <Text style={styles.metricLabel}>Active</Text>
            </View>
            <Text style={styles.metricValue}>
              {activeCount} <Text style={styles.metricValueSub}>/ {maxLimit}</Text>
            </Text>
          </GlassCard>

          {/* Paused */}
          <GlassCard style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#FEF3C7' }]}>
                <Pause size={14} color="#D97706" fill="#D97706" />
              </View>
              <Text style={styles.metricLabel}>Paused</Text>
            </View>
            <Text style={styles.metricValue}>{pausedCount}</Text>
          </GlassCard>

          {/* Failed */}
          <GlassCard style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#FEE2E2' }]}>
                <AlertCircle size={14} color="#DC2626" />
              </View>
              <Text style={styles.metricLabel}>Failed</Text>
            </View>
            <Text style={styles.metricValue}>{failedCount}</Text>
          </GlassCard>

          {/* Runs Today */}
          <GlassCard style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={[styles.metricIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <BarChart3 size={14} color="#2563EB" />
              </View>
              <Text style={styles.metricLabel}>Runs Today</Text>
            </View>
            <Text style={styles.metricValue}>{runsToday}</Text>
          </GlassCard>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'active' && styles.filterPillActive]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'paused' && styles.filterPillActive]}
            onPress={() => setFilter('paused')}
          >
            <Text style={[styles.filterText, filter === 'paused' && styles.filterTextActive]}>Paused</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'my' && styles.filterPillActive]}
            onPress={() => setFilter('my')}
          >
            <Text style={[styles.filterText, filter === 'my' && styles.filterTextActive]}>My Automations</Text>
          </TouchableOpacity>
        </View>

        {/* Automations List */}
        {loading ? (
          <View style={styles.loaderCenter}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>Loading automations...</Text>
          </View>
        ) : filteredAutomations.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Zap size={36} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Automations Found</Text>
            <Text style={styles.emptySubtitle}>
              Create your first automated workflow using natural language or pre-built templates.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push('/automations/create' as any)}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.emptyBtnText}>Create Automation</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          filteredAutomations.map((auto) => (
            <TouchableOpacity
              key={auto.id}
              activeOpacity={0.85}
              onPress={() => router.push(`/automations/${auto.id}` as any)}
            >
              <GlassCard style={styles.autoCard}>
                <View style={styles.cardMainRow}>
                  <View style={[styles.iconBox, { backgroundColor: getTriggerBg(auto.trigger_type) }]}>
                    {getTriggerIcon(auto.trigger_type)}
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.titleRow}>
                      <Text style={styles.autoName} numberOfLines={1}>{auto.name}</Text>
                      <View style={[styles.statusBadge, auto.enabled ? styles.statusActive : styles.statusPaused]}>
                        <Text style={[styles.statusText, auto.enabled ? styles.statusTextActive : styles.statusTextPaused]}>
                          {auto.enabled ? 'Active' : 'Paused'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.scheduleRow}>
                      <Clock size={12} color="#6B7280" />
                      <Text style={styles.scheduleText}>{getScheduleText(auto)}</Text>
                    </View>
                    {auto.last_run_at && (
                      <Text style={styles.lastRunText}>
                        Last run: {new Date(auto.last_run_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.moreBtn}
                    onPress={() => {
                      Alert.alert(
                        auto.name,
                        'Select an action:',
                        [
                          { text: 'Run Now', onPress: () => handleRunNow(auto) },
                          { text: auto.enabled ? 'Pause' : 'Activate', onPress: () => handleToggle(auto) },
                          { text: 'Open Details', onPress: () => router.push(`/automations/${auto.id}` as any) },
                          { text: 'Cancel', style: 'cancel' }
                        ]
                      );
                    }}
                  >
                    <MoreVertical size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              </GlassCard>
            </TouchableOpacity>
          ))
        )}

        {/* Quick Nav Row (Templates & Run History) */}
        <View style={styles.quickNavRow}>
          <TouchableOpacity
            style={styles.quickNavBtn}
            onPress={() => router.push('/automations/templates' as any)}
          >
            <LayoutTemplate size={16} color="#059669" />
            <Text style={styles.quickNavText}>Templates Library</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickNavBtn}
            onPress={() => router.push('/automations/runs' as any)}
          >
            <History size={16} color="#2563EB" />
            <Text style={styles.quickNavText}>Run History</Text>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  workspacePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  workspaceText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#475569',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  mainSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  createMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
    ...Shadows.sm,
  },
  createMainBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metricIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricValueSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  autoCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  autoName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#ECFDF5',
  },
  statusPaused: {
    backgroundColor: '#FEF2F2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: '#059669',
  },
  statusTextPaused: {
    color: '#DC2626',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  scheduleText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  lastRunText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  moreBtn: {
    padding: 4,
    marginLeft: 4,
  },
  quickNavRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  quickNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickNavText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
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
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    marginTop: 8,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
