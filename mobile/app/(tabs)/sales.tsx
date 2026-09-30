import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Sparkles, Filter, PhoneCall, ArrowUpRight, Search, Users } from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { RevenueCatAdBanner } from '../../src/components/RevenueCatAdBanner';
import { leadService } from '../../src/services/leadService';
import { useAuthStore } from '../../src/store/authStore';
import { Lead } from '../../src/types';

export default function SalesScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stageFilter, setStageFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadLeads = async () => {
    if (!currentBusiness?.id) return;
    try {
      const list = await leadService.listLeads(
        currentBusiness.id,
        stageFilter === 'all' ? undefined : stageFilter,
        priorityFilter === 'all' ? undefined : priorityFilter,
        search || undefined
      );
      setLeads(list);
    } catch (err) {
      console.warn('Error loading leads:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [currentBusiness?.id, stageFilter, priorityFilter, search]);

  const onRefresh = () => {
    setRefreshing(true);
    loadLeads();
  };

  const totalPipeline = leads.reduce((sum, l) => sum + Number(l.value || 0), 0);

  const getPriorityBadge = (priority: string = 'medium') => {
    const p = priority.toUpperCase();
    switch (p) {
      case 'HIGH':
        return { bg: Colors.dangerBg, text: Colors.danger };
      case 'LOW':
        return { bg: Colors.infoBg, text: Colors.info };
      default:
        return { bg: Colors.warningBg, text: Colors.warning };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Sales Pipeline</Text>
          <Text style={styles.subtitle}>
            ₹{totalPipeline.toLocaleString('en-IN')} active pipeline value
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.customersBtn}
            onPress={() => router.push('/customers')}
            activeOpacity={0.75}
          >
            <Users size={15} color={Colors.primaryDark} />
            <Text style={styles.customersBtnText}>CRM</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.84}
            onPress={() => router.push('/leads/create')}
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
        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search deals, contacts..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Stage Tabs Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stageTabsScroll}
        >
          {['all', 'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won'].map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.stageTab, stageFilter === s && styles.stageTabActive]}
              onPress={() => setStageFilter(s)}
            >
              <Text style={[styles.stageTabText, stageFilter === s && styles.stageTabTextActive]}>
                {s.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sales AI Agent Banner */}
        <GlassCard variant="elevated" style={styles.aiSalesCard}>
          <View style={styles.aiSalesHeader}>
            <View style={styles.aiBadge}>
              <Sparkles size={14} color={Colors.primary} />
              <Text style={styles.aiBadgeText}>AI SALES AGENT</Text>
            </View>
          </View>
          <Text style={styles.aiSalesTitle}>
            {leads.length} active opportunities tracked in Supabase.
          </Text>
          <Text style={styles.aiSalesSub}>
            Follow up with highest-probability deals to accelerate conversion.
          </Text>
        </GlassCard>

        {/* RevenueCat Power-Up Ad */}
        <RevenueCatAdBanner variant="sales" style={{ marginHorizontal: 20, marginBottom: 16 }} />

        {/* Deals List */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>Active Deals ({leads.length})</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : leads.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Deals in this Stage</Text>
            <Text style={styles.emptySub}>Add a new lead to start pipeline tracking.</Text>
          </GlassCard>
        ) : (
          leads.map((lead) => {
            const badge = getPriorityBadge(lead.priority);
            return (
              <TouchableOpacity
                key={lead.id}
                activeOpacity={0.8}
                onPress={() => router.push(`/leads/${lead.id}` as any)}
              >
                <GlassCard style={styles.leadCard}>
                  <View style={styles.leadTopRow}>
                    <View style={styles.leadMainInfo}>
                      <Text style={styles.leadName}>{lead.title}</Text>
                      <View style={styles.stageTag}>
                        <Text style={styles.stageText}>{lead.status.toUpperCase()}</Text>
                      </View>
                    </View>
                    <Text style={styles.dealValue}>
                      ₹{Number(lead.value || 0).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  <View style={styles.leadBottomRow}>
                    <View style={[styles.priorityBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.priorityText, { color: badge.text }]}>
                        {(lead.priority || 'MEDIUM').toUpperCase()} PRIORITY
                      </Text>
                    </View>

                    <Text style={styles.companySub}>
                      {(lead as any).company || lead.contact_name || 'Direct Lead'}
                    </Text>
                  </View>

                  <View style={styles.actionRow}>
                    <GlassButton
                      title="View Deal"
                      variant="glass"
                      size="sm"
                      icon={<ArrowUpRight size={12} color={Colors.primary} />}
                      onPress={() => router.push(`/leads/${lead.id}` as any)}
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
    gap: 10,
  },
  customersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  customersBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
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
    paddingBottom: 140,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Manrope_500Medium',
    color: Colors.text,
  },
  stageTabsScroll: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  stageTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stageTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stageTabText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: Colors.textSecondary,
  },
  stageTabTextActive: {
    color: '#FFFFFF',
  },
  aiSalesCard: {
    marginVertical: 10,
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
    fontFamily: 'Manrope_800ExtraBold',
    color: Colors.primary,
  },
  aiSalesTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  aiSalesSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: 'Manrope_400Regular',
    lineHeight: 18,
  },
  listHeaderRow: {
    marginTop: 10,
    marginBottom: 10,
  },
  listHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: Colors.text,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
  },
  leadCard: {
    marginBottom: 10,
  },
  leadTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  leadMainInfo: {
    flex: 1,
    marginRight: 8,
  },
  leadName: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: Colors.text,
    marginBottom: 4,
  },
  stageTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  stageText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: Colors.primary,
  },
  dealValue: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: Colors.text,
  },
  leadBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
  },
  companySub: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: 'Manrope_500Medium',
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
    fontFamily: 'Manrope_800ExtraBold',
    color: Colors.text,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: 'Manrope_400Regular',
  },
});
