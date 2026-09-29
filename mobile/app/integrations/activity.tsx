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
  Mail,
  Calendar,
  Globe,
  MessageCircle,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
} from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/authStore';

interface ActivityItem {
  id: string;
  provider: 'gmail' | 'calendar' | 'website' | 'whatsapp' | 'system';
  title: string;
  description: string;
  time: string;
  status: 'Success' | 'Failed';
}

export default function IntegrationActivityScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();
  const [filter, setFilter] = useState<'All' | 'gmail' | 'calendar' | 'website' | 'whatsapp'>('All');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      if (!currentBusiness?.id) {
        setActivities([]);
        return;
      }

      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: ActivityItem[] = data.map((item: any) => {
          let prov: ActivityItem['provider'] = 'system';
          if (item.activity_type === 'email') prov = 'gmail';
          else if (item.activity_type === 'meeting' || item.activity_type === 'calendar') prov = 'calendar';
          else if (item.activity_type === 'whatsapp' || item.activity_type === 'call') prov = 'whatsapp';
          else if (item.activity_type === 'website') prov = 'website';

          return {
            id: item.id,
            provider: prov,
            title: item.title || 'Activity Event',
            description: item.description || 'Action processed successfully.',
            time: item.created_at
              ? new Date(item.created_at).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recently',
            status: 'Success',
          };
        });
        setActivities(mapped);
      } else {
        setActivities([]);
      }
    } catch (e) {
      console.warn('Error fetching activity log:', e);
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentBusiness?.id]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

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
      default:
        return (
          <View style={[styles.iconWrap, { backgroundColor: '#F1F5F9' }]}>
            <Layers size={16} color="#64748B" />
          </View>
        );
    }
  };

  const filtered = activities.filter((a) => {
    if (filter === 'All') return true;
    return a.provider === filter;
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
            <Text style={styles.headerTitle}>Integration Activity</Text>
            <Text style={styles.headerSubtitle}>Track real-time event logs & triggers.</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.providerDropdown}
          onPress={() => {
            const next = filter === 'All' ? 'gmail' : filter === 'gmail' ? 'calendar' : filter === 'calendar' ? 'whatsapp' : 'All';
            setFilter(next as any);
          }}
        >
          <Text style={styles.providerDropdownText}>{filter === 'All' ? 'All Providers' : filter.toUpperCase()}</Text>
          <ChevronDown size={12} color="#64748B" />
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
                <Activity size={36} color="#059669" />
              </View>
              <Text style={styles.emptyTitle}>No Activity Recorded</Text>
              <Text style={styles.emptySubtitle}>
                Webhooks, sync tasks, and automation executions will stream here as they occur.
              </Text>
            </View>
          ) : (
            filtered.map((item) => {
              const isSuccess = item.status === 'Success';
              return (
                <View key={item.id} style={styles.activityCard}>
                  {getProviderIcon(item.provider)}

                  <View style={styles.activityInfo}>
                    <View style={styles.titleRow}>
                      <Text style={styles.activityTitle}>{item.title}</Text>
                      <View style={styles.statusRow}>
                        {isSuccess ? (
                          <CheckCircle2 size={13} color="#059669" />
                        ) : (
                          <XCircle size={13} color="#EF4444" />
                        )}
                        <Text
                          style={[
                            styles.statusText,
                            { color: isSuccess ? '#059669' : '#EF4444' },
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.activityDesc}>{item.description}</Text>
                    <Text style={styles.activityTime}>{item.time}</Text>
                  </View>
                </View>
              );
            })
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
  providerDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  providerDropdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
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
  activityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  activityInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  activityDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 6,
  },
  activityTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
});
