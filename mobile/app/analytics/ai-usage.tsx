import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Crown,
  Sparkles,
  TrendingUp,
  DollarSign,
  FileText,
  Plus,
} from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';

export default function AIUsageScreen() {
  const router = useRouter();

  const barData = [
    { month: 'Jan', height: 40 },
    { month: 'Feb', height: 60 },
    { month: 'Mar', height: 50 },
    { month: 'Apr', height: 75 },
    { month: 'May', height: 65 },
    { month: 'Jun', height: 90 },
  ];

  const agentBreakdown = [
    {
      id: 'supervisor',
      name: 'Supervisor Agent',
      credits: '450 credits',
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      icon: Sparkles,
    },
    {
      id: 'sales',
      name: 'Sales Agent',
      credits: '320 credits',
      color: '#10B981',
      bgColor: '#ECFDF5',
      icon: TrendingUp,
    },
    {
      id: 'finance',
      name: 'Finance Agent',
      credits: '280 credits',
      color: '#8B5CF6',
      bgColor: '#F5F3FF',
      icon: DollarSign,
    },
    {
      id: 'proposal',
      name: 'Proposal Agent',
      credits: '200 credits',
      color: '#F97316',
      bgColor: '#FFF7ED',
      icon: FileText,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Usage</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Current Plan Card */}
        <View style={styles.planCard}>
          <View>
            <Text style={styles.planLabel}>Current Plan</Text>
            <Text style={styles.planName}>Business</Text>
          </View>

          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => router.push('/paywall')}
          >
            <Plus size={13} color="#D97706" strokeWidth={2.5} />
            <Text style={styles.upgradeBtnText}>Upgrade</Text>
          </TouchableOpacity>
        </View>

        {/* Monthly Usage & Circular Gauge Card */}
        <View style={styles.usageCard}>
          <View style={styles.usageInfo}>
            <Text style={styles.usageLabel}>Monthly Usage</Text>
            <View style={styles.usageNumbersRow}>
              <Text style={styles.usageMainNumber}>1,250</Text>
              <Text style={styles.usageTotalNumber}> / 2,000</Text>
            </View>
            <Text style={styles.creditsSub}>AI Credits</Text>
          </View>

          {/* 62% Ring Badge */}
          <View style={styles.circularBadge}>
            <Text style={styles.percentNumber}>62%</Text>
          </View>
        </View>

        {/* Usage Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.barsRow}>
            {barData.map((b) => (
              <View key={b.month} style={styles.barColumn}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${b.height}%` }]} />
                </View>
                <Text style={styles.monthText}>{b.month}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Agent Breakdown List */}
        <View style={styles.agentsCard}>
          {agentBreakdown.map((agent, idx) => {
            const Icon = agent.icon;
            const isLast = idx === agentBreakdown.length - 1;
            return (
              <View key={agent.id} style={[styles.agentRow, !isLast && styles.agentRowBorder]}>
                <View style={[styles.agentIconBox, { backgroundColor: agent.bgColor }]}>
                  <Icon size={16} color={agent.color} />
                </View>
                <Text style={styles.agentName}>{agent.name}</Text>
                <Text style={styles.agentCredits}>{agent.credits}</Text>
              </View>
            );
          })}
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
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    paddingBottom: 60,
    gap: 14,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  planLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  upgradeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  usageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  usageInfo: {
    flex: 1,
  },
  usageLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  usageNumbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  usageMainNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  usageTotalNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#94A3B8',
  },
  creditsSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  circularBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
  },
  percentNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: '#059669',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
  },
  barColumn: {
    alignItems: 'center',
    gap: 8,
  },
  barTrack: {
    width: 22,
    height: 85,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#10B981',
    borderRadius: 6,
  },
  monthText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  agentsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  agentRowBorder: {
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  agentIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  agentCredits: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
});
