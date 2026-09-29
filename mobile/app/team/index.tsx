import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Crown,
  MoreVertical,
  Shield,
  User,
} from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';

interface MemberItem {
  id: string;
  name: string;
  role: 'Owner - you' | 'Admin' | 'Member';
  avatarUrl?: string;
  initials?: string;
  avatarBg?: string;
}

const mockMembers: MemberItem[] = [
  {
    id: 'm1',
    name: 'Manav Nagpal',
    role: 'Owner - you',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
  },
  {
    id: 'm2',
    name: 'Kaaysha Rao',
    role: 'Admin',
    initials: 'KA',
    avatarBg: '#ECFDF5',
  },
  {
    id: 'm3',
    name: 'Rohan Mehta',
    role: 'Member',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
  },
  {
    id: 'm4',
    name: 'Priya Sharma',
    role: 'Member',
    initials: 'PS',
    avatarBg: '#EDE9FE',
  },
  {
    id: 'm5',
    name: 'Aman Verma',
    role: 'Member',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
  },
];

export default function TeamMembersScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Team Members</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => Alert.alert('Invite Member', 'Enter email address to send team invite.')}
        >
          <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {mockMembers.map((member) => (
          <View key={member.id} style={styles.memberCard}>
            {member.avatarUrl ? (
              <Image source={{ uri: member.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarInitials, { backgroundColor: member.avatarBg }]}>
                <Text style={styles.avatarInitialsText}>{member.initials}</Text>
              </View>
            )}

            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberRole}>{member.role}</Text>
            </View>

            {member.role === 'Owner - you' ? (
              <Crown size={18} color="#F59E0B" />
            ) : (
              <TouchableOpacity style={styles.moreBtn}>
                <MoreVertical size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 60,
    gap: 10,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarInitials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberRole: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  moreBtn: {
    padding: 6,
  },
});
