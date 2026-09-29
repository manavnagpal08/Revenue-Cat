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
  Plus,
  Video,
  Clock,
  Calendar as CalendarIcon,
  ChevronRight,
} from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';

interface MeetingItem {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  subtitle: string;
  type: 'Video Call' | 'Google Meet';
  isOutline?: boolean;
}

const days = [
  { day: 'Mon', date: 15 },
  { day: 'Tue', date: 16 },
  { day: 'Wed', date: 17, isToday: true },
  { day: 'Thu', date: 18 },
  { day: 'Fri', date: 19 },
  { day: 'Sat', date: 20 },
  { day: 'Sun', date: 21 },
];

const mockMeetings: MeetingItem[] = [
  {
    id: 'm-1',
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    title: 'Acme Interiors',
    subtitle: 'Project Discussion',
    type: 'Video Call',
    isOutline: true,
  },
  {
    id: 'm-2',
    startTime: '2:00 PM',
    endTime: '3:00 PM',
    title: 'Rahul Designs',
    subtitle: 'Proposal Review',
    type: 'Google Meet',
  },
  {
    id: 'm-3',
    startTime: '4:30 PM',
    endTime: '5:00 PM',
    title: 'Team Sync',
    subtitle: 'Internal Meeting',
    type: 'Google Meet',
  },
];

export default function CalendarScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(17);

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
          <Text style={styles.badgeCircleText}>8</Text>
        </View>
      </View>

      {/* Horizontal Date Selector Strip */}
      <View style={styles.datesStrip}>
        {days.map((d) => {
          const isSelected = selectedDate === d.date;
          return (
            <TouchableOpacity
              key={d.date}
              style={[styles.datePill, isSelected && styles.datePillSelected]}
              onPress={() => setSelectedDate(d.date)}
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
        <Text style={styles.sectionDateText}>Today, {selectedDate} Sep 2026</Text>
      </View>

      {/* Meetings List */}
      <ScrollView contentContainerStyle={styles.meetingsList} showsVerticalScrollIndicator={false}>
        {mockMeetings.map((item) => (
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

            <TouchableOpacity
              style={[
                styles.actionPill,
                item.isOutline ? styles.actionPillOutline : styles.actionPillFilled,
              ]}
              onPress={() => {}}
            >
              <Text
                style={[
                  styles.actionPillText,
                  item.isOutline ? styles.actionPillTextOutline : styles.actionPillTextFilled,
                ]}
              >
                {item.type}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

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
    padding: 6,
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
  meetingsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
    gap: 12,
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
    bottom: 90,
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
