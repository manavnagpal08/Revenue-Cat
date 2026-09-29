import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  Globe,
  ChevronRight,
  Phone,
  Mail,
  Plus,
  Inbox,
} from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/authStore';

interface WebsiteLeadItem {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  time: string;
  source: string;
  status: string;
  message: string;
  phone?: string;
  email?: string;
}

const BG_COLORS = ['#FCE7F3', '#EDE9FE', '#FEE2E2', '#DBEAFE', '#ECFDF5', '#FEF3C7'];

export default function WebsiteLeadsScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'qualified' | 'won'>('all');
  const [leads, setLeads] = useState<WebsiteLeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      if (!currentBusiness?.id) {
        setLeads([]);
        return;
      }

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: WebsiteLeadItem[] = data.map((l: any, idx: number) => {
          const contactName = l.contact_name || l.title || 'Inbound Prospect';
          const initials = contactName.slice(0, 2).toUpperCase();
          return {
            id: l.id,
            name: contactName,
            initials: initials || 'LE',
            avatarBg: BG_COLORS[idx % BG_COLORS.length],
            time: l.created_at
              ? new Date(l.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })
              : 'Recent',
            source: l.source ? `${l.source.toUpperCase()} FORM` : 'WEBSITE FORM',
            status: l.status || 'new',
            message: l.notes || l.company || 'Inquiry received via web form submission.',
            phone: l.phone,
            email: l.email,
          };
        });
        setLeads(mapped);
      } else {
        setLeads([]);
      }
    } catch (err) {
      console.warn('Error fetching website leads:', err);
      setLeads([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentBusiness?.id]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeads();
  };

  const newCount = leads.filter((l) => l.status === 'new').length;
  const qualifiedCount = leads.filter((l) => l.status === 'qualified' || l.status === 'proposal').length;
  const convertedCount = leads.filter((l) => l.status === 'won' || l.status === 'converted').length;

  const filtered = leads.filter((l) => {
    if (activeTab === 'new') return l.status === 'new';
    if (activeTab === 'qualified') return l.status === 'qualified' || l.status === 'proposal';
    if (activeTab === 'won') return l.status === 'won' || l.status === 'converted';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Inbound Leads</Text>
            <Text style={styles.headerSubtitle}>Leads captured from your website and forms.</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/leads/create')}
        >
          <Plus size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsWrapper}>
        <TouchableOpacity
          style={[styles.filterTab, activeTab === 'all' && styles.filterTabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.filterTabText, activeTab === 'all' && styles.filterTabTextActive]}>
            All ({leads.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeTab === 'new' && styles.filterTabActive]}
          onPress={() => setActiveTab('new')}
        >
          <Text style={[styles.filterTabText, activeTab === 'new' && styles.filterTabTextActive]}>
            New ({newCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeTab === 'qualified' && styles.filterTabActive]}
          onPress={() => setActiveTab('qualified')}
        >
          <Text
            style={[
              styles.filterTabText,
              activeTab === 'qualified' && styles.filterTabTextActive,
            ]}
          >
            Qualified ({qualifiedCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeTab === 'won' && styles.filterTabActive]}
          onPress={() => setActiveTab('won')}
        >
          <Text style={[styles.filterTabText, activeTab === 'won' && styles.filterTabTextActive]}>
            Won ({convertedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
          }
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Globe size={36} color="#059669" />
              </View>
              <Text style={styles.emptyTitle}>No Inbound Leads Found</Text>
              <Text style={styles.emptySubtitle}>
                Forms filled on your website and webhook endpoints will funnel new inquiries right here.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => router.push('/leads/create')}
              >
                <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyActionBtnText}>Create Inbound Lead</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filtered.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.leadCard}
                activeOpacity={0.75}
                onPress={() => router.push(`/leads/${item.id}` as any)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.avatarCircle, { backgroundColor: item.avatarBg }]}>
                    <Text style={styles.avatarText}>{item.initials}</Text>
                  </View>
                  <View style={styles.leadInfo}>
                    <Text style={styles.leadName}>{item.name}</Text>
                    <Text style={styles.leadSource}>{item.source} • {item.time}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      item.status === 'won' || item.status === 'converted'
                        ? styles.statusPillWon
                        : styles.statusPillNew,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        item.status === 'won' || item.status === 'converted'
                          ? styles.statusPillTextWon
                          : styles.statusPillTextNew,
                      ]}
                    >
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.leadMessage} numberOfLines={2}>
                  {item.message}
                </Text>

                <View style={styles.cardFooter}>
                  {item.email ? (
                    <View style={styles.contactItem}>
                      <Mail size={12} color="#64748B" />
                      <Text style={styles.contactText}>{item.email}</Text>
                    </View>
                  ) : null}
                  {item.phone ? (
                    <View style={styles.contactItem}>
                      <Phone size={12} color="#64748B" />
                      <Text style={styles.contactText}>{item.phone}</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabsWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  filterTabActive: {
    backgroundColor: '#059669',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  leadCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  leadInfo: {
    flex: 1,
  },
  leadName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  leadSource: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusPillNew: {
    backgroundColor: '#ECFDF5',
  },
  statusPillTextNew: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  statusPillWon: {
    backgroundColor: '#EFF6FF',
  },
  statusPillTextWon: {
    color: '#2563EB',
    fontSize: 10,
    fontWeight: '700',
  },
  leadMessage: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactText: {
    fontSize: 11,
    color: '#64748B',
  },
});
