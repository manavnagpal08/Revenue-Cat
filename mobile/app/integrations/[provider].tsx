import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Mail,
  Calendar,
  MessageCircle,
  Globe,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Send,
  Eye,
  Lock,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { integrationService, IntegrationItem } from '../../src/services/integrationService';
import { useAuthStore } from '../../src/store/authStore';

export default function IntegrationDetailScreen() {
  const { provider } = useLocalSearchParams<{ provider: string }>();
  const router = useRouter();
  const { currentBusiness } = useAuthStore();

  const [integration, setIntegration] = useState<IntegrationItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadStatus();
  }, [provider, currentBusiness?.id]);

  const loadStatus = async () => {
    if (!currentBusiness?.id || !provider) return;
    try {
      const list = await integrationService.listIntegrations(currentBusiness.id);
      const found = list.find((i) => i.provider === provider);
      setIntegration(found || null);
    } catch (err) {
      console.warn('Error loading integration status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!currentBusiness?.id || !provider) return;
    setActionLoading(true);
    try {
      const authUrl = await integrationService.getConnectUrl(currentBusiness.id, provider);
      const supported = await Linking.canOpenURL(authUrl);
      if (supported) {
        await Linking.openURL(authUrl);
      } else {
        Alert.alert('Configuration Required', 'Google OAuth client ID is not configured in backend .env yet.');
      }
    } catch (err: any) {
      Alert.alert('Connection Error', err.message || 'Failed to initialize OAuth');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Integration',
      `Are you sure you want to disconnect ${integration?.display_name || provider}? AI features for this integration will be paused.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            if (!currentBusiness?.id || !provider) return;
            setActionLoading(true);
            try {
              await integrationService.disconnectIntegration(currentBusiness.id, provider);
              Alert.alert('Disconnected', 'Integration revoked.');
              loadStatus();
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSyncNow = async () => {
    if (!currentBusiness?.id || !provider) return;
    setActionLoading(true);
    try {
      await integrationService.syncIntegration(currentBusiness.id, provider);
      Alert.alert('Sync Complete', 'Integration data synchronized with SoloCEO.');
      loadStatus();
    } finally {
      setActionLoading(false);
    }
  };

  const getProviderDetails = () => {
    switch (provider) {
      case 'gmail':
        return {
          title: 'Connect Your Gmail',
          subtitle: 'Securely connect your Gmail account to sync emails, track conversations, and let AI help you follow up.',
          icon: <Mail size={36} color="#EA4335" />,
          permissions: [
            { icon: <Eye size={16} color={Colors.primary} />, title: 'Read your emails', desc: 'To understand customer conversations and history' },
            { icon: <Send size={16} color={Colors.primary} />, title: 'Send emails on approval', desc: 'To reply and send follow-ups with your confirmation' },
            { icon: <ShieldCheck size={16} color={Colors.primary} />, title: 'Access labels & threads', desc: 'To organize and track important client messages' },
            { icon: <Lock size={16} color={Colors.success} />, title: 'Secure & encrypted', desc: 'Your tokens are encrypted server-side and never exposed' },
          ],
        };
      case 'google_calendar':
        return {
          title: 'Connect Google Calendar',
          subtitle: 'Sync meetings, view schedule availability, and let AI schedule client appointments.',
          icon: <Calendar size={36} color="#4285F4" />,
          permissions: [
            { icon: <Eye size={16} color={Colors.primary} />, title: 'View calendar events', desc: 'Check upcoming meetings and availability' },
            { icon: <Send size={16} color={Colors.primary} />, title: 'Create meetings on approval', desc: 'Schedule client calls with Google Meet links' },
            { icon: <Lock size={16} color={Colors.success} />, title: 'Secure & encrypted', desc: 'Standard OAuth 2.0 with restricted calendar scope' },
          ],
        };
      case 'whatsapp':
        return {
          title: 'WhatsApp Business API',
          subtitle: 'Connect your Meta Cloud API phone number for direct client chat and inbound leads.',
          icon: <MessageCircle size={36} color="#25D366" />,
          permissions: [
            { icon: <Eye size={16} color={Colors.primary} />, title: 'Ingest inbound messages', desc: 'Capture customer inquiries directly in SoloCEO' },
            { icon: <Send size={16} color={Colors.primary} />, title: 'Send template messages', desc: 'Send quotes and updates with explicit confirmation' },
            { icon: <Lock size={16} color={Colors.success} />, title: 'Meta Cloud Verified', desc: 'Server-to-server webhook integration' },
          ],
        };
      default:
        return {
          title: 'Website Leads Webhook',
          subtitle: 'Ingest contact form leads directly from your WordPress, Webflow, Framer, or custom website.',
          icon: <Globe size={36} color={Colors.primary} />,
          permissions: [
            { icon: <ShieldCheck size={16} color={Colors.primary} />, title: 'Webhook Endpoint', desc: 'POST /api/integrations/webhooks/leads/{business_id}' },
            { icon: <Lock size={16} color={Colors.success} />, title: 'Signed Secret Header', desc: 'Protected by X-SoloCEO-Secret authentication' },
          ],
        };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const details = getProviderDetails();
  const isConnected = integration?.status === 'connected';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{integration?.display_name || 'Integration'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Provider Hero Card */}
        <GlassCard variant="elevated" style={styles.heroCard}>
          <View style={styles.heroIconBadge}>{details.icon}</View>
          <Text style={styles.heroTitle}>{details.title}</Text>
          <Text style={styles.heroSubtitle}>{details.subtitle}</Text>

          {isConnected ? (
            <View style={styles.connectedAccountBox}>
              <View style={styles.connectedBadge}>
                <CheckCircle2 size={12} color={Colors.success} />
                <Text style={styles.connectedBadgeText}>CONNECTED</Text>
              </View>
              {integration?.account_email && (
                <Text style={styles.accountEmailText}>{integration.account_email}</Text>
              )}
              {integration?.last_synced_at && (
                <Text style={styles.syncMetaText}>
                  Last synced: {new Date(integration.last_synced_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.disconnectedBox}>
              <Text style={styles.disconnectedText}>
                {integration?.status === 'configuration_required'
                  ? 'Configuration Required (API keys missing in .env)'
                  : 'Not Connected'}
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Permissions / Features List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Capabilities & Permissions</Text>
        </View>

        <GlassCard style={styles.permissionsCard}>
          {details.permissions.map((p, idx) => (
            <View key={idx} style={[styles.permRow, idx > 0 && styles.permBorder]}>
              <View style={styles.permIconBox}>{p.icon}</View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.permTitle}>{p.title}</Text>
                <Text style={styles.permDesc}>{p.desc}</Text>
              </View>
            </View>
          ))}
        </GlassCard>

        {/* Action Controls */}
        <View style={styles.actionsContainer}>
          {isConnected ? (
            <>
              <GlassButton
                title="Sync Now"
                variant="glass"
                icon={<RefreshCw size={16} color={Colors.primary} />}
                onPress={handleSyncNow}
                loading={actionLoading}
                style={{ marginBottom: 10 }}
              />
              <GlassButton
                title="Disconnect"
                variant="danger"
                icon={<Trash2 size={16} color={Colors.danger} />}
                onPress={handleDisconnect}
                loading={actionLoading}
              />
            </>
          ) : (
            <GlassButton
              title={`Connect with ${integration?.display_name || 'Google'}`}
              variant="primary"
              size="lg"
              onPress={handleConnect}
              loading={actionLoading}
            />
          )}

          <Text style={styles.disclaimerText}>
            You can disconnect anytime. SoloCEO strictly isolates your data to your workspace.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  heroCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 20,
  },
  heroIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...Shadows.card,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    paddingHorizontal: 10,
  },
  connectedAccountBox: {
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.glass,
    borderRadius: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  connectedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.success,
  },
  accountEmailText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  syncMetaText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  disconnectedBox: {
    marginTop: 14,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  disconnectedText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  permissionsCard: {
    padding: 16,
    marginBottom: 24,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  permBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  permIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  permDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  actionsContainer: {
    marginTop: 4,
  },
  disclaimerText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 16,
  },
});
