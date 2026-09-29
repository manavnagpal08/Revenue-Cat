import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Crown,
  Sparkles,
  Zap,
  Clock,
  Receipt,
  BarChart3,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors, Shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import {
  billingService,
  SubscriptionData,
  UsageSummary,
} from '../../src/services/billingService';

export default function BillingHubScreen() {
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || '00000000-0000-0000-0000-000000000002';

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [restoring, setRestoring] = useState(false);

  const loadData = async () => {
    try {
      const [subData, usageData] = await Promise.all([
        billingService.getSubscription(businessId),
        billingService.getUsage(businessId),
      ]);
      setSubscription(subData);
      setUsage(usageData);
    } catch (e) {
      console.warn('Error loading billing hub data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [businessId]);

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const res = await billingService.restorePurchases(businessId);
      Alert.alert('Purchases Restored', res.message || 'Subscription entitlements synchronized.');
      loadData();
    } catch (e: any) {
      Alert.alert('Restore Notice', e.message || 'No active purchases found to restore.');
    } finally {
      setRestoring(false);
    }
  };

  if (loading || !subscription || !usage) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const renewalDate = subscription.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Oct 28, 2026';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Subscription &amp; Billing</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Active Plan Card */}
        <GlassCard style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={styles.planLeft}>
              <View style={styles.crownWrap}>
                <Crown size={20} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.planTierName}>
                  {subscription.tier.toUpperCase()} PLAN
                </Text>
                <Text style={styles.planStatusText}>
                  ● {subscription.status.toUpperCase()}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.changePlanBtn}
              onPress={() => router.push('/paywall' as any)}
            >
              <Text style={styles.changePlanText}>Change Plan</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.planInfoRow}>
            <View>
              <Text style={styles.infoLabel}>Next Billing Date</Text>
              <Text style={styles.infoValue}>{renewalDate}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.infoLabel}>Billing Provider</Text>
              <Text style={styles.infoValue}>RevenueCat / Apple</Text>
            </View>
          </View>
        </GlassCard>

        {/* Usage Glance Card */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>USAGE &amp; LIMITS</Text>
          <TouchableOpacity onPress={() => router.push('/billing/usage' as any)}>
            <Text style={styles.seeAllText}>View Details &gt;</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push('/billing/usage' as any)}
        >
          <GlassCard style={styles.usageCard}>
            {/* AI Credits Meter */}
            <View style={styles.meterHeader}>
              <View style={styles.meterTitleRow}>
                <Sparkles size={14} color={Colors.primary} />
                <Text style={styles.meterTitle}>AI Credits</Text>
              </View>
              <Text style={styles.meterCount}>
                {usage.ai_credits_used} / {usage.ai_credits_total} used
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, usage.ai_credits_percent)}%` },
                ]}
              />
            </View>

            {/* Automations Meter */}
            <View style={[styles.meterHeader, { marginTop: 14 }]}>
              <View style={styles.meterTitleRow}>
                <Zap size={14} color="#059669" />
                <Text style={styles.meterTitle}>Active Automations</Text>
              </View>
              <Text style={styles.meterCount}>
                {usage.automations_active} / {usage.automations_limit} active
              </Text>
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
        </TouchableOpacity>

        {/* Quick Navigation Rows */}
        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>BILLING MANAGEMENT</Text>

        <GlassCard style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={() => router.push('/billing/history' as any)}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#EEF2FF' }]}>
                <Receipt size={16} color="#4F46E5" />
              </View>
              <View>
                <Text style={styles.menuTitle}>Invoices &amp; Receipts</Text>
                <Text style={styles.menuSub}>View billing history and payment records</Text>
              </View>
            </View>
            <ChevronRight size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            activeOpacity={0.7}
            onPress={handleRestore}
            disabled={restoring}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#ECFDF5' }]}>
                <ShieldCheck size={16} color="#10B981" />
              </View>
              <View>
                <Text style={styles.menuTitle}>Restore Purchases</Text>
                <Text style={styles.menuSub}>Sync entitlements from App Store</Text>
              </View>
            </View>
            {restoring ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <ChevronRight size={16} color={Colors.textMuted} />
            )}
          </TouchableOpacity>
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
  planCard: {
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    marginBottom: 20,
    ...Shadows.glass,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  crownWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planTierName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  planStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  changePlanBtn: {
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  changePlanText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  planInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  usageCard: {
    padding: 16,
    ...Shadows.card,
  },
  meterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  meterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  meterCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  menuGroup: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginTop: 8,
    ...Shadows.card,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  menuSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
});
