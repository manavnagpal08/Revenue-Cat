import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, Check, User, Calendar, Receipt } from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';
import { GlassCard } from '../../src/components/GlassCard';
import { GlassButton } from '../../src/components/GlassButton';
import { invoiceService } from '../../src/services/invoiceService';
import { customerService } from '../../src/services/customerService';
import { useAuthStore } from '../../src/store/authStore';
import { Customer } from '../../src/types';

interface LineItemInput {
  description: string;
  quantity: string;
  unit_price: string;
}

export default function CreateInvoiceScreen() {
  const router = useRouter();
  const { currentBusiness } = useAuthStore();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [taxRate, setTaxRate] = useState<string>('18');
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [notes, setNotes] = useState<string>('Payment due within 14 days of invoice date.');

  const [items, setItems] = useState<LineItemInput[]>([
    { description: 'Consulting / Strategy Session', quantity: '1', unit_price: '15000' },
  ]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [currentBusiness?.id]);

  const loadCustomers = async () => {
    if (!currentBusiness?.id) return;
    try {
      const list = await customerService.listCustomers(currentBusiness.id);
      setCustomers(list);
      if (list.length > 0) {
        setSelectedCustomerId(list[0].id);
      }
    } catch (err) {
      console.warn('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: '1', unit_price: '0' }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof LineItemInput, val: string) => {
    const updated = [...items];
    updated[index][field] = val;
    setItems(updated);
  };

  // Live Math calculations
  const parsedItems = items.map((it) => {
    const q = parseFloat(it.quantity) || 0;
    const p = parseFloat(it.unit_price) || 0;
    return { ...it, quantityNum: q, unitPriceNum: p, total: q * p };
  });

  const subtotal = parsedItems.reduce((acc, it) => acc + it.total, 0);
  const taxRateNum = parseFloat(taxRate) || 0;
  const taxAmount = (subtotal * taxRateNum) / 100.0;
  const discountNum = parseFloat(discountAmount) || 0;
  const totalAmount = Math.max(0, subtotal + taxAmount - discountNum);

  const handleCreate = async () => {
    if (!currentBusiness?.id) {
      Alert.alert('Error', 'No active workspace found');
      return;
    }

    if (!selectedCustomerId) {
      Alert.alert('Validation Error', 'Please select a customer.');
      return;
    }

    const validItems = parsedItems
      .filter((it) => it.description.trim().length > 0 && it.quantityNum > 0 && it.unitPriceNum > 0)
      .map((it) => ({
        description: it.description.trim(),
        quantity: it.quantityNum,
        unit_price: it.unitPriceNum,
      }));

    if (validItems.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one valid line item with description and price.');
      return;
    }

    setSubmitting(true);
    try {
      await invoiceService.createInvoice({
        business_id: currentBusiness.id,
        customer_id: selectedCustomerId,
        due_date: dueDate,
        tax_rate: taxRateNum,
        discount_amount: discountNum,
        notes: notes.trim() || undefined,
        items: validItems,
      });

      Alert.alert('Success', 'Invoice generated successfully!');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
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
        <Text style={styles.headerTitle}>New Invoice</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Customer Selection */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Select Client *</Text>
          </View>

          {customers.length === 0 ? (
            <GlassCard style={styles.noCustomerCard}>
              <Text style={styles.noCustomerText}>No customers available.</Text>
              <GlassButton
                title="Create Customer First"
                variant="glass"
                size="sm"
                onPress={() => router.push('/customers/create')}
                style={{ marginTop: 8 }}
              />
            </GlassCard>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.customerScroll}
            >
              {customers.map((c) => {
                const isSelected = c.id === selectedCustomerId;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.customerChip, isSelected && styles.customerChipActive]}
                    onPress={() => setSelectedCustomerId(c.id)}
                  >
                    <User size={14} color={isSelected ? '#FFFFFF' : Colors.textSecondary} />
                    <Text
                      style={[styles.customerChipText, isSelected && styles.customerChipTextActive]}
                    >
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Due Date & Tax */}
          <GlassCard style={styles.configCard}>
            <View style={styles.fieldRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Due Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="2026-10-15"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={{ width: 100 }}>
                <Text style={styles.inputLabel}>Tax Rate (%)</Text>
                <TextInput
                  style={styles.input}
                  value={taxRate}
                  onChangeText={setTaxRate}
                  keyboardType="numeric"
                  placeholder="18"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <View style={{ marginTop: 10 }}>
              <Text style={styles.inputLabel}>Discount (₹)</Text>
              <TextInput
                style={styles.input}
                value={discountAmount}
                onChangeText={setDiscountAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </GlassCard>

          {/* Line Items Builder */}
          <View style={[styles.sectionHeader, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>Invoice Items</Text>
            <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
              <Plus size={14} color={Colors.primary} />
              <Text style={styles.addItemBtnText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, idx) => (
            <GlassCard key={idx} style={styles.itemBuilderCard}>
              <View style={styles.itemBuilderTop}>
                <Text style={styles.itemIndexText}>Item #{idx + 1}</Text>
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(idx)}>
                    <Trash2 size={16} color={Colors.danger} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.input}
                value={item.description}
                onChangeText={(val) => updateItem(idx, 'description', val)}
                placeholder="e.g. Mobile UI Design Sprint"
                placeholderTextColor={Colors.textMuted}
              />

              <View style={styles.itemRowInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Qty</Text>
                  <TextInput
                    style={styles.input}
                    value={item.quantity}
                    onChangeText={(val) => updateItem(idx, 'quantity', val)}
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
                <View style={{ flex: 2 }}>
                  <Text style={styles.inputLabel}>Unit Price (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={item.unit_price}
                    onChangeText={(val) => updateItem(idx, 'unit_price', val)}
                    keyboardType="numeric"
                    placeholder="15000"
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>
              </View>
            </GlassCard>
          ))}

          {/* Calculation Summary */}
          <GlassCard variant="elevated" style={styles.calcCard}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Subtotal</Text>
              <Text style={styles.calcVal}>₹{Math.round(subtotal).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Tax ({taxRateNum}%)</Text>
              <Text style={styles.calcVal}>+ ₹{Math.round(taxAmount).toLocaleString('en-IN')}</Text>
            </View>
            {discountNum > 0 && (
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Discount</Text>
                <Text style={[styles.calcVal, { color: Colors.success }]}>
                  - ₹{discountNum.toLocaleString('en-IN')}
                </Text>
              </View>
            )}
            <View style={[styles.calcRow, styles.calcTotalRow]}>
              <Text style={styles.calcTotalLabel}>Total Amount</Text>
              <Text style={styles.calcTotalVal}>
                ₹{Math.round(totalAmount).toLocaleString('en-IN')}
              </Text>
            </View>
          </GlassCard>

          {/* Notes */}
          <View style={{ marginTop: 14 }}>
            <Text style={styles.inputLabel}>Payment Terms & Notes</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="e.g. Bank details, payment terms..."
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {/* Submit */}
          <GlassButton
            title="Generate & Save Invoice"
            variant="primary"
            size="lg"
            icon={<Receipt size={18} color="#FFFFFF" />}
            onPress={handleCreate}
            loading={submitting}
            style={{ marginTop: 24, marginBottom: 30 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  customerScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  customerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customerChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  customerChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  customerChipTextActive: {
    color: '#FFFFFF',
  },
  noCustomerCard: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  noCustomerText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  configCard: {
    padding: 14,
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: Colors.text,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addItemBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  itemBuilderCard: {
    padding: 14,
    marginBottom: 10,
  },
  itemBuilderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemIndexText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
  },
  itemRowInputs: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  calcCard: {
    padding: 16,
    marginTop: 10,
    gap: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  calcVal: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  calcTotalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    marginTop: 4,
  },
  calcTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  calcTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
});
