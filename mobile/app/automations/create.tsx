import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Zap,
  Bot,
  Sparkles,
  CheckCircle2,
  Mail,
  Clock,
  AlertCircle,
  MessageSquare,
  FileText,
  Shield,
  Send,
  RefreshCw,
} from 'lucide-react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { Colors, Shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/store/authStore';
import { automationService } from '../../src/services/automationService';

export default function AutomationBuilderScreen() {
  const { currentBusiness } = useAuthStore();
  const businessId = currentBusiness?.id || '00000000-0000-0000-0000-000000000002';
  const params = useLocalSearchParams<{ templateId?: string; mode?: string }>();

  const [mode, setMode] = useState<'template' | 'ai' | 'custom'>(
    (params.mode as any) || (params.templateId ? 'template' : 'custom')
  );

  // Form State
  const [name, setName] = useState('Follow up inactive leads');
  const [description, setDescription] = useState('Auto-send personalized follow-up emails to leads who haven\'t replied in 7 days.');
  const [triggerType, setTriggerType] = useState('lead_inactive');
  const [inactivityDays, setInactivityDays] = useState('7');
  const [agentType, setAgentType] = useState('sales');
  const [channel, setChannel] = useState<'email' | 'whatsapp' | 'task' | 'notification'>('email');
  const [prompt, setPrompt] = useState(
    'Write a friendly and professional follow-up email for a lead who hasn\'t replied in 7 days. Mention their project interest and offer a quick call to discuss next steps.'
  );
  const [tone, setTone] = useState<'professional' | 'friendly' | 'persuasive'>('friendly');
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [aiNaturalQuery, setAiNaturalQuery] = useState('');
  const [previewText, setPreviewText] = useState(
    'Subject: Quick follow-up on your project\n\nHi {name},\n\nI hope you\'re doing well! I wanted to follow up on our previous conversation regarding your project scope. If you\'re still interested, I\'d be delighted to schedule a brief 10-minute check-in.\n\nBest regards,\nSoloCEO Team'
  );
  const [saving, setSaving] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);

  // Pre-fill from template if provided
  useEffect(() => {
    if (params.templateId) {
      loadTemplate(params.templateId);
    }
  }, [params.templateId]);

  const loadTemplate = async (templateId: string) => {
    try {
      const templates = await automationService.getTemplates();
      const tpl = templates.find((t) => t.id === templateId);
      if (tpl) {
        setName(tpl.name);
        setDescription(tpl.description);
        setTriggerType(tpl.trigger_type);
        setAgentType(tpl.configuration.agent_type || 'sales');
        setChannel(tpl.configuration.action_config?.channel || 'email');
        setPrompt(tpl.configuration.action_config?.prompt || '');
        setTone(tpl.configuration.action_config?.tone || 'professional');
        setRequiresApproval(tpl.configuration.requires_approval ?? true);
      }
    } catch (e) {
      console.warn('Template load error:', e);
    }
  };

  const handleAiNaturalSubmit = () => {
    if (!aiNaturalQuery.trim()) return;
    const query = aiNaturalQuery.toLowerCase();
    if (query.includes('invoice') || query.includes('overdue') || query.includes('pay')) {
      setName('Overdue Invoice Automation');
      setDescription('Automatically notify clients with overdue invoices.');
      setTriggerType('invoice_overdue');
      setAgentType('finance');
      setChannel('email');
      setPrompt('Generate a polite but firm overdue payment reminder with due date and balance.');
      setTone('professional');
    } else if (query.includes('lead') || query.includes('follow') || query.includes('inactive')) {
      setName('Smart Lead Follow-Up');
      setDescription('Follow up with inactive leads after 5 days.');
      setTriggerType('lead_inactive');
      setAgentType('sales');
      setChannel('email');
      setPrompt('Draft an engaging follow-up asking if they want to move forward with their project.');
      setTone('friendly');
    } else {
      setName('Daily AI Business Summary');
      setDescription('Generate executive business briefing every morning.');
      setTriggerType('daily_summary');
      setAgentType('supervisor');
      setChannel('notification');
      setPrompt('Summarize top leads, cash collections, and open tasks for today.');
      setTone('professional');
      setRequiresApproval(false);
    }
    setMode('custom');
  };

  const regeneratePreview = () => {
    setGeneratingPreview(true);
    setTimeout(() => {
      if (channel === 'email') {
        setPreviewText(
          `Subject: Update regarding your project inquiry\n\nHi {name},\n\nJust checking in following our last discussion. We have reserved project slots for next month and would love to help you bring this vision to life.\n\nLet me know if this week works for a quick discussion!\n\nBest,\nSoloCEO`
        );
      } else if (channel === 'whatsapp') {
        setPreviewText(
          `Hi {name}! Just following up on your project inquiry. Let us know if you would like to schedule a quick call this week.`
        );
      } else {
        setPreviewText(
          `[Task Generated]: Review lead proposal requirements and schedule consultation call.`
        );
      }
      setGeneratingPreview(false);
    }, 400);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter an automation name.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        business_id: businessId,
        name: name.trim(),
        description: description.trim(),
        trigger_type: triggerType,
        trigger_config: {
          inactivity_days: parseInt(inactivityDays) || 7,
        },
        condition_config: {
          rules: [
            { field: 'lead.status', operator: '!=', value: 'lost' },
          ],
          match_type: 'all',
        },
        agent_type: agentType,
        action_config: {
          channel,
          action_type: channel === 'email' ? 'send_email' : channel === 'whatsapp' ? 'send_whatsapp' : 'send_notification',
          prompt: prompt.trim(),
          tone,
        },
        status: 'active',
        enabled: true,
        requires_approval: requiresApproval,
      };

      await automationService.createAutomation(payload as any);
      Alert.alert('Success', 'Automation created and activated successfully!', [
        { text: 'OK', onPress: () => router.replace('/automations' as any) },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create automation');
    } finally {
      setSaving(false);
    }
  };

  const triggersList = [
    { type: 'lead_inactive', title: 'Lead is inactive', desc: 'No reply for specified days', icon: Clock },
    { type: 'website_lead_received', title: 'New website lead', desc: 'Captured from contact form', icon: Mail },
    { type: 'invoice_overdue', title: 'Invoice is overdue', desc: 'Payment passes due date', icon: AlertCircle },
    { type: 'daily_summary', title: 'Daily business brief', desc: 'Scheduled morning briefing', icon: Zap },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Automation</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Mode Selector Tabs */}
      <View style={styles.modeTabsWrap}>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'template' && styles.modeTabActive]}
          onPress={() => router.push('/automations/templates' as any)}
        >
          <Text style={[styles.modeTabText, mode === 'template' && styles.modeTabTextActive]}>
            Templates
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'ai' && styles.modeTabActive]}
          onPress={() => setMode('ai')}
        >
          <Sparkles size={12} color={mode === 'ai' ? '#FFFFFF' : Colors.textSecondary} />
          <Text style={[styles.modeTabText, mode === 'ai' && styles.modeTabTextActive]}>
            AI Assist
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'custom' && styles.modeTabActive]}
          onPress={() => setMode('custom')}
        >
          <Text style={[styles.modeTabText, mode === 'custom' && styles.modeTabTextActive]}>
            Custom Builder
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {mode === 'ai' ? (
          /* AI Assist Mode */
          <GlassCard style={styles.aiCard}>
            <View style={styles.aiHeaderRow}>
              <Sparkles size={20} color={Colors.primary} />
              <Text style={styles.aiCardTitle}>Describe your automation</Text>
            </View>
            <Text style={styles.aiCardDesc}>
              Tell SoloCEO what you'd like to automate. Example: "When an invoice is 3 days overdue, draft a polite payment reminder via email."
            </Text>
            <TextInput
              style={styles.aiInput}
              placeholder="E.g., Send follow-up email to leads who haven't responded in 5 days..."
              placeholderTextColor={Colors.textMuted}
              value={aiNaturalQuery}
              onChangeText={setAiNaturalQuery}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity style={styles.aiSubmitBtn} onPress={handleAiNaturalSubmit}>
              <Sparkles size={16} color="#FFFFFF" />
              <Text style={styles.aiSubmitBtnText}>Generate Workflow</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          /* Visual Workflow Builder Nodes */
          <View style={styles.builderContainer}>
            {/* General Info */}
            <GlassCard style={styles.nodeCard}>
              <Text style={styles.sectionLabel}>WORKFLOW DETAILS</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="Automation Name"
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.descInput}
                placeholder="Description"
                placeholderTextColor={Colors.textMuted}
                value={description}
                onChangeText={setDescription}
              />
            </GlassCard>

            {/* Step 1: Trigger Node */}
            <GlassCard style={styles.nodeCard}>
              <View style={styles.nodeHeader}>
                <View style={[styles.stepBadge, { backgroundColor: '#EEF2FF' }]}>
                  <Zap size={14} color="#4F46E5" />
                  <Text style={styles.stepNum}>1</Text>
                </View>
                <Text style={styles.nodeTitle}>Trigger</Text>
              </View>

              <Text style={styles.nodeHelp}>Choose when this automation should run:</Text>

              <View style={styles.triggersGrid}>
                {triggersList.map((trig) => {
                  const Icon = trig.icon;
                  const isSelected = triggerType === trig.type;
                  return (
                    <TouchableOpacity
                      key={trig.type}
                      style={[styles.trigOption, isSelected && styles.trigOptionSelected]}
                      onPress={() => setTriggerType(trig.type)}
                    >
                      <View style={styles.trigLeft}>
                        <Icon size={16} color={isSelected ? Colors.primary : Colors.textSecondary} />
                        <View>
                          <Text style={[styles.trigTitle, isSelected && styles.trigTitleSelected]}>
                            {trig.title}
                          </Text>
                          <Text style={styles.trigDesc}>{trig.desc}</Text>
                        </View>
                      </View>
                      {isSelected ? <CheckCircle2 size={16} color={Colors.primary} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </GlassCard>

            {/* Step 2: AI Agent & Action Node */}
            <GlassCard style={styles.nodeCard}>
              <View style={styles.nodeHeader}>
                <View style={[styles.stepBadge, { backgroundColor: '#ECFDF5' }]}>
                  <Bot size={14} color="#059669" />
                  <Text style={[styles.stepNum, { color: '#059669' }]}>2</Text>
                </View>
                <Text style={styles.nodeTitle}>AI Agent Reasoning</Text>
              </View>

              {/* Agent Selector */}
              <Text style={styles.fieldLabel}>ASSIGNED AI AGENT</Text>
              <View style={styles.agentPillsRow}>
                {['sales', 'finance', 'proposal', 'customer_support'].map((agent) => (
                  <TouchableOpacity
                    key={agent}
                    style={[styles.agentPill, agentType === agent && styles.agentPillSelected]}
                    onPress={() => setAgentType(agent)}
                  >
                    <Text
                      style={[
                        styles.agentPillText,
                        agentType === agent && styles.agentPillTextSelected,
                      ]}
                    >
                      {agent.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Channel Selector */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>ACTION CHANNEL</Text>
              <View style={styles.channelRow}>
                {[
                  { id: 'email', label: 'Email', icon: Mail },
                  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                  { id: 'notification', label: 'In-App Alert', icon: AlertCircle },
                ].map((ch) => {
                  const Icon = ch.icon;
                  const isChSelected = channel === ch.id;
                  return (
                    <TouchableOpacity
                      key={ch.id}
                      style={[styles.channelBtn, isChSelected && styles.channelBtnSelected]}
                      onPress={() => setChannel(ch.id as any)}
                    >
                      <Icon size={14} color={isChSelected ? '#FFFFFF' : Colors.textSecondary} />
                      <Text
                        style={[
                          styles.channelBtnText,
                          isChSelected && styles.channelBtnTextSelected,
                        ]}
                      >
                        {ch.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Prompt for AI */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>PROMPT FOR AI</Text>
              <TextInput
                style={styles.promptInput}
                value={prompt}
                onChangeText={setPrompt}
                multiline
                numberOfLines={3}
                placeholder="Instructions for the AI..."
                placeholderTextColor={Colors.textMuted}
              />

              {/* Tone Selection */}
              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>AI TONE</Text>
              <View style={styles.toneRow}>
                {(['professional', 'friendly', 'persuasive'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.toneBtn, tone === t && styles.toneBtnSelected]}
                    onPress={() => setTone(t)}
                  >
                    <Text style={[styles.toneBtnText, tone === t && styles.toneBtnTextSelected]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Preview Box */}
              <View style={styles.previewBox}>
                <View style={styles.previewHeader}>
                  <Text style={styles.previewTitle}>Live Output Preview</Text>
                  <TouchableOpacity
                    style={styles.regenBtn}
                    onPress={regeneratePreview}
                    disabled={generatingPreview}
                  >
                    <RefreshCw size={12} color={Colors.primary} />
                    <Text style={styles.regenText}>Regenerate</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.previewContent}>{previewText}</Text>
              </View>
            </GlassCard>

            {/* Step 3: Human Approval Setting */}
            <GlassCard style={styles.nodeCard}>
              <View style={styles.nodeHeader}>
                <View style={[styles.stepBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Shield size={14} color="#D97706" />
                  <Text style={[styles.stepNum, { color: '#D97706' }]}>3</Text>
                </View>
                <Text style={styles.nodeTitle}>Safety &amp; Human Approval</Text>
              </View>

              <View style={styles.approvalToggleRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.approvalTitle}>Require My Approval</Text>
                  <Text style={styles.approvalDesc}>
                    Generate draft and notify you in SoloCEO before sending external communications.
                  </Text>
                </View>
                <Switch
                  value={requiresApproval}
                  onValueChange={setRequiresApproval}
                  trackColor={{ false: '#E2E8F0', true: '#C7D2FE' }}
                  thumbColor={requiresApproval ? '#4F46E5' : '#94A3B8'}
                />
              </View>
            </GlassCard>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveBtn}
              activeOpacity={0.88}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Save &amp; Activate Automation</Text>
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
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  modeTabsWrap: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  aiCard: {
    padding: 16,
    ...Shadows.card,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  aiCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  aiCardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  aiInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 14,
  },
  aiSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  aiSubmitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  builderContainer: {
    gap: 14,
  },
  nodeCard: {
    padding: 16,
    ...Shadows.card,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  nameInput: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingVertical: 6,
    marginBottom: 8,
  },
  descInput: {
    fontSize: 13,
    color: Colors.textSecondary,
    paddingVertical: 4,
  },
  nodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  nodeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  nodeHelp: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  triggersGrid: {
    gap: 8,
  },
  trigOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trigOptionSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: Colors.primary,
  },
  trigLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  trigTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  trigTitleSelected: {
    color: Colors.primary,
  },
  trigDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  agentPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  agentPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  agentPillSelected: {
    backgroundColor: Colors.primary,
  },
  agentPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  agentPillTextSelected: {
    color: '#FFFFFF',
  },
  channelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  channelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  channelBtnSelected: {
    backgroundColor: Colors.primary,
  },
  channelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  channelBtnTextSelected: {
    color: '#FFFFFF',
  },
  promptInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    color: Colors.text,
    textAlignVertical: 'top',
    minHeight: 65,
  },
  toneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toneBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  toneBtnSelected: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  toneBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  toneBtnTextSelected: {
    color: Colors.primary,
  },
  previewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  previewTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  regenText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  previewContent: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 17,
  },
  approvalToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  approvalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  approvalDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
    marginTop: 2,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 8,
    ...Shadows.card,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
});
