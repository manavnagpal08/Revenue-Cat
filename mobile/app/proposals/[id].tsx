import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Receipt,
  FileCheck,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { proposalService } from '../../src/services/proposalService';
import { Proposal } from '../../src/types';

export default function ProposalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadProposal();
  }, [id]);

  const loadProposal = async () => {
    try {
      const prop = await proposalService.getProposal(id);
      setProposal(prop);
    } catch (err) {
      console.warn('Error loading proposal:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await proposalService.acceptProposal(id);
      Alert.alert('Proposal Accepted', 'Proposal is marked as accepted by the client.');
      loadProposal();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept proposal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToInvoice = async () => {
    if (!proposal) return;
    setActionLoading(true);
    try {
      const invoice = await proposalService.convertProposalToInvoice(proposal);
      Alert.alert('Success', 'Proposal converted into a live invoice!', [
        {
          text: 'View Invoice',
          onPress: () => router.replace(`/invoices/${invoice.id}` as any),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Conversion Failed', err.message || 'Failed to convert proposal to invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Proposal',
      'Are you sure you want to delete this proposal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            await proposalService.deleteProposal(id);
            router.back();
          },
        },
      ]
    );
  };

  if (loading || !proposal) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isAccepted = proposal.status === 'accepted';
  const deliverables = proposal.deliverables || [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Proposal Scope</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Trash2 size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Proposal Card */}
        <GlassCard variant="elevated" style={styles.mainCard}>
          <View style={styles.mainCardTop}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.proposalTitle}>{proposal.title}</Text>
              <Text style={styles.clientName}>
                {proposal.customer?.name || 'Prospective Client'}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                isAccepted && { backgroundColor: Colors.successBg },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isAccepted && { color: Colors.success },
                ]}
              >
                {proposal.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.totalValueBox}>
            <Text style={styles.totalValueLabel}>PROPOSAL ESTIMATE</Text>
            <Text style={styles.totalValueAmount}>
              ₹{Number(proposal.total_value).toLocaleString('en-IN')}
            </Text>
          </View>

          {proposal.valid_until ? (
            <View style={styles.validityRow}>
              <Calendar size={14} color={Colors.textMuted} />
              <Text style={styles.validityText}>Valid until: {proposal.valid_until}</Text>
            </View>
          ) : null}
        </GlassCard>

        {/* Action Buttons: Convert to Invoice / Accept */}
        <View style={styles.actionRow}>
          {!isAccepted && (
            <GlassButton
              title="Mark Accepted"
              variant="glass"
              icon={<CheckCircle2 size={16} color={Colors.success} />}
              onPress={handleAccept}
              loading={actionLoading}
              style={{ flex: 1 }}
            />
          )}
          <GlassButton
            title="Convert to Live Invoice"
            variant="primary"
            icon={<Receipt size={16} color="#FFFFFF" />}
            onPress={handleConvertToInvoice}
            loading={actionLoading}
            style={{ flex: 1 }}
          />
        </View>

        {/* Project Overview */}
        {proposal.project_overview ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Project Overview & Objectives</Text>
            <GlassCard style={styles.sectionCard}>
              <Text style={styles.overviewText}>{proposal.project_overview}</Text>
            </GlassCard>
          </View>
        ) : null}

        {/* Deliverables Breakdown */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>
            Deliverables & Milestone Scope ({deliverables.length})
          </Text>

          {deliverables.length === 0 ? (
            <GlassCard style={styles.sectionCard}>
              <Text style={styles.emptyDeliverableText}>
                No specific deliverables listed. Total scoped at ₹
                {Number(proposal.total_value).toLocaleString('en-IN')}.
              </Text>
            </GlassCard>
          ) : (
            deliverables.map((deliv, idx) => (
              <GlassCard key={idx} style={styles.deliverableCard}>
                <View style={styles.delivHeader}>
                  <View style={styles.delivIndex}>
                    <Text style={styles.delivIndexText}>0{idx + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.delivTitle}>{deliv.title}</Text>
                  </View>
                  <Text style={styles.delivCost}>
                    ₹{Number(deliv.cost).toLocaleString('en-IN')}
                  </Text>
                </View>
              </GlassCard>
            ))
          )}
        </View>

        {/* Timeline */}
        {proposal.timeline ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Timeline & Milestones</Text>
            <GlassCard style={styles.sectionCard}>
              <Text style={styles.timelineText}>{proposal.timeline}</Text>
            </GlassCard>
          </View>
        ) : null}
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
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  mainCard: {
    padding: 18,
    marginBottom: 16,
  },
  mainCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  proposalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  clientName: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  totalValueBox: {
    backgroundColor: Colors.glass,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginBottom: 12,
  },
  totalValueLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  totalValueAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 4,
  },
  validityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  validityText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  sectionBlock: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  sectionCard: {
    padding: 16,
  },
  overviewText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  timelineText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  emptyDeliverableText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  deliverableCard: {
    padding: 14,
    marginBottom: 8,
  },
  delivHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  delivIndex: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delivIndexText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  delivTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  delivCost: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
});
