import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Send, Bot, User, ArrowUpRight, DollarSign, Users, FileText } from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  agent?: 'supervisor' | 'sales' | 'finance' | 'proposal';
  text: string;
  actionCard?: {
    type: string;
    title: string;
    details: string;
    actionLabel: string;
  };
}

export default function AIScreen() {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      agent: 'supervisor',
      text: 'Good morning Alex! I am your AI Supervisor. I am continuously monitoring your CRM, invoices, proposals, and pipeline. What would you like to get done?',
    },
  ]);

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    setTimeout(() => {
      let aiResponse: Message;
      const lower = query.toLowerCase();

      if (lower.includes('money') || lower.includes('owe') || lower.includes('overdue')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          agent: 'finance',
          text: 'I checked your invoices. You have 3 overdue invoices totaling ₹31,200.',
          actionCard: {
            type: 'finance',
            title: 'Overdue Breakdown',
            details: '• Acme Interiors: ₹18,000 (10d late)\n• XYZ Studio: ₹8,500 (5d late)\n• Rahul Designs: ₹4,700 (3d late)',
            actionLabel: 'Send All Reminders',
          },
        };
      } else if (lower.includes('lead') || lower.includes('call') || lower.includes('follow')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          agent: 'sales',
          text: 'Acme Interiors is your highest-value deal at ₹85,000. They have been waiting for 6 days since the proposal was sent.',
          actionCard: {
            type: 'sales',
            title: 'Recommended Follow-up',
            details: 'Draft email to Vikram Mehta ready: "Hi Vikram, just checking in regarding the mobile app proposal..."',
            actionLabel: 'Review & Send Draft',
          },
        };
      } else if (lower.includes('proposal') || lower.includes('create')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          agent: 'proposal',
          text: 'I can generate a customized proposal. Which customer and project would you like me to scope?',
          actionCard: {
            type: 'proposal',
            title: 'New Proposal Draft',
            details: 'Template: Design & Development Sprint (₹85,000)',
            actionLabel: 'Configure & Generate PDF',
          },
        };
      } else {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          agent: 'supervisor',
          text: `I analyzed your business data regarding "${query}". Your monthly revenue is ₹184,500 (+18.4%), 3 active deals in pipeline, and cash collection rate is 85.5%.`,
        };
      }

      setMessages((prev) => [...prev, aiResponse]);
      setLoading(false);
    }, 900);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.supervisorAvatar}>
            <Sparkles size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>SoloCEO AI</Text>
            <Text style={styles.headerStatus}>Supervisor • Sales • Finance • Proposals</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatContainer}
        >
          {/* Quick suggestions if few messages */}
          {messages.length <= 2 ? (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>QUICK COMMANDS</Text>
              <View style={styles.pillContainer}>
                <TouchableOpacity
                  style={styles.pill}
                  onPress={() => handleSend('Who owes me money?')}
                >
                  <DollarSign size={14} color={Colors.warning} />
                  <Text style={styles.pillText}>Who owes me money?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pill}
                  onPress={() => handleSend('Which leads should I follow up with?')}
                >
                  <Users size={14} color={Colors.info} />
                  <Text style={styles.pillText}>Leads to follow up</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pill}
                  onPress={() => handleSend('Create a proposal for Acme')}
                >
                  <FileText size={14} color={Colors.primary} />
                  <Text style={styles.pillText}>Create proposal</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {messages.map((msg) => {
            const isAssistant = msg.sender === 'assistant';
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  isAssistant ? styles.assistantWrapper : styles.userWrapper,
                ]}
              >
                {isAssistant ? (
                  <View style={styles.agentTag}>
                    <Text style={styles.agentTagText}>
                      {msg.agent?.toUpperCase() || 'SUPERVISOR'}
                    </Text>
                  </View>
                ) : null}

                <View
                  style={[
                    styles.messageBubble,
                    isAssistant ? styles.assistantBubble : styles.userBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isAssistant ? styles.assistantText : styles.userText,
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>

                {msg.actionCard ? (
                  <GlassCard variant="elevated" style={styles.actionCard}>
                    <Text style={styles.actionCardTitle}>{msg.actionCard.title}</Text>
                    <Text style={styles.actionCardDetails}>{msg.actionCard.details}</Text>
                    <GlassButton
                      title={msg.actionCard.actionLabel}
                      variant="primary"
                      size="sm"
                      icon={<ArrowUpRight size={14} color="#FFFFFF" />}
                      style={{ marginTop: 10 }}
                    />
                  </GlassCard>
                ) : null}
              </View>
            );
          })}

          {loading ? (
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>SoloCEO is reasoning across your data...</Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Ask your business anything..."
            placeholderTextColor={Colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.glass,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  supervisorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  headerStatus: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chatContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  suggestionsContainer: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  pillContainer: {
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    ...Shadows.card,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  messageWrapper: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  assistantWrapper: {
    alignSelf: 'flex-start',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  agentTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  agentTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  assistantBubble: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    ...Shadows.card,
  },
  userBubble: {
    backgroundColor: Colors.primary,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  assistantText: {
    color: Colors.text,
  },
  userText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  actionCard: {
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  actionCardDetails: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  inputContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 88 : 80,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...Shadows.glass,
  },
  textInput: {
    flex: 1,
    height: 44,
    fontSize: 14,
    color: Colors.text,
    paddingHorizontal: 8,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
});
