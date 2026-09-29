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
  Globe,
  AlertCircle,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
} from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';

export default function NotificationsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'All' | 'Leads' | 'Invoices' | 'Mentions'>('All');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filtersWrapper}>
        {(['All', 'Leads', 'Invoices', 'Mentions'] as const).map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Today Section */}
        <Text style={styles.sectionHeader}>Today</Text>

        <TouchableOpacity style={styles.notificationCard} activeOpacity={0.75}>
          <View style={[styles.iconWrap, { backgroundColor: '#ECFDF5' }]}>
            <Globe size={18} color="#059669" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.notifTitle}>New lead from website</Text>
            <Text style={styles.notifDesc}>ABC Technologies</Text>
          </View>
          <View style={styles.timeWrap}>
            <Text style={styles.timeText}>10:24 AM</Text>
            <View style={styles.unreadDot} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.notificationCard} activeOpacity={0.75}>
          <View style={[styles.iconWrap, { backgroundColor: '#FEE2E2' }]}>
            <AlertCircle size={18} color="#EF4444" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.notifTitle}>Invoice overdue</Text>
            <Text style={styles.notifDesc}>INV-002 is 3 days overdue</Text>
          </View>
          <View style={styles.timeWrap}>
            <Text style={styles.timeText}>9:12 AM</Text>
            <View style={styles.unreadDot} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.notificationCard} activeOpacity={0.75}>
          <View style={[styles.iconWrap, { backgroundColor: '#F3E8FF' }]}>
            <Calendar size={18} color="#9333EA" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.notifTitle}>Meeting reminder</Text>
            <Text style={styles.notifDesc}>Client call with Pixel Studio</Text>
          </View>
          <View style={styles.timeWrap}>
            <Text style={styles.timeText}>8:00 AM</Text>
          </View>
        </TouchableOpacity>

        {/* Yesterday Section */}
        <Text style={[styles.sectionHeader, { marginTop: 18 }]}>Yesterday</Text>

        <TouchableOpacity style={styles.notificationCard} activeOpacity={0.75}>
          <View style={[styles.iconWrap, { backgroundColor: '#DBEAFE' }]}>
            <FileText size={18} color="#2563EB" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.notifTitle}>Proposal viewed</Text>
            <Text style={styles.notifDesc}>XYZ Studio viewed your proposal</Text>
          </View>
          <View style={styles.timeWrap}>
            <Text style={styles.timeText}>Yesterday</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.notificationCard} activeOpacity={0.75}>
          <View style={[styles.iconWrap, { backgroundColor: '#ECFDF5' }]}>
            <DollarSign size={18} color="#059669" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.notifTitle}>Payment received</Text>
            <Text style={styles.notifDesc}>₹45,000 from Acme Interiors</Text>
          </View>
          <View style={styles.timeWrap}>
            <Text style={styles.timeText}>Yesterday</Text>
          </View>
        </TouchableOpacity>
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
  filtersWrapper: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: {
    backgroundColor: '#059669',
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 60,
    gap: 10,
  },
  sectionHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  notificationCard: {
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
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  notifDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  timeWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
});
