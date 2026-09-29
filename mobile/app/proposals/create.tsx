import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, User, FileText } from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { proposalService } from '../../src/services/proposalService';
import { customerService } from '../../src/services/customerService';
import { useAuthStore } from '../../src/store/authStore';
import { Customer } from '../../src/types';

interface DeliverableInput {
  title: string;
  cost: string;
}

export default function CreateProposalScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [overview, setOverview] = useState('');
  const [timeline, setTimeline] = useState('3-4 weeks delivery with weekly sprints');
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  const [deliverables, setDeliverables] = useState<DeliverableInput[]>([
    { title: 'Discovery & UX Architecture', cost: '35000' },
    { title: 'Interactive Prototype & UI System', cost: '45000' },
  ]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [currentBusiness?.id]);

  const loadCustomers = async () => {
    if (!currentBusiness?.id) return;
    try {
      const list = await customerService.listCustomers(currentBusiness.id);
      setCustomers(list);
      if (list.length > 0) {
        setSelectedCustomerId(list[0].id);
      }
    } catch (err) {
      console.warn('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const addDeliverable = () => {
    setDeliverables([...deliverables, { title: '', cost: '0' }]);
  };

  const removeDeliverable = (index: number) => {
    if (deliverables.length <= 1) return;
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const updateDeliverable = (index: number, field: keyof DeliverableInput, val: string) => {
    const updated = [...deliverables];
    updated[index][field] = val;
    setDeliverables(updated);
  };

  const totalCalculated = deliverables.reduce(
    (sum, d) => sum + (parseFloat(d.cost) || 0),
    0
  );

  const handleCreate = async () => {
    if (!currentBusiness?.id) {
      Alert.alert('Error', 'No active workspace found');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a proposal title.');
      return;
    }

    const validDelivs = deliverables
      .filter((d) => d.title.trim().length > 0 && (parseFloat(d.cost) || 0) > 0)
      .map((d) => ({
        title: d.title.trim(),
        cost: parseFloat(d.cost) || 0,
      }));

    if (validDelivs.length === 0) {
      Alert.alert('Validation Error', 'Please include at least one valid deliverable with price.');
      return;
    }

    setSubmitting(true);
    try {
      await proposalService.createProposal({
        business_id: currentBusiness.id,
        customer_id: selectedCustomerId || undefined,
        title: title.trim(),
        project_overview: overview.trim() || undefined,
        timeline: timeline.trim() || undefined,
        valid_until: validUntil || undefined,
        total_value: totalCalculated,
        deliverables: validDelivs,
      });

      Alert.alert('Success', 'Proposal created successfully!');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create proposal');
    } finally {
      setSubmitting(false);
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Proposal</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Customer Selection */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Client / Prospect</Text>
          </View>

          {customers.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.customerScroll}
            >
              {customers.map((c) => {
                const isSelected = c.id === selectedCustomerId;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.customerChip, isSelected && styles.customerChipActive]}
                    onPress={() => setSelectedCustomerId(c.id)}
                  >
                    <User size={14} color={isSelected ? '#FFFFFF' : Colors.textSecondary} />
                    <Text
                      style={[styles.customerChipText, isSelected && styles.customerChipTextActive]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Proposal Scope Details */}
          <GlassCard style={styles.card}>
            <Text style={styles.inputLabel}>Proposal Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Design & Mobile App Development"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Project Overview & Objectives</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={overview}
              onChangeText={setOverview}
              multiline
              placeholder="Describe client objectives, problem statement, and scope..."
              placeholderTextColor={Colors.textMuted}
            />
          </GlassCard>

          {/* Deliverables Builder */}
          <View style={[styles.sectionHeader, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>Deliverables & Scope</Text>
            <TouchableOpacity style={styles.addItemBtn} onPress={addDeliverable}>
              <Plus size={14} color={Colors.primary} />
              <Text style={styles.addItemBtnText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {deliverables.map((deliv, idx) => (
            <GlassCard key={idx} style={styles.itemBuilderCard}>
              <View style={styles.itemBuilderTop}>
                <Text style={styles.itemIndexText}>Deliverable #{idx + 1}</Text>
                {deliverables.length > 1 && (
                  <TouchableOpacity onPress={() => removeDeliverable(idx)}>
                    <Trash2 size={16} color={Colors.danger} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.inputLabel}>Deliverable Title</Text>
              <TextInput
                style={styles.input}
                value={deliv.title}
                onChangeText={(val) => updateDeliverable(idx, 'title', val)}
                placeholder="e.g. UI/UX Figma Design Kit"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={[styles.inputLabel, { marginTop: 8 }]}>Estimated Cost (₹)</Text>
              <TextInput
                style={styles.input}
                value={deliv.cost}
                onChangeText={(val) => updateDeliverable(idx, 'cost', val)}
                keyboardType="numeric"
                placeholder="35000"
                placeholderTextColor={Colors.textMuted}
              />
            </GlassCard>
          ))}

          {/* Total Value Auto-sum Box */}
          <GlassCard variant="elevated" style={styles.totalSumCard}>
            <Text style={styles.totalSumLabel}>TOTAL PROPOSED VALUE</Text>
            <Text style={styles.totalSumValue}>
              ₹{Math.round(totalCalculated).toLocaleString('en-IN')}
            </Text>
          </GlassCard>

          {/* Timeline & Validity */}
          <GlassCard style={[styles.card, { marginTop: 14 }]}>
            <Text style={styles.inputLabel}>Timeline & Sprints</Text>
            <TextInput
              style={styles.input}
              value={timeline}
              onChangeText={setTimeline}
              placeholder="e.g. 4 weeks delivery"
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Valid Until (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={validUntil}
              onChangeText={setValidUntil}
              placeholder="2026-11-01"
              placeholderTextColor={Colors.textMuted}
            />
          </GlassCard>

          {/* Submit */}
          <GlassButton
            title="Create & Save Proposal"
            variant="primary"
            size="lg"
            icon={<FileText size={18} color="#FFFFFF" />}
            onPress={handleCreate}
            loading={submitting}
            style={{ marginTop: 24, marginBottom: 30 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  customerScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  customerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customerChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  customerChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  customerChipTextActive: {
    color: '#FFFFFF',
  },
  card: {
    padding: 16,
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.text,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addItemBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  itemBuilderCard: {
    padding: 14,
    marginBottom: 10,
  },
  itemBuilderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemIndexText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  totalSumCard: {
    padding: 16,
    alignItems: 'center',
    marginTop: 6,
  },
  totalSumLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  totalSumValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
    marginTop: 4,
  },
});
