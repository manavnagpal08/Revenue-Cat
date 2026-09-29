import { supabase } from '../lib/supabase';
import { Proposal, Invoice } from '../types';

export interface CreateProposalInput {
  business_id: string;
  customer_id?: string;
  lead_id?: string;
  title: string;
  project_overview?: string;
  deliverables?: Array<{ title: string; cost: number }>;
  timeline?: string;
  total_value: number;
  valid_until?: string;
}

export const proposalService = {
  async listProposals(businessId: string, statusFilter?: string, search?: string): Promise<Proposal[]> {
    let query = supabase.from('proposals').select('*, customer:customers(*)').eq('business_id', businessId);
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.warn('Error listing proposals from Supabase:', error.message);
      return [];
    }
    return (data || []) as Proposal[];
  },

  async getProposal(id: string): Promise<Proposal | null> {
    const { data, error } = await supabase
      .from('proposals')
      .select('*, customer:customers(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Proposal;
  },

  async createProposal(input: CreateProposalInput): Promise<Proposal> {
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        ...input,
        status: 'draft',
      })
      .select()
      .single();
    if (error) throw error;
    return data as Proposal;
  },

  async acceptProposal(id: string): Promise<void> {
    await supabase.from('proposals').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', id);
  },

  async rejectProposal(id: string): Promise<void> {
    await supabase.from('proposals').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', id);
  },

  async convertProposalToInvoice(proposal: Proposal): Promise<Invoice> {
    const totalVal = Number(proposal.total_value || 0);
    const subtotal = Math.round((totalVal / 1.18) * 100) / 100;
    const taxAmount = Math.round((totalVal - subtotal) * 100) / 100;

    const invNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    // 1. Create Invoice
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert({
        business_id: proposal.business_id,
        customer_id: proposal.customer_id,
        invoice_number: invNumber,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: dueDate,
        subtotal,
        tax_rate: 18.0,
        tax_amount: taxAmount,
        discount_amount: 0.0,
        total_amount: totalVal,
        paid_amount: 0.0,
        status: 'draft',
        notes: `Generated from Proposal: ${proposal.title}`,
      })
      .select()
      .single();
    if (invErr) throw invErr;

    // 2. Insert items
    const deliverables = proposal.deliverables || [];
    if (deliverables.length > 0) {
      const items = deliverables.map((d) => ({
        invoice_id: invoice.id,
        description: d.title,
        quantity: 1.0,
        unit_price: d.cost,
        total_price: d.cost,
      }));
      await supabase.from('invoice_items').insert(items);
    }

    // 3. Mark proposal accepted
    await supabase.from('proposals').update({ status: 'accepted' }).eq('id', proposal.id);

    return invoice as Invoice;
  },

  async deleteProposal(id: string): Promise<void> {
    await supabase.from('proposals').delete().eq('id', id);
  },
};
