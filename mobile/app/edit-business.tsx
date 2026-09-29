import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Building,
  Phone,
  Globe,
  DollarSign,
  Users,
  Layers,
  CreditCard,
  ChevronRight,
  Trash2,
} from 'lucide-react-native';
import { Colors } from '../src/constants/theme';
import { useAuthStore } from '../src/store/authStore';

export default function BusinessSettingsScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();

  const menuItems = [
    {
      id: 'info',
      icon: Building,
      title: 'Business Information',
      action: () => Alert.alert('Business Info', 'Update your business name and details.'),
    },
    {
      id: 'contact',
      icon: Phone,
      title: 'Contact Details',
      action: () => Alert.alert('Contact Details', 'Update address, phone, and website.'),
    },
    {
      id: 'currency',
      icon: DollarSign,
      title: 'Currency & Timezone',
      action: () => Alert.alert('Currency & Timezone', 'Current: INR (₹) / Asia/Kolkata'),
    },
    {
      id: 'team',
      icon: Users,
      title: 'Team Members',
      action: () => router.push('/team' as any),
    },
    {
      id: 'integrations',
      icon: Layers,
      title: 'Integrations',
      action: () => router.push('/integrations' as any),
    },
    {
      id: 'billing',
      icon: CreditCard,
      title: 'Billing & Subscription',
      action: () => router.push('/billing' as any),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Business Profile Card */}
        <View style={styles.businessHeaderCard}>
          <View style={styles.avatarBox}>
            <Building size={24} color="#3B82F6" />
          </View>
          <View style={styles.businessHeaderInfo}>
            <Text style={styles.businessName}>
              {currentBusiness?.name || 'Acme Digital'}
            </Text>
            <Text style={styles.businessType}>
              {currentBusiness?.industry || 'Agency • Digital Services'}
            </Text>
          </View>
        </View>

        {/* Menu Items List */}
        <View style={styles.menuCard}>
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            const isLast = idx === menuItems.length - 1;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuRow, !isLast && styles.menuRowBorder]}
                activeOpacity={0.7}
                onPress={item.action}
              >
                <View style={styles.menuIconBox}>
                  <Icon size={18} color="#64748B" />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <ChevronRight size={18} color="#94A3B8" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Delete Business Action */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() =>
            Alert.alert(
              'Delete Business Workspace',
              'Are you sure you want to delete this business workspace? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => router.replace('/(tabs)') },
              ]
            )
          }
        >
          <Text style={styles.deleteBtnText}>Delete Business</Text>
        </TouchableOpacity>
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
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    paddingBottom: 60,
  },
  businessHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    marginBottom: 16,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessHeaderInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  businessType: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  menuIconBox: {
    width: 28,
    alignItems: 'center',
  },
  menuTitle: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  deleteBtn: {
    marginTop: 24,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
});
