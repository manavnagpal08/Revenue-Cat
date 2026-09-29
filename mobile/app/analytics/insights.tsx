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
  ShieldAlert,
  AlertTriangle,
  Award,
  ChevronRight,
  Filter,
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { analyticsService, BusinessInsightItem, BusinessInsightsResponse } from '../../src/services/analyticsService';
import { GlassCard } from '../../src/components/GlassCard';

const CATEGORIES = [
  { id: 'all', label: 'All Insights' },
  { id: 'finance', label: 'Finance' },
  { id: 'sales', label: 'Sales' },
  { id: 'customers', label: 'Customers' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'automations', label: 'Automations' },
];

export default function InsightsScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || 'default';

  const [category, setCategory] = useState('all');
  const [data, setData] = useState<BusinessInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getInsights(businessId, '30d', category);
      setData(res);
    } catch (err) {
      console.warn('Error loading insights:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [businessId, category]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchInsights();
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return {
          bg: '#FEE2E2',
          text: '#EF4444',
          label: 'Urgent Attention',
          icon: ShieldAlert,
        };
      case 'medium':
        return {
          bg: '#FEF3C7',
          text: '#D97706',
          label: 'Opportunity',
          icon: AlertTriangle,
        };
      case 'positive':
        return {
          bg: '#ECFDF5',
          text: '#059669',
          label: 'Healthy Metric',
          icon: Award,
        };
      default:
        return {
          bg: '#EFF6FF',
          text: '#3B82F6',
          label: 'Observation',
          icon: Sparkles,
        };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Strategic Insights</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
        }
      >
        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {CATEGORIES.map((cat) => {
            const active = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, active && styles.categoryPillActive]}
                onPress={() => setCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    active && styles.categoryPillTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>Evaluating Business Operations...</Text>
          </View>
        ) : (
          <>
            {data?.insights && data.insights.length > 0 ? (
              data.insights.map((ins) => {
                const badge = getSeverityBadge(ins.severity);
                const Icon = badge.icon;
                return (
                  <GlassCard key={ins.id} style={styles.card} variant="elevated">
                    <View style={styles.cardHeader}>
                      <View style={[styles.severityTag, { backgroundColor: badge.bg }]}>
                        <Icon size={12} color={badge.text} />
                        <Text style={[styles.severityTagText, { color: badge.text }]}>
                          {badge.label}
                        </Text>
                      </View>
                      {ins.metric_impact && (
                        <View style={styles.impactTag}>
                          <Text style={styles.impactTagText}>{ins.metric_impact}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.cardTitle}>{ins.title}</Text>
                    <Text style={styles.cardDescription}>{ins.description}</Text>

                    {ins.action_label && ins.action_route && (
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => router.push(ins.action_route as any)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.actionBtnText}>{ins.action_label}</Text>
                        <ChevronRight size={14} color="#059669" />
                      </TouchableOpacity>
                    )}
                  </GlassCard>
                );
              })
            ) : (
              <GlassCard style={styles.card}>
                <Text style={styles.cardTitle}>No Anomalies Detected</Text>
                <Text style={styles.cardDescription}>
                  Your business operations are running smoothly without any urgent intervention required.
                </Text>
              </GlassCard>
            )}
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
  categoryScroll: {
    marginBottom: 16,
  },
  categoryContent: {
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
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
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  severityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  severityTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  impactTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  impactTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
});
