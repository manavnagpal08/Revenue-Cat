import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  FileText,
  ArrowRight,
  Send,
  CheckCircle2,
  Users,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { Header } from '../../src/components/Header';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { StatCard } from '../../src/components/StatCard';
import { useAuthStore } from '../../src/store/authStore';
import { dashboardService } from '../../src/services/dashboardService';
import { leadService } from '../../src/services/leadService';
import { aiService } from '../../src/services/aiService';
import { BusinessKPIs, Lead, AIBusinessBrief } from '../../src/types';

export default function HomeScreen() {
  const router = useRouter();
  const { currentBusiness, profile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // Business state computed from database
  const [stats, setStats] = useState<BusinessKPIs>({
    revenueThisMonth: 45000,
    revenueGrowthPercent: 24.8,
    outstandingAmount: 31200,
    overdueAmount: 0,
    activeLeadsCount: 3,
    pendingProposalsCount: 2,
    overdueInvoicesCount: 0,
  });

  const [brief, setBrief] = useState<AIBusinessBrief | null>(null);
  const [topLead, setTopLead] = useState<Lead | null>(null);

  const loadDashboardData = useCallback(async () => {
    if (!currentBusiness?.id) return;
    try {
      const [metrics, leads, aiBrief] = await Promise.all([
        dashboardService.getMetrics(currentBusiness.id),
        leadService.listLeads(currentBusiness.id),
        aiService.getBusinessBrief(currentBusiness.id),
      ]);

      setStats(metrics);
      setBrief(aiBrief);

      // Find top opportunity (highest value in discovery/proposal)
      const openLeads = leads.filter((l) => l.status !== 'won' && l.status !== 'lost');
      if (openLeads.length > 0) {
        openLeads.sort((a, b) => Number(b.value || 0) - Number(a.value || 0));
        setTopLead(openLeads[0]);
      } else {
        setTopLead(null);
      }
    } catch (err) {
      console.warn('Error loading dashboard:', err);
    } finally {
      setRefreshing(false);
    }
  }, [currentBusiness?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Top Header with Workspace Switcher */}
        <Header
          userName={profile?.full_name?.split(' ')[0] || 'Alex'}
          businessName={currentBusiness?.name || 'Rivera Studio'}
          subtitle="Your business needs attention today"
          onProfilePress={() => router.push('/(tabs)/more')}
        />

        {/* AI Business Brief — Hero Card */}
        <View style={styles.sectionContainer}>
          <GlassCard variant="glow" style={styles.briefCard}>
            <View style={styles.briefHeader}>
              <View style={styles.briefBadge}>
                <Sparkles size={13} color={Colors.primary} />
                <Text style={styles.briefBadgeText}>AI BUSINESS BRIEF</Text>
              </View>
              <View style={styles.liveSyncBadge}>
                <View style={styles.liveSyncDot} />
                <Text style={styles.briefTimestamp}>Live Sync</Text>
              </View>
            </View>

            <Text style={styles.briefTitle}>
              "{topLead ? `${topLead.title} (₹${Number(topLead.value).toLocaleString('en-IN')})` : 'Acme Interiors'} is your highest-value opportunity today."
            </Text>

            <Text style={styles.briefDescription}>
              Stage: <Text style={{ fontWeight: '700', color: Colors.text }}>{topLead?.status.toUpperCase().replace('_', ' ') || 'PROPOSAL SENT'}</Text>. Recommended action: Send a gentle follow-up note to keep momentum.
            </Text>

            <View style={styles.briefActions}>
              <GlassButton
                title="Follow Up with AI"
                variant="primary"
                size="sm"
                icon={<Send size={13} color="#FFFFFF" />}
                onPress={() => router.push('/(tabs)/ai')}
                style={{ flex: 1.2 }}
              />
              <GlassButton
                title="View Pipeline"
                variant="secondary"
                size="sm"
                onPress={() => router.push('/(tabs)/sales')}
                style={{ flex: 0.9 }}
              />
            </View>
          </GlassCard>
        </View>

        {/* RevenueCat Subscriptions & Upgrade Promo Card */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push('/paywall')}
            style={styles.revenueCatPromoCard}
          >
            <View style={styles.rcPromoLeft}>
              <View style={styles.rcIconCircle}>
                <Sparkles size={16} color="#F59E0B" />
              </View>
              <View style={styles.rcPromoContent}>
                <View style={styles.rcBadgeRow}>
                  <Text style={styles.rcTitle}>RevenueCat Subscriptions</Text>
                  <View style={styles.rcActivePill}>
                    <Text style={styles.rcActivePillText}>BUSINESS TIER</Text>
                  </View>
                </View>
                <Text style={styles.rcSubtitle}>
                  250 AI Credits/mo • WhatsApp Cloud API • 25 Active Workflows
                </Text>
              </View>
            </View>
            <View style={styles.rcUpgradeBtn}>
              <Text style={styles.rcUpgradeBtnText}>Upgrade</Text>
              <ArrowRight size={12} color="#059669" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 4 Core Financial & Pipeline KPIs */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Business KPIs</Text>
            <TouchableOpacity onPress={() => router.push('/analytics' as any)}>
              <Text style={styles.seeAllText}>Deep Analytics →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              <StatCard
                title="Revenue"
                value={`₹${stats.revenueThisMonth.toLocaleString('en-IN')}`}
                subtitle="Collected this month"
                changePercent={stats.revenueGrowthPercent}
                variant="revenue"
                icon={<TrendingUp size={16} color={Colors.primary} />}
                onPress={() => router.push('/analytics/revenue' as any)}
              />
              <StatCard
                title="Overdue"
                value={`₹${stats.overdueAmount.toLocaleString('en-IN')}`}
                subtitle={`${stats.overdueInvoicesCount || 0} overdue invoices`}
                variant="warning"
                icon={<AlertCircle size={16} color={Colors.warning} />}
                onPress={() => router.push('/(tabs)/finance')}
              />
            </View>

            <View style={styles.kpiRow}>
              <StatCard
                title="Active Leads"
                value={`${stats.activeLeadsCount}`}
                subtitle="Open in pipeline"
                variant="info"
                icon={<Users size={16} color={Colors.info} />}
                onPress={() => router.push('/(tabs)/sales')}
              />
              <StatCard
                title="Proposals"
                value={`${stats.pendingProposalsCount}`}
                subtitle="Quotes pending"
                variant="purple"
                icon={<FileText size={16} color={Colors.purple} />}
                onPress={() => router.push('/proposals' as any)}
              />
            </View>
          </View>
        </View>

        {/* Ask SoloCEO Quick Command Launcher */}
        <View style={styles.sectionContainer}>
          <GlassCard variant="subtle" style={styles.askAiCard}>
            <View style={styles.askAiHeader}>
              <View style={styles.sparkleCircle}>
                <Sparkles size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.askAiTitle}>ASK SOLOCEO AI</Text>
            </View>
            <Text style={styles.askAiSubtitle}>What should I do today?</Text>

            <View style={styles.quickPromptChips}>
              <TouchableOpacity
                style={styles.promptChip}
                activeOpacity={0.7}
                onPress={() => router.push('/(tabs)/ai')}
              >
                <View style={styles.promptChipLeft}>
                  <View style={[styles.promptDot, { backgroundColor: Colors.warning }]} />
                  <Text style={styles.promptChipText}>Who owes me money & overdue invoices?</Text>
                </View>
                <ArrowRight size={13} color={Colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.promptChip}
                activeOpacity={0.7}
                onPress={() => router.push('/(tabs)/ai')}
              >
                <View style={styles.promptChipLeft}>
                  <View style={[styles.promptDot, { backgroundColor: Colors.info }]} />
                  <Text style={styles.promptChipText}>Which leads need follow-up today?</Text>
                </View>
                <ArrowRight size={13} color={Colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.promptChip}
                activeOpacity={0.7}
                onPress={() => router.push('/proposals/create')}
              >
                <View style={styles.promptChipLeft}>
                  <View style={[styles.promptDot, { backgroundColor: Colors.primary }]} />
                  <Text style={styles.promptChipText}>Draft new proposal & scope deliverables</Text>
                </View>
                <ArrowRight size={13} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>

        {/* Business Intelligence & Analytics Hub Widget */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push('/analytics' as any)}
          >
            <GlassCard variant="glow" style={styles.automationsWidgetCard}>
              <View style={styles.automationsWidgetRow}>
                <View style={styles.automationsWidgetLeft}>
                  <View style={[styles.autoWidgetIconWrap, { backgroundColor: Colors.primarySubtle }]}>
                    <TrendingUp size={18} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.autoWidgetTitle}>Business Intelligence &amp; Analytics</Text>
                    <Text style={styles.autoWidgetSubtitle}>Revenue breakdown, pipeline &amp; AI insights</Text>
                  </View>
                </View>
                <View style={styles.autoWidgetRight}>
                  <View style={[styles.runningPill, { backgroundColor: Colors.primarySubtle }]}>
                    <Text style={[styles.runningPillText, { color: Colors.primaryDark }]}>Live Hub</Text>
                  </View>
                  <ArrowRight size={16} color={Colors.textMuted} />
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        </View>

        {/* Automations Summary Widget (Screen 10) */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/automations' as any)}
          >
            <GlassCard style={styles.automationsWidgetCard}>
              <View style={styles.automationsWidgetRow}>
                <View style={styles.automationsWidgetLeft}>
                  <View style={styles.autoWidgetIconWrap}>
                    <Sparkles size={16} color="#059669" />
                  </View>
                  <View>
                    <Text style={styles.autoWidgetTitle}>Automations</Text>
                    <Text style={styles.autoWidgetSubtitle}>3 / 5 active</Text>
                  </View>
                </View>
                <View style={styles.autoWidgetRight}>
                  <View style={styles.runningPill}>
                    <Text style={styles.runningPillText}>1 running now</Text>
                  </View>
                  <ArrowRight size={16} color="#94A3B8" />
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        </View>

        {/* Recent Automation Activity Section (Screen 10) */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Automation Activity</Text>
            <TouchableOpacity onPress={() => router.push('/automations/runs' as any)}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <GlassCard style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: '#ECFDF5' }]}>
                <CheckCircle2 size={14} color="#059669" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Overdue Invoice Reminder</Text>
                <Text style={styles.activitySub}>Ran at 9:02 AM • 2 emails ready</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: '#ECFDF5' }]}>
                <CheckCircle2 size={14} color="#059669" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Website Lead Processing</Text>
                <Text style={styles.activitySub}>Ran at 1:15 PM • 1 new lead created</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: '#FEF2F2' }]}>
                <AlertCircle size={14} color="#DC2626" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Inactive Lead Follow-up</Text>
                <Text style={styles.activitySub}>Failed at 10:30 AM • Integration error</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* AI Agent Team Status */}
        <View style={[styles.sectionContainer, { marginBottom: 90 }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>AI Operations Team</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/ai')}>
              <Text style={styles.seeAllText}>Command Center</Text>
            </TouchableOpacity>
          </View>

          <GlassCard style={styles.teamCard}>
            <View style={styles.agentRow}>
              <View style={styles.agentInfo}>
                <View style={[styles.agentDot, { backgroundColor: Colors.success }]} />
                <View>
                  <Text style={styles.agentName}>Sales Agent</Text>
                  <Text style={styles.agentStatus}>Monitoring {stats.activeLeadsCount} active pipeline deals</Text>
                </View>
              </View>
              <CheckCircle2 size={16} color={Colors.success} />
            </View>

            <View style={styles.divider} />

            <View style={styles.agentRow}>
              <View style={styles.agentInfo}>
                <View style={[styles.agentDot, { backgroundColor: stats.overdueAmount > 0 ? Colors.warning : Colors.success }]} />
                <View>
                  <Text style={styles.agentName}>Finance Agent</Text>
                  <Text style={styles.agentStatus}>
                    {stats.overdueAmount > 0
                      ? `Detected ₹${stats.overdueAmount.toLocaleString('en-IN')} in overdue invoices`
                      : 'All accounts receivable up to date'}
                  </Text>
                </View>
              </View>
              <CheckCircle2 size={16} color={Colors.success} />
            </View>

            <View style={styles.divider} />

            <View style={styles.agentRow}>
              <View style={styles.agentInfo}>
                <View style={[styles.agentDot, { backgroundColor: Colors.info }]} />
                <View>
                  <Text style={styles.agentName}>Proposal Agent</Text>
                  <Text style={styles.agentStatus}>Ready to draft proposals & scope deliverables</Text>
                </View>
              </View>
              <CheckCircle2 size={16} color={Colors.success} />
            </View>
          </GlassCard>
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
  scrollContent: {
    paddingBottom: 140,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: Colors.primary,
  },
  revenueCatPromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    ...Shadows.sm,
  },
  rcPromoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  rcIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rcPromoContent: {
    flex: 1,
  },
  rcBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  rcTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: '#0F172A',
  },
  rcActivePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rcActivePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: '#059669',
  },
  rcSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    fontFamily: 'Manrope_400Regular',
    lineHeight: 16,
  },
  rcUpgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rcUpgradeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#059669',
  },
  briefCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    borderRadius: 22,
    ...Shadows.glass,
  },
  briefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  briefBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  briefBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: Colors.primaryDark,
    letterSpacing: 0.8,
  },
  liveSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  liveSyncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  briefTimestamp: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
  },
  briefTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: Colors.text,
    lineHeight: 23,
    marginBottom: 6,
  },
  briefDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 16,
    fontFamily: 'Manrope_400Regular',
  },
  briefActions: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiGrid: {
    gap: 4,
  },
  kpiRow: {
    flexDirection: 'row',
  },
  askAiCard: {
    padding: 16,
    borderRadius: 22,
  },
  askAiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sparkleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  askAiTitle: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: Colors.primaryDark,
    letterSpacing: 0.8,
  },
  askAiSubtitle: {
    fontSize: 19,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: Colors.text,
    marginBottom: 14,
    letterSpacing: -0.4,
  },
  quickPromptChips: {
    gap: 8,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    ...Shadows.sm,
  },
  promptChipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  promptDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  promptChipText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: Colors.text,
    letterSpacing: -0.1,
  },
  teamCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  agentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  agentName: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: Colors.text,
  },
  agentStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'Manrope_400Regular',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
  automationsWidgetCard: {
    padding: 14,
    borderRadius: 16,
  },
  automationsWidgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  automationsWidgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  autoWidgetIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoWidgetTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#0F172A',
  },
  autoWidgetSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Manrope_400Regular',
    marginTop: 2,
  },
  autoWidgetRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  runningPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  runningPillText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#D97706',
  },
  activityCard: {
    padding: 12,
    borderRadius: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  activityDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#0F172A',
  },
  activitySub: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Manrope_400Regular',
    marginTop: 2,
  },
});
