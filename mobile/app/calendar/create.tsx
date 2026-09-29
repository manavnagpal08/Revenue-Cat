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
  Sparkles,
  ChevronRight,
  ChevronDown,
  Video,
  Calendar,
  Clock,
} from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';

export default function CreateMeetingScreen() {
  const router = useRouter();
  const [meetingTitle, setMeetingTitle] = useState('Project Discussion');
  const [date, setDate] = useState('17 Sep 2026');
  const [time, setTime] = useState('4:00 PM');
  const [duration, setDuration] = useState('1 hour');
  const [meetingType, setMeetingType] = useState('Google Meet (Video Call)');
  const [creating, setCreating] = useState(false);

  const handleCreateMeeting = () => {
    setCreating(true);
    setTimeout(() => {
      setCreating(false);
      Alert.alert(
        'Meeting Created! 📅',
        'Google Meet invite with AI Agenda sent to Acme Interiors (acme@interiors.com).',
        [{ text: 'Done', onPress: () => router.back() }]
      );
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Create Meeting</Text>
          <Text style={styles.headerSubtitle}>Schedule a new meeting with AI assistance.</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Customer Selector */}
        <Text style={styles.inputLabel}>Customer</Text>
        <TouchableOpacity style={styles.customerCard} activeOpacity={0.8}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarMiniText}>AI</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>Acme Interiors</Text>
            <Text style={styles.customerEmail}>acme@interiors.com</Text>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Meeting Title */}
        <Text style={styles.inputLabel}>Meeting Title</Text>
        <TextInput
          style={styles.textInput}
          value={meetingTitle}
          onChangeText={setMeetingTitle}
        />

        {/* Date & Time Row */}
        <Text style={styles.inputLabel}>Date & Time</Text>
        <View style={styles.row}>
          <View style={[styles.pickerBox, { flex: 1.2 }]}>
            <Text style={styles.pickerText}>{date}</Text>
            <Calendar size={14} color="#64748B" />
          </View>
          <View style={[styles.pickerBox, { flex: 1 }]}>
            <Text style={styles.pickerText}>{time}</Text>
            <Clock size={14} color="#64748B" />
          </View>
        </View>

        {/* Duration */}
        <Text style={styles.inputLabel}>Duration</Text>
        <View style={styles.pickerBox}>
          <Text style={styles.pickerText}>{duration}</Text>
          <ChevronDown size={14} color="#64748B" />
        </View>

        {/* Meeting Type */}
        <Text style={styles.inputLabel}>Meeting Type</Text>
        <View style={styles.pickerBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Video size={14} color="#059669" />
            <Text style={styles.pickerText}>{meetingType}</Text>
          </View>
          <ChevronDown size={14} color="#64748B" />
        </View>

        {/* AI Generated Agenda Card */}
        <View style={styles.aiAgendaCard}>
          <View style={styles.aiAgendaHeader}>
            <Sparkles size={14} color="#059669" />
            <Text style={styles.aiAgendaTitle}>AI Generated Agenda</Text>
          </View>

          <View style={styles.agendaList}>
            <Text style={styles.agendaItem}>1. Review project requirements</Text>
            <Text style={styles.agendaItem}>2. Discuss timeline and milestones</Text>
            <Text style={styles.agendaItem}>3. Go over pricing and payment terms</Text>
            <Text style={styles.agendaItem}>4. Address any questions</Text>
            <Text style={styles.agendaItem}>5. Next steps and action items</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createBtn}
            onPress={handleCreateMeeting}
            disabled={creating}
          >
            <Text style={styles.createBtnText}>
              {creating ? 'Scheduling...' : 'Create Meeting'}
            </Text>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 12,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 60,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
    marginTop: 12,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  avatarMini: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3730A3',
  },
  customerName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  customerEmail: {
    fontSize: 11,
    color: '#64748B',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: '#0F172A',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
  },
  pickerText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },
  aiAgendaCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
    padding: 14,
    marginTop: 18,
  },
  aiAgendaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  aiAgendaTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  agendaList: {
    gap: 5,
  },
  agendaItem: {
    fontSize: 12.5,
    color: '#064E3B',
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  createBtn: {
    flex: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
