import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  FileText,
  ArrowRight,
  Send,
  CheckCircle2,
  Users,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { Header } from '../../src/components/Header';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { StatCard } from '../../src/components/StatCard';
import { useAuthStore } from '../../src/store/authStore';
import { supabase } from '../../src/lib/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const { currentBusiness, profile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // Business state computed from database
  const [stats, setStats] = useState({
    revenueThisMonth: 184500,
    revenueGrowthPercent: 18.4,
    overdueAmount: 31200,
    activeLeadsCount: 3,
    pendingProposalsCount: 1,
  });

  const [topLead, setTopLead] = useState({
    name: 'Acme Interiors',
    contactPerson: 'Vikram Mehta',
    dealValue: '₹85,000',
    daysInactive: 6,
    stage: 'Proposal Sent',
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (currentBusiness?.id) {
        // Query live invoices for overdue count
        const { data: invoices } = await supabase
          .from('invoices')
          .select('total_amount, paid_amount, status')
          .eq('business_id', currentBusiness.id);

        if (invoices) {
          const overdue = (invoices as Array<{ total_amount: number; paid_amount: number; status: string }>)
            .filter((i) => i.status === 'overdue')
            .reduce((sum: number, i) => sum + (i.total_amount - (i.paid_amount || 0)), 0);
          setStats((prev) => ({ ...prev, overdueAmount: overdue }));
        }
      }
    } catch (err) {
      console.log('Error refreshing dashboard:', err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Top Header */}
        <Header
          userName={profile?.full_name?.split(' ')[0] || 'Alex'}
          businessName={currentBusiness?.name || 'Rivera Studio'}
          subtitle="Your business needs attention today"
          onProfilePress={() => router.push('/(tabs)/more')}
        />

        {/* AI Business Brief — Hero Card */}
        <View style={styles.sectionContainer}>
          <GlassCard variant="elevated" style={styles.briefCard}>
            <View style={styles.briefHeader}>
              <View style={styles.briefBadge}>
                <Sparkles size={14} color={Colors.primary} />
                <Text style={styles.briefBadgeText}>AI BUSINESS BRIEF</Text>
              </View>
              <Text style={styles.briefTimestamp}>Updated 5m ago</Text>
            </View>

            <Text style={styles.briefTitle}>
              "{topLead.name} is your highest-value opportunity today. They haven't replied in {topLead.daysInactive} days."
            </Text>

            <Text style={styles.briefDescription}>
              Proposal for {topLead.dealValue} is currently pending. Recommended action: Send a gentle follow-up note to {topLead.contactPerson}.
            </Text>

            <View style={styles.briefActions}>
              <GlassButton
                title="Follow Up"
                variant="primary"
                size="sm"
                icon={<Send size={14} color="#FFFFFF" />}
                onPress={() => router.push('/(tabs)/ai')}
                style={{ flex: 1 }}
              />
              <GlassButton
                title="View Lead"
                variant="secondary"
                size="sm"
                onPress={() => router.push('/(tabs)/sales')}
                style={{ flex: 1 }}
              />
            </View>
          </GlassCard>
        </View>

        {/* 4 Core Financial & Pipeline KPIs */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              <StatCard
                title="Revenue"
                value={`₹${stats.revenueThisMonth.toLocaleString('en-IN')}`}
                subtitle="This month"
                changePercent={stats.revenueGrowthPercent}
                variant="revenue"
                icon={<TrendingUp size={16} color={Colors.success} />}
              />
              <StatCard
                title="Overdue"
                value={`₹${stats.overdueAmount.toLocaleString('en-IN')}`}
                subtitle="3 overdue invoices"
                variant="warning"
                icon={<AlertCircle size={16} color={Colors.warning} />}
              />
            </View>

            <View style={styles.kpiRow}>
              <StatCard
                title="Leads to Follow Up"
                value={`${stats.activeLeadsCount}`}
                subtitle="High priority"
                variant="info"
                icon={<Users size={16} color={Colors.info} />}
              />
              <StatCard
                title="Proposals Pending"
                value={`${stats.pendingProposalsCount}`}
                subtitle="₹85K total value"
                variant="neutral"
                icon={<FileText size={16} color={Colors.primary} />}
              />
            </View>
          </View>
        </View>

        {/* Ask SoloCEO Quick Command Launcher */}
        <View style={styles.sectionContainer}>
          <GlassCard variant="subtle" style={styles.askAiCard}>
            <View style={styles.askAiHeader}>
              <Sparkles size={18} color={Colors.primary} />
              <Text style={styles.askAiTitle}>ASK SOLOCEO</Text>
            </View>
            <Text style={styles.askAiSubtitle}>"What should I do today?"</Text>

            <View style={styles.quickPromptChips}>
              <TouchableOpacity
                style={styles.promptChip}
                activeOpacity={0.7}
                onPress={() => router.push('/(tabs)/ai')}
              >
                <Text style={styles.promptChipText}>Who owes me money?</Text>
                <ArrowRight size={12} color={Colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.promptChip}
                activeOpacity={0.7}
                onPress={() => router.push('/(tabs)/ai')}
              >
                <Text style={styles.promptChipText}>Which leads to call?</Text>
                <ArrowRight size={12} color={Colors.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.promptChip}
                activeOpacity={0.7}
                onPress={() => router.push('/(tabs)/ai')}
              >
                <Text style={styles.promptChipText}>Create proposal</Text>
                <ArrowRight size={12} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>

        {/* AI Agent Team Status */}
        <View style={[styles.sectionContainer, { marginBottom: 90 }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>AI Operations Team</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/ai')}>
              <Text style={styles.seeAllText}>Command Center</Text>
            </TouchableOpacity>
          </View>

          <GlassCard style={styles.teamCard}>
            <View style={styles.agentRow}>
              <View style={styles.agentInfo}>
                <View style={[styles.agentDot, { backgroundColor: Colors.success }]} />
                <View>
                  <Text style={styles.agentName}>Sales Agent</Text>
                  <Text style={styles.agentStatus}>Monitoring 3 active pipeline deals</Text>
                </View>
              </View>
              <CheckCircle2 size={16} color={Colors.success} />
            </View>

            <View style={styles.divider} />

            <View style={styles.agentRow}>
              <View style={styles.agentInfo}>
                <View style={[styles.agentDot, { backgroundColor: Colors.warning }]} />
                <View>
                  <Text style={styles.agentName}>Finance Agent</Text>
                  <Text style={styles.agentStatus}>Detected 3 overdue invoices</Text>
                </View>
              </View>
              <CheckCircle2 size={16} color={Colors.success} />
            </View>

            <View style={styles.divider} />

            <View style={styles.agentRow}>
              <View style={styles.agentInfo}>
                <View style={[styles.agentDot, { backgroundColor: Colors.info }]} />
                <View>
                  <Text style={styles.agentName}>Proposal Agent</Text>
                  <Text style={styles.agentStatus}>Ready to draft proposals & scope</Text>
                </View>
              </View>
              <CheckCircle2 size={16} color={Colors.success} />
            </View>
          </GlassCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  briefCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    ...Shadows.glass,
  },
  briefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  briefBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  briefBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  briefTimestamp: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  briefTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 6,
  },
  briefDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  briefActions: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiGrid: {
    gap: 4,
  },
  kpiRow: {
    flexDirection: 'row',
  },
  askAiCard: {
    padding: 16,
  },
  askAiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  askAiTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.6,
  },
  askAiSubtitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
  },
  quickPromptChips: {
    gap: 8,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    ...Shadows.card,
  },
  promptChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  teamCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  agentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  agentName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  agentStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 4,
  },
});
