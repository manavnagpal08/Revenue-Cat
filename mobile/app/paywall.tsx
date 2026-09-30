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
import { useRouter } from 'expo-router';
import { X, Crown, Check, Sparkles, Zap, ShieldCheck, RefreshCw } from 'lucide-react-native';
import { Colors, Shadows } from '../src/constants/theme';
import { GlassCard } from '../src/components/GlassCard';
import { useAuthStore } from '../src/store/authStore';
import { billingService, PlanConfig, SubscriptionData } from '../src/services/billingService';

export default function PaywallScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || '00000000-0000-0000-0000-000000000002';

  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'business' | 'pro'>('business');
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, [businessId]);

  const loadBillingData = async () => {
    try {
      const [plansData, subData] = await Promise.all([
        billingService.getPlans(),
        billingService.getSubscription(businessId),
      ]);
      setPlans(plansData.filter((p) => p.id !== 'free'));
      setSubscription(subData);
      if (subData?.tier && subData.tier !== 'free') {
        setSelectedPlan(subData.tier as any);
      }
    } catch (e) {
      console.warn('Error loading plans:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      const updated = await billingService.upgradePlan(businessId, selectedPlan);
      setSubscription(updated);
      Alert.alert(
        'Subscription Activated! 🚀',
        `Your workspace has been upgraded to the ${selectedPlan.toUpperCase()} plan. All corresponding AI credits, agent capabilities, and workflow limits have been unlocked.`,
        [{ text: 'Continue Operating', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Purchase Notice', err.message || 'Could not complete subscription upgrade.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const res = await billingService.restorePurchases(businessId);
      Alert.alert('Restore Purchases', res.message || 'Purchases restored successfully.');
      loadBillingData();
    } catch (err: any) {
      Alert.alert('Restore Failed', err.message || 'No existing active subscriptions found.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Close Button */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <X size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore} disabled={restoring}>
          {restoring ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.restoreText}>Restore</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Hero */}
          <View style={styles.heroSection}>
            <View style={styles.crownCircle}>
              <Crown size={32} color="#F59E0B" />
            </View>
            <Text style={styles.heroTitle}>Upgrade SoloCEO</Text>
            <Text style={styles.heroSub}>
              Unlock high-throughput AI credits, unlimited automated workflows, WhatsApp integrations, and dedicated agent reasoning.
            </Text>
          </View>

          {/* Plan Selector Cards */}
          <View style={styles.plansContainer}>
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const isCurrent = subscription?.tier === plan.id;

              return (
                <TouchableOpacity
                  key={plan.id}
                  activeOpacity={0.88}
                  onPress={() => setSelectedPlan(plan.id as any)}
                >
                  <GlassCard
                    style={[
                      styles.planCard,
                      isSelected && styles.planCardSelected,
                      plan.is_popular && styles.planCardPopular,
                    ]}
                  >
                    {/* Badge */}
                    {plan.is_popular ? (
                      <View style={styles.popularBadge}>
                        <Sparkles size={11} color="#FFFFFF" />
                        <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                      </View>
                    ) : isCurrent ? (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>CURRENT PLAN</Text>
                      </View>
                    ) : null}

                    <View style={styles.planHeader}>
                      <View>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planDesc}>{plan.description}</Text>
                      </View>
                      <View style={styles.priceWrap}>
                        <Text style={styles.planPrice}>₹{plan.price_monthly}</Text>
                        <Text style={styles.planPeriod}>/mo</Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Features List */}
                    <View style={styles.featuresList}>
                      {plan.features.map((feat, idx) => (
                        <View key={idx} style={styles.featureItem}>
                          <View style={styles.checkWrap}>
                            <Check size={12} color="#10B981" />
                          </View>
                          <Text style={styles.featureText}>{feat}</Text>
                        </View>
                      ))}
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Guarantee Banner */}
          <View style={styles.guaranteeRow}>
            <ShieldCheck size={18} color="#10B981" />
            <Text style={styles.guaranteeText}>
              Cancel anytime. Billed monthly with multi-tenant business data security.
            </Text>
          </View>

          {/* Upgrade CTA Button */}
          <TouchableOpacity
            style={styles.subscribeBtn}
            activeOpacity={0.88}
            onPress={handlePurchase}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Zap size={18} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.subscribeBtnText}>
                  {subscription?.tier === selectedPlan
                    ? 'Renew / Manage Plan'
                    : `Upgrade to ${selectedPlan.toUpperCase()}`}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.termsText}>
            By subscribing, you agree to SoloCEO's Terms of Service and Privacy Policy. Subscriptions renew automatically unless cancelled prior to renewal date.
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  restoreBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    ...Shadows.card,
  },
  restoreText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: Colors.primary,
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  crownCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FDE68A',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: 'Manrope_400Regular',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    paddingHorizontal: 10,
  },
  plansContainer: {
    gap: 14,
    marginTop: 14,
  },
  planCard: {
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.card,
  },
  planCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
  },
  planCardPopular: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  currentBadge: {
    position: 'absolute',
    top: -10,
    right: 14,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: Colors.text,
  },
  planDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'Manrope_400Regular',
    marginTop: 2,
    maxWidth: 180,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: Colors.text,
  },
  planPeriod: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: Colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: 'Manrope_500Medium',
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  guaranteeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: 'Manrope_400Regular',
    flex: 1,
    lineHeight: 16,
  },
  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 15,
    borderRadius: 16,
    ...Shadows.card,
  },
  subscribeBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    fontSize: 16,
  },
  termsText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'Manrope_400Regular',
    textAlign: 'center',
    lineHeight: 15,
    marginTop: 14,
  },
});
