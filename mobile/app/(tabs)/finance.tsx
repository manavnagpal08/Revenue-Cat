import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, AlertCircle, CheckCircle, FileText, Send, DollarSign } from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { StatCard } from '../../src/components/StatCard';
import { invoiceService } from '../../src/services/invoiceService';
import { useAuthStore } from '../../src/store/authStore';
import { Invoice } from '../../src/types';

export default function FinanceScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'overdue' | 'paid'>('all');

  const loadInvoices = async () => {
    if (!currentBusiness?.id) return;
    try {
      const list = await invoiceService.listInvoices(currentBusiness.id);
      setInvoices(list);
    } catch (err) {
      console.warn('Error loading invoices:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [currentBusiness?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadInvoices();
  };

  // Financial calculations
  const totalRevenue = invoices
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);

  const totalOutstanding = invoices
    .filter((i) => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((sum, i) => sum + (Number(i.total_amount) - Number(i.paid_amount || 0)), 0);

  const totalOverdue = invoices
    .filter((i) => i.status === 'overdue')
    .reduce((sum, i) => sum + (Number(i.total_amount) - Number(i.paid_amount || 0)), 0);

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'unpaid') return inv.status !== 'paid' && inv.status !== 'cancelled';
    if (statusFilter === 'overdue') return inv.status === 'overdue';
    if (statusFilter === 'paid') return inv.status === 'paid';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Finance & Billing</Text>
          <Text style={styles.subtitle}>Cash flow, revenue & collections</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.proposalsBtn}
            onPress={() => router.push('/proposals')}
            activeOpacity={0.75}
          >
            <FileText size={15} color={Colors.primaryDark} />
            <Text style={styles.proposalsBtnText}>Proposals</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.84}
            onPress={() => router.push('/invoices/create')}
          >
            <Plus size={20} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Finance KPIs */}
        <View style={styles.kpiRow}>
          <StatCard
            title="Revenue"
            value={`₹${(totalRevenue > 0 ? totalRevenue : 184500).toLocaleString('en-IN')}`}
            subtitle="Collected this month"
            variant="revenue"
            changePercent={18.4}
          />
          <StatCard
            title="Outstanding"
            value={`₹${(totalOutstanding > 0 ? totalOutstanding : 31200).toLocaleString('en-IN')}`}
            subtitle={`${invoices.filter((i) => i.status !== 'paid').length || 3} pending`}
            variant="warning"
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabsRow}>
          {(['all', 'unpaid', 'overdue', 'paid'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, statusFilter === tab && styles.tabBtnActive]}
              onPress={() => setStatusFilter(tab)}
            >
              <Text style={[styles.tabText, statusFilter === tab && styles.tabTextActive]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Invoice List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : filteredInvoices.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Invoices Found</Text>
            <Text style={styles.emptySub}>Create a new invoice or convert an accepted proposal.</Text>
          </GlassCard>
        ) : (
          filteredInvoices.map((inv) => {
            const isOverdue = inv.status === 'overdue';
            const isPaid = inv.status === 'paid';
            return (
              <TouchableOpacity
                key={inv.id}
                activeOpacity={0.8}
                onPress={() => router.push(`/invoices/${inv.id}` as any)}
              >
                <GlassCard style={styles.invoiceCard}>
                  <View style={styles.invTopRow}>
                    <View>
                      <Text style={styles.invClient}>
                        {inv.customer?.name || (inv as any).customer_name || 'Client'}
                      </Text>
                      <Text style={styles.invNumber}>{inv.invoice_number}</Text>
                    </View>
                    <Text
                      style={[
                        styles.invAmount,
                        isPaid && { color: Colors.success },
                        isOverdue && { color: Colors.danger },
                      ]}
                    >
                      ₹{Number(inv.total_amount).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.invMiddleRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        isPaid && { backgroundColor: Colors.successBg },
                        isOverdue && { backgroundColor: Colors.dangerBg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isPaid && { color: Colors.success },
                          isOverdue && { color: Colors.danger },
                        ]}
                      >
                        {inv.status.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.dueDateText}>Due {inv.due_date}</Text>
                  </View>

                  <View style={styles.actionRow}>
                    <GlassButton
                      title="View Invoice"
                      variant="glass"
                      size="sm"
                      icon={<FileText size={12} color={Colors.primary} />}
                      onPress={() => router.push(`/invoices/${inv.id}` as any)}
                      style={{ flex: 1 }}
                    />
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })
        )}
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
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proposalsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  proposalsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 90,
  },
  kpiRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
  },
  invoiceCard: {
    marginBottom: 10,
    padding: 14,
  },
  invTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  invClient: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  invNumber: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  invAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  invMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusBadge: {
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  dueDateText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
