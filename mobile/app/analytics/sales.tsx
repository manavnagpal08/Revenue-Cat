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
  Briefcase,
  TrendingUp,
  Target,
  Clock,
  CheckCircle2,
  FileCheck,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { analyticsService, SalesAnalytics } from '../../src/services/analyticsService';
import { GlassCard } from '../../src/components/GlassCard';

const TIMEFRAMES = [
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: '1y', label: '1Y' },
];

export default function SalesAnalyticsScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'default';
  const currencySymbol = currentBusiness?.currency_symbol || '₹';

  const [timeFrame, setTimeFrame] = useState('30d');
  const [data, setData] = useState<SalesAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getSales(businessId, timeFrame);
      setData(res);
    } catch (err) {
      console.warn('Error loading sales analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId, timeFrame]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSales();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sales Pipeline & Funnel</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
        }
      >
        {/* Timeframe selector */}
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
            <Text style={styles.loadingText}>Analyzing Deal Funnels...</Text>
          </View>
        ) : (
          <>
            {/* High Level Pipeline KPIs */}
            <View style={styles.statGrid}>
              <GlassCard style={styles.statCard} variant="elevated">
                <Text style={styles.statLabel}>Pipeline Value</Text>
                <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                  {currencySymbol}{(data?.total_pipeline_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.statSub}>{data?.total_leads || 0} active opportunities</Text>
              </GlassCard>

              <GlassCard style={styles.statCard} variant="elevated">
                <Text style={styles.statLabel}>Win Rate</Text>
                <Text style={[styles.statValue, { color: '#059669' }]}>
                  {data?.win_rate_percent || 0}%
                </Text>
                <Text style={styles.statSub}>{data?.won_leads || 0} deals closed won</Text>
              </GlassCard>
            </View>

            <View style={styles.statGrid}>
              <GlassCard style={styles.statCard}>
                <Text style={styles.statLabel}>Average Deal Size</Text>
                <Text style={styles.statValue}>
                  {currencySymbol}{(data?.average_deal_size || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.statSub}>Per qualified opportunity</Text>
              </GlassCard>

              <GlassCard style={styles.statCard}>
                <Text style={styles.statLabel}>Sales Cycle</Text>
                <Text style={styles.statValue}>
                  {data?.average_sales_cycle_days || 0} <Text style={{ fontSize: 13, fontWeight: 'normal' }}>days</Text>
                </Text>
                <Text style={styles.statSub}>Inquiry to close</Text>
              </GlassCard>
            </View>

            {/* Pipeline Stage Funnel */}
            <GlassCard style={styles.sectionCard} variant="elevated">
              <Text style={styles.sectionTitle}>Conversion Funnel</Text>
              <Text style={styles.sectionSubtitle}>Stage drop-off and conversion rates</Text>

              <View style={styles.funnelContainer}>
                {data?.funnel_stages && data.funnel_stages.length > 0 ? (
                  data.funnel_stages.map((stage, idx) => {
                    const stageWidth = Math.max(25, 100 - idx * 14);
                    return (
                      <View key={idx} style={styles.funnelStageItem}>
                        <View style={styles.funnelRowInfo}>
                          <Text style={styles.funnelStageName}>{stage.stage}</Text>
                          <Text style={styles.funnelStageValue}>
                            {stage.count} deals • {currencySymbol}{stage.value.toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View style={styles.funnelTrack}>
                          <View
                            style={[
                              styles.funnelBar,
                              { width: `${stageWidth}%`, backgroundColor: idx === data.funnel_stages.length - 1 ? '#10B981' : '#3B82F6' },
                            ]}
                          />
                        </View>
                        <Text style={styles.funnelConvText}>{stage.conversion_rate}% conversion</Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyText}>No pipeline stages recorded.</Text>
                )}
              </View>
            </GlassCard>

            {/* Lead Sources & Win Rates */}
            <GlassCard style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Lead Acquisition Channels</Text>
              <Text style={styles.sectionSubtitle}>Source volume and win velocity</Text>

              {data?.leads_by_source && data.leads_by_source.length > 0 ? (
                data.leads_by_source.map((src, i) => (
                  <View key={i} style={styles.sourceRow}>
                    <View style={styles.sourceMain}>
                      <Text style={styles.sourceNameText}>{src.source}</Text>
                      <Text style={styles.sourceDetails}>
                        {src.count} leads • {src.won_count} won ({currencySymbol}{src.total_value.toLocaleString('en-IN')})
                      </Text>
                    </View>
                    <View style={styles.sourceBadge}>
                      <Text style={styles.sourceBadgeText}>{src.conversion_rate}% Win</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No lead sources available.</Text>
              )}
            </GlassCard>

            {/* Proposals Summary */}
            <GlassCard style={styles.sectionCard}>
              <View style={styles.propHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Proposal Velocity</Text>
                  <Text style={styles.sectionSubtitle}>Contract acceptance stats</Text>
                </View>
                <View style={styles.propRateBadge}>
                  <Text style={styles.propRateText}>
                    {data?.proposals_summary?.acceptance_rate || 0}% Accepted
                  </Text>
                </View>
              </View>
              <View style={styles.propGrid}>
                <View style={styles.propGridItem}>
                  <Text style={styles.propVal}>{data?.proposals_summary?.total || 0}</Text>
                  <Text style={styles.propLbl}>Sent</Text>
                </View>
                <View style={styles.propGridItem}>
                  <Text style={[styles.propVal, { color: '#059669' }]}>
                    {data?.proposals_summary?.accepted || 0}
                  </Text>
                  <Text style={styles.propLbl}>Accepted</Text>
                </View>
                <View style={styles.propGridItem}>
                  <Text style={[styles.propVal, { color: '#3B82F6' }]}>
                    {data?.proposals_summary?.pending || 0}
                  </Text>
                  <Text style={styles.propLbl}>Pending</Text>
                </View>
              </View>
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
  funnelContainer: {
    gap: 12,
  },
  funnelStageItem: {
    gap: 4,
  },
  funnelRowInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  funnelStageName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  funnelStageValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  funnelTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  funnelBar: {
    height: '100%',
    borderRadius: 4,
  },
  funnelConvText: {
    fontSize: 10,
    color: '#94A3B8',
    alignSelf: 'flex-end',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sourceMain: {
    flex: 1,
  },
  sourceNameText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  sourceDetails: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  sourceBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  propHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  propRateBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  propRateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  propGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  propGridItem: {
    alignItems: 'center',
  },
  propVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  propLbl: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 14,
  },
});
