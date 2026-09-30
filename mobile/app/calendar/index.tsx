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
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Video,
  Clock,
  Calendar as CalendarIcon,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/authStore';

interface MeetingItem {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  subtitle: string;
  type: string;
  isOutline?: boolean;
}

interface DayItem {
  day: string;
  date: number;
  fullDateStr: string;
  isToday: boolean;
}

export default function CalendarScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();
  const [days, setDays] = useState<DayItem[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Generate current week dynamically
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon
    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const weekDays: DayItem[] = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const isToday = d.toDateString() === now.toDateString();
      const dateIso = d.toISOString().split('T')[0];
      weekDays.push({
        day: dayNames[i],
        date: d.getDate(),
        fullDateStr: dateIso,
        isToday,
      });
      if (isToday) {
        setSelectedDateStr(dateIso);
      }
    }

    if (weekDays.length > 0 && !selectedDateStr) {
      const todayItem = weekDays.find((w) => w.isToday) || weekDays[0];
      setSelectedDateStr(todayItem.fullDateStr);
    }
    setDays(weekDays);
  }, []);

  const fetchMeetings = useCallback(async () => {
    try {
      if (!currentBusiness?.id) {
        setMeetings([]);
        return;
      }

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .order('due_date', { ascending: true });

      if (error) throw error;

      if (tasks && tasks.length > 0) {
        const mapped: MeetingItem[] = tasks.map((t: any) => {
          const due = t.due_date ? new Date(t.due_date) : new Date();
          const start = due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const end = new Date(due.getTime() + 45 * 60000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          return {
            id: t.id,
            startTime: start || '10:00 AM',
            endTime: end || '10:45 AM',
            title: t.title || 'Client Meeting',
            subtitle: t.description || 'Project consultation',
            type: t.priority === 'high' ? 'Google Meet' : 'Video Call',
            isOutline: t.status === 'completed',
          };
        });
        setMeetings(mapped);
      } else {
        setMeetings([]);
      }
    } catch (err) {
      console.warn('Error fetching calendar events:', err);
      setMeetings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentBusiness?.id]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  useFocusEffect(
    useCallback(() => {
      fetchMeetings();
    }, [fetchMeetings])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMeetings();
  };

  const selectedDayObj = days.find((d) => d.fullDateStr === selectedDateStr);
  const displayDateHeader = selectedDayObj
    ? `${selectedDayObj.isToday ? 'Today, ' : ''}${selectedDayObj.date} ${new Date(selectedDayObj.fullDateStr).toLocaleDateString([], { month: 'short', year: 'numeric' })}`
    : 'Schedule';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Calendar</Text>
            <Text style={styles.headerSubtitle}>Your upcoming meetings and events.</Text>
          </View>
        </View>
        <View style={styles.badgeCircle}>
          <Text style={styles.badgeCircleText}>{meetings.length}</Text>
        </View>
      </View>

      {/* Horizontal Date Selector Strip */}
      <View style={styles.datesStrip}>
        {days.map((d) => {
          const isSelected = selectedDateStr === d.fullDateStr;
          return (
            <TouchableOpacity
              key={d.fullDateStr}
              style={[styles.datePill, isSelected && styles.datePillSelected]}
              onPress={() => setSelectedDateStr(d.fullDateStr)}
            >
              <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                {d.day}
              </Text>
              <Text style={[styles.dateNumText, isSelected && styles.dateNumTextSelected]}>
                {d.date}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Date Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionDateText}>{displayDateHeader}</Text>
      </View>

      {/* Meetings List */}
      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.meetingsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />
          }
        >
          {meetings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <CalendarIcon size={36} color="#059669" />
              </View>
              <Text style={styles.emptyTitle}>No Meetings Scheduled</Text>
              <Text style={styles.emptySubtitle}>
                You have no scheduled calls or tasks for this date.
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => router.push('/calendar/create')}
              >
                <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyActionBtnText}>Schedule Meeting</Text>
              </TouchableOpacity>
            </View>
          ) : (
            meetings.map((item) => (
              <View key={item.id} style={styles.meetingCard}>
                <View style={styles.timeColumn}>
                  <Text style={styles.startTimeText}>{item.startTime}</Text>
                  <Text style={styles.endTimeText}>{item.endTime}</Text>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.detailsColumn}>
                  <Text style={styles.meetingTitle}>{item.title}</Text>
                  <Text style={styles.meetingSubtitle}>{item.subtitle}</Text>
                </View>

                <View
                  style={[
                    styles.actionPill,
                    item.isOutline ? styles.actionPillOutline : styles.actionPillFilled,
                  ]}
                >
                  <Text
                    style={[
                      styles.actionPillText,
                      item.isOutline ? styles.actionPillTextOutline : styles.actionPillTextFilled,
                    ]}
                  >
                    {item.type}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Floating Action Button (+) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/calendar/create')}
        activeOpacity={0.85}
      >
        <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>
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
    marginTop: 1,
  },
  badgeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCircleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  datesStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  datePill: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    minWidth: 42,
  },
  datePillSelected: {
    backgroundColor: '#059669',
  },
  dayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  dateNumText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateNumTextSelected: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionDateText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  loaderCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meetingsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
  meetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeColumn: {
    width: 76,
  },
  startTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  endTimeText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  cardDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 10,
  },
  detailsColumn: {
    flex: 1,
  },
  meetingTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  meetingSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  actionPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  actionPillFilled: {
    backgroundColor: '#ECFDF5',
  },
  actionPillOutline: {
    borderWidth: 1,
    borderColor: '#059669',
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionPillTextFilled: {
    color: '#059669',
  },
  actionPillTextOutline: {
    color: '#059669',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
});
