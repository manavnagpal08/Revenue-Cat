import { supabase } from '../lib/supabase';
import { Lead, LeadStatus } from '../types';

export interface CreateLeadInput {
  business_id: string;
  title: string;
  company?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  value: number;
  source?: string;
  status?: LeadStatus;
  priority?: 'low' | 'medium' | 'high';
  probability?: number;
  expected_close_date?: string;
  notes?: string;
  customer_id?: string;
  next_followup_at?: string;
}

export interface AddActivityInput {
  business_id: string;
  lead_id: string;
  customer_id?: string;
  activity_type: 'note' | 'email' | 'call' | 'meeting' | 'proposal_sent' | 'ai_brief';
  title: string;
  description?: string;
}

export const leadService = {
  async listLeads(businessId: string, stage?: string, priority?: string, search?: string): Promise<Lead[]> {
    let query = supabase.from('leads').select('*, customer:customers(*)').eq('business_id', businessId);
    if (stage && stage !== 'all') {
      query = query.eq('status', stage);
    }
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.warn('Error listing leads from Supabase:', error.message);
      return [];
    }
    return (data || []) as Lead[];
  },

  async getLead(id: string): Promise<Lead | null> {
    const { data, error } = await supabase.from('leads').select('*, customer:customers(*)').eq('id', id).single();
    if (error) throw error;
    return data as Lead;
  },

  async createLead(input: CreateLeadInput): Promise<Lead> {
    const { data, error } = await supabase.from('leads').insert(input).select().single();
    if (error) throw error;
    return data as Lead;
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Lead;
  },

  async deleteLead(id: string): Promise<void> {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) throw error;
  },

  async addActivity(input: AddActivityInput): Promise<any> {
    const { data, error } = await supabase.from('lead_activities').insert(input).select().single();
    if (error) throw error;
    await supabase.from('leads').update({ last_contacted_at: new Date().toISOString() }).eq('id', input.lead_id);
    return data;
  },

  async listActivities(leadId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async convertLeadToCustomer(lead: Lead): Promise<any> {
    // 1. Create Customer
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .insert({
        business_id: lead.business_id,
        name: (lead as any).contact_name || lead.title,
        company_name: (lead as any).company || lead.title,
        email: (lead as any).email,
        phone: (lead as any).phone,
        status: 'active',
        notes: `Converted from lead: ${lead.title}`,
        total_revenue: lead.value,
      })
      .select()
      .single();
    if (custErr) throw custErr;

    // 2. Update Lead
    await supabase.from('leads').update({
      customer_id: customer.id,
      status: 'won',
      probability: 100,
      updated_at: new Date().toISOString(),
    }).eq('id', lead.id);

    // 3. Log Activity
    await supabase.from('lead_activities').insert({
      business_id: lead.business_id,
      lead_id: lead.id,
      customer_id: customer.id,
      activity_type: 'note',
      title: 'Lead Converted to Customer 🎉',
      description: `Converted into active customer '${customer.name}'`,
    });

    return customer;
  },
};
