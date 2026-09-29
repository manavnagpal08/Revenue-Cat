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
  Sparkles,
  Zap,
  TrendingUp,
  Award,
  CreditCard,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { analyticsService, AIUsageAnalytics } from '../../src/services/analyticsService';
import { GlassCard } from '../../src/components/GlassCard';

export default function AIUsageAnalyticsScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'default';

  const [data, setData] = useState<AIUsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAIUsage = useCallback(async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getAIUsage(businessId, '30d');
      setData(res);
    } catch (err) {
      console.warn('Error loading AI usage analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchAIUsage();
  }, [fetchAIUsage]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAIUsage();
  };

  const usedCredits = data?.credits_used || 0;
  const totalCredits = data?.credits_total || 50;
  const usedPercent = totalCredits > 0 ? Math.round((usedCredits / totalCredits) * 100) : 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Intelligence & Credits</Text>
        <TouchableOpacity
          style={styles.upgradeBtn}
          onPress={() => router.push('/paywall')}
        >
          <Sparkles size={14} color="#059669" />
          <Text style={styles.upgradeBtnText}>Upgrade</Text>
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
            <Text style={styles.loadingText}>Fetching AI Usage Metrics...</Text>
          </View>
        ) : (
          <>
            {/* Credit Meter Card */}
            <GlassCard style={styles.meterCard} variant="elevated">
              <View style={styles.meterHeader}>
                <View>
                  <Text style={styles.meterTitle}>Monthly AI Credits</Text>
                  <Text style={styles.meterSubtitle}>Reset cycle in 12 days</Text>
                </View>
                <View style={styles.badgeUsed}>
                  <Text style={styles.badgeUsedText}>{usedPercent}% Used</Text>
                </View>
              </View>

              <View style={styles.bigCreditRow}>
                <Text style={styles.bigCreditUsed}>{usedCredits}</Text>
                <Text style={styles.bigCreditTotal}>/ {totalCredits} credits</Text>
              </View>

              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${Math.min(100, usedPercent)}%` }]} />
              </View>

              <Text style={styles.remainingText}>
                {data?.credits_remaining || 0} credits remaining for supervisor reasoning & draft generation.
              </Text>
            </GlassCard>

            {/* Usage by Agent */}
            <GlassCard style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Consumption by Specialized Agent</Text>
              <Text style={styles.sectionSubtitle}>Breakdown of credits consumed per agent</Text>

              <View style={styles.agentList}>
                {data?.credits_used_by_agent &&
                  Object.entries(data.credits_used_by_agent).map(([agent, credits], idx) => {
                    const pct = usedCredits > 0 ? Math.round((credits / usedCredits) * 100) : 0;
                    return (
                      <View key={idx} style={styles.agentRow}>
                        <View style={styles.agentInfo}>
                          <Text style={styles.agentName}>{agent}</Text>
                          <Text style={styles.agentCredits}>{credits} credits ({pct}%)</Text>
                        </View>
                        <View style={styles.agentTrack}>
                          <View style={[styles.agentBar, { width: `${Math.min(100, pct)}%` }]} />
                        </View>
                      </View>
                    );
                  })}
              </View>
            </GlassCard>

            {/* Daily Consumption Trend */}
            <GlassCard style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Daily Activity Trend</Text>
              <Text style={styles.sectionSubtitle}>Credits spent per calendar day</Text>

              {data?.daily_usage_trend && data.daily_usage_trend.length > 0 ? (
                data.daily_usage_trend.map((day, i) => (
                  <View key={i} style={styles.dailyRow}>
                    <Text style={styles.dailyDate}>{day.date}</Text>
                    <Text style={styles.dailyRequests}>{day.requests} requests</Text>
                    <Text style={styles.dailyCredits}>+{day.credits} credits</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No recent query activity.</Text>
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
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  upgradeBtnText: {
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
  meterCard: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  meterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  meterSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  badgeUsed: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeUsedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  bigCreditRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 14,
    gap: 6,
  },
  bigCreditUsed: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
  },
  bigCreditTotal: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
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
  remainingText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 10,
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
  agentList: {
    gap: 12,
  },
  agentRow: {
    gap: 4,
  },
  agentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  agentName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  agentCredits: {
    fontSize: 12,
    color: '#64748B',
  },
  agentTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  agentBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  dailyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dailyDate: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  dailyRequests: {
    fontSize: 12,
    color: '#64748B',
  },
  dailyCredits: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 14,
  },
});
