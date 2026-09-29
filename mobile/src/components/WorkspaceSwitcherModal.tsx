import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { Building, Check, Plus, X, Globe, DollarSign } from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { GlassCard } from './GlassCard';
import { useAuthStore } from '../store/authStore';
import { useRouter } from 'expo-router';

interface WorkspaceSwitcherModalProps {
  visible: boolean;
  onClose: () => void;
}

export const WorkspaceSwitcherModal: React.FC<WorkspaceSwitcherModalProps> = ({
  visible,
  onClose,
}) => {
  const router = useRouter();
  const { businesses, currentBusiness, switchBusiness } = useAuthStore();

  const handleSelectBusiness = (id: string) => {
    switchBusiness(id);
    onClose();
  };

  const handleCreateNew = () => {
    onClose();
    router.push('/create-business');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <GlassCard variant="elevated" style={styles.card}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerTitleRow}>
                    <Building size={20} color={Colors.primary} />
                    <Text style={styles.title}>Switch Workspace</Text>
                  </View>
                  <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                    <X size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.subtitle}>
                  Select a business workspace to view associated pipeline, invoices & AI operations.
                </Text>

                {/* Business List */}
                <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                  {businesses.map((biz) => {
                    const isSelected = currentBusiness?.id === biz.id;
                    return (
                      <TouchableOpacity
                        key={biz.id}
                        activeOpacity={0.7}
                        onPress={() => handleSelectBusiness(biz.id)}
                        style={[
                          styles.bizItem,
                          isSelected && styles.bizItemSelected,
                        ]}
                      >
                        <View style={styles.bizItemLeft}>
                          <View
                            style={[
                              styles.bizIconCircle,
                              isSelected && { backgroundColor: Colors.primary },
                            ]}
                          >
                            <Building
                              size={16}
                              color={isSelected ? '#FFFFFF' : Colors.primary}
                            />
                          </View>
                          <View style={styles.bizInfo}>
                            <Text style={styles.bizName}>{biz.name}</Text>
                            <Text style={styles.bizDetails}>
                              {biz.industry || 'Business'} • {biz.currency_symbol} ({biz.currency})
                            </Text>
                          </View>
                        </View>

                        {isSelected ? (
                          <View style={styles.checkCircle}>
                            <Check size={14} color="#FFFFFF" />
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <View style={styles.divider} />

                {/* Create New Business */}
                <TouchableOpacity
                  style={styles.createBtn}
                  activeOpacity={0.8}
                  onPress={handleCreateNew}
                >
                  <Plus size={18} color={Colors.primary} />
                  <Text style={styles.createText}>Create New Workspace</Text>
                </TouchableOpacity>
              </GlassCard>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
  },
  card: {
    padding: 20,
    maxHeight: 520,
    ...Shadows.glass,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  list: {
    maxHeight: 280,
  },
  bizItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bizItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySubtle,
  },
  bizItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bizIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bizInfo: {
    flex: 1,
  },
  bizName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  bizDetails: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 12,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primarySubtle,
  },
  createText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
});
