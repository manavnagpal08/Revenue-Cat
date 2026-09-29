import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Building,
  Phone,
  Mail,
  Globe,
  Trash2,
  DollarSign,
  TrendingUp,
  FileText,
  Plus,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { customerService } from '../../src/services/customerService';
import { leadService } from '../../src/services/leadService';
import { invoiceService } from '../../src/services/invoiceService';
import { proposalService } from '../../src/services/proposalService';
import { Customer, Lead, Invoice, Proposal } from '../../src/types';

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadDetail();
  }, [id]);

  const loadDetail = async () => {
    try {
      const cust = await customerService.getCustomer(id);
      setCustomer(cust);

      if (cust?.business_id) {
        // Fetch related leads
        const allLeads = await leadService.listLeads(cust.business_id);
        setLeads(allLeads.filter((l) => l.customer_id === id));

        // Fetch related invoices
        const allInvoices = await invoiceService.listInvoices(cust.business_id);
        setInvoices(allInvoices.filter((i) => i.customer_id === id));

        // Fetch related proposals
        const allProposals = await proposalService.listProposals(cust.business_id);
        setProposals(allProposals.filter((p) => p.customer_id === id));
      }
    } catch (err) {
      console.warn('Error loading customer detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Customer',
      'Are you sure you want to delete this customer? All associated history will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            await customerService.deleteCustomer(id);
            router.back();
          },
        },
      ]
    );
  };

  if (loading || !customer) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Client Profile</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Trash2 size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Customer Profile Card */}
        <GlassCard variant="elevated" style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{customer.name[0] || 'C'}</Text>
          </View>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.companyName}>{customer.company_name || 'Individual'}</Text>

          <View style={styles.kpiPill}>
            <Text style={styles.kpiLabel}>LIFETIME REVENUE</Text>
            <Text style={styles.kpiValue}>
              ₹{Number(customer.total_revenue || 0).toLocaleString('en-IN')}
            </Text>
          </View>

          {/* Contact Actions */}
          <View style={styles.contactRow}>
            {customer.phone ? (
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => Linking.openURL(`tel:${customer.phone}`)}
              >
                <Phone size={14} color={Colors.primary} />
                <Text style={styles.contactBtnText}>Call</Text>
              </TouchableOpacity>
            ) : null}

            {customer.email ? (
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => Linking.openURL(`mailto:${customer.email}`)}
              >
                <Mail size={14} color={Colors.primary} />
                <Text style={styles.contactBtnText}>Email</Text>
              </TouchableOpacity>
            ) : null}

            {customer.website ? (
              <TouchableOpacity
                style={styles.contactBtn}
                onPress={() => Linking.openURL(customer.website!)}
              >
                <Globe size={14} color={Colors.primary} />
                <Text style={styles.contactBtnText}>Website</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </GlassCard>

        {/* Related Invoices */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Invoices ({invoices.length})</Text>
        </View>

        {invoices.length === 0 ? (
          <GlassCard style={styles.emptyMiniCard}>
            <Text style={styles.emptyText}>No invoices billed to this customer.</Text>
          </GlassCard>
        ) : (
          invoices.map((inv) => (
            <GlassCard key={inv.id} style={styles.miniCard}>
              <View style={styles.miniCardRow}>
                <View>
                  <Text style={styles.miniTitle}>{inv.invoice_number}</Text>
                  <Text style={styles.miniSub}>Due {inv.due_date}</Text>
                </View>
                <Text style={styles.miniAmount}>₹{inv.total_amount.toLocaleString('en-IN')}</Text>
              </View>
            </GlassCard>
          ))
        )}

        {/* Related Leads / Deals */}
        <View style={[styles.sectionHeaderRow, { marginTop: 16 }]}>
          <Text style={styles.sectionTitle}>Pipeline Deals ({leads.length})</Text>
        </View>

        {leads.length === 0 ? (
          <GlassCard style={styles.emptyMiniCard}>
            <Text style={styles.emptyText}>No active deals in pipeline.</Text>
          </GlassCard>
        ) : (
          leads.map((l) => (
            <GlassCard key={l.id} style={styles.miniCard}>
              <View style={styles.miniCardRow}>
                <View>
                  <Text style={styles.miniTitle}>{l.title}</Text>
                  <Text style={styles.miniSub}>Stage: {l.status.toUpperCase()}</Text>
                </View>
                <Text style={styles.miniAmount}>₹{l.value.toLocaleString('en-IN')}</Text>
              </View>
            </GlassCard>
          ))
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
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarLargeText: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  companyName: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  kpiPill: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 14,
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.success,
    letterSpacing: 0.6,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.success,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  sectionHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  miniCard: {
    marginBottom: 8,
    padding: 12,
  },
  miniCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  miniSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  miniAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  emptyMiniCard: {
    padding: 14,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
