import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, SlidersHorizontal, Mail, MessageCircle, Send, Plus, ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';

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

const mockConversations: ConversationItem[] = [
  {
    id: 'conv-1',
    name: 'Acme Interiors',
    initials: 'AI',
    avatarBg: '#E0E7FF',
    channel: 'Email',
    subject: 'Re: Updated proposal',
    preview: 'Can you send the revised proposal...',
    time: '2h ago',
    unreadCount: 3,
    needsReply: true,
  },
  {
    id: 'conv-2',
    name: 'Rahul Designs',
    initials: 'RD',
    avatarBg: '#FEE2E2',
    channel: 'WhatsApp',
    subject: 'Project Discussion',
    preview: 'Thanks for the details. Can we hop...',
    time: '4h ago',
    unreadCount: 1,
    needsReply: true,
  },
  {
    id: 'conv-3',
    name: 'Priya Sharma',
    initials: 'PS',
    avatarBg: '#EDE9FE',
    channel: 'Email',
    subject: 'Website Inquiry',
    preview: 'Hi, I am interested in your services...',
    time: '1d ago',
    unreadCount: 0,
    needsReply: false,
  },
  {
    id: 'conv-4',
    name: 'Vertex Media',
    initials: 'VM',
    avatarBg: '#FCE7F3',
    channel: 'Email',
    subject: 'Follow up on invoice',
    preview: 'Gentle reminder about invoice #INV-001...',
    time: '1d ago',
    unreadCount: 2,
    needsReply: true,
  },
  {
    id: 'conv-5',
    name: 'Karan Mehta',
    initials: 'KM',
    avatarBg: '#FEF3C7',
    channel: 'WhatsApp',
    subject: 'New Project',
    preview: 'Let us discuss the timeline and budget...',
    time: '2d ago',
    unreadCount: 0,
    needsReply: false,
  },
];

export default function CommunicationsInboxScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'all' | 'email' | 'whatsapp' | 'needs_reply'>('all');
  const [search, setSearch] = useState('');

  const filtered = mockConversations.filter((c) => {
    if (activeFilter === 'email') return c.channel === 'Email';
    if (activeFilter === 'whatsapp') return c.channel === 'WhatsApp';
    if (activeFilter === 'needs_reply') return c.needsReply;
    return true;
  }).filter((c) => {
    if (!search) return true;
    return c.name.toLowerCase().includes(search.toLowerCase()) || c.subject.toLowerCase().includes(search.toLowerCase());
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
              All (24)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'email' && styles.filterChipActive]}
            onPress={() => setActiveFilter('email')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'email' && styles.filterChipTextActive]}>
              Email (12)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'whatsapp' && styles.filterChipActive]}
            onPress={() => setActiveFilter('whatsapp')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'whatsapp' && styles.filterChipTextActive]}>
              WhatsApp (8)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeFilter === 'needs_reply' && styles.filterChipActive]}
            onPress={() => setActiveFilter('needs_reply')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'needs_reply' && styles.filterChipTextActive]}>
              Needs Reply (5)
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
        <TouchableOpacity style={styles.filterIconButton}>
          <SlidersHorizontal size={16} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Conversations List */}
      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filtered.map((item) => (
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
                  <View style={[styles.channelBadge, item.channel === 'Email' ? styles.emailBadge : styles.whatsappBadge]}>
                    <Text style={[styles.channelBadgeText, item.channel === 'Email' ? styles.emailBadgeText : styles.whatsappBadgeText]}>
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
        ))}
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
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  composeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  filtersWrapper: {
    paddingVertical: 10,
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
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  filterIconButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 10,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  channelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  channelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emailBadge: {
    backgroundColor: '#EFF6FF',
  },
  emailBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  whatsappBadge: {
    backgroundColor: '#ECFDF5',
  },
  whatsappBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  timeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  unreadBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subjectText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 2,
  },
  previewText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
