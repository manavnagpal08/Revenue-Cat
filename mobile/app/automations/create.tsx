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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Sparkles,
  Zap,
  Send,
  ChevronRight,
  CheckCircle2,
  FileText,
  Clock,
  Mail,
  UserPlus,
  Flame,
  Bot,
  Sliders,
  Edit3,
  ShieldCheck,
  Plus,
} from 'lucide-react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors, Shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import {
  automationService,
  Automation,
  AutomationAIBuilderResponse,
} from '../../src/services/automationService';

export default function CreateAutomationScreen() {
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || '00000000-0000-0000-0000-000000000002';
  const params = useLocalSearchParams<{ templateId?: string; prompt?: string }>();

  const [activeTab, setActiveTab] = useState<'ai' | 'visual'>('ai');
  const [promptInput, setPromptInput] = useState(params.prompt || '');
  const [loadingAi, setLoadingAi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiPreview, setAiPreview] = useState<AutomationAIBuilderResponse | null>(null);

  // Visual Builder form state
  const [workflowName, setWorkflowName] = useState('Invoice Overdue Reminder');
  const [triggerType, setTriggerType] = useState('invoice_overdue');
  const [conditionField, setConditionField] = useState('Amount > ₹10,000');
  const [conditionOperator, setConditionOperator] = useState('AND Overdue days > 3');
  const [agentType, setAgentType] = useState('finance');
  const [actionType, setActionType] = useState('send_email');
  const [requiresApproval, setRequiresApproval] = useState(true);

  const examplePrompts = [
    {
      title: 'Follow up with inactive leads',
      prompt: 'Follow up with leads who have not replied for 7 days and send a personalized email.',
    },
    {
      title: 'Send invoice reminders',
      prompt: 'Every morning check overdue invoices and prepare payment reminder emails.',
    },
    {
      title: 'Weekly business summary',
      prompt: 'Every Monday morning generate my weekly business summary and notify me.',
    },
    {
      title: 'Prepare meeting briefs',
      prompt: 'Prepare client brief and intelligence summary 30 minutes before client meetings.',
    },
    {
      title: 'Create proposal when lead is qualified',
      prompt: 'Generate an initial scope and proposal draft when a lead reaches qualified stage.',
    },
  ];

  useEffect(() => {
    if (params.prompt) {
      handleGenerateAI(params.prompt);
    }
  }, [params.prompt]);

  const handleGenerateAI = async (textToUse?: string) => {
    const text = textToUse || promptInput;
    if (!text.trim()) {
      Alert.alert('Empty Prompt', 'Please describe what you want to automate.');
      return;
    }
    setLoadingAi(true);
    try {
      const response = await automationService.buildWithAI(text, businessId);
      setAiPreview(response);
      // Sync with visual builder state
      if (response.suggested_workflow) {
        const wf = response.suggested_workflow;
        setWorkflowName(wf.name);
        setTriggerType(wf.trigger_type);
        setAgentType(wf.agent_type || 'sales');
        setRequiresApproval(wf.requires_approval ?? true);
      }
    } catch (e: any) {
      Alert.alert('AI Builder Error', e?.message || 'Failed to parse automation prompt');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSaveAndActivate = async (customPayload?: Partial<Automation>) => {
    setSaving(true);
    try {
      const payload = customPayload || (aiPreview ? aiPreview.suggested_workflow : {
        business_id: businessId,
        name: workflowName,
        trigger_type: triggerType,
        trigger_config: {},
        condition_config: {},
        agent_type: agentType,
        action_config: { action_type: actionType, channel: 'email' },
        requires_approval: requiresApproval,
        status: 'active',
        enabled: true,
      });

      payload.business_id = businessId;
      payload.status = 'active';
      payload.enabled = true;

      const created = await automationService.createAutomation(payload as any);
      Alert.alert('Success', `Workflow "${created.name}" created and activated!`, [
        { text: 'View Automation', onPress: () => router.replace(`/automations/${created.id}` as any) },
        { text: 'Done', onPress: () => router.replace('/automations' as any) },
      ]);
    } catch (e: any) {
      if (e?.message?.includes('AUTOMATION_LIMIT_REACHED')) {
        Alert.alert(
          'Plan Limit Reached',
          'You have reached the maximum active automations for your current plan. Upgrade to unlock more.',
          [
            { text: 'Upgrade Plan', onPress: () => router.push('/paywall' as any) },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert('Error', e?.message || 'Failed to save automation');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {aiPreview && activeTab === 'ai' ? 'Review Generated Workflow' : 'Create Automation'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Segmented Control: AI Builder vs Visual Builder */}
      {!aiPreview && (
        <View style={styles.segmentedWrap}>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'ai' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('ai')}
          >
            <Sparkles size={14} color={activeTab === 'ai' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.segmentText, activeTab === 'ai' && styles.segmentTextActive]}>
              AI Builder
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, activeTab === 'visual' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('visual')}
          >
            <Sliders size={14} color={activeTab === 'visual' ? '#FFFFFF' : '#64748B'} />
            <Text style={[styles.segmentText, activeTab === 'visual' && styles.segmentTextActive]}>
              Visual Builder
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ================= MODE 1: AI BUILDER (INPUT) ================= */}
        {activeTab === 'ai' && !aiPreview && (
          <View>
            <Text style={styles.sectionHeading}>Describe what you want to automate</Text>
            <Text style={styles.sectionSubtitle}>
              Example: Follow up with leads who haven't replied for 7 days and send a personalized email.
            </Text>

            {/* Input Box */}
            <GlassCard style={styles.inputCard}>
              <TextInput
                style={styles.promptInput}
                placeholder="When a new website lead comes in, create a customer, create a lead and send a follow-up email."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={promptInput}
                onChangeText={setPromptInput}
                maxLength={500}
              />
              <View style={styles.inputFooter}>
                <Text style={styles.charCount}>{promptInput.length}/500</Text>
                <TouchableOpacity
                  style={[styles.sendBtn, !promptInput.trim() && styles.sendBtnDisabled]}
                  onPress={() => handleGenerateAI()}
                  disabled={loadingAi || !promptInput.trim()}
                >
                  {loadingAi ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Send size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </GlassCard>

            {/* Example Prompts */}
            <Text style={styles.examplesTitle}>Try these examples</Text>
            <View style={styles.examplesList}>
              {examplePrompts.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.exampleItem}
                  onPress={() => {
                    setPromptInput(item.prompt);
                    handleGenerateAI(item.prompt);
                  }}
                >
                  <View style={styles.exampleLeft}>
                    <Sparkles size={14} color="#059669" />
                    <Text style={styles.exampleText}>{item.title}</Text>
                  </View>
                  <ChevronRight size={16} color="#94A3B8" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ================= MODE 2: AI GENERATED WORKFLOW PREVIEW (SCREEN 3) ================= */}
        {activeTab === 'ai' && aiPreview && (
          <View>
            <Text style={styles.previewSubtitle}>
              AI has created the following automation based on your request. You can edit it before activating.
            </Text>

            {/* Step 1: Trigger Card */}
            <GlassCard style={styles.stepPreviewCard}>
              <View style={styles.stepHeaderRow}>
                <View style={styles.stepNumberBadge}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <View style={styles.stepHeaderContent}>
                  <View style={styles.stepTitleRow}>
                    <Text style={styles.stepSectionTitle}>Trigger</Text>
                    <TouchableOpacity onPress={() => setActiveTab('visual')}>
                      <Text style={styles.editActionText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.stepMainTitle}>{aiPreview.suggested_workflow.name}</Text>
                  <Text style={styles.stepDescText}>{aiPreview.suggested_workflow.description}</Text>
                </View>
              </View>
            </GlassCard>

            {/* Step 2: Actions Breakdown */}
            <View style={styles.actionsBlockHeader}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.actionsBlockTitle}>Actions ({aiPreview.steps.length} steps)</Text>
            </View>

            <View style={styles.stepsSequence}>
              {aiPreview.steps.map((step, idx) => (
                <GlassCard key={idx} style={styles.actionStepCard}>
                  <View style={styles.actionStepRow}>
                    <View style={styles.actionIconBox}>
                      {step.agent_badge ? (
                        <Bot size={16} color="#059669" />
                      ) : step.type === 'trigger' ? (
                        <Flame size={16} color="#EF4444" />
                      ) : (
                        <CheckCircle2 size={16} color="#2563EB" />
                      )}
                    </View>
                    <View style={styles.actionStepContent}>
                      <Text style={styles.actionStepTitle}>{step.title}</Text>
                      <Text style={styles.actionStepDesc}>{step.description}</Text>
                      {step.agent_badge && (
                        <View style={styles.agentBadge}>
                          <Bot size={10} color="#059669" />
                          <Text style={styles.agentBadgeText}>{step.agent_badge}</Text>
                        </View>
                      )}
                      {step.requires_approval && (
                        <View style={styles.approvalBadge}>
                          <ShieldCheck size={10} color="#D97706" />
                          <Text style={styles.approvalBadgeText}>Requires Approval</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </GlassCard>
              ))}
            </View>

            {/* Buttons */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => handleSaveAndActivate()}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Sparkles size={16} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Save & Activate</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.editManualBtn}
              onPress={() => {
                setActiveTab('visual');
                setAiPreview(null);
              }}
            >
              <Text style={styles.editManualBtnText}>Edit Manually</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= MODE 3: VISUAL WORKFLOW BUILDER (SCREEN 4) ================= */}
        {activeTab === 'visual' && (
          <View>
            <View style={styles.visualFlowWrap}>
              {/* Node 1: When this happens */}
              <View style={styles.nodeCardWrap}>
                <Text style={styles.nodeLabel}>When this happens</Text>
                <GlassCard style={styles.nodeCard}>
                  <View style={styles.nodeRow}>
                    <View style={[styles.nodeIconBox, { backgroundColor: '#ECFDF5' }]}>
                      <Zap size={18} color="#059669" />
                    </View>
                    <View style={styles.nodeContent}>
                      <Text style={styles.nodeTitle}>Invoice becomes overdue</Text>
                      <Text style={styles.nodeDesc}>Status changes to overdue</Text>
                    </View>
                    <TouchableOpacity style={styles.nodeEditBtn}>
                      <Edit3 size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              </View>

              <View style={styles.connectorLine} />

              {/* Node 2: If these conditions are met */}
              <View style={styles.nodeCardWrap}>
                <Text style={styles.nodeLabel}>If these conditions are met</Text>
                <GlassCard style={styles.nodeCard}>
                  <View style={styles.nodeRow}>
                    <View style={[styles.nodeIconBox, { backgroundColor: '#FEF3C7' }]}>
                      <Sliders size={18} color="#D97706" />
                    </View>
                    <View style={styles.nodeContent}>
                      <Text style={styles.nodeTitle}>Amount &gt; ₹10,000</Text>
                      <Text style={styles.nodeDesc}>AND Overdue days &gt; 3</Text>
                    </View>
                    <ChevronRight size={16} color="#94A3B8" />
                  </View>
                </GlassCard>
              </View>

              <View style={styles.connectorLine} />

              {/* Node 3: AI Agent / Logic */}
              <View style={styles.nodeCardWrap}>
                <Text style={styles.nodeLabel}>AI Agent / Logic</Text>
                <GlassCard style={styles.nodeCard}>
                  <View style={styles.nodeRow}>
                    <View style={[styles.nodeIconBox, { backgroundColor: '#F5F3FF' }]}>
                      <Sparkles size={18} color="#7C3AED" />
                    </View>
                    <View style={styles.nodeContent}>
                      <Text style={styles.nodeTitle}>Finance Agent</Text>
                      <Text style={styles.nodeDesc}>Generate payment reminder</Text>
                    </View>
                    <ChevronRight size={16} color="#94A3B8" />
                  </View>
                </GlassCard>
              </View>

              <View style={styles.connectorLine} />

              {/* Node 4: Then do this */}
              <View style={styles.nodeCardWrap}>
                <Text style={styles.nodeLabel}>Then do this</Text>
                <GlassCard style={styles.nodeCard}>
                  <View style={styles.nodeRow}>
                    <View style={[styles.nodeIconBox, { backgroundColor: '#EFF6FF' }]}>
                      <Send size={18} color="#2563EB" />
                    </View>
                    <View style={styles.nodeContent}>
                      <Text style={styles.nodeTitle}>Send Email to Customer</Text>
                      <Text style={[styles.nodeDesc, { color: '#D97706', fontWeight: '600' }]}>
                        Requires your approval
                      </Text>
                    </View>
                    <ChevronRight size={16} color="#94A3B8" />
                  </View>
                </GlassCard>
              </View>
            </View>

            {/* Approval Toggle */}
            <GlassCard style={styles.approvalToggleCard}>
              <View style={styles.approvalToggleRow}>
                <View>
                  <Text style={styles.approvalToggleTitle}>Require Human Approval</Text>
                  <Text style={styles.approvalToggleDesc}>Hold external emails for your tap-to-send review.</Text>
                </View>
                <Switch
                  value={requiresApproval}
                  onValueChange={setRequiresApproval}
                  trackColor={{ false: '#E2E8F0', true: '#059669' }}
                />
              </View>
            </GlassCard>

            {/* Save & Activate Button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => handleSaveAndActivate()}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Sparkles size={16} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Save & Activate</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
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
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  segmentedWrap: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#059669',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 18,
  },
  inputCard: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 24,
  },
  promptInput: {
    fontSize: 14,
    color: '#0F172A',
    minHeight: 90,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  inputFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#94A3B8',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  examplesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  examplesList: {
    gap: 8,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  exampleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  exampleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  previewSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
  stepPreviewCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepHeaderContent: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  stepSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
    textTransform: 'uppercase',
  },
  editActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  stepMainTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  stepDescText: {
    fontSize: 12,
    color: '#64748B',
  },
  actionsBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  actionsBlockTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepsSequence: {
    gap: 10,
    marginBottom: 24,
  },
  actionStepCard: {
    padding: 14,
    borderRadius: 14,
  },
  actionStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  actionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionStepContent: {
    flex: 1,
  },
  actionStepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  actionStepDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
  },
  agentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  agentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  approvalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  approvalBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    ...Shadows.sm,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editManualBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editManualBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  visualFlowWrap: {
    marginBottom: 20,
  },
  nodeCardWrap: {
    gap: 6,
  },
  nodeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginLeft: 4,
  },
  nodeCard: {
    padding: 14,
    borderRadius: 14,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nodeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeContent: {
    flex: 1,
  },
  nodeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  nodeDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  nodeEditBtn: {
    padding: 4,
  },
  connectorLine: {
    width: 2,
    height: 18,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginVertical: 4,
  },
  approvalToggleCard: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
  },
  approvalToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  approvalToggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  approvalToggleDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
