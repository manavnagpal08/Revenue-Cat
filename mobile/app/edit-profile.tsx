import React from 'react';
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
  User,
  Lock,
  Bell,
  Link as LinkIcon,
  Globe,
  ShieldCheck,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';
import { Colors } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your workspace?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const menuItems = [
    {
      id: 'personal',
      icon: User,
      title: 'Personal Information',
      action: () => Alert.alert('Personal Information', 'Edit your name, phone, and title.'),
    },
    {
      id: 'password',
      icon: Lock,
      title: 'Change Password',
      action: () => Alert.alert('Security', 'Password change email sent.'),
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'Notification Preferences',
      action: () => router.push('/notifications' as any),
    },
    {
      id: 'connected',
      icon: LinkIcon,
      title: 'Connected Accounts',
      action: () => router.push('/integrations' as any),
    },
    {
      id: 'language',
      icon: Globe,
      title: 'Language',
      value: 'English',
      action: () => Alert.alert('Language', 'Default application language: English (US)'),
    },
    {
      id: 'privacy',
      icon: ShieldCheck,
      title: 'Privacy & Security',
      action: () => Alert.alert('Privacy & Security', 'All data is encrypted in transit and at rest with Supabase RLS.'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120' }}
              style={styles.avatarImage}
            />
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={12} color="#059669" />
            </View>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{profile?.full_name || 'Manav Nagpal'}</Text>
            <Text style={styles.userEmail}>{profile?.email || 'manav@soloceo.com'}</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuCard}>
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isLast = idx === menuItems.length - 1;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuRow, !isLast && styles.menuRowBorder]}
                activeOpacity={0.7}
                onPress={item.action}
              >
                <Icon size={18} color="#64748B" />
                <Text style={styles.menuTitle}>{item.title}</Text>
                {item.value ? <Text style={styles.menuValue}>{item.value}</Text> : null}
                <ChevronRight size={18} color="#94A3B8" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutBtnText}>Sign Out</Text>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    paddingBottom: 60,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    marginBottom: 16,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  menuTitle: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  menuValue: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  signOutBtn: {
    marginTop: 24,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
});
