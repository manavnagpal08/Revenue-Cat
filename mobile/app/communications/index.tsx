import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, SlidersHorizontal, Mail, MessageSquare, Send, ArrowLeft, Plus } from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/authStore';

interface ConversationItem {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  channel: 'Email' | 'WhatsApp';
  subject: string;
  preview: string;
  time: string;
  unreadCount?: number;
  needsReply?: boolean;
}

const AVATAR_COLORS = ['#E0E7FF', '#FEE2E2', '#EDE9FE', '#FCE7F3', '#FEF3C7', '#DCFCE7', '#E0F2FE'];

export default function CommunicationsInboxScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState<'all' | 'email' | 'whatsapp' | 'needs_reply'>('all');
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      if (!currentBusiness?.id) {
        setConversations([]);
        return;
      }
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (customers && customers.length > 0) {
        const mapped: ConversationItem[] = customers.map((c: any, index: number) => {
          const initials = (c.name || 'C')
            .split(' ')
            .map((p: string) => p[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
          const channel: 'Email' | 'WhatsApp' = c.phone ? 'WhatsApp' : 'Email';
          const bg = AVATAR_COLORS[index % AVATAR_COLORS.length];
          return {
            id: c.id,
            name: c.name || c.company_name || 'Client Contact',
            initials: initials || 'CL',
            avatarBg: bg,
            channel,
            subject: c.company_name ? `Project: ${c.company_name}` : 'Discussion & Inquiries',
            preview: c.notes || c.email || 'Ready to discuss next project milestone...',
            time: c.updated_at ? new Date(c.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent',
            unreadCount: 0,
            needsReply: false,
          };
        });
        setConversations(mapped);
      } else {
        setConversations([]);
      }
    } catch (e) {
      console.warn('Error fetching communications:', e);
      setConversations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentBusiness?.id]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const filtered = conversations.filter((c) => {
    if (activeFilter === 'email') return c.channel === 'Email';
    if (activeFilter === 'whatsapp') return c.channel === 'WhatsApp';
    if (activeFilter === 'needs_reply') return c.needsReply;
    return true;
  }).filter((c) => {
    if (!search) return true;
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase())
    );
  });

  const emailCount = conversations.filter((c) => c.channel === 'Email').length;
  const whatsappCount = conversations.filter((c) => c.channel === 'WhatsApp').length;
  const needsReplyCount = conversations.filter((c) => c.needsReply).length;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Communications</Text>
            <Text style={styles.headerSubtitle}>All your customer conversations in one place.</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.composeBtn}
          onPress={() => router.push('/communications/compose')}
        >
          <Send size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'all' && styles.filterChipActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'all' && styles.filterChipTextActive]}>
              All ({conversations.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'email' && styles.filterChipActive]}
            onPress={() => setActiveFilter('email')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'email' && styles.filterChipTextActive]}>
              Email ({emailCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'whatsapp' && styles.filterChipActive]}
            onPress={() => setActiveFilter('whatsapp')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'whatsapp' && styles.filterChipTextActive]}>
              WhatsApp ({whatsappCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'needs_reply' && styles.filterChipActive]}
            onPress={() => setActiveFilter('needs_reply')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'needs_reply' && styles.filterChipTextActive]}>
              Needs Reply ({needsReplyCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Conversations List */}
      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
          }
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <MessageSquare size={36} color="#059669" />
              </View>
              <Text style={styles.emptyTitle}>No Conversations Found</Text>
              <Text style={styles.emptySubtitle}>
                {search
                  ? 'No contacts matched your search query.'
                  : 'Start reaching out or add new clients to your pipeline.'}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => router.push('/customers/create')}
              >
                <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyActionBtnText}>Add Customer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filtered.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.conversationCard}
                activeOpacity={0.7}
                onPress={() => router.push(`/communications/${item.id}` as any)}
              >
                <View style={[styles.avatarCircle, { backgroundColor: item.avatarBg }]}>
                  <Text style={styles.avatarText}>{item.initials}</Text>
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.nameBadgeRow}>
                      <Text style={styles.customerName}>{item.name}</Text>
                      <View
                        style={[
                          styles.channelBadge,
                          item.channel === 'Email' ? styles.emailBadge : styles.whatsappBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.channelBadgeText,
                            item.channel === 'Email'
                              ? styles.emailBadgeText
                              : styles.whatsappBadgeText,
                          ]}
                        >
                          {item.channel}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.timeBadgeRow}>
                      <Text style={styles.timeText}>{item.time}</Text>
                      {item.unreadCount ? (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>

                  <Text style={styles.subjectText} numberOfLines={1}>
                    {item.subject}
                  </Text>
                  <Text style={styles.previewText} numberOfLines={1}>
                    {item.preview}
                  </Text>
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
    paddingBottom: 8,
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
    backgroundColor: '#FFFFFF',
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
    marginTop: 2,
  },
  composeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersWrapper: {
    marginTop: 10,
    marginBottom: 12,
  },
  filtersScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 10,
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
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  channelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  channelBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emailBadge: {
    backgroundColor: '#EFF6FF',
  },
  emailBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },
  whatsappBadge: {
    backgroundColor: '#F0FDF4',
  },
  whatsappBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16A34A',
  },
  timeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  unreadBadge: {
    backgroundColor: '#059669',
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subjectText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 2,
  },
  previewText: {
    fontSize: 12,
    color: '#64748B',
  },
});
