import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  DollarSign,
  User,
  Building,
  Phone,
  Mail,
  CheckCircle,
  Plus,
  MessageSquare,
  Clock,
  Sparkles,
  Trash2,
  ArrowRight,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { leadService } from '../../src/services/leadService';
import { Lead, LeadStatus } from '../../src/types';

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  // Activity Log Modal
  const [logModalVisible, setLogModalVisible] = useState(false);
  const [actType, setActType] = useState<'call' | 'email' | 'meeting' | 'note'>('call');
  const [actTitle, setActTitle] = useState('');
  const [actDesc, setActDesc] = useState('');
  const [savingAct, setSavingAct] = useState(false);

  const loadLead = async () => {
    if (!id) return;
    try {
      const data = await leadService.getLead(id);
      setLead(data);
      const acts = await leadService.listActivities(id);
      setActivities(acts);
    } catch (err) {
      console.warn('Error loading lead detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLead();
  }, [id]);

  const handleStageChange = async (newStage: LeadStatus) => {
    if (!lead) return;
    try {
      const updated = await leadService.updateLead(lead.id, { status: newStage });
      setLead(updated);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleConvert = async () => {
    if (!lead) return;
    Alert.alert(
      'Convert Lead to Customer',
      `Create active customer account for "${lead.title}" and mark deal as Won?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Convert & Won 🚀',
          onPress: async () => {
            setConverting(true);
            try {
              const customer = await leadService.convertLeadToCustomer(lead);
              Alert.alert('Success 🎉', `Customer "${customer.name}" created!`, [
                {
                  text: 'View Customer',
                  onPress: () => router.replace(`/customers/${customer.id}` as any),
                },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Conversion failed');
            } finally {
              setConverting(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveActivity = async () => {
    if (!actTitle.trim() || !lead) return;
    setSavingAct(true);
    try {
      await leadService.addActivity({
        business_id: lead.business_id,
        lead_id: lead.id,
        activity_type: actType,
        title: actTitle.trim(),
        description: actDesc.trim() || undefined,
      });

      setLogModalVisible(false);
      setActTitle('');
      setActDesc('');
      loadLead();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSavingAct(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Deal', 'Are you sure you want to remove this lead?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!id) return;
          await leadService.deleteLead(id);
          router.back();
        },
      },
    ]);
  };

  if (loading || !lead) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const stages: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won'];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deal Pipeline</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Trash2 size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Deal Card */}
        <GlassCard variant="elevated" style={styles.heroCard}>
          <Text style={styles.dealTitle}>{lead.title}</Text>
          <Text style={styles.dealValue}>
            ₹{Number(lead.value || 0).toLocaleString('en-IN')}
          </Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>COMPANY</Text>
              <Text style={styles.infoVal}>{(lead as any).company || 'Direct Client'}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>PRIORITY</Text>
              <Text style={[styles.infoVal, { color: Colors.danger }]}>
                {(lead.priority || 'MEDIUM').toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Stage Progress Bar */}
          <Text style={styles.stageLabel}>PIPELINE STAGE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stagesScroll}>
            {stages.map((st) => {
              const isActive = lead.status === st;
              return (
                <TouchableOpacity
                  key={st}
                  style={[styles.stageChip, isActive && styles.stageChipActive]}
                  onPress={() => handleStageChange(st)}
                >
                  <Text style={[styles.stageChipText, isActive && styles.stageChipTextActive]}>
                    {st.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Primary Convert CTA */}
          <GlassButton
            title={converting ? 'Converting...' : 'Convert Lead → Customer'}
            variant="primary"
            size="md"
            loading={converting}
            icon={<Sparkles size={16} color="#FFFFFF" />}
            onPress={handleConvert}
            style={{ marginTop: 16 }}
          />
        </GlassCard>

        {/* Activity Timeline */}
        <View style={styles.activityHeaderRow}>
          <Text style={styles.sectionTitle}>Activity History ({activities.length})</Text>
          <TouchableOpacity
            style={styles.addActivityBtn}
            onPress={() => setLogModalVisible(true)}
          >
            <Plus size={14} color={Colors.primary} />
            <Text style={styles.addActivityText}>Log Interaction</Text>
          </TouchableOpacity>
        </View>

        {activities.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Text style={styles.emptyText}>No activities logged yet. Tap above to log a call or meeting note.</Text>
          </GlassCard>
        ) : (
          activities.map((act) => (
            <GlassCard key={act.id} style={styles.actCard}>
              <View style={styles.actTop}>
                <View style={styles.actTypeBadge}>
                  <Text style={styles.actTypeText}>{act.activity_type.toUpperCase()}</Text>
                </View>
                <Text style={styles.actDate}>
                  {new Date(act.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.actTitle}>{act.title}</Text>
              {act.description ? (
                <Text style={styles.actDesc}>{act.description}</Text>
              ) : null}
            </GlassCard>
          ))
        )}
      </ScrollView>

      {/* Log Activity Modal */}
      <Modal visible={logModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <GlassCard variant="elevated" style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log Lead Activity</Text>

            <View style={styles.typeSelector}>
              {(['call', 'email', 'meeting', 'note'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, actType === t && styles.typeBtnActive]}
                  onPress={() => setActType(t)}
                >
                  <Text style={[styles.typeBtnText, actType === t && styles.typeBtnTextActive]}>
                    {t.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Activity Summary (e.g. Discovery call completed)"
              placeholderTextColor={Colors.textMuted}
              value={actTitle}
              onChangeText={setActTitle}
            />

            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Detailed notes or follow-up action..."
              placeholderTextColor={Colors.textMuted}
              value={actDesc}
              onChangeText={setActDesc}
              multiline
            />

            <View style={styles.modalActions}>
              <GlassButton
                title="Cancel"
                variant="ghost"
                size="sm"
                onPress={() => setLogModalVisible(false)}
                style={{ flex: 1 }}
              />
              <GlassButton
                title="Save Activity"
                variant="primary"
                size="sm"
                loading={savingAct}
                onPress={handleSaveActivity}
                style={{ flex: 1 }}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>
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
    paddingBottom: 40,
  },
  heroCard: {
    padding: 20,
    marginBottom: 20,
  },
  dealTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  dealValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    marginTop: 6,
    letterSpacing: -0.5,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 20,
    marginVertical: 14,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  infoVal: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  stageLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  stagesScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  stageChip: {
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  stageChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stageChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  stageChipTextActive: {
    color: '#FFFFFF',
  },
  activityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  addActivityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addActivityText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  actCard: {
    marginBottom: 10,
    padding: 14,
  },
  actTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  actTypeBadge: {
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actTypeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  actDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  actTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  actDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 14,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
});
