import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  Crown,
  Receipt,
  CreditCard,
  Edit3,
  XCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { billingService, SubscriptionData } from '../../src/services/billingService';

export default function BillingSubscriptionScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || '00000000-0000-0000-0000-000000000002';

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSubscription = useCallback(async () => {
    try {
      const sub = await billingService.getSubscription(businessId);
      setSubscription(sub);
    } catch (e) {
      console.warn('Error loading subscription:', e);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  useFocusEffect(
    useCallback(() => {
      loadSubscription();
    }, [loadSubscription])
  );

  const getPlanDetails = (tier?: string) => {
    switch (tier) {
      case 'pro':
        return { name: 'Pro Plan', price: '$99 / month', color: '#10B981', credits: 1000, autos: 'Unlimited' };
      case 'business':
        return { name: 'Business Plan', price: '$49 / month', color: '#F59E0B', credits: 250, autos: 'Unlimited' };
      case 'starter':
        return { name: 'Starter Plan', price: '$19 / month', color: '#3B82F6', credits: 100, autos: '10 active' };
      default:
        return { name: 'Free Starter Plan', price: 'Free', color: '#64748B', credits: 10, autos: '2 active' };
    }
  };

  const planInfo = getPlanDetails(subscription?.tier);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription & Billing</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Subscription Card */}
        <View style={styles.subscriptionCard}>
          <View style={styles.planTopRow}>
            <View style={[styles.crownBox, { backgroundColor: `${planInfo.color}15` }]}>
              <Crown size={22} color={planInfo.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.planName}>{planInfo.name}</Text>
              <Text style={styles.planPrice}>{planInfo.price}</Text>
            </View>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>
                {subscription?.tier === 'free' ? 'Free Tier' : 'Active'}
              </Text>
            </View>
          </View>

          <View style={styles.perksRow}>
            <View style={styles.perkItem}>
              <Sparkles size={13} color="#059669" />
              <Text style={styles.perkText}>{planInfo.credits} AI Credits</Text>
            </View>
            <View style={styles.perkItem}>
              <Zap size={13} color="#059669" />
              <Text style={styles.perkText}>{planInfo.autos} Automations</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => router.push('/paywall')}
          >
            <Text style={styles.manageBtnText}>
              {subscription?.tier === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Options List */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => router.push('/billing/history')}
          >
            <Receipt size={18} color="#64748B" />
            <Text style={styles.menuTitle}>Billing History & Invoices</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => router.push('/paywall')}
          >
            <Edit3 size={18} color="#64748B" />
            <Text style={styles.menuTitle}>Change Plan / In-App Purchases</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                'Cancel Subscription',
                'To cancel your subscription, please manage your active subscriptions through your Apple App Store or Google Play Store settings.',
                [{ text: 'OK' }]
              )
            }
          >
            <XCircle size={18} color="#EF4444" />
            <Text style={[styles.menuTitle, { color: '#EF4444' }]}>Cancel Subscription</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Security / RevenueCat Notice */}
        <View style={styles.securityBox}>
          <ShieldCheck size={16} color="#059669" />
          <Text style={styles.securityText}>
            Billing & Entitlements securely processed via RevenueCat. 256-bit encrypted transactions.
          </Text>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  planTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  crownBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: '#0F172A',
  },
  planPrice: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#059669',
    marginTop: 2,
  },
  activePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#059669',
  },
  perksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  perkText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#334155',
  },
  manageBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageBtnText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#FFFFFF',
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  menuTitle: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#0F172A',
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  securityText: {
    flex: 1,
    fontSize: 11.5,
    color: '#64748B',
    fontFamily: 'Manrope_400Regular',
    lineHeight: 16,
  },
});
