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
  Users,
  UserPlus,
  UserCheck,
  AlertOctagon,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { analyticsService, CustomerAnalytics } from '../../src/services/analyticsService';
import { GlassCard } from '../../src/components/GlassCard';

const TIMEFRAMES = [
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: '1y', label: '1Y' },
];

export default function CustomerAnalyticsScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'default';
  const currencySymbol = currentBusiness?.currency_symbol || '₹';

  const [timeFrame, setTimeFrame] = useState('30d');
  const [data, setData] = useState<CustomerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getCustomers(businessId, timeFrame);
      setData(res);
    } catch (err) {
      console.warn('Error loading customer analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId, timeFrame]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  const getSegmentBadgeStyle = (segment: string) => {
    switch (segment) {
      case 'high_value':
        return { bg: '#FEF3C7', text: '#D97706', label: 'High Value' };
      case 'at_risk':
        return { bg: '#FEE2E2', text: '#EF4444', label: 'At Risk' };
      case 'new':
        return { bg: '#ECFDF5', text: '#059669', label: 'New Client' };
      case 'inactive':
        return { bg: '#F1F5F9', text: '#64748B', label: 'Inactive' };
      default:
        return { bg: '#EFF6FF', text: '#3B82F6', label: 'Active' };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Health & Segmentation</Text>
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
            <Text style={styles.loadingText}>Segmenting Customer Base...</Text>
          </View>
        ) : (
          <>
            {/* Top Customer KPIs */}
            <View style={styles.statGrid}>
              <GlassCard style={styles.statCard} variant="elevated">
                <Text style={styles.statLabel}>Total Customers</Text>
                <Text style={styles.statValue}>{data?.total_customers || 0}</Text>
                <Text style={styles.statSub}>{data?.active_customers || 0} active in period</Text>
              </GlassCard>

              <GlassCard style={styles.statCard} variant="elevated">
                <Text style={styles.statLabel}>New Accounts</Text>
                <Text style={[styles.statValue, { color: '#059669' }]}>
                  +{data?.new_customers || 0}
                </Text>
                <Text style={styles.statSub}>Acquired in {timeFrame.toUpperCase()}</Text>
              </GlassCard>
            </View>

            {/* Segmentation Breakdown Grid */}
            <GlassCard style={styles.sectionCard} variant="elevated">
              <Text style={styles.sectionTitle}>Cohort Segmentation</Text>
              <Text style={styles.sectionSubtitle}>Automated account classification</Text>

              <View style={styles.segmentGrid}>
                <View style={[styles.segmentBox, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.segmentNum, { color: '#D97706' }]}>
                    {data?.segments?.high_value || 0}
                  </Text>
                  <Text style={[styles.segmentLabel, { color: '#92400E' }]}>High Value</Text>
                  <Text style={styles.segmentSub}>&gt;₹100k revenue</Text>
                </View>

                <View style={[styles.segmentBox, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.segmentNum, { color: '#2563EB' }]}>
                    {data?.segments?.active || 0}
                  </Text>
                  <Text style={[styles.segmentLabel, { color: '#1E40AF' }]}>Active</Text>
                  <Text style={styles.segmentSub}>&lt;30d interaction</Text>
                </View>

                <View style={[styles.segmentBox, { backgroundColor: '#FEE2E2' }]}>
                  <Text style={[styles.segmentNum, { color: '#DC2626' }]}>
                    {data?.segments?.at_risk || 0}
                  </Text>
                  <Text style={[styles.segmentLabel, { color: '#991B1B' }]}>At Risk</Text>
                  <Text style={styles.segmentSub}>Overdue &gt;30d</Text>
                </View>

                <View style={[styles.segmentBox, { backgroundColor: '#F1F5F9' }]}>
                  <Text style={[styles.segmentNum, { color: '#475569' }]}>
                    {data?.segments?.inactive || 0}
                  </Text>
                  <Text style={[styles.segmentLabel, { color: '#334155' }]}>Inactive</Text>
                  <Text style={styles.segmentSub}>&gt;60d dormant</Text>
                </View>
              </View>
            </GlassCard>

            {/* Top Accounts Ranking */}
            <GlassCard style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Account Health & Value</Text>
              <Text style={styles.sectionSubtitle}>Top accounts ranked by lifetime value</Text>

              {data?.top_customers && data.top_customers.length > 0 ? (
                data.top_customers.map((c) => {
                  const badge = getSegmentBadgeStyle(c.segment);
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={styles.accountRow}
                      onPress={() => router.push('/customers' as any)}
                    >
                      <View style={styles.accountMain}>
                        <Text style={styles.accountName}>{c.name}</Text>
                        <Text style={styles.accountCompany}>
                          {c.company || 'Direct Client'} • {c.invoice_count} invoices
                        </Text>
                      </View>
                      <View style={styles.accountRight}>
                        <Text style={styles.accountSpent}>
                          {currencySymbol}{c.total_spent.toLocaleString('en-IN')}
                        </Text>
                        <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.badgePillText, { color: badge.text }]}>
                            {badge.label}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>No customer accounts available.</Text>
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
  segmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segmentBox: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
  },
  segmentNum: {
    fontSize: 20,
    fontWeight: '800',
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  segmentSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  accountMain: {
    flex: 1,
  },
  accountName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  accountCompany: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  accountRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  accountSpent: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 14,
  },
});
