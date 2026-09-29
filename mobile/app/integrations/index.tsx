import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
} from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';

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

const mainTools: ToolItem[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: Mail,
    iconColor: '#EA4335',
    iconBg: '#FEE2E2',
    status: 'Connected',
    subtext: 'rahul@acmestudio.com',
    isManage: true,
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    icon: Calendar,
    iconColor: '#2563EB',
    iconBg: '#DBEAFE',
    status: 'Connected',
    subtext: '3 calendars synced',
    isManage: true,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    icon: MessageCircle,
    iconColor: '#059669',
    iconBg: '#ECFDF5',
    status: 'Not Connected',
    subtext: 'Connect to start messaging',
    isManage: false,
  },
  {
    id: 'website',
    name: 'Website / Leads',
    icon: Globe,
    iconColor: '#4F46E5',
    iconBg: '#EEF2FF',
    status: 'Connected',
    subtext: 'Receiving leads via webhook',
    isManage: true,
  },
];

const moreTools = [
  { id: 'slack', name: 'Slack', color: '#E11D48' },
  { id: 'zapier', name: 'Zapier', color: '#F97316' },
  { id: 'notion', name: 'Notion', color: '#0F172A' },
];

export default function IntegrationsHubScreen() {
  const router = useRouter();

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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionSubtitle}>
          Connect your tools to streamline your business
        </Text>

        {/* Main Tools Cards */}
        <View style={styles.toolsList}>
          {mainTools.map((tool) => {
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
                  onPress={() => router.push(`/integrations/${tool.id}`)}
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
                onPress={() => Alert.alert(m.name, `${m.name} integration is coming soon in Q4!`)}
              >
                <View style={styles.moreIconBox}>
                  <Layers size={16} color={m.color} />
                </View>
                <Text style={styles.moreToolName}>{m.name}</Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Coming Soon</Text>
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
    color: '#059669',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 60,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
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
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  toolSubtext: {
    fontSize: 11.5,
    color: '#64748B',
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  actionBtnManage: {
    backgroundColor: '#F1F5F9',
  },
  actionBtnConnect: {
    backgroundColor: '#059669',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionBtnTextManage: {
    color: '#475569',
  },
  actionBtnTextConnect: {
    color: '#FFFFFF',
  },
  moreHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 24,
    marginBottom: 10,
  },
  moreToolsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
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
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreToolName: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  comingSoonBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 4,
  },
  comingSoonText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
});
