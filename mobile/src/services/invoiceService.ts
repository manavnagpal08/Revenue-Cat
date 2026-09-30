import { supabase } from '../lib/supabase';
import { Invoice, InvoiceItem, InvoiceStatus } from '../types';

export interface CreateInvoiceInput {
  business_id: string;
  customer_id: string;
  invoice_number?: string;
  issue_date?: string;
  due_date: string;
  notes?: string;
  tax_rate?: number;
  discount_amount?: number;
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
  }>;
}

export interface RecordPaymentInput {
  business_id: string;
  invoice_id: string;
  customer_id: string;
  amount: number;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
}

import { DEMO_INVOICES, DEMO_BUSINESS_ID } from './demoData';

const invoiceCache = new Map<string, Invoice[]>([
  [DEMO_BUSINESS_ID, [...DEMO_INVOICES]],
]);

export const invoiceService = {
  async listInvoices(businessId: string, statusFilter?: string, search?: string): Promise<Invoice[]> {
    let dbInvoices: Invoice[] = [];
    try {
      let query = supabase.from('invoices').select('*, customer:customers(*)').eq('business_id', businessId);
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (search) {
        query = query.ilike('invoice_number', `%${search}%`);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) {
        dbInvoices = data as Invoice[];
      }
    } catch (err) {
      console.warn('Error listing invoices from Supabase:', err);
    }

    const cached = invoiceCache.get(businessId) || [];
    const invMap = new Map<string, Invoice>();

    for (const inv of cached) {
      invMap.set(inv.id, inv);
      invMap.set(inv.invoice_number, inv);
    }
    for (const inv of dbInvoices) {
      invMap.set(inv.id, inv);
      invMap.set(inv.invoice_number, inv);
    }

    let combined = Array.from(new Set(invMap.values()));
    if (statusFilter && statusFilter !== 'all') {
      combined = combined.filter((i) => i.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      combined = combined.filter((i) =>
        i.invoice_number?.toLowerCase().includes(q) ||
        (i as any).customer?.name?.toLowerCase().includes(q) ||
        (i as any).customer?.company_name?.toLowerCase().includes(q)
      );
    }

    return combined.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  },

  async getInvoice(id: string): Promise<Invoice | null> {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, customer:customers(*), items:invoice_items(*), payments:payments(*)')
        .eq('id', id)
        .single();
      if (!error && data) return data as Invoice;
    } catch {}

    for (const list of invoiceCache.values()) {
      const found = list.find((i) => i.id === id || i.invoice_number === id);
      if (found) return found;
    }
    return null;
  },

  async createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
    const subtotal = input.items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0);
    const taxRate = input.tax_rate ?? 18.0;
    const taxAmount = (subtotal * taxRate) / 100.0;
    const discount = input.discount_amount ?? 0.0;
    const totalAmount = Math.max(0, subtotal + taxAmount - discount);

    const invNumber =
      input.invoice_number ||
      `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert({
        business_id: input.business_id,
        customer_id: input.customer_id,
        invoice_number: invNumber,
        issue_date: input.issue_date || new Date().toISOString().split('T')[0],
        due_date: input.due_date,
        subtotal: Math.round(subtotal * 100) / 100,
        tax_rate: taxRate,
        tax_amount: Math.round(taxAmount * 100) / 100,
        discount_amount: discount,
        total_amount: Math.round(totalAmount * 100) / 100,
        paid_amount: 0.0,
        status: 'draft',
        notes: input.notes,
      })
      .select()
      .single();

    if (invErr) throw invErr;

    // Insert Items
    const itemsToInsert = input.items.map((it) => ({
      invoice_id: invoice.id,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unit_price,
      total_price: Math.round(it.quantity * it.unit_price * 100) / 100,
    }));

    if (itemsToInsert.length > 0) {
      const { error: itemErr } = await supabase.from('invoice_items').insert(itemsToInsert);
      if (itemErr) console.warn('Items note:', itemErr.message);
    }

    return invoice as Invoice;
  },

  async recordPayment(input: RecordPaymentInput): Promise<any> {
    // 1. Get current invoice
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', input.invoice_id)
      .single();
    if (invErr) throw invErr;

    const currentPaid = Number(invoice.paid_amount || 0);
    const newPaid = Math.round((currentPaid + input.amount) * 100) / 100;
    const total = Number(invoice.total_amount);
    const newStatus = newPaid >= total ? 'paid' : 'partially_paid';

    // 2. Insert payment
    const { data: payment, error: pmtErr } = await supabase
      .from('payments')
      .insert({
        business_id: input.business_id,
        invoice_id: input.invoice_id,
        customer_id: input.customer_id,
        amount: input.amount,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: input.payment_method || 'bank_transfer',
        reference_number: input.reference_number,
        notes: input.notes,
      })
      .select()
      .single();
    if (pmtErr) throw pmtErr;

    // 3. Update invoice
    await supabase
      .from('invoices')
      .update({
        paid_amount: newPaid,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.invoice_id);

    // 4. Update customer total revenue
    const { data: customer } = await supabase
      .from('customers')
      .select('total_revenue')
      .eq('id', input.customer_id)
      .single();

    if (customer) {
      const prevRev = Number(customer.total_revenue || 0);
      await supabase
        .from('customers')
        .update({
          total_revenue: Math.round((prevRev + input.amount) * 100) / 100,
          last_interaction_at: new Date().toISOString(),
        })
        .eq('id', input.customer_id);
    }

    return payment;
  },

  async sendInvoice(invoiceId: string): Promise<void> {
    await supabase.from('invoices').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', invoiceId);
  },

  async deleteInvoice(invoiceId: string): Promise<void> {
    await supabase.from('invoices').delete().eq('id', invoiceId);
  },
};
