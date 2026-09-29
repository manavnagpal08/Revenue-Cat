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
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Award,
  ChevronRight,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { analyticsService, RevenueAnalytics } from '../../src/services/analyticsService';
import { GlassCard } from '../../src/components/GlassCard';

const TIMEFRAMES = [
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: '1y', label: '1Y' },
];

export default function RevenueAnalyticsScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'default';
  const currencySymbol = currentBusiness?.currency_symbol || '₹';

  const [timeFrame, setTimeFrame] = useState('30d');
  const [data, setData] = useState<RevenueAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRevenue = useCallback(async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getRevenue(businessId, timeFrame);
      setData(res);
    } catch (err) {
      console.warn('Error loading revenue analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId, timeFrame]);

  useEffect(() => {
    fetchRevenue();
  }, [fetchRevenue]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRevenue();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Revenue & Cash Flow</Text>
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
            <Text style={styles.loadingText}>Computing Revenue Analytics...</Text>
          </View>
        ) : (
          <>
            {/* Primary Stat Tiles */}
            <View style={styles.statGrid}>
              <GlassCard style={styles.statCard} variant="elevated">
                <Text style={styles.statLabel}>Total Invoiced</Text>
                <Text style={styles.statValue}>
                  {currencySymbol}{(data?.total_invoiced || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.statSub}>Billed in {timeFrame.toUpperCase()}</Text>
              </GlassCard>

              <GlassCard style={styles.statCard} variant="elevated">
                <Text style={styles.statLabel}>Collected</Text>
                <Text style={[styles.statValue, { color: '#059669' }]}>
                  {currencySymbol}{(data?.total_collected || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.statSub}>{data?.collection_rate_percent || 0}% collection rate</Text>
              </GlassCard>
            </View>

            <View style={styles.statGrid}>
              <GlassCard style={styles.statCard}>
                <Text style={styles.statLabel}>Outstanding</Text>
                <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                  {currencySymbol}{(data?.total_outstanding || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.statSub}>Awaiting payment</Text>
              </GlassCard>

              <GlassCard style={styles.statCard}>
                <Text style={styles.statLabel}>Overdue Exposure</Text>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>
                  {currencySymbol}{(data?.total_overdue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.statSub}>Past due date</Text>
              </GlassCard>
            </View>

            {/* Collection Efficiency Gauge */}
            <GlassCard style={styles.sectionCard} variant="elevated">
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Collection Efficiency</Text>
                <Text style={styles.gaugePercent}>{data?.collection_rate_percent || 0}%</Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, data?.collection_rate_percent || 0)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressHint}>
                Average invoice value is {currencySymbol}
                {(data?.average_invoice_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}.
              </Text>
            </GlassCard>

            {/* Revenue by Source Breakdown */}
            <GlassCard style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Revenue by Channel</Text>
              <Text style={styles.sectionSubtitle}>Acquisition channel distribution</Text>

              <View style={styles.sourceList}>
                {data?.revenue_by_source && data.revenue_by_source.length > 0 ? (
                  data.revenue_by_source.map((item, idx) => (
                    <View key={idx} style={styles.sourceItem}>
                      <View style={styles.sourceInfo}>
                        <Text style={styles.sourceName}>{item.source}</Text>
                        <Text style={styles.sourceAmount}>
                          {currencySymbol}{item.amount.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.sourceBarTrack}>
                        <View
                          style={[
                            styles.sourceBarFill,
                            { width: `${Math.min(100, item.percentage || 10)}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.sourcePercentText}>{item.percentage}%</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No revenue sources recorded.</Text>
                )}
              </View>
            </GlassCard>

            {/* Top Paying Clients */}
            <GlassCard style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Top Paying Accounts</Text>
              <Text style={styles.sectionSubtitle}>Clients ranked by paid volume</Text>

              {data?.top_paying_customers && data.top_paying_customers.length > 0 ? (
                data.top_paying_customers.map((c, i) => (
                  <TouchableOpacity
                    key={c.customer_id || i}
                    style={styles.customerRow}
                    onPress={() => router.push('/customers' as any)}
                  >
                    <View style={styles.rankCircle}>
                      <Text style={styles.rankText}>#{i + 1}</Text>
                    </View>
                    <View style={styles.custInfo}>
                      <Text style={styles.custName}>{c.customer_name}</Text>
                      <Text style={styles.custInvoices}>{c.invoice_count} invoice{c.invoice_count > 1 ? 's' : ''}</Text>
                    </View>
                    <View style={styles.custAmountBox}>
                      <Text style={styles.custAmount}>
                        {currencySymbol}{c.total_paid.toLocaleString('en-IN')}
                      </Text>
                      <ChevronRight size={14} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.emptyText}>No payments recorded in this period.</Text>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  gaugePercent: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 5,
  },
  progressHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
  },
  sourceList: {
    gap: 10,
    marginTop: 4,
  },
  sourceItem: {
    gap: 4,
  },
  sourceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sourceName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  sourceAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  sourceBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sourceBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  sourcePercentText: {
    fontSize: 10,
    color: '#94A3B8',
    alignSelf: 'flex-end',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rankCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  custInfo: {
    flex: 1,
  },
  custName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  custInvoices: {
    fontSize: 11,
    color: '#64748B',
  },
  custAmountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  custAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
