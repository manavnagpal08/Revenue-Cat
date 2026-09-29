import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Phone,
  MoreVertical,
  Sparkles,
  ChevronDown,
  Edit3,
  Send,
  CheckCircle2,
} from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';

export default function ConversationDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'conversation' | 'details' | 'insights'>('conversation');
  const [tone, setTone] = useState('Professional');
  const [suggestedText, setSuggestedText] = useState(
    "Hi there,\n\nI've updated the proposal with the new pricing and added a dedicated maintenance section as requested. Please find it attached.\n\nLet me know if you'd like any changes!"
  );
  const [isEditing, setIsEditing] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'customer',
      text: 'Hi, can you share the updated proposal with the new pricing?',
      time: '10:24 AM',
    },
    {
      id: 'm2',
      sender: 'me',
      text: "Of course! I'll send the revised proposal by EOD. It will include the new timeline and pricing.",
      time: '10:28 AM',
    },
    {
      id: 'm3',
      sender: 'customer',
      text: 'Can you add a section for maintenance as well?',
      time: '10:30 AM',
    },
  ]);

  const handleSendReply = () => {
    setMessages((prev) => [
      ...prev,
      {
        id: 'm-' + Date.now(),
        sender: 'me',
        text: suggestedText,
        time: 'Just now',
      },
    ]);
    Alert.alert('Reply Sent! 🚀', 'Your AI-crafted response has been sent to Acme Interiors.');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.customerHeaderCenter}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarMiniText}>AI</Text>
          </View>
          <View>
            <View style={styles.customerNameRow}>
              <Text style={styles.customerName}>Acme Interiors</Text>
            </View>
            <Text style={styles.customerEmail}>acme@interiors.com</Text>
          </View>
          <View style={styles.activeTag}>
            <Text style={styles.activeTagText}>Active</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn}>
            <Phone size={18} color="#059669" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <MoreVertical size={18} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'conversation' && styles.tabBtnActive]}
          onPress={() => setActiveTab('conversation')}
        >
          <Text style={[styles.tabText, activeTab === 'conversation' && styles.tabTextActive]}>
            Conversation
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'details' && styles.tabBtnActive]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>
            Details
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'insights' && styles.tabBtnActive]}
          onPress={() => setActiveTab('insights')}
        >
          <Text style={[styles.tabText, activeTab === 'insights' && styles.tabTextActive]}>
            AI Insights
          </Text>
        </TouchableOpacity>
      </View>

      {/* Messages Scroll Area */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {messages.map((msg) => {
          const isMe = msg.sender === 'me';
          return (
            <View key={msg.id} style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
              <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
                <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
                  {msg.text}
                </Text>
                <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeOther]}>
                  {msg.time}
                </Text>
              </View>
            </View>
          );
        })}

        {/* AI Suggested Reply Card */}
        <View style={styles.aiReplyCard}>
          <View style={styles.aiReplyHeader}>
            <View style={styles.aiTitleRow}>
              <Sparkles size={14} color="#059669" />
              <Text style={styles.aiReplyTitle}>AI Suggested Reply</Text>
            </View>

            <TouchableOpacity style={styles.toneDropdown}>
              <Text style={styles.toneDropdownText}>{tone}</Text>
              <ChevronDown size={12} color="#059669" />
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <TextInput
              style={styles.editableInput}
              multiline
              value={suggestedText}
              onChangeText={setSuggestedText}
            />
          ) : (
            <Text style={styles.aiSuggestedBody}>{suggestedText}</Text>
          )}

          <View style={styles.aiReplyActions}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Edit3 size={14} color="#0F172A" />
              <Text style={styles.editBtnText}>{isEditing ? 'Done' : 'Edit'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sendReplyBtn}
              onPress={handleSendReply}
            >
              <Send size={14} color="#FFFFFF" />
              <Text style={styles.sendReplyBtnText}>Send Reply</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  backBtn: {
    padding: 6,
  },
  customerHeaderCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarMini: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3730A3',
  },
  customerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  customerEmail: {
    fontSize: 11,
    color: '#64748B',
  },
  activeTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    padding: 6,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 20,
  },
  tabBtn: {
    paddingVertical: 10,
    marginRight: 24,
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    borderColor: '#059669',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
    gap: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  messageRowMe: {
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBubbleMe: {
    backgroundColor: '#ECFDF5',
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  messageBubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  messageTextMe: {
    color: '#064E3B',
  },
  messageTextOther: {
    color: '#1E293B',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  messageTimeMe: {
    color: '#059669',
  },
  messageTimeOther: {
    color: '#94A3B8',
  },
  aiReplyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    marginTop: 14,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  aiReplyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiReplyTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#059669',
  },
  toneDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  toneDropdownText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  aiSuggestedBody: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  editableInput: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#059669',
    minHeight: 80,
  },
  aiReplyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  sendReplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#059669',
  },
  sendReplyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
