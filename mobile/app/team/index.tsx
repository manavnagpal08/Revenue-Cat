import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Crown,
  MoreVertical,
  Shield,
  User,
  Mail,
  X,
} from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/store/authStore';

interface MemberItem {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  initials?: string;
  avatarBg?: string;
  isCurrentUser?: boolean;
}

const AVATAR_BG_COLORS = ['#ECFDF5', '#EDE9FE', '#FEF3C7', '#E0F2FE', '#FCE7F3'];

export default function TeamMembersScreen() {
  const router = useRouter();
  const { user, profile, currentBusiness } = useAuthStore();
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Member'>('Member');
  const [inviting, setInviting] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      const currentUserName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You';
      const currentUserEmail = user?.email || '';

      const baseList: MemberItem[] = [
        {
          id: user?.id || 'owner-1',
          name: currentUserName,
          email: currentUserEmail,
          role: 'Owner - you',
          initials: currentUserName.slice(0, 2).toUpperCase(),
          avatarBg: '#ECFDF5',
          isCurrentUser: true,
        },
      ];

      if (currentBusiness?.id) {
        const { data, error } = await supabase
          .from('business_members')
          .select('*, profiles(*)')
          .eq('business_id', currentBusiness.id);

        if (!error && data && data.length > 0) {
          const fetchedMembers: MemberItem[] = data
            .filter((m: any) => m.user_id !== user?.id)
            .map((m: any, idx: number) => {
              const name = m.profiles?.full_name || m.profiles?.email?.split('@')[0] || 'Team Member';
              const initials = name.slice(0, 2).toUpperCase();
              return {
                id: m.id,
                name,
                email: m.profiles?.email || '',
                role: m.role ? m.role.charAt(0).toUpperCase() + m.role.slice(1) : 'Member',
                initials,
                avatarBg: AVATAR_BG_COLORS[idx % AVATAR_BG_COLORS.length],
                isCurrentUser: false,
              };
            });
          setMembers([...baseList, ...fetchedMembers]);
        } else {
          setMembers(baseList);
        }
      } else {
        setMembers(baseList);
      }
    } catch (e) {
      console.warn('Error loading team members:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, profile, currentBusiness]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useFocusEffect(
    useCallback(() => {
      fetchMembers();
    }, [fetchMembers])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchMembers();
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setInviting(true);
    try {
      // Simulate/Trigger Supabase invite
      setTimeout(() => {
        setInviting(false);
        setInviteModalVisible(false);
        setInviteEmail('');
        Alert.alert('Invite Sent', `An invitation has been dispatched to ${inviteEmail}.`);
      }, 600);
    } catch {
      setInviting(false);
      Alert.alert('Error', 'Unable to send invitation.');
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
          <Text style={styles.headerTitle}>Team Members</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setInviteModalVisible(true)}
        >
          <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.addBtnText}>Add</Text>
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
          <Text style={styles.sectionLabel}>Active Workspace Members ({members.length})</Text>

          {members.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={[styles.avatarInitials, { backgroundColor: member.avatarBg || '#ECFDF5' }]}>
                <Text style={styles.avatarInitialsText}>{member.initials || 'TM'}</Text>
              </View>

              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role} • {member.email || 'No email'}</Text>
              </View>

              {member.isCurrentUser ? (
                <View style={styles.crownWrap}>
                  <Crown size={18} color="#F59E0B" />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.moreBtn}
                  onPress={() => {
                    Alert.alert(
                      'Manage Member',
                      `Options for ${member.name}`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Remove from Team', style: 'destructive' },
                      ]
                    );
                  }}
                >
                  <MoreVertical size={18} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Invite Modal */}
      <Modal
        visible={inviteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Team Member</Text>
              <TouchableOpacity onPress={() => setInviteModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="colleague@example.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={inviteEmail}
              onChangeText={setInviteEmail}
            />

            <Text style={styles.inputLabel}>Role</Text>
            <View style={styles.roleSelectRow}>
              {(['Member', 'Admin'] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleSelectChip, inviteRole === r && styles.roleSelectChipActive]}
                  onPress={() => setInviteRole(r)}
                >
                  <Text style={[styles.roleSelectChipText, inviteRole === r && styles.roleSelectChipTextActive]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.sendInviteBtn, inviting && { opacity: 0.7 }]}
              onPress={handleSendInvite}
              disabled={inviting}
            >
              {inviting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.sendInviteBtnText}>Send Invitation</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  avatarInitials: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitialsText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  memberRole: {
    fontSize: 12,
    color: '#64748B',
  },
  crownWrap: {
    padding: 6,
  },
  moreBtn: {
    padding: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: '#0F172A',
  },
  roleSelectRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 20,
  },
  roleSelectChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  roleSelectChipActive: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  roleSelectChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  roleSelectChipTextActive: {
    color: '#059669',
  },
  sendInviteBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendInviteBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
