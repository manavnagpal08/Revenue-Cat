import React, { useState } from 'react';
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
  Mail,
  Calendar,
  Globe,
  MessageCircle,
  ChevronDown,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';

interface ActivityItem {
  id: string;
  provider: 'gmail' | 'calendar' | 'website' | 'whatsapp';
  title: string;
  description: string;
  time: string;
  status: 'Success' | 'Failed';
}

const mockActivity: ActivityItem[] = [
  {
    id: 'a1',
    provider: 'gmail',
    title: 'Email Sent',
    description: 'Email sent to Acme Interiors',
    time: '2h ago',
    status: 'Success',
  },
  {
    id: 'a2',
    provider: 'calendar',
    title: 'Meeting Created',
    description: 'Project Discussion with Rahul Designs',
    time: '4h ago',
    status: 'Success',
  },
  {
    id: 'a3',
    provider: 'website',
    title: 'New Website Lead',
    description: 'Lead from contact form - Neha Kapoor',
    time: '6h ago',
    status: 'Success',
  },
  {
    id: 'a4',
    provider: 'gmail',
    title: 'Email Sync',
    description: 'Synced 12 new emails',
    time: '1d ago',
    status: 'Success',
  },
  {
    id: 'a5',
    provider: 'whatsapp',
    title: 'WhatsApp Message',
    description: 'Message sent to Karan Mehta',
    time: '1d ago',
    status: 'Failed',
  },
  {
    id: 'a6',
    provider: 'calendar',
    title: 'Calendar Sync',
    description: 'Synced 5 new events',
    time: '1d ago',
    status: 'Success',
  },
];

export default function IntegrationActivityScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('All Providers');

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gmail':
        return (
          <View style={[styles.iconWrap, { backgroundColor: '#FEE2E2' }]}>
            <Mail size={16} color="#EA4335" />
          </View>
        );
      case 'calendar':
        return (
          <View style={[styles.iconWrap, { backgroundColor: '#DBEAFE' }]}>
            <Calendar size={16} color="#2563EB" />
          </View>
        );
      case 'website':
        return (
          <View style={[styles.iconWrap, { backgroundColor: '#E0E7FF' }]}>
            <Globe size={16} color="#4F46E5" />
          </View>
        );
      case 'whatsapp':
        return (
          <View style={[styles.iconWrap, { backgroundColor: '#ECFDF5' }]}>
            <MessageCircle size={16} color="#059669" />
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Integration Activity</Text>
            <Text style={styles.headerSubtitle}>Track all integration operations.</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.providerDropdown}>
          <Text style={styles.providerDropdownText}>{filter}</Text>
          <ChevronDown size={12} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {mockActivity.map((item) => {
          const isSuccess = item.status === 'Success';
          return (
            <View key={item.id} style={styles.activityCard}>
              {getProviderIcon(item.provider)}

              <View style={styles.cardDetails}>
                <View style={styles.topRow}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>

                <View style={styles.bottomRow}>
                  <Text style={styles.activityDesc} numberOfLines={1}>
                    {item.description}
                  </Text>
                  <View style={[styles.statusBadge, isSuccess ? styles.successBadge : styles.failedBadge]}>
                    <Text style={[styles.statusText, isSuccess ? styles.successText : styles.failedText]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
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
  providerDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  providerDropdownText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 60,
    gap: 10,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetails: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  activityDesc: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  successBadge: {
    backgroundColor: '#ECFDF5',
  },
  successText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  failedBadge: {
    backgroundColor: '#FEF2F2',
  },
  failedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
});
