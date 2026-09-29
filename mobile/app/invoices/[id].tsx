import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Trash2,
  Send,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  Calendar,
  X,
  PlusCircle,
} from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { invoiceService } from '../../src/services/invoiceService';
import { Invoice, Payment } from '../../src/types';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Payment modal state
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'bank_transfer' | 'upi' | 'card' | 'cash'>('bank_transfer');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  useEffect(() => {
    if (!id) return;
    loadInvoice();
  }, [id]);

  const loadInvoice = async () => {
    try {
      const inv = await invoiceService.getInvoice(id);
      setInvoice(inv);
      if (inv) {
        const remaining = Math.max(0, Number(inv.total_amount) - Number(inv.paid_amount || 0));
        setPayAmount(remaining.toString());
      }
    } catch (err) {
      console.warn('Error loading invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      await invoiceService.sendInvoice(id);
      Alert.alert('Success', 'Invoice marked as sent and dispatched to client.');
      loadInvoice();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid payment amount greater than 0.');
      return;
    }

    if (!invoice) return;

    setActionLoading(true);
    try {
      await invoiceService.recordPayment({
        business_id: invoice.business_id,
        invoice_id: invoice.id,
        customer_id: invoice.customer_id,
        amount: amountNum,
        payment_method: payMethod,
        reference_number: payRef.trim() || undefined,
        notes: payNotes.trim() || undefined,
      });

      setPayModalVisible(false);
      Alert.alert('Payment Recorded', `₹${amountNum.toLocaleString('en-IN')} received successfully.`);
      loadInvoice();
    } catch (err: any) {
      Alert.alert('Payment Error', err.message || 'Failed to record payment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Invoice',
      'Are you sure you want to delete this invoice? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            await invoiceService.deleteInvoice(id);
            router.back();
          },
        },
      ]
    );
  };

  if (loading || !invoice) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const isPaid = invoice.status === 'paid';
  const isPartiallyPaid = invoice.status === 'partially_paid';
  const isOverdue = invoice.status === 'overdue';
  const remainingBalance = Math.max(0, Number(invoice.total_amount) - Number(invoice.paid_amount || 0));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{invoice.invoice_number}</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Trash2 size={18} color={Colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Banner */}
        <GlassCard variant="elevated" style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.clientTitle}>{invoice.customer?.name || 'Client'}</Text>
              <Text style={styles.companySub}>{invoice.customer?.company_name || 'Individual'}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                isPaid && { backgroundColor: Colors.successBg },
                isPartiallyPaid && { backgroundColor: Colors.warningBg },
                isOverdue && { backgroundColor: Colors.dangerBg },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isPaid && { color: Colors.success },
                  isPartiallyPaid && { color: Colors.warning },
                  isOverdue && { color: Colors.danger },
                ]}
              >
                {invoice.status.toUpperCase().replace('_', ' ')}
              </Text>
            </View>
          </View>

          {/* Amount breakdown summary */}
          <View style={styles.amountHeroBox}>
            <Text style={styles.heroAmountLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.heroAmountValue}>
              ₹{Number(invoice.total_amount).toLocaleString('en-IN')}
            </Text>
            {remainingBalance > 0 && remainingBalance < Number(invoice.total_amount) && (
              <Text style={styles.balanceSub}>
                Remaining Balance: ₹{remainingBalance.toLocaleString('en-IN')} (Paid: ₹{Number(invoice.paid_amount || 0).toLocaleString('en-IN')})
              </Text>
            )}
          </View>

          {/* Key Dates */}
          <View style={styles.datesRow}>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>Issue Date</Text>
              <Text style={styles.dateVal}>{invoice.issue_date}</Text>
            </View>
            <View style={styles.dateCol}>
              <Text style={styles.dateLabel}>Due Date</Text>
              <Text style={[styles.dateVal, isOverdue && { color: Colors.danger, fontWeight: '700' }]}>
                {invoice.due_date}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Action Controls */}
        <View style={styles.actionButtonRow}>
          {!isPaid && (
            <GlassButton
              title="Record Payment"
              variant="primary"
              icon={<CreditCard size={16} color="#FFFFFF" />}
              onPress={() => setPayModalVisible(true)}
              style={{ flex: 1 }}
            />
          )}
          {invoice.status === 'draft' && (
            <GlassButton
              title="Send to Client"
              variant="glass"
              icon={<Send size={16} color={Colors.primary} />}
              onPress={handleSendInvoice}
              loading={actionLoading}
              style={{ flex: 1 }}
            />
          )}
        </View>

        {/* Line Items List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Line Items</Text>
        </View>

        <GlassCard style={styles.itemsCard}>
          {invoice.items && invoice.items.length > 0 ? (
            invoice.items.map((item, idx) => (
              <View key={item.id || idx} style={[styles.itemRow, idx > 0 && styles.itemBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity} x ₹{Number(item.unit_price).toLocaleString('en-IN')}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  ₹{Number(item.total_price).toLocaleString('en-IN')}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemDesc}>General Services / Project Deliverables</Text>
                <Text style={styles.itemMeta}>1 x ₹{Number(invoice.subtotal).toLocaleString('en-IN')}</Text>
              </View>
              <Text style={styles.itemTotal}>₹{Number(invoice.subtotal).toLocaleString('en-IN')}</Text>
            </View>
          )}

          {/* Math calculation footer */}
          <View style={styles.mathFooter}>
            <View style={styles.mathRow}>
              <Text style={styles.mathLabel}>Subtotal</Text>
              <Text style={styles.mathVal}>₹{Number(invoice.subtotal).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.mathRow}>
              <Text style={styles.mathLabel}>Tax ({invoice.tax_rate || 18}%)</Text>
              <Text style={styles.mathVal}>+ ₹{Number(invoice.tax_amount || 0).toLocaleString('en-IN')}</Text>
            </View>
            {Number(invoice.discount_amount || 0) > 0 && (
              <View style={styles.mathRow}>
                <Text style={styles.mathLabel}>Discount</Text>
                <Text style={[styles.mathVal, { color: Colors.success }]}>
                  - ₹{Number(invoice.discount_amount).toLocaleString('en-IN')}
                </Text>
              </View>
            )}
            <View style={[styles.mathRow, styles.mathTotalRow]}>
              <Text style={styles.mathTotalLabel}>Total Amount</Text>
              <Text style={styles.mathTotalVal}>₹{Number(invoice.total_amount).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.mathRow}>
              <Text style={styles.mathLabel}>Paid to Date</Text>
              <Text style={[styles.mathVal, { color: Colors.success, fontWeight: '700' }]}>
                ₹{Number(invoice.paid_amount || 0).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Payments History */}
        {invoice.payments && invoice.payments.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Payments History ({invoice.payments.length})</Text>
            </View>
            {invoice.payments.map((p) => (
              <GlassCard key={p.id} style={styles.paymentCard}>
                <View style={styles.paymentRow}>
                  <View>
                    <Text style={styles.paymentAmount}>
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.paymentMeta}>
                      Method: {p.payment_method?.toUpperCase()} • {p.payment_date}
                    </Text>
                    {p.reference_number ? (
                      <Text style={styles.paymentRef}>Ref: {p.reference_number}</Text>
                    ) : null}
                  </View>
                  <CheckCircle2 size={20} color={Colors.success} />
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {/* Notes */}
        {invoice.notes ? (
          <View style={{ marginTop: 20 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Notes</Text>
            </View>
            <GlassCard style={styles.notesCard}>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </GlassCard>
          </View>
        ) : null}
      </ScrollView>

      {/* Record Payment Modal */}
      <Modal visible={payModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Payment</Text>
              <TouchableOpacity onPress={() => setPayModalVisible(false)}>
                <X size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Payment Amount (₹) *</Text>
              <TextInput
                style={styles.input}
                value={payAmount}
                onChangeText={setPayAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Payment Method</Text>
              <View style={styles.methodChips}>
                {(['bank_transfer', 'upi', 'card', 'cash'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.methodChip, payMethod === m && styles.methodChipActive]}
                    onPress={() => setPayMethod(m)}
                  >
                    <Text
                      style={[styles.methodChipText, payMethod === m && styles.methodChipTextActive]}
                    >
                      {m.toUpperCase().replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Reference / Transaction ID</Text>
              <TextInput
                style={styles.input}
                value={payRef}
                onChangeText={setPayRef}
                placeholder="e.g. UTR / IMPS / Txn ID"
                placeholderTextColor={Colors.textMuted}
              />

              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                value={payNotes}
                onChangeText={setPayNotes}
                placeholder="Optional payment notes"
                placeholderTextColor={Colors.textMuted}
                multiline
              />

              <GlassButton
                title="Confirm Payment"
                variant="primary"
                onPress={handleRecordPayment}
                loading={actionLoading}
                style={{ marginTop: 16, marginBottom: 20 }}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    fontSize: 17,
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
    paddingBottom: 60,
  },
  summaryCard: {
    padding: 18,
    marginBottom: 16,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  clientTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  companySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  amountHeroBox: {
    backgroundColor: Colors.glass,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginBottom: 16,
  },
  heroAmountLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  heroAmountValue: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.text,
    marginTop: 4,
  },
  balanceSub: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning,
    marginTop: 6,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  dateVal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 2,
  },
  actionButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  itemsCard: {
    padding: 16,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  itemDesc: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  itemMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  mathFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    marginTop: 6,
    gap: 6,
  },
  mathRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mathLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  mathVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  mathTotalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  mathTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  mathTotalVal: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.primary,
  },
  paymentCard: {
    padding: 14,
    marginBottom: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.success,
  },
  paymentMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  paymentRef: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  notesCard: {
    padding: 14,
  },
  notesText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  methodChips: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  methodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  methodChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  methodChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  methodChipTextActive: {
    color: '#FFFFFF',
  },
});
