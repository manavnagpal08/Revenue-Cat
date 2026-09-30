import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  Send,
  Trash2,
  TrendingUp,
  FileText,
  Users,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Receipt,
  X,
  Bot,
  User,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { MarkdownText } from '../../src/components/MarkdownText';
import { aiService } from '../../src/services/aiService';
import { useAuthStore } from '../../src/store/authStore';
import { AIMessage, AIAgentActionCard } from '../../src/types';

export default function AICommandCenterScreen() {
  const router = useRouter();
  const { currentBusiness, profile } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>('conv-' + Date.now());

  // Confirmation modal state for write actions
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      agent: 'supervisor',
      content:
        `Good day, ${profile?.full_name?.split(' ')[0] || 'Founder'}. I am your SoloCEO AI Operating System.\n\n` +
        `I am actively monitoring **${currentBusiness?.name || 'your workspace'}** across sales pipeline, cash collections, and project scoping.\n\n` +
        `How can I assist your business today?`,
      created_at: new Date().toISOString(),
    },
  ]);

  const suggestedPrompts = [
    'Which leads need follow-up?',
    'Who owes me money?',
    'Create proposal for Acme Interiors',
    'What should I focus on today?',
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || !currentBusiness?.id || loading) return;

    const userMsg: AIMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      content: textToSend.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiService.sendCommand(currentBusiness.id, textToSend.trim(), conversationId);
      setConversationId(res.conversation_id);

      const assistantMsg: AIMessage = {
        id: 'msg-' + (Date.now() + 1),
        sender: 'assistant',
        agent: res.agent,
        content: res.message,
        structured_data: res.structured_data,
        action_cards: res.action_cards,
        requires_confirmation: res.requires_confirmation,
        pending_action: res.pending_action,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // If action requires confirmation, pop the modal
      if (res.requires_confirmation && res.pending_action) {
        setPendingAction(res.pending_action);
        setConfirmModalVisible(true);
      }
    } catch (err: any) {
      const errorMsg: AIMessage = {
        id: 'err-' + Date.now(),
        sender: 'assistant',
        agent: 'supervisor',
        content: `Error processing query: ${err.message || 'Unable to connect to AI engine.'}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    }
  };

  const handleActionCardPress = (card: AIAgentActionCard) => {
    const payload = card.action_payload || {};
    const action = payload.action;

    if (action === 'VIEW_LEAD' && payload.lead_id) {
      router.push(`/leads/${payload.lead_id}` as any);
    } else if (action === 'VIEW_INVOICE' && payload.invoice_id) {
      router.push(`/invoices/${payload.invoice_id}` as any);
    } else if (action === 'VIEW_PROPOSAL' && payload.proposal_id) {
      router.push(`/proposals/${payload.proposal_id}` as any);
    } else if (action === 'VIEW_CUSTOMER' && payload.customer_id) {
      router.push(`/customers/${payload.customer_id}` as any);
    } else if (action === 'VIEW_SALES') {
      router.push('/(tabs)/sales');
    } else if (action === 'VIEW_INVOICES') {
      router.push('/(tabs)/finance');
    } else if (action === 'CREATE_PROPOSAL') {
      setPendingAction({
        action_type: 'CREATE_PROPOSAL',
        payload: {
          title: card.title.replace('Create Proposal: ', ''),
          total_value: 75000,
        },
      });
      setConfirmModalVisible(true);
    }
  };

  const handleExecuteConfirmedAction = async () => {
    if (!pendingAction || !currentBusiness?.id) return;
    setConfirmLoading(true);
    try {
      const result = await aiService.confirmAction(
        currentBusiness.id,
        pendingAction.action_type,
        pendingAction.payload
      );

      setConfirmModalVisible(false);
      Alert.alert('Action Executed', 'Action successfully confirmed and written to your database.');

      const successMsg: AIMessage = {
        id: 'success-' + Date.now(),
        sender: 'assistant',
        agent: 'supervisor',
        content: `Action **${pendingAction.action_type}** executed successfully! Record updated in database.`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, successMsg]);
      setPendingAction(null);
    } catch (err: any) {
      Alert.alert('Action Error', err.message || 'Failed to execute action');
    } finally {
      setConfirmLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome-msg',
        sender: 'assistant',
        agent: 'supervisor',
        content: `Chat cleared. Ready for your next query on **${currentBusiness?.name || 'your workspace'}**.`,
        created_at: new Date().toISOString(),
      },
    ]);
    setConversationId('conv-' + Date.now());
  };

  const getAgentBadge = (agent?: string) => {
    switch (agent) {
      case 'sales':
        return { name: 'SALES AGENT', color: Colors.info, bg: '#E0F2FE' };
      case 'finance':
        return { name: 'FINANCE AGENT', color: Colors.warning, bg: '#FEF3C7' };
      case 'proposal':
        return { name: 'PROPOSAL AGENT', color: Colors.primary, bg: Colors.primarySubtle };
      case 'customer_support':
        return { name: 'CUSTOMER INTELLIGENCE', color: Colors.success, bg: Colors.successBg };
      case 'general_business':
        return { name: 'CHIEF OF STAFF', color: Colors.primaryDark, bg: '#F1F5F9' };
      default:
        return { name: 'AI SUPERVISOR', color: Colors.primary, bg: Colors.primarySubtle };
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.supervisorIconBadge}>
            <Sparkles size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Command Center</Text>
            <Text style={styles.headerSub}>{currentBusiness?.name || 'Workspace'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.clearBtn} onPress={clearChat}>
          <Trash2 size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {/* Suggested Quick Prompts */}
          {messages.length <= 2 && (
            <View style={styles.promptsContainer}>
              <Text style={styles.promptsHeader}>QUICK COMMANDS</Text>
              <View style={styles.promptsGrid}>
                {suggestedPrompts.map((p, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.promptChip}
                    onPress={() => handleSend(p)}
                  >
                    <Text style={styles.promptChipText}>{p}</Text>
                    <ArrowRight size={12} color={Colors.primary} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Conversation Messages */}
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            const badge = getAgentBadge(m.agent);

            return (
              <View
                key={m.id}
                style={[
                  styles.messageWrapper,
                  isUser ? styles.messageWrapperUser : styles.messageWrapperAi,
                ]}
              >
                {!isUser && (
                  <View style={[styles.agentBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.agentBadgeText, { color: badge.color }]}>
                      {badge.name}
                    </Text>
                  </View>
                )}

                <GlassCard
                  variant={isUser ? 'subtle' : 'elevated'}
                  style={[styles.messageCard, isUser ? styles.userCard : styles.aiCard]}
                >
                  <MarkdownText content={m.content} isUser={isUser} />

                  {/* Render Action Cards */}
                  {m.action_cards && m.action_cards.length > 0 && (
                    <View style={styles.actionCardsContainer}>
                      {m.action_cards.map((card, cIdx) => (
                        <TouchableOpacity
                          key={cIdx}
                          style={styles.actionCard}
                          activeOpacity={0.8}
                          onPress={() => handleActionCardPress(card)}
                        >
                          <View style={styles.actionCardContent}>
                            <Text style={styles.actionCardTitle}>{card.title}</Text>
                            <Text style={styles.actionCardDesc}>{card.description}</Text>
                          </View>
                          <View style={styles.actionCardBtn}>
                            <Text style={styles.actionCardBtnText}>
                              {card.primary_action_label || 'Execute'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </GlassCard>
              </View>
            );
          })}

          {loading && (
            <View style={styles.aiLoadingBox}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.aiLoadingText}>AI Operating System analyzing data...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask anything about leads, invoices, proposals..."
            placeholderTextColor={Colors.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || loading}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Confirmation Modal for Write Actions */}
      <Modal visible={confirmModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalTop}>
              <View style={styles.modalTitleRow}>
                <AlertCircle size={20} color={Colors.primary} />
                <Text style={styles.modalTitle}>Confirm AI Action</Text>
              </View>
              <TouchableOpacity onPress={() => setConfirmModalVisible(false)}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              The AI Agent is requesting confirmation to execute a write action on your business workspace:
            </Text>

            <GlassCard style={styles.payloadBox}>
              <Text style={styles.payloadType}>{pendingAction?.action_type}</Text>
              <Text style={styles.payloadData}>
                {JSON.stringify(pendingAction?.payload, null, 2)}
              </Text>
            </GlassCard>

            <View style={styles.modalActions}>
              <GlassButton
                title="Cancel"
                variant="glass"
                onPress={() => setConfirmModalVisible(false)}
                style={{ flex: 1 }}
              />
              <GlassButton
                title="Confirm & Execute"
                variant="primary"
                onPress={handleExecuteConfirmedAction}
                loading={confirmLoading}
                style={{ flex: 1 }}
              />
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  supervisorIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  promptsContainer: {
    marginBottom: 16,
  },
  promptsHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  promptsGrid: {
    gap: 8,
  },
  promptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    ...Shadows.sm,
  },
  promptChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  messageWrapperUser: {
    alignItems: 'flex-end',
  },
  messageWrapperAi: {
    alignItems: 'flex-start',
  },
  agentBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  agentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  messageCard: {
    maxWidth: '92%',
    padding: 15,
    borderRadius: 20,
  },
  userCard: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
    ...Shadows.glowSubtle,
  },
  aiCard: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderColor: Colors.borderGlass,
    ...Shadows.card,
  },
  messageText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionCardsContainer: {
    marginTop: 14,
    gap: 10,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.borderEmerald,
    borderRadius: 16,
    padding: 14,
    ...Shadows.sm,
  },
  actionCardContent: {
    marginBottom: 10,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  actionCardDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },
  actionCardBtn: {
    backgroundColor: Colors.primarySubtle,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  actionCardBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  aiLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: Colors.primarySubtle,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  aiLoadingText: {
    fontSize: 13,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginBottom: Platform.OS === 'ios' ? 92 : 82,
    ...Shadows.card,
  },
  input: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 11,
    fontSize: 14,
    color: Colors.text,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.border,
    shadowOpacity: 0,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    ...Shadows.glass,
  },
  modalTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  modalDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  payloadBox: {
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  payloadType: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  payloadData: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
});
