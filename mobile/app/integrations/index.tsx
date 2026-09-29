import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Mail,
  Calendar,
  MessageCircle,
  Globe,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { integrationService, IntegrationItem } from '../../src/services/integrationService';
import { useAuthStore } from '../../src/store/authStore';

export default function IntegrationsHubScreen() {
  const router = useRouter();
  const { currentBusiness, profile } = useAuthStore();

  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!currentBusiness?.id) return;
    try {
      const list = await integrationService.listIntegrations(currentBusiness.id);
      setIntegrations(list);
    } catch (err) {
      console.warn('Error loading integrations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentBusiness?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gmail':
        return <Mail size={22} color="#EA4335" />;
      case 'google_calendar':
        return <Calendar size={22} color="#4285F4" />;
      case 'whatsapp':
        return <MessageCircle size={22} color="#25D366" />;
      case 'website_leads':
        return <Globe size={22} color={Colors.primary} />;
      default:
        return <Globe size={22} color={Colors.primary} />;
    }
  };

  const getStatusBadge = (status: string, accountEmail?: string) => {
    if (status === 'connected') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: Colors.successBg }]}>
          <CheckCircle2 size={10} color={Colors.success} />
          <Text style={[styles.statusBadgeText, { color: Colors.success }]}>
            {accountEmail || 'Connected'}
          </Text>
        </View>
      );
    } else if (status === 'configuration_required') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#FEF3C7' }]}>
          <AlertCircle size={10} color={Colors.warning} />
          <Text style={[styles.statusBadgeText, { color: Colors.warning }]}>
            Config Required
          </Text>
        </View>
      );
    }
    return (
      <View style={[styles.statusBadge, { backgroundColor: '#F1F5F9' }]}>
        <Text style={[styles.statusBadgeText, { color: Colors.textMuted }]}>
          Not Connected
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Integrations</Text>
          <Text style={styles.headerSub}>Connect your tools to streamline business</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Hub Banner */}
        <GlassCard variant="elevated" style={styles.hubBanner}>
          <View style={styles.hubBannerLeft}>
            <View style={styles.hubBadge}>
              <Sparkles size={14} color={Colors.primary} />
              <Text style={styles.hubBadgeText}>CONNECTED WORKSPACE</Text>
            </View>
            <Text style={styles.hubBannerTitle}>AI Operations Engine</Text>
            <Text style={styles.hubBannerSub}>
              SoloCEO AI reads emails, checks your calendar, and captures incoming leads automatically.
            </Text>
          </View>
        </GlassCard>

        {/* Integrations List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Integrations</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : (
          integrations.map((item) => {
            const isConnected = item.status === 'connected';
            return (
              <GlassCard key={item.id} style={styles.integrationCard}>
                <View style={styles.cardTopRow}>
                  <View style={styles.iconContainer}>{getProviderIcon(item.provider)}</View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.providerName}>{item.display_name}</Text>
                    <Text style={styles.providerDesc} numberOfLines={1}>
                      {item.description}
                    </Text>
                    <View style={{ marginTop: 4 }}>
                      {getStatusBadge(item.status, item.account_email)}
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.actionBtn, isConnected && styles.manageBtn]}
                    onPress={() => router.push(`/integrations/${item.provider}` as any)}
                  >
                    <Text
                      style={[styles.actionBtnText, isConnected && styles.manageBtnText]}
                    >
                      {isConnected ? 'Manage' : 'Connect'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            );
          })
        )}

        {/* Coming Soon Section */}
        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>More Integrations</Text>
        </View>

        <GlassCard style={styles.moreIntegrationsCard}>
          <View style={styles.moreRow}>
            <View style={styles.morePill}>
              <Text style={styles.morePillText}># Slack</Text>
            </View>
            <View style={styles.morePill}>
              <Text style={styles.morePillText}>⚡ Zapier</Text>
            </View>
            <View style={styles.morePill}>
              <Text style={styles.morePillText}>📝 Notion</Text>
            </View>
            <View style={styles.morePill}>
              <Text style={styles.morePillText}>🟠 HubSpot</Text>
            </View>
          </View>
          <Text style={styles.moreSubText}>
            CRM & team collaboration sync scheduled for upcoming updates.
          </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  headerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  hubBanner: {
    padding: 18,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  hubBannerLeft: {
    flex: 1,
  },
  hubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  hubBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.6,
  },
  hubBannerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  hubBannerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
  },
  integrationCard: {
    padding: 14,
    marginBottom: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  providerDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    ...Shadows.glow,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  manageBtn: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  manageBtnText: {
    color: Colors.text,
  },
  moreIntegrationsCard: {
    padding: 16,
  },
  moreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  morePill: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  morePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  moreSubText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
