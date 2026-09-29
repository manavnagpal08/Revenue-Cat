import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
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
  Plus,
  Edit3,
  Zap,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { WorkspaceSwitcherModal } from '../../src/components/WorkspaceSwitcherModal';
import { useAuthStore } from '../../src/store/authStore';
import { billingService, SubscriptionData, UsageSummary } from '../../src/services/billingService';

export default function MoreScreen() {
  const router = useRouter();
  const { profile, currentBusiness, businesses, signOut } = useAuthStore();
  const businessId = currentBusiness?.id || '00000000-0000-0000-0000-000000000002';
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageSummary | null>(null);

  useEffect(() => {
    loadBillingInfo();
  }, [businessId]);

  const loadBillingInfo = async () => {
    try {
      const [subData, usageData] = await Promise.all([
        billingService.getSubscription(businessId),
        billingService.getUsage(businessId),
      ]);
      setSubscription(subData);
      setUsage(usageData);
    } catch (e) {
      console.warn('Error loading more billing info:', e);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of SoloCEO?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Workspace & Profile</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Profile Card */}
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
            </View>
            <TouchableOpacity
              style={styles.editIconBtn}
              onPress={() => router.push('/edit-profile')}
            >
              <Edit3 size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Active Business Workspace Card */}
        <Text style={styles.sectionHeader}>ACTIVE WORKSPACE</Text>
        <GlassCard variant="elevated" style={styles.workspaceCard}>
          <View style={styles.wsHeader}>
            <View style={styles.wsLeft}>
              <View style={styles.wsIconBox}>
                <Building size={20} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.wsName}>{currentBusiness?.name || 'Rivera Studio'}</Text>
                <Text style={styles.wsRole}>
                  {currentBusiness?.industry || 'Consulting'} • Owner
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => setSwitcherVisible(true)}
            >
              <Text style={styles.switchText}>Switch ({businesses.length})</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.wsDivider} />

          <View style={styles.wsActionRow}>
            <TouchableOpacity
              style={styles.wsSubAction}
              onPress={() => router.push('/edit-business')}
            >
              <Edit3 size={14} color={Colors.textSecondary} />
              <Text style={styles.wsSubActionText}>Edit Business Info</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.wsSubAction}
              onPress={() => router.push('/create-business')}
            >
              <Plus size={14} color={Colors.primary} />
              <Text style={[styles.wsSubActionText, { color: Colors.primary }]}>
                New Workspace
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* RevenueCat Subscription Card */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>MEMBERSHIP & PLAN</Text>
          <TouchableOpacity onPress={() => router.push('/billing' as any)}>
            <Text style={styles.seeAllText}>Manage</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.88} onPress={() => router.push('/billing' as any)}>
          <GlassCard variant="elevated" style={styles.subscriptionCard}>
            <View style={styles.subHeader}>
              <View style={styles.subBadge}>
                <Crown size={14} color="#F59E0B" />
                <Text style={styles.subBadgeText}>
                  SOLOCEO {(subscription?.tier || 'STARTER').toUpperCase()}
                </Text>
              </View>
              <Text style={styles.subStatus}>
                {(subscription?.status || 'Active').toUpperCase()}
              </Text>
            </View>

            <Text style={styles.subTitle}>
              {subscription?.tier === 'pro'
                ? 'Unlimited AI Actions & Agents'
                : subscription?.tier === 'business'
                ? '250 AI Credits & WhatsApp Integrations'
                : '50 AI Credits & Smart Workflows'}
            </Text>
            <Text style={styles.subDesc}>
              Sales, Finance & Proposal Agents active with automated business intelligence.
            </Text>

            <GlassButton
              title="Manage Subscription"
              variant="glass"
              size="sm"
              icon={<CreditCard size={14} color={Colors.text} />}
              onPress={() => router.push('/billing' as any)}
              style={{ marginTop: 12 }}
            />
          </GlassCard>
        </TouchableOpacity>

        {/* AI Usage & Credits */}
        <TouchableOpacity activeOpacity={0.88} onPress={() => router.push('/billing/usage' as any)}>
          <GlassCard style={styles.usageCard}>
            <View style={styles.usageHeader}>
              <View style={styles.usageTitleRow}>
                <Sparkles size={16} color={Colors.primary} />
                <Text style={styles.usageTitle}>AI Operations Usage</Text>
              </View>
              <Text style={styles.usageCount}>
                {usage?.ai_credits_used || 0} / {usage?.ai_credits_total || 50} credits
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(100, usage?.ai_credits_percent || 25)}%` },
                ]}
              />
            </View>
            <Text style={styles.usageSub}>
              {usage?.ai_credits_remaining || 0} credits remaining • Tap for breakdown
            </Text>
          </GlassCard>
        </TouchableOpacity>

        {/* Analytics & Business Intelligence Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>BUSINESS INTELLIGENCE &amp; ANALYTICS</Text>
          <TouchableOpacity onPress={() => router.push('/analytics' as any)}>
            <Text style={styles.seeAllText}>Overview</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/analytics' as any)}>
          <GlassCard style={styles.settingsGroup}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                  <Sparkles size={16} color="#059669" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Analytics &amp; KPI Dashboard</Text>
                  <Text style={styles.settingSub}>Revenue, sales funnels, cohort health &amp; reports</Text>
                </View>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/analytics/reports' as any)}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                  <CreditCard size={16} color="#2563EB" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>AI Reports Studio &amp; Export</Text>
                  <Text style={styles.settingSub}>Executive summaries in PDF, CSV, &amp; Markdown</Text>
                </View>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </GlassCard>
        </TouchableOpacity>

        {/* AI Automations Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>AI AUTOMATION & WORKFLOWS</Text>
          <TouchableOpacity onPress={() => router.push('/automations' as any)}>
            <Text style={styles.seeAllText}>Hub &amp; Rules</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/automations' as any)}>
          <GlassCard style={styles.settingsGroup}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#EEF2FF' }]}>
                  <Zap size={16} color="#4F46E5" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Workflow Engine</Text>
                  <Text style={styles.settingSub}>Smart triggers, lead follow-ups &amp; invoice alerts</Text>
                </View>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* Integrations Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>CONNECTED INTEGRATIONS</Text>
          <TouchableOpacity onPress={() => router.push('/integrations' as any)}>
            <Text style={styles.seeAllText}>Manage</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/integrations' as any)}>
          <GlassCard style={styles.settingsGroup}>
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                  <Mail size={16} color="#DC2626" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Gmail</Text>
                  <Text style={styles.settingSub}>Email intelligence & customer threads</Text>
                </View>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                  <Calendar size={16} color="#2563EB" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>Google Calendar</Text>
                  <Text style={styles.settingSub}>Tracking meetings & appointments</Text>
                </View>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                  <MessageSquare size={16} color="#16A34A" />
                </View>
                <View>
                  <Text style={styles.settingLabel}>WhatsApp Business & Leads</Text>
                  <Text style={styles.settingSub}>Inbound contact forms & messaging</Text>
                </View>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} />
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* Security & Sign Out */}
        <Text style={styles.sectionHeader}>ACCOUNT & SECURITY</Text>
        <GlassCard style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
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

      {/* Workspace Switcher Modal */}
      <WorkspaceSwitcherModal
        visible={switcherVisible}
        onClose={() => setSwitcherVisible(false)}
      />
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
    paddingBottom: 130,
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
    marginBottom: 2,
  },
  editIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  workspaceCard: {
    marginBottom: 16,
    padding: 16,
    ...Shadows.glass,
  },
  wsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  wsIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wsName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  wsRole: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  switchBtn: {
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  switchText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  wsDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  wsActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wsSubAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  wsSubActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
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
