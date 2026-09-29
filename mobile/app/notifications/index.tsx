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
  Globe,
  AlertCircle,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  Bell,
  CheckCheck,
} from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/authStore';

interface NotificationItem {
  id: string;
  category: 'Leads' | 'Invoices' | 'Mentions' | 'General';
  title: string;
  description: string;
  time: string;
  isUnread?: boolean;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState<'All' | 'Leads' | 'Invoices' | 'Mentions'>('All');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      if (!currentBusiness?.id) {
        setNotifications([]);
        return;
      }

      // Check if notifications table exists or fetch recent activities
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: NotificationItem[] = data.map((n: any) => ({
          id: n.id,
          category: n.type === 'lead' ? 'Leads' : n.type === 'invoice' ? 'Invoices' : 'General',
          title: n.title || 'Notification',
          description: n.message || n.body || '',
          time: n.created_at
            ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Recent',
          isUnread: !n.is_read,
        }));
        setNotifications(mapped);
      } else {
        // Fallback: Check lead_activities as notification feed
        const { data: acts } = await supabase
          .from('lead_activities')
          .select('*')
          .eq('business_id', currentBusiness.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (acts && acts.length > 0) {
          const mappedActs: NotificationItem[] = acts.map((a: any) => ({
            id: a.id,
            category: a.activity_type === 'email' ? 'Mentions' : 'Leads',
            title: a.title || 'Activity Alert',
            description: a.description || '',
            time: a.created_at
              ? new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Recent',
            isUnread: false,
          }));
          setNotifications(mappedActs);
        } else {
          setNotifications([]);
        }
      }
    } catch (err) {
      console.warn('Error fetching notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentBusiness?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Leads':
        return (
          <View style={[styles.iconWrap, { backgroundColor: '#ECFDF5' }]}>
            <Globe size={18} color="#059669" />
          </View>
        );
      case 'Invoices':
        return (
          <View style={[styles.iconWrap, { backgroundColor: '#FEE2E2' }]}>
            <DollarSign size={18} color="#EF4444" />
          </View>
        );
      default:
        return (
          <View style={[styles.iconWrap, { backgroundColor: '#DBEAFE' }]}>
            <FileText size={18} color="#2563EB" />
          </View>
        );
    }
  };

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'All') return true;
    return n.category === activeFilter;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 36 }} />
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
                <Bell size={36} color="#059669" />
              </View>
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptySubtitle}>
                You have no unread notifications or alerts. New lead alerts, overdue invoice notices, and calendar reminders will pop up here.
              </Text>
            </View>
          ) : (
            filtered.map((item) => (
              <TouchableOpacity key={item.id} style={styles.notificationCard} activeOpacity={0.75}>
                {getCategoryIcon(item.category)}
                <View style={styles.cardInfo}>
                  <Text style={styles.notifTitle}>{item.title}</Text>
                  <Text style={styles.notifDesc}>{item.description}</Text>
                </View>
                <View style={styles.timeWrap}>
                  <Text style={styles.timeText}>{item.time}</Text>
                  {item.isUnread ? <View style={styles.unreadDot} /> : null}
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
    fontSize: 18,
    fontWeight: '700',
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
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 60,
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
