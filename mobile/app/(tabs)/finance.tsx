import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, AlertCircle, CheckCircle, FileText, Send } from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { StatCard } from '../../src/components/StatCard';

interface OverdueInvoice {
  id: string;
  client: string;
  amount: string;
  dueDate: string;
  daysLate: number;
}

export default function FinanceScreen() {
  const [overdueInvoices] = useState<OverdueInvoice[]>([
    {
      id: 'INV-001',
      client: 'Acme Interiors',
      amount: '₹18,000',
      dueDate: '10 days ago',
      daysLate: 10,
    },
    {
      id: 'INV-002',
      client: 'XYZ Studio',
      amount: '₹8,500',
      dueDate: '5 days ago',
      daysLate: 5,
    },
    {
      id: 'INV-003',
      client: 'Rahul Designs',
      amount: '₹4,700',
      dueDate: '3 days ago',
      daysLate: 3,
    },
  ]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Finance</Text>
          <Text style={styles.subtitle}>Cash flow, revenue & collections</Text>
        </View>
        <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Finance KPIs */}
        <View style={styles.kpiRow}>
          <StatCard
            title="Revenue"
            value="₹184,500"
            subtitle="Collected this month"
            variant="revenue"
            changePercent={18.4}
          />
          <StatCard
            title="Outstanding"
            value="₹31,200"
            subtitle="3 unpaid invoices"
            variant="warning"
          />
        </View>

        {/* Overdue Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.warningTitleRow}>
            <AlertCircle size={16} color={Colors.warning} />
            <Text style={styles.sectionTitle}>Overdue Invoices (₹31,200)</Text>
          </View>
        </View>

        {overdueInvoices.map((inv) => (
          <GlassCard key={inv.id} style={styles.invoiceCard}>
            <View style={styles.invTopRow}>
              <View>
                <Text style={styles.invClient}>{inv.client}</Text>
                <Text style={styles.invNumber}>{inv.id}</Text>
              </View>
              <Text style={styles.invAmount}>{inv.amount}</Text>
            </View>

            <View style={styles.invMiddleRow}>
              <View style={styles.lateBadge}>
                <Text style={styles.lateText}>OVERDUE BY {inv.daysLate} DAYS</Text>
              </View>
              <Text style={styles.dueDateText}>Due {inv.dueDate}</Text>
            </View>

            <View style={styles.actionRow}>
              <GlassButton
                title="Send Reminder"
                variant="primary"
                size="sm"
                icon={<Send size={12} color="#FFFFFF" />}
                style={{ flex: 1 }}
              />
              <GlassButton
                title="View PDF"
                variant="secondary"
                size="sm"
                icon={<FileText size={12} color={Colors.text} />}
                style={{ flex: 1 }}
              />
            </View>
          </GlassCard>
        ))}

        {/* Recently Paid */}
        <View style={[styles.sectionHeaderRow, { marginTop: 16 }]}>
          <View style={styles.warningTitleRow}>
            <CheckCircle size={16} color={Colors.success} />
            <Text style={styles.sectionTitle}>Recently Paid</Text>
          </View>
        </View>

        <GlassCard style={styles.paidCard}>
          <View style={styles.invTopRow}>
            <View>
              <Text style={styles.invClient}>Zenith Logistics</Text>
              <Text style={styles.invNumber}>INV-2026-004</Text>
            </View>
            <Text style={[styles.invAmount, { color: Colors.success }]}>₹184,500</Text>
          </View>
          <Text style={styles.paidMethodText}>Paid via Bank Transfer on Sep 27</Text>
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    marginBottom: 16,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  warningTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  invoiceCard: {
    marginBottom: 12,
  },
  invTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  invClient: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  invNumber: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  invAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.danger,
  },
  invMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  lateBadge: {
    backgroundColor: Colors.dangerBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lateText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.danger,
  },
  dueDateText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paidCard: {
    marginBottom: 16,
  },
  paidMethodText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
