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
  Crown,
  Receipt,
  CreditCard,
  Edit3,
  XCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react-native';
import { Colors } from '../../src/constants/theme';

export default function BillingSubscriptionScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Subscription Card */}
        <View style={styles.subscriptionCard}>
          <View style={styles.planTopRow}>
            <View style={styles.crownBox}>
              <Crown size={22} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.planName}>Business Plan</Text>
              <Text style={styles.planPrice}>
                ₹1,499 <Text style={styles.periodText}>/ month</Text>
              </Text>
            </View>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>+ Active</Text>
            </View>
          </View>

          <Text style={styles.nextBillingText}>Next billing: Mar 14, 2026</Text>

          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => router.push('/paywall')}
          >
            <Text style={styles.manageBtnText}>Manage Subscription</Text>
          </TouchableOpacity>
        </View>

        {/* Options List */}
        <View style={styles.menuCard}>
          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => router.push('/billing/history')}
          >
            <Receipt size={18} color="#64748B" />
            <Text style={styles.menuTitle}>Billing History</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => Alert.alert('Payment Method', 'Primary card: •••• 4242 (Visa)')}
          >
            <CreditCard size={18} color="#64748B" />
            <Text style={styles.menuTitle}>Payment Method</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => router.push('/paywall')}
          >
            <Edit3 size={18} color="#64748B" />
            <Text style={styles.menuTitle}>Update Plan</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert('Cancel Subscription', 'Are you sure you want to cancel? Your access remains active until Mar 14, 2026.', [
                { text: 'Keep Plan', style: 'cancel' },
                { text: 'Cancel Subscription', style: 'destructive' },
              ])
            }
          >
            <XCircle size={18} color="#DC2626" />
            <Text style={[styles.menuTitle, { color: '#DC2626' }]}>Cancel Subscription</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* AI Credits Reset Notice Box */}
        <View style={styles.noticeBox}>
          <View style={styles.noticeIconWrap}>
            <Sparkles size={16} color="#4F46E5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>AI Credits Reset</Text>
            <Text style={styles.noticeDesc}>Your AI credits will reset on Mar 14, 2026</Text>
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
    gap: 14,
  },
  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  planTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  crownBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  planPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  activePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.2)',
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  nextBillingText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 14,
  },
  manageBtn: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
  },
  manageBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
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
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  menuTitle: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0F172A',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
    gap: 12,
  },
  noticeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3730A3',
  },
  noticeDesc: {
    fontSize: 11.5,
    color: '#4F46E5',
    marginTop: 1,
  },
});
