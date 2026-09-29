import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Search, FileText, ArrowLeft, CheckCircle, Clock, Send } from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { proposalService } from '../../src/services/proposalService';
import { useAuthStore } from '../../src/store/authStore';
import { Proposal } from '../../src/types';

export default function ProposalsListScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'accepted'>('all');

  const loadProposals = async () => {
    if (!currentBusiness?.id) return;
    try {
      const list = await proposalService.listProposals(
        currentBusiness.id,
        statusFilter === 'all' ? undefined : statusFilter,
        search.trim() || undefined
      );
      setProposals(list);
    } catch (err) {
      console.warn('Error loading proposals:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, [currentBusiness?.id, statusFilter, search]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProposals();
  };

  const totalPipelineValue = proposals.reduce((sum, p) => sum + Number(p.total_value || 0), 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Proposals & Quotes</Text>
            <Text style={styles.subtitle}>Pitch, scope & convert to invoices</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.8}
          onPress={() => router.push('/proposals/create')}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Pipeline Value Banner */}
        <GlassCard variant="elevated" style={styles.bannerCard}>
          <Text style={styles.bannerLabel}>TOTAL PROPOSAL VALUE</Text>
          <Text style={styles.bannerValue}>₹{totalPipelineValue.toLocaleString('en-IN')}</Text>
          <Text style={styles.bannerSub}>{proposals.length} proposals created</Text>
        </GlassCard>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search proposals..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabsRow}>
          {(['all', 'draft', 'sent', 'accepted'] as const).map((tab) => (
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

        {/* Proposal Cards List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : proposals.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Proposals Found</Text>
            <Text style={styles.emptySub}>
              Create your first proposal to scope projects and close high-ticket clients.
            </Text>
            <GlassButton
              title="Create Proposal"
              variant="primary"
              size="sm"
              onPress={() => router.push('/proposals/create')}
              style={{ marginTop: 14 }}
            />
          </GlassCard>
        ) : (
          proposals.map((prop) => {
            const isAccepted = prop.status === 'accepted';
            const isSent = prop.status === 'sent';
            return (
              <TouchableOpacity
                key={prop.id}
                activeOpacity={0.8}
                onPress={() => router.push(`/proposals/${prop.id}` as any)}
              >
                <GlassCard style={styles.propCard}>
                  <View style={styles.propTopRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.propTitle} numberOfLines={1}>
                        {prop.title}
                      </Text>
                      <Text style={styles.propCustomer}>
                        {prop.customer?.name || 'Prospective Client'}
                      </Text>
                    </View>
                    <Text style={styles.propAmount}>
                      ₹{Number(prop.total_value).toLocaleString('en-IN')}
                    </Text>
                  </View>

                  {prop.project_overview ? (
                    <Text style={styles.propOverview} numberOfLines={2}>
                      {prop.project_overview}
                    </Text>
                  ) : null}

                  <View style={styles.propBottomRow}>
                    <View
                      style={[
                        styles.statusBadge,
                        isAccepted && { backgroundColor: Colors.successBg },
                        isSent && { backgroundColor: Colors.primarySubtle },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isAccepted && { color: Colors.success },
                          isSent && { color: Colors.primary },
                        ]}
                      >
                        {prop.status.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.dateMeta}>
                      {prop.deliverables?.length || 0} Deliverables
                    </Text>
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
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  bannerCard: {
    padding: 18,
    marginBottom: 16,
    alignItems: 'center',
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  bannerValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 4,
  },
  bannerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text,
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
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  propCard: {
    padding: 16,
    marginBottom: 10,
  },
  propTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  propTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  propCustomer: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  propAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text,
  },
  propOverview: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  propBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  dateMeta: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
