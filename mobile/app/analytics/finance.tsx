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
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingDown,
  Calendar,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { analyticsService, FinanceAnalytics } from '../../src/services/analyticsService';
import { GlassCard } from '../../src/components/GlassCard';

const TIMEFRAMES = [
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: '1y', label: '1Y' },
];

export default function FinanceAnalyticsScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'default';
  const currencySymbol = currentBusiness?.currency_symbol || '₹';

  const [timeFrame, setTimeFrame] = useState('30d');
  const [data, setData] = useState<FinanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFinance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getFinance(businessId, timeFrame);
      setData(res);
    } catch (err) {
      console.warn('Error loading finance analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId, timeFrame]);

  useEffect(() => {
    fetchFinance();
  }, [fetchFinance]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFinance();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Finance & Invoicing Telemetry</Text>
        <View style={{ width: 32 }} />
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
            <Text style={styles.loadingText}>Loading Financial Telemetry...</Text>
          </View>
        ) : (
          <>
            {/* Top Stat Cards */}
            <View style={styles.statGrid}>
              <GlassCard style={styles.statCard} variant="elevated">
                <Text style={styles.statLabel}>Total Invoiced</Text>
                <Text style={styles.statValue}>
                  {currencySymbol}{(data?.total_amount_billed || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.statSub}>{data?.total_invoices || 0} invoices issued</Text>
              </GlassCard>

              <GlassCard style={styles.statCard} variant="elevated">
                <Text style={styles.statLabel}>Overdue Exposure</Text>
                <Text style={[styles.statValue, { color: '#EF4444' }]}>
                  {currencySymbol}{(data?.total_amount_overdue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Text>
                <Text style={styles.statSub}>{data?.overdue_invoices_count || 0} overdue invoices</Text>
              </GlassCard>
            </View>

            {/* Overdue Aging Matrix */}
            <GlassCard style={styles.sectionCard} variant="elevated">
              <Text style={styles.sectionTitle}>Aging Matrix</Text>
              <Text style={styles.sectionSubtitle}>Outstanding receivables by days past due</Text>

              <View style={styles.agingGrid}>
                <View style={styles.agingBox}>
                  <Text style={styles.agingDays}>1–15 Days</Text>
                  <Text style={styles.agingAmount}>
                    {currencySymbol}{(data?.overdue_aging?.['1_15_days'] || 0).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.agingNote}>Initial reminders</Text>
                </View>

                <View style={styles.agingBox}>
                  <Text style={styles.agingDays}>16–30 Days</Text>
                  <Text style={[styles.agingAmount, { color: '#D97706' }]}>
                    {currencySymbol}{(data?.overdue_aging?.['16_30_days'] || 0).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.agingNote}>Urgent escalation</Text>
                </View>

                <View style={styles.agingBox}>
                  <Text style={styles.agingDays}>30+ Days</Text>
                  <Text style={[styles.agingAmount, { color: '#EF4444' }]}>
                    {currencySymbol}{(data?.overdue_aging?.['30_plus_days'] || 0).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.agingNote}>High recovery risk</Text>
                </View>
              </View>
            </GlassCard>

            {/* Invoices Status Distribution */}
            <GlassCard style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Invoice Status Distribution</Text>
              <Text style={styles.sectionSubtitle}>Volume & breakdown across statuses</Text>

              <View style={styles.distList}>
                {data?.status_distribution && data.status_distribution.length > 0 ? (
                  data.status_distribution.map((item, idx) => (
                    <View key={idx} style={styles.distRow}>
                      <View style={styles.distLeft}>
                        <View style={[styles.statusDot, { backgroundColor: item.color }]} />
                        <Text style={styles.statusLabel}>{item.status}</Text>
                        <Text style={styles.statusCount}>({item.count})</Text>
                      </View>
                      <Text style={styles.statusAmount}>
                        {currencySymbol}{item.amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No invoice records found.</Text>
                )}
              </View>
            </GlassCard>

            {/* Payment Velocity */}
            <GlassCard style={styles.sectionCard}>
              <View style={styles.velocityRow}>
                <View>
                  <Text style={styles.sectionTitle}>Average Settlement Velocity</Text>
                  <Text style={styles.sectionSubtitle}>Time taken from invoice sent to paid</Text>
                </View>
                <View style={styles.velocityPill}>
                  <Text style={styles.velocityNum}>
                    {data?.payment_velocity_average_days || 0}
                  </Text>
                  <Text style={styles.velocityUnit}>Days</Text>
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
  agingGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  agingBox: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  agingDays: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  agingAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  agingNote: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  distList: {
    gap: 10,
  },
  distRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  distLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  statusCount: {
    fontSize: 12,
    color: '#64748B',
  },
  statusAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  velocityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  velocityPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  velocityNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
  },
  velocityUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 14,
  },
});
