import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Bot,
  AlertTriangle,
  Layers,
  Clock,
  TrendingUp,
} from 'lucide-react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors, Shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { billingService, UsageSummary } from '../../src/services/billingService';

export default function UsageScreen() {
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || '00000000-0000-0000-0000-000000000002';

  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<UsageSummary | null>(null);

  useEffect(() => {
    loadUsage();
  }, [businessId]);

  const loadUsage = async () => {
    try {
      const data = await billingService.getUsage(businessId);
      setUsage(data);
    } catch (e) {
      console.warn('Error loading usage data:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !usage) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isLowCredits = usage.ai_credits_remaining <= 5;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Usage &amp; AI Credits</Text>
        <TouchableOpacity
          style={styles.upgradeBtn}
          onPress={() => router.push('/paywall' as any)}
        >
          <Text style={styles.upgradeBtnText}>Upgrade</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Low Credits Warning Banner */}
        {isLowCredits ? (
          <GlassCard style={styles.warningBanner}>
            <AlertTriangle size={18} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={styles.warningTitle}>Credits Running Low</Text>
              <Text style={styles.warningDesc}>
                You have {usage.ai_credits_remaining} AI credit(s) remaining. Upgrade your plan to prevent workflow interruptions.
              </Text>
            </View>
          </GlassCard>
        ) : null}

        {/* AI Credits Meter Card */}
        <GlassCard style={styles.meterCard}>
          <View style={styles.meterTop}>
            <View style={styles.iconCircle}>
              <Sparkles size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.meterHeaderTitle}>AI Reasoning Credits</Text>
              <Text style={styles.meterHeaderSub}>
                Monthly limit on {usage.plan_tier.toUpperCase()} plan
              </Text>
            </View>
            <View style={styles.remainingPill}>
              <Text style={styles.remainingText}>
                {usage.ai_credits_remaining} remaining
              </Text>
            </View>
          </View>

          <View style={styles.statLargeRow}>
            <Text style={styles.statLargeNum}>{usage.ai_credits_used}</Text>
            <Text style={styles.statLargeDenom}>/ {usage.ai_credits_total} used</Text>
            <Text style={styles.statLargePct}>({usage.ai_credits_percent}%)</Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, usage.ai_credits_percent)}%`,
                  backgroundColor: isLowCredits ? '#EF4444' : Colors.primary,
                },
              ]}
            />
          </View>
        </GlassCard>

        {/* Automations Meter Card */}
        <GlassCard style={styles.meterCard}>
          <View style={styles.meterTop}>
            <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Zap size={20} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.meterHeaderTitle}>Active Automations</Text>
              <Text style={styles.meterHeaderSub}>Workflow rules running concurrently</Text>
            </View>
            <View style={[styles.remainingPill, { backgroundColor: '#ECFDF5' }]}>
              <Text style={[styles.remainingText, { color: '#059669' }]}>
                {Math.max(0, usage.automations_limit - usage.automations_active)} slots left
              </Text>
            </View>
          </View>

          <View style={styles.statLargeRow}>
            <Text style={styles.statLargeNum}>{usage.automations_active}</Text>
            <Text style={styles.statLargeDenom}>/ {usage.automations_limit} active</Text>
            <Text style={styles.statLargePct}>({usage.automations_percent}%)</Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, usage.automations_percent)}%`,
                  backgroundColor: '#059669',
                },
              ]}
            />
          </View>
        </GlassCard>

        {/* Breakdown by Action */}
        <Text style={styles.sectionTitle}>USAGE BY AGENT &amp; OPERATION</Text>
        <GlassCard style={styles.breakdownCard}>
          {Object.keys(usage.usage_by_action).length === 0 ? (
            <Text style={styles.emptyText}>No metered operations recorded this billing period.</Text>
          ) : (
            Object.entries(usage.usage_by_action).map(([action, credits], idx) => (
              <View key={idx} style={styles.breakdownRow}>
                <View style={styles.breakdownLeft}>
                  <Bot size={16} color={Colors.primary} />
                  <Text style={styles.breakdownName}>
                    {action.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.creditsBadge}>
                  <Text style={styles.creditsBadgeText}>{credits} credits</Text>
                </View>
              </View>
            ))
          )}
        </GlassCard>

        {/* Recent Usage Activity */}
        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>RECENT ACTIVITY LOG</Text>
        <GlassCard style={styles.logCard}>
          {usage.recent_usage_records.length === 0 ? (
            <Text style={styles.emptyText}>No recent operations logged.</Text>
          ) : (
            usage.recent_usage_records.map((item) => (
              <View key={item.id} style={styles.logRow}>
                <View style={styles.logLeft}>
                  <Clock size={14} color={Colors.textMuted} />
                  <View>
                    <Text style={styles.logAction}>
                      {item.action_type.replace(/_/g, ' ')}
                    </Text>
                    <Text style={styles.logTime}>
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                </View>
                <Text style={styles.logCost}>-{item.credits_consumed} cr</Text>
              </View>
            ))
          )}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  upgradeBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    marginBottom: 16,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D97706',
  },
  warningDesc: {
    fontSize: 11,
    color: '#B45309',
    lineHeight: 15,
    marginTop: 2,
  },
  meterCard: {
    padding: 16,
    marginBottom: 16,
    ...Shadows.card,
  },
  meterTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meterHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  meterHeaderSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  remainingPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  remainingText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLargeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 14,
  },
  statLargeNum: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  statLargeDenom: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginLeft: 6,
  },
  statLargePct: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginLeft: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  breakdownCard: {
    padding: 14,
    ...Shadows.card,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  breakdownName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  creditsBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  creditsBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  logCard: {
    padding: 14,
    ...Shadows.card,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logAction: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  logTime: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  logCost: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  emptyText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: 12,
  },
});
