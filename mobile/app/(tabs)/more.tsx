import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Crown,
  Sparkles,
  Mail,
  Calendar,
  MessageSquare,
  Shield,
  CreditCard,
  LogOut,
  ChevronRight,
  User,
  Building,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { useAuthStore } from '../../src/store/authStore';

export default function MoreScreen() {
  const router = useRouter();
  const { profile, currentBusiness, signOut } = useAuthStore();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Workspace & Settings</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile / Business Card */}
        <GlassCard style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {profile?.full_name ? profile.full_name[0] : 'A'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{profile?.full_name || 'Alex Rivera'}</Text>
              <Text style={styles.userEmail}>{profile?.email || 'alex.founder@soloceo.app'}</Text>
              <View style={styles.bizTag}>
                <Building size={12} color={Colors.primary} />
                <Text style={styles.bizTagText}>
                  {currentBusiness?.name || 'Rivera Design & Tech Studio'}
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>

        {/* RevenueCat Subscription Card */}
        <GlassCard variant="elevated" style={styles.subscriptionCard}>
          <View style={styles.subHeader}>
            <View style={styles.subBadge}>
              <Crown size={14} color="#F59E0B" />
              <Text style={styles.subBadgeText}>SOLOCEO PRO</Text>
            </View>
            <Text style={styles.subStatus}>Active Plan</Text>
          </View>

          <Text style={styles.subTitle}>Unlimited AI Actions & Agents</Text>
          <Text style={styles.subDesc}>
            Sales, Finance & Proposal Agents active with automated business intelligence.
          </Text>

          <GlassButton
            title="Manage Subscription"
            variant="glass"
            size="sm"
            icon={<CreditCard size={14} color={Colors.text} />}
            onPress={() => router.push('/paywall')}
            style={{ marginTop: 12 }}
          />
        </GlassCard>

        {/* AI Usage & Credits */}
        <GlassCard style={styles.usageCard}>
          <View style={styles.usageHeader}>
            <View style={styles.usageTitleRow}>
              <Sparkles size={16} color={Colors.primary} />
              <Text style={styles.usageTitle}>AI Operations Usage</Text>
            </View>
            <Text style={styles.usageCount}>142 / Unlimited</Text>
          </View>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '40%' }]} />
          </View>
          <Text style={styles.usageSub}>Resets on Oct 28, 2026</Text>
        </GlassCard>

        {/* Integrations Section */}
        <Text style={styles.sectionHeader}>CONNECTED INTEGRATIONS</Text>
        <GlassCard style={styles.settingsGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                <Mail size={16} color="#DC2626" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Gmail</Text>
                <Text style={styles.settingSub}>Syncing incoming leads & threads</Text>
              </View>
            </View>
            <View style={styles.connectedPill}>
              <Text style={styles.connectedText}>Connected</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                <Calendar size={16} color="#2563EB" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Google Calendar</Text>
                <Text style={styles.settingSub}>Tracking meetings & follow-ups</Text>
              </View>
            </View>
            <View style={styles.connectedPill}>
              <Text style={styles.connectedText}>Connected</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                <MessageSquare size={16} color="#16A34A" />
              </View>
              <View>
                <Text style={styles.settingLabel}>Business Messaging</Text>
                <Text style={styles.settingSub}>WhatsApp & CRM conversation sync</Text>
              </View>
            </View>
            <View style={styles.connectedPill}>
              <Text style={styles.connectedText}>Connected</Text>
            </View>
          </View>
        </GlassCard>

        {/* Security & Sign Out */}
        <Text style={styles.sectionHeader}>ACCOUNT & SECURITY</Text>
        <GlassCard style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingItem} onPress={signOut}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: Colors.dangerBg }]}>
                <LogOut size={16} color={Colors.danger} />
              </View>
              <Text style={[styles.settingLabel, { color: Colors.danger }]}>Sign Out</Text>
            </View>
            <ChevronRight size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  profileCard: {
    marginBottom: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  bizTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bizTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  subscriptionCard: {
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    ...Shadows.glass,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  subBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.8,
  },
  subStatus: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  usageCard: {
    marginBottom: 20,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  usageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  usageTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  usageCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  usageSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  settingsGroup: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  settingSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  connectedPill: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  connectedText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
});
