import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  Mail,
  Calendar,
  MessageCircle,
  Globe,
  Sparkles,
  ChevronRight,
  Plus,
  Layers,
  Zap,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { integrationService } from '../../src/services/integrationService';

interface ToolItem {
  id: string;
  name: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  status: 'Connected' | 'Not Connected' | 'Coming Soon';
  subtext: string;
  isManage?: boolean;
}

export default function IntegrationsHubScreen() {
  const router = useRouter();
  const { currentBusiness, profile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const userEmail = profile?.email || 'founder@soloceo.app';

  const [tools, setTools] = useState<ToolItem[]>([
    {
      id: 'gmail',
      name: 'Gmail',
      icon: Mail,
      iconColor: '#EA4335',
      iconBg: '#FEE2E2',
      status: 'Connected',
      subtext: userEmail,
      isManage: true,
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      icon: Calendar,
      iconColor: '#2563EB',
      iconBg: '#DBEAFE',
      status: 'Connected',
      subtext: 'Primary Calendar Synced',
      isManage: true,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      icon: MessageCircle,
      iconColor: '#059669',
      iconBg: '#ECFDF5',
      status: 'Connected',
      subtext: 'Meta Cloud API Connected',
      isManage: true,
    },
    {
      id: 'website',
      name: 'Website / Inbound Leads',
      icon: Globe,
      iconColor: '#4F46E5',
      iconBg: '#EEF2FF',
      status: 'Connected',
      subtext: 'Receiving leads via webhook',
      isManage: true,
    },
  ]);

  const moreTools = [
    { id: 'slack', name: 'Slack', color: '#E11D48', iconBg: '#FFE4E6' },
    { id: 'zapier', name: 'Zapier', color: '#F97316', iconBg: '#FFEDD5' },
    { id: 'notion', name: 'Notion', color: '#0F172A', iconBg: '#F1F5F9' },
  ];

  const loadIntegrations = useCallback(async () => {
    if (!currentBusiness?.id) return;
    try {
      const items = await integrationService.listIntegrations(currentBusiness.id);
      if (items && items.length > 0) {
        setTools((prev) =>
          prev.map((tool) => {
            const match = items.find(
              (i) =>
                i.provider === tool.id ||
                (tool.id === 'website' && i.provider === 'website_leads') ||
                (tool.id === 'calendar' && i.provider === 'google_calendar')
            );
            if (match) {
              const isConn = match.status === 'connected';
              return {
                ...tool,
                status: isConn ? 'Connected' : 'Not Connected',
                subtext: match.account_email || (isConn ? userEmail : 'Connect to start'),
              };
            }
            return tool;
          })
        );
      }
    } catch (e) {
      console.warn('Error loading integrations:', e);
    } finally {
      setRefreshing(false);
    }
  }, [currentBusiness?.id, userEmail]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  useFocusEffect(
    useCallback(() => {
      loadIntegrations();
    }, [loadIntegrations])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIntegrations();
  };

  const toggleConnection = (toolId: string) => {
    setTools((prev) =>
      prev.map((t) => {
        if (t.id === toolId) {
          const nextConnected = t.status !== 'Connected';
          return {
            ...t,
            status: nextConnected ? 'Connected' : 'Not Connected',
            subtext: nextConnected ? userEmail : 'Connect to enable sync',
            isManage: nextConnected,
          };
        }
        return t;
      })
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Integrations</Text>
        </View>

        <TouchableOpacity
          style={styles.activityBtn}
          onPress={() => router.push('/integrations/activity' as any)}
        >
          <Text style={styles.activityBtnText}>Activity</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Text style={styles.sectionSubtitle}>
          Connect your essential operational tools to power AI automation
        </Text>

        {/* Main Tools Cards */}
        <View style={styles.toolsList}>
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isConnected = tool.status === 'Connected';
            return (
              <View key={tool.id} style={styles.toolCard}>
                <View style={[styles.iconBox, { backgroundColor: tool.iconBg }]}>
                  <Icon size={20} color={tool.iconColor} />
                </View>

                <View style={styles.toolInfo}>
                  <Text style={styles.toolName}>{tool.name}</Text>
                  <View style={styles.statusRow}>
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: isConnected ? '#059669' : '#94A3B8' },
                      ]}
                    />
                    <Text style={styles.toolSubtext}>{tool.subtext}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    isConnected ? styles.actionBtnManage : styles.actionBtnConnect,
                  ]}
                  onPress={() => router.push(`/integrations/${tool.id}` as any)}
                >
                  <Text
                    style={[
                      styles.actionBtnText,
                      isConnected ? styles.actionBtnTextManage : styles.actionBtnTextConnect,
                    ]}
                  >
                    {isConnected ? 'Manage' : 'Connect'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* More Integrations Section */}
        <Text style={styles.moreHeader}>More Integrations</Text>
        <View style={styles.moreToolsCard}>
          {moreTools.map((m, idx) => {
            const isLast = idx === moreTools.length - 1;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.moreToolRow, !isLast && styles.moreToolRowBorder]}
                activeOpacity={0.7}
                onPress={() => router.push(`/integrations/${m.id}` as any)}
              >
                <View style={[styles.moreIconBox, { backgroundColor: m.iconBg }]}>
                  <Layers size={16} color={m.color} />
                </View>
                <Text style={styles.moreToolName}>{m.name}</Text>
                <View style={styles.connectPill}>
                  <Text style={styles.connectPillText}>Available</Text>
                </View>
                <ChevronRight size={18} color="#94A3B8" />
              </TouchableOpacity>
            );
          })}
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
    fontFamily: 'Manrope_800ExtraBold',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  activityBtn: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  activityBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#059669',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 100,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Manrope_400Regular',
    marginBottom: 16,
  },
  toolsList: {
    gap: 12,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...Shadows.sm,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  toolSubtext: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Manrope_400Regular',
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  actionBtnConnect: {
    backgroundColor: '#059669',
  },
  actionBtnManage: {
    backgroundColor: '#F1F5F9',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
  },
  actionBtnTextConnect: {
    color: '#FFFFFF',
  },
  actionBtnTextManage: {
    color: '#334155',
  },
  moreHeader: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#0F172A',
    marginTop: 24,
    marginBottom: 12,
  },
  moreToolsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  moreToolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  moreToolRowBorder: {
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  moreIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreToolName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#0F172A',
  },
  connectPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 4,
  },
  connectPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#059669',
  },
});
