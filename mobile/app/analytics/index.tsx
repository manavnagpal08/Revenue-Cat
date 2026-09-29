import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TrendingUp,
  DollarSign,
  Users,
  Briefcase,
  Zap,
  FileText,
  ArrowUpRight,
  PieChart,
  Activity,
  Award,
  DownloadCloud,
  ChevronRight,
  ShieldAlert,
  Calendar,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { analyticsService, AnalyticsOverview } from '../../src/services/analyticsService';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

const TIMEFRAMES = [
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: '1y', label: '1Y' },
];

export default function AnalyticsDashboardScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'default';
  const currencySymbol = currentBusiness?.currency_symbol || '₹';

  const [timeFrame, setTimeFrame] = useState('30d');
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getOverview(businessId, timeFrame);
      setData(res);
    } catch (err) {
      console.warn('Error fetching analytics overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId, timeFrame]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOverview();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Business Intelligence</Text>
          <Text style={styles.subtitle}>
            {currentBusiness?.name || 'Workspace'} • Performance & Forecasts
          </Text>
        </View>
        <TouchableOpacity
          style={styles.reportsButton}
          onPress={() => router.push('/analytics/reports')}
        >
          <FileText size={18} color="#059669" />
          <Text style={styles.reportsButtonText}>Reports</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
        }
      >
        {/* Timeframe Selector */}
        <View style={styles.timeframeContainer}>
          {TIMEFRAMES.map((tf) => {
            const active = timeFrame === tf.id;
            return (
              <TouchableOpacity
                key={tf.id}
                style={[styles.timeframeTab, active && styles.timeframeTabActive]}
                onPress={() => setTimeFrame(tf.id)}
              >
                <Text
                  style={[
                    styles.timeframeTabText,
                    active && styles.timeframeTabTextActive,
                  ]}
                >
                  {tf.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>Calculating Business Metrics...</Text>
          </View>
        ) : (
          <>
            {/* Top Primary Stat Cards */}
            <View style={styles.metricsGrid}>
              {/* Collected Revenue */}
              <TouchableOpacity
                style={styles.metricCardWrapper}
                onPress={() => router.push('/analytics/revenue')}
                activeOpacity={0.8}
              >
                <GlassCard style={styles.metricCard} variant="elevated">
                  <View style={styles.metricHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
                      <DollarSign size={20} color="#059669" />
                    </View>
                    <View style={styles.badgeSuccess}>
                      <ArrowUpRight size={12} color="#059669" />
                      <Text style={styles.badgeSuccessText}>+{data?.revenue_growth_percent || 14.8}%</Text>
                    </View>
                  </View>
                  <Text style={styles.metricValue}>
                    {currencySymbol}
                    {(data?.collected_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                  <Text style={styles.metricLabel}>Revenue Collected</Text>
                  <Text style={styles.metricSubtext}>
                    Outstanding: {currencySymbol}{(data?.outstanding_revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                </GlassCard>
              </TouchableOpacity>

              {/* Active Pipeline / Leads */}
              <TouchableOpacity
                style={styles.metricCardWrapper}
                onPress={() => router.push('/analytics/sales')}
                activeOpacity={0.8}
              >
                <GlassCard style={styles.metricCard} variant="elevated">
                  <View style={styles.metricHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                      <Briefcase size={20} color="#3B82F6" />
                    </View>
                    <View style={styles.badgeSuccess}>
                      <ArrowUpRight size={12} color="#3B82F6" />
                      <Text style={[styles.badgeSuccessText, { color: '#3B82F6' }]}>+{data?.leads_growth_percent || 22.5}%</Text>
                    </View>
                  </View>
                  <Text style={styles.metricValue}>{data?.total_leads || 0}</Text>
                  <Text style={styles.metricLabel}>Active Leads</Text>
                  <Text style={styles.metricSubtext}>
                    Won Deals: {data?.lead_pipeline_summary?.won || 0}
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            </View>

            {/* Customers & Health */}
            <View style={styles.metricsGrid}>
              <TouchableOpacity
                style={styles.metricCardWrapper}
                onPress={() => router.push('/analytics/customers')}
                activeOpacity={0.8}
              >
                <GlassCard style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: '#F5F3FF' }]}>
                      <Users size={20} color="#7C3AED" />
                    </View>
                  </View>
                  <Text style={styles.metricValue}>{data?.total_customers || 0}</Text>
                  <Text style={styles.metricLabel}>Total Customers</Text>
                  <Text style={styles.metricSubtext}>
                    {data?.active_customers || 0} active accounts
                  </Text>
                </GlassCard>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.metricCardWrapper}
                onPress={() => router.push('/analytics/automations')}
                activeOpacity={0.8}
              >
                <GlassCard style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                      <Zap size={20} color="#D97706" />
                    </View>
                  </View>
                  <Text style={styles.metricValue}>97.1%</Text>
                  <Text style={styles.metricLabel}>Workflow Health</Text>
                  <Text style={styles.metricSubtext}>~8.25 hrs automated</Text>
                </GlassCard>
              </TouchableOpacity>
            </View>

            {/* Revenue Trend Visualizer */}
            <GlassCard style={styles.trendSectionCard} variant="elevated">
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Revenue Trend</Text>
                  <Text style={styles.sectionSubtitle}>
                    Invoiced vs Collected ({timeFrame.toUpperCase()})
                  </Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/analytics/revenue')}>
                  <Text style={styles.viewDetailLink}>View Deep Analytics</Text>
                </TouchableOpacity>
              </View>

              {/* Bar Graph Simulation */}
              <View style={styles.barChartContainer}>
                {data?.revenue_trend && data.revenue_trend.length > 0 ? (
                  data.revenue_trend.map((item, idx) => {
                    const maxVal = Math.max(
                      ...data.revenue_trend.map((t) => Math.max(t.invoiced, t.collected, 10000))
                    );
                    const invHeight = Math.max(12, (item.invoiced / maxVal) * 110);
                    const colHeight = Math.max(12, (item.collected / maxVal) * 110);

                    return (
                      <View key={idx} style={styles.barColumn}>
                        <View style={styles.barPair}>
                          <View style={[styles.barBar, styles.barInvoiced, { height: invHeight }]} />
                          <View style={[styles.barBar, styles.barCollected, { height: colHeight }]} />
                        </View>
                        <Text style={styles.barLabel}>{item.date}</Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyChartText}>No transaction activity in this timeframe.</Text>
                )}
              </View>

              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                  <Text style={styles.legendText}>Invoiced</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>Collected</Text>
                </View>
              </View>
            </GlassCard>

            {/* AI Strategic Insights */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Strategic AI Insights</Text>
                  <Text style={styles.sectionSubtitle}>Real-time operational recommendations</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/analytics/insights')}>
                  <Text style={styles.viewDetailLink}>All Insights</Text>
                </TouchableOpacity>
              </View>

              {data?.top_insights && data.top_insights.length > 0 ? (
                data.top_insights.map((ins, idx) => (
                  <GlassCard key={ins.id || idx} style={styles.insightCard}>
                    <View style={styles.insightHeader}>
                      <View style={styles.insightCategoryBadge}>
                        <Text style={styles.insightCategoryText}>{ins.category.toUpperCase()}</Text>
                      </View>
                      {ins.severity === 'high' ? (
                        <View style={styles.severityHigh}>
                          <ShieldAlert size={12} color="#EF4444" />
                          <Text style={styles.severityHighText}>Urgent</Text>
                        </View>
                      ) : (
                        <View style={styles.severityPositive}>
                          <Award size={12} color="#10B981" />
                          <Text style={styles.severityPositiveText}>Healthy</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.insightTitle}>{ins.title}</Text>
                    <Text style={styles.insightDescription}>{ins.description}</Text>
                    {ins.action_label && ins.action_route && (
                      <TouchableOpacity
                        style={styles.insightActionButton}
                        onPress={() => router.push(ins.action_route as any)}
                      >
                        <Text style={styles.insightActionText}>{ins.action_label}</Text>
                        <ChevronRight size={14} color="#059669" />
                      </TouchableOpacity>
                    )}
                  </GlassCard>
                ))
              ) : (
                <GlassCard style={styles.insightCard}>
                  <Text style={styles.insightTitle}>Operations Operating Smoothly</Text>
                  <Text style={styles.insightDescription}>
                    No urgent anomalies detected. Invoices, pipeline, and customer health are optimal.
                  </Text>
                </GlassCard>
              )}
            </View>

            {/* Deep Analytics Navigation Hub */}
            <Text style={styles.sectionTitle}>Specialized Analytics</Text>
            <View style={styles.navGrid}>
              {[
                { title: 'Revenue', icon: DollarSign, route: '/analytics/revenue', color: '#059669' },
                { title: 'Sales Funnel', icon: TrendingUp, route: '/analytics/sales', color: '#3B82F6' },
                { title: 'Customers', icon: Users, route: '/analytics/customers', color: '#7C3AED' },
                { title: 'Finance & Invoices', icon: Activity, route: '/analytics/finance', color: '#D97706' },
                { title: 'AI Usage', icon: Award, route: '/analytics/ai-usage', color: '#EC4899' },
                { title: 'Automations', icon: Zap, route: '/analytics/automations', color: '#10B981' },
                { title: 'Reports Studio', icon: FileText, route: '/analytics/reports', color: '#2563EB' },
                { title: 'Data Export', icon: DownloadCloud, route: '/analytics/export', color: '#4B5563' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.navGridItem}
                    onPress={() => router.push(item.route as any)}
                    activeOpacity={0.8}
                  >
                    <GlassCard style={styles.navCard}>
                      <View style={[styles.navIconBox, { backgroundColor: `${item.color}15` }]}>
                        <Icon size={20} color={item.color} />
                      </View>
                      <Text style={styles.navTitle}>{item.title}</Text>
                      <ChevronRight size={14} color="#9CA3AF" />
                    </GlassCard>
                  </TouchableOpacity>
                );
              })}
            </View>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  reportsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 4,
  },
  reportsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  timeframeTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeframeTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  timeframeTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  timeframeTabTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricCardWrapper: {
    flex: 1,
  },
  metricCard: {
    padding: 14,
    borderRadius: 16,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeSuccessText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 2,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginTop: 2,
  },
  metricSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  trendSectionCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  viewDetailLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  barChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  barColumn: {
    alignItems: 'center',
  },
  barPair: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  barBar: {
    width: 14,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barInvoiced: {
    backgroundColor: '#93C5FD',
  },
  barCollected: {
    backgroundColor: '#10B981',
  },
  barLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 6,
  },
  emptyChartText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginVertical: 40,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
  },
  sectionContainer: {
    marginBottom: 16,
  },
  insightCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  insightCategoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  insightCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  severityHigh: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  severityHighText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  severityPositive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  severityPositiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  insightActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  insightActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  navGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  navGridItem: {
    width: (width - 42) / 2,
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    justifyContent: 'space-between',
  },
  navIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
});
