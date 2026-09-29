import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Sparkles, Filter, PhoneCall, ArrowUpRight } from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';

interface LeadItem {
  id: string;
  name: string;
  dealValue: string;
  stage: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  daysAgo: number;
}

export default function SalesScreen() {
  const [leads] = useState<LeadItem[]>([
    {
      id: '1',
      name: 'Acme Interiors',
      dealValue: '₹85,000',
      stage: 'Proposal',
      priority: 'HIGH',
      daysAgo: 6,
    },
    {
      id: '2',
      name: 'XYZ Studio',
      dealValue: '₹42,000',
      stage: 'Contacted',
      priority: 'MEDIUM',
      daysAgo: 3,
    },
    {
      id: '3',
      name: 'Rahul Designs',
      dealValue: '₹25,000',
      stage: 'New',
      priority: 'LOW',
      daysAgo: 8,
    },
  ]);

  const getPriorityBadge = (priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (priority) {
      case 'HIGH':
        return { bg: Colors.dangerBg, text: Colors.danger };
      case 'MEDIUM':
        return { bg: Colors.warningBg, text: Colors.warning };
      case 'LOW':
        return { bg: Colors.infoBg, text: Colors.info };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Sales Pipeline</Text>
          <Text style={styles.subtitle}>₹152,000 active pipeline value</Text>
        </View>
        <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Sales AI Agent Banner */}
        <GlassCard variant="elevated" style={styles.aiSalesCard}>
          <View style={styles.aiSalesHeader}>
            <View style={styles.aiBadge}>
              <Sparkles size={14} color={Colors.primary} />
              <Text style={styles.aiBadgeText}>AI SALES AGENT</Text>
            </View>
          </View>
          <Text style={styles.aiSalesTitle}>
            3 leads require immediate action to prevent deal slippage.
          </Text>
          <Text style={styles.aiSalesSub}>
            Acme Interiors hasn't replied to the proposal sent 6 days ago. Follow-up draft ready.
          </Text>
        </GlassCard>

        {/* Lead List */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>Active Deals ({leads.length})</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={14} color={Colors.textSecondary} />
            <Text style={styles.filterText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {leads.map((lead) => {
          const badge = getPriorityBadge(lead.priority);
          return (
            <GlassCard key={lead.id} style={styles.leadCard}>
              <View style={styles.leadTopRow}>
                <View style={styles.leadMainInfo}>
                  <Text style={styles.leadName}>{lead.name}</Text>
                  <View style={styles.stageTag}>
                    <Text style={styles.stageText}>{lead.stage}</Text>
                  </View>
                </View>
                <Text style={styles.dealValue}>{lead.dealValue}</Text>
              </View>

              <View style={styles.leadBottomRow}>
                <View style={[styles.priorityBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.priorityText, { color: badge.text }]}>
                    {lead.priority} PRIORITY
                  </Text>
                </View>

                <Text style={styles.lastActiveText}>
                  {lead.daysAgo} days without reply
                </Text>
              </View>

              <View style={styles.actionRow}>
                <GlassButton
                  title="Follow Up"
                  variant="primary"
                  size="sm"
                  icon={<PhoneCall size={12} color="#FFFFFF" />}
                  style={{ flex: 1 }}
                />
                <GlassButton
                  title="Details"
                  variant="secondary"
                  size="sm"
                  icon={<ArrowUpRight size={12} color={Colors.text} />}
                  style={{ flex: 1 }}
                />
              </View>
            </GlassCard>
          );
        })}
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
  aiSalesCard: {
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    ...Shadows.glass,
  },
  aiSalesHeader: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  aiSalesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  aiSalesSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 10,
  },
  listHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  leadCard: {
    marginBottom: 12,
  },
  leadTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  leadMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leadName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  stageTag: {
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  stageText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  dealValue: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  leadBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  lastActiveText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
