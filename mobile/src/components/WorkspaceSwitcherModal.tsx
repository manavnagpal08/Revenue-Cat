import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Check, Plus, Building, Sparkles, Layers, Briefcase } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { useAuthStore } from '../store/authStore';

interface WorkspaceSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

interface WorkspaceItem {
  id: string;
  name: string;
  type: string;
  color: string;
  bgColor: string;
  icon: any;
}

const defaultWorkspaces: WorkspaceItem[] = [
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Acme Digital',
    type: 'Agency • 5 members',
    color: '#059669',
    bgColor: '#ECFDF5',
    icon: Sparkles,
  },
  {
    id: 'ws-2',
    name: 'Rahul Designs',
    type: 'Freelancer • 1 member',
    color: '#EA580C',
    bgColor: '#FFF7ED',
    icon: Layers,
  },
  {
    id: 'ws-3',
    name: 'XYZ Studio',
    type: 'Creative Studio • 3 members',
    color: '#4F46E5',
    bgColor: '#EEF2FF',
    icon: Building,
  },
  {
    id: 'ws-4',
    name: 'Pixel Marketing',
    type: 'Agency • 2 members',
    color: '#E11D48',
    bgColor: '#FFF1F2',
    icon: Briefcase,
  },
];

export const WorkspaceSwitcherModal: React.FC<WorkspaceSwitcherModalProps> = ({
  visible,
  onClose,
}) => {
  const router = useRouter();
  const { currentBusiness, businesses, switchBusiness, profile } = useAuthStore();

  const handleSelect = (bizId: string) => {
    switchBusiness(bizId);
    onClose();
  };

  const handleCreateNew = () => {
    onClose();
    router.push('/create-business');
  };

  const activeId = currentBusiness?.id || '00000000-0000-0000-0000-000000000002';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Top User Greeting Header */}
          <View style={styles.header}>
            <View style={styles.userRow}>
              <Image
                source={{ uri: profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120' }}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.greetingTitle}>
                  Hi {profile?.full_name?.split(' ')[0] || 'Manav'} 👋
                </Text>
                <Text style={styles.greetingSub}>Switch workspace</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Workspace List */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {defaultWorkspaces.map((item) => {
              const isSelected = item.id === activeId || item.name === currentBusiness?.name;
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.workspaceItem, isSelected && styles.workspaceItemSelected]}
                  activeOpacity={0.7}
                  onPress={() => handleSelect(item.id)}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
                    <Icon size={20} color={item.color} />
                  </View>

                  <View style={styles.itemInfo}>
                    <Text style={styles.bizName}>{item.name}</Text>
                    <Text style={styles.bizType}>{item.type}</Text>
                  </View>

                  {isSelected && (
                    <View style={styles.checkCircle}>
                      <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Create New Business Button */}
          <TouchableOpacity
            style={styles.createBtn}
            onPress={handleCreateNew}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#059669" strokeWidth={2.5} />
            <Text style={styles.createBtnText}>Create New Business</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  greetingTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  greetingSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  list: {
    maxHeight: 280,
    marginVertical: 12,
  },
  workspaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 6,
    gap: 12,
  },
  workspaceItemSelected: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  bizName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  bizType: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 6,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
});
