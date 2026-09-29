import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Search, User, Phone, Mail, Building, ChevronRight, DollarSign } from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { customerService } from '../../src/services/customerService';
import { useAuthStore } from '../../src/store/authStore';
import { Customer } from '../../src/types';

export default function CustomersScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const loadCustomers = async () => {
    if (!currentBusiness?.id) return;
    try {
      const list = await customerService.listCustomers(currentBusiness.id, search, statusFilter);
      setCustomers(list);
    } catch (err) {
      console.warn('Error loading customers:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [currentBusiness?.id, statusFilter, search]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCustomers();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customers & CRM</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/customers/create')}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search customers or companies..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsRow}>
          {(['all', 'active', 'inactive'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, statusFilter === tab && styles.tabBtnActive]}
              onPress={() => setStatusFilter(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  statusFilter === tab && styles.tabTextActive,
                ]}
              >
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Customer List */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading customers...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
            }
          >
            {customers.length === 0 ? (
              <GlassCard style={styles.emptyCard}>
                <Building size={36} color={Colors.textMuted} style={{ marginBottom: 10 }} />
                <Text style={styles.emptyTitle}>No Customers Found</Text>
                <Text style={styles.emptySub}>
                  Create your first client account or convert leads to start tracking customer revenue.
                </Text>
              </GlassCard>
            ) : (
              customers.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  activeOpacity={0.75}
                  onPress={() => router.push(`/customers/${c.id}` as any)}
                >
                  <GlassCard style={styles.customerCard}>
                    <View style={styles.cardTop}>
                      <View style={styles.custLeft}>
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarInitial}>{c.name[0] || 'C'}</Text>
                        </View>
                        <View>
                          <Text style={styles.custName}>{c.name}</Text>
                          <Text style={styles.custCompany}>{c.company_name || 'Individual'}</Text>
                        </View>
                      </View>

                      <View style={styles.revenueBadge}>
                        <Text style={styles.revenueText}>
                          ₹{Number(c.total_revenue || 0).toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.cardBottom}>
                      <View style={styles.contactItem}>
                        <Mail size={12} color={Colors.textMuted} />
                        <Text style={styles.contactText}>{c.email || 'No email'}</Text>
                      </View>
                      <ChevronRight size={16} color={Colors.textMuted} />
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </View>
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.glow,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 8,
  },
  customerCard: {
    marginBottom: 10,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  custLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  custName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  custCompany: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  revenueBadge: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  revenueText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 10,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
