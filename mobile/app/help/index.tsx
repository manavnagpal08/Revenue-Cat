import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  BookOpen,
  TrendingUp,
  FileText,
  Sparkles,
  Layers,
  CreditCard,
  ChevronRight,
  MessageSquare,
  Compass,
} from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';

interface HelpTopic {
  id: string;
  icon: any;
  title: string;
  desc: string;
}

const topics: HelpTopic[] = [
  {
    id: 't1',
    icon: BookOpen,
    title: 'Getting Started',
    desc: 'Learn the basics of SoloCEO',
  },
  {
    id: 't2',
    icon: TrendingUp,
    title: 'Managing Leads',
    desc: 'How to manage your pipeline',
  },
  {
    id: 't3',
    icon: FileText,
    title: 'Creating Invoices',
    desc: 'Generate and send invoices',
  },
  {
    id: 't4',
    icon: Sparkles,
    title: 'Using AI Agents',
    desc: 'Automate your business operations',
  },
  {
    id: 't5',
    icon: Layers,
    title: 'Integrations',
    desc: 'Connect Gmail, Calendar and more',
  },
  {
    id: 't6',
    icon: CreditCard,
    title: 'Billing & Subscription',
    desc: 'Manage your plan and payments',
  },
];

export default function HelpAndSupportScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  const filtered = topics.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for help..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Topics List */}
        <View style={styles.topicsCard}>
          {filtered.map((item, idx) => {
            const Icon = item.icon;
            const isLast = idx === filtered.length - 1;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.topicRow, !isLast && styles.topicRowBorder]}
                activeOpacity={0.7}
                onPress={() => Alert.alert(item.title, item.desc)}
              >
                <View style={styles.iconBox}>
                  <Icon size={18} color="#059669" />
                </View>

                <View style={styles.topicInfo}>
                  <Text style={styles.topicTitle}>{item.title}</Text>
                  <Text style={styles.topicDesc}>{item.desc}</Text>
                </View>

                <ChevronRight size={18} color="#94A3B8" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom Support Actions */}
        <View style={styles.bottomButtonsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Alert.alert('Contact Support', 'Email us at support@soloceo.app for 24/7 assistance.')}
          >
            <MessageSquare size={14} color="#059669" />
            <Text style={styles.actionBtnText}>Contact Support</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => Alert.alert('Documentation Guides', 'Opening interactive documentation.')}
          >
            <Compass size={14} color="#059669" />
            <Text style={styles.actionBtnText}>View Guides</Text>
          </TouchableOpacity>
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
    paddingVertical: 16,
    paddingBottom: 60,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  topicsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  topicRowBorder: {
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  topicDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 14,
    paddingVertical: 12,
  },
  actionBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#059669',
  },
});
