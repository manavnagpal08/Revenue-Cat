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
import {
  ArrowLeft,
  Search,
  Globe,
  ChevronRight,
  Phone,
  Mail,
} from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';

interface WebsiteLeadItem {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  time: string;
  source: string;
  status: 'New' | 'Qualified' | 'Converted';
  message: string;
}

const mockWebsiteLeads: WebsiteLeadItem[] = [
  {
    id: 'wl-1',
    name: 'Neha Kapoor',
    initials: 'NK',
    avatarBg: '#FCE7F3',
    time: '2h ago',
    source: 'Website Form',
    status: 'New',
    message: 'Hi, I am interested in interior design services for my new office space...',
  },
  {
    id: 'wl-2',
    name: 'Vikram Reddy',
    initials: 'VR',
    avatarBg: '#EDE9FE',
    time: '5h ago',
    source: 'Contact Form',
    status: 'New',
    message: 'Looking for a quote for commercial interior design. Please get back to me.',
  },
  {
    id: 'wl-3',
    name: 'Simran Kaur',
    initials: 'SK',
    avatarBg: '#FEE2E2',
    time: '1d ago',
    source: 'Website Form',
    status: 'Qualified',
    message: 'Need home interior design for 3BHK apartment. Budget around 15-20 lakhs.',
  },
  {
    id: 'wl-4',
    name: 'Arjun Patel',
    initials: 'AP',
    avatarBg: '#DBEAFE',
    time: '2d ago',
    source: 'Contact Form',
    status: 'New',
    message: 'Interested in kitchen renovation services. Please share your portfolio.',
  },
];

export default function WebsiteLeadsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'New' | 'Qualified' | 'Converted'>('New');

  const filtered = mockWebsiteLeads.filter((l) => {
    if (activeTab === 'New') return l.status === 'New';
    if (activeTab === 'Qualified') return l.status === 'Qualified';
    if (activeTab === 'Converted') return l.status === 'Converted';
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
            <Text style={styles.headerTitle}>Website Leads</Text>
            <Text style={styles.headerSubtitle}>Leads captured from your website and forms.</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.searchIconBtn}>
          <Search size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsWrapper}>
        <TouchableOpacity
          style={[styles.filterTab, activeTab === 'New' && styles.filterTabActive]}
          onPress={() => setActiveTab('New')}
        >
          <Text style={[styles.filterTabText, activeTab === 'New' && styles.filterTabTextActive]}>
            New (5)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeTab === 'Qualified' && styles.filterTabActive]}
          onPress={() => setActiveTab('Qualified')}
        >
          <Text style={[styles.filterTabText, activeTab === 'Qualified' && styles.filterTabTextActive]}>
            Qualified (12)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, activeTab === 'Converted' && styles.filterTabActive]}
          onPress={() => setActiveTab('Converted')}
        >
          <Text style={[styles.filterTabText, activeTab === 'Converted' && styles.filterTabTextActive]}>
            Converted (8)
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filtered.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.leadCard}
            activeOpacity={0.75}
            onPress={() => router.push(`/leads/${item.id}`)}
          >
            <View style={[styles.avatarBox, { backgroundColor: item.avatarBg }]}>
              <Text style={styles.avatarText}>{item.initials}</Text>
            </View>

            <View style={styles.leadDetails}>
              <View style={styles.leadTopRow}>
                <Text style={styles.leadName}>{item.name}</Text>
                <Text style={styles.leadTime}>{item.time}</Text>
              </View>

              <View style={styles.leadSubRow}>
                <View style={styles.sourceTag}>
                  <Globe size={11} color="#64748B" />
                  <Text style={styles.sourceText}>{item.source}</Text>
                </View>

                <View
                  style={[
                    styles.statusPill,
                    item.status === 'New' ? styles.statusNew : styles.statusQualified,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      item.status === 'New' ? styles.statusNewText : styles.statusQualifiedText,
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.leadMessage} numberOfLines={2}>
                {item.message}
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
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  searchIconBtn: {
    padding: 6,
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
    paddingHorizontal: 14,
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
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 60,
    gap: 10,
  },
  leadCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  leadDetails: {
    flex: 1,
  },
  leadTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  leadName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  leadTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  leadSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusNew: {
    backgroundColor: '#ECFDF5',
  },
  statusNewText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  statusQualified: {
    backgroundColor: '#EFF6FF',
  },
  statusQualifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  leadMessage: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
});
