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
  Receipt,
  CheckCircle2,
  Calendar,
  Download,
} from 'lucide-react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors, Shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { billingService, BillingHistoryItem } from '../../src/services/billingService';

export default function BillingHistoryScreen() {
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || '00000000-0000-0000-0000-000000000002';

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<BillingHistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, [businessId]);

  const loadHistory = async () => {
    try {
      const data = await billingService.getHistory(businessId);
      setHistory(data);
    } catch (e) {
      console.warn('Error loading history:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Invoices &amp; Receipts</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {history.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Receipt size={28} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Invoices Yet</Text>
              <Text style={styles.emptySub}>
                Your subscription invoices and payment receipts will appear here once billing cycles complete.
              </Text>
            </GlassCard>
          ) : (
            history.map((item) => (
              <GlassCard key={item.id} style={styles.invoiceCard}>
                <View style={styles.invoiceHeader}>
                  <View style={styles.invoiceLeft}>
                    <View style={styles.iconBox}>
                      <Receipt size={18} color={Colors.primary} />
                    </View>
                    <View>
                      <Text style={styles.planName}>
                        {item.plan_tier.toUpperCase()} SUBSCRIPTION
                      </Text>
                      <Text style={styles.invoiceDate}>
                        {new Date(item.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.amountWrap}>
                    <Text style={styles.amountText}>₹{item.amount}</Text>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.footerRow}>
                  <Text style={styles.periodText}>
                    Billed via {item.provider.toUpperCase()}
                  </Text>
                  <View style={styles.paidBadge}>
                    <CheckCircle2 size={13} color="#10B981" />
                    <Text style={styles.paidText}>Paid</Text>
                  </View>
                </View>
              </GlassCard>
            ))
          )}
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
    gap: 12,
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  invoiceCard: {
    padding: 16,
    ...Shadows.card,
  },
  invoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invoiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  invoiceDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  amountWrap: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  statusPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paidText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
});
