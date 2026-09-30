import { supabase } from '../lib/supabase';
import { Lead, LeadStatus } from '../types';
import { customerService } from './customerService';

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

// In-memory cache for instant UI rendering and offline/simulator resilience
const leadCache = new Map<string, Lead[]>();

export const leadService = {
  async listLeads(businessId: string, stage?: string, priority?: string, search?: string): Promise<Lead[]> {
    let dbLeads: Lead[] = [];
    try {
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
      if (!error && data) {
        dbLeads = data as Lead[];
      }
    } catch (err) {
      console.warn('Supabase lead query error:', err);
    }

    const cached = leadCache.get(businessId) || [];
    const leadMap = new Map<string, Lead>();

    // Put cached first, then overlay with DB
    for (const l of cached) {
      leadMap.set(l.id, l);
    }
    for (const l of dbLeads) {
      leadMap.set(l.id, l);
    }

    let combined = Array.from(leadMap.values());
    if (stage && stage !== 'all') {
      combined = combined.filter((l) => l.status === stage);
    }
    if (priority && priority !== 'all') {
      combined = combined.filter((l) => l.priority === priority);
    }
    if (search) {
      const q = search.toLowerCase();
      combined = combined.filter(
        (l) =>
          l.title?.toLowerCase().includes(q) ||
          (l as any).company?.toLowerCase().includes(q) ||
          (l as any).contact_name?.toLowerCase().includes(q)
      );
    }

    return combined.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  },

  async getLead(id: string): Promise<Lead | null> {
    try {
      const { data, error } = await supabase.from('leads').select('*, customer:customers(*)').eq('id', id).single();
      if (!error && data) return data as Lead;
    } catch {}

    for (const list of leadCache.values()) {
      const found = list.find((l) => l.id === id);
      if (found) return found;
    }
    return null;
  },

  async createLead(input: CreateLeadInput): Promise<Lead> {
    const tempId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newLead: Lead = {
      id: tempId,
      business_id: input.business_id,
      title: input.title,
      company: input.company,
      contact_name: input.contact_name,
      email: input.email,
      phone: input.phone,
      value: input.value || 0,
      source: input.source || 'Manual Entry',
      status: input.status || 'new',
      priority: input.priority || 'medium',
      probability: input.probability || 30,
      expected_close_date: input.expected_close_date,
      notes: input.notes,
      customer_id: input.customer_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any;

    // 1. Auto-create or ensure customer in CRM
    try {
      if (input.contact_name || input.company || input.email) {
        const customerName = input.contact_name || input.company || input.title;
        const customer = await customerService.createCustomer({
          business_id: input.business_id,
          name: customerName,
          company_name: input.company || customerName,
          email: input.email,
          phone: input.phone,
          status: 'active',
          notes: `Prospect for: ${input.title} (Source: ${input.source || 'Lead Simulator'})`,
        });
        if (customer?.id) {
          newLead.customer_id = customer.id;
          (newLead as any).customer = customer;
        }
      }
    } catch (e) {
      console.warn('CRM customer auto-link warning:', e);
    }

    // 2. Insert to Supabase leads table
    try {
      const { data, error } = await supabase.from('leads').insert({
        business_id: newLead.business_id,
        title: newLead.title,
        company: (newLead as any).company,
        contact_name: (newLead as any).contact_name,
        email: (newLead as any).email,
        phone: (newLead as any).phone,
        value: newLead.value,
        source: (newLead as any).source,
        status: newLead.status,
        priority: newLead.priority,
        probability: newLead.probability,
        notes: (newLead as any).notes,
        customer_id: newLead.customer_id,
      }).select().single();

      if (!error && data) {
        Object.assign(newLead, data);
      }
    } catch (e) {
      console.warn('Supabase lead insert fallback to memory:', e);
    }

    // 3. Cache in memory
    const existing = leadCache.get(input.business_id) || [];
    leadCache.set(input.business_id, [newLead, ...existing]);

    return newLead;
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as Lead;
    } catch {}

    for (const [bizId, list] of leadCache.entries()) {
      const idx = list.findIndex((l) => l.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
        leadCache.set(bizId, [...list]);
        return list[idx];
      }
    }

    return updates as Lead;
  },

  async deleteLead(id: string): Promise<void> {
    try {
      await supabase.from('leads').delete().eq('id', id);
    } catch {}

    for (const [bizId, list] of leadCache.entries()) {
      leadCache.set(
        bizId,
        list.filter((l) => l.id !== id)
      );
    }
  },

  async addActivity(input: AddActivityInput): Promise<any> {
    try {
      const { data, error } = await supabase.from('lead_activities').insert(input).select().single();
      if (!error && data) {
        await supabase.from('leads').update({ last_contacted_at: new Date().toISOString() }).eq('id', input.lead_id);
        return data;
      }
    } catch {}

    return { id: `act_${Date.now()}`, ...input, created_at: new Date().toISOString() };
  },

  async listActivities(leadId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch {}
    return [];
  },

  async convertLeadToCustomer(lead: Lead): Promise<any> {
    // 1. Create Customer
    const customer = await customerService.createCustomer({
      business_id: lead.business_id,
      name: (lead as any).contact_name || lead.title,
      company_name: (lead as any).company || lead.title,
      email: (lead as any).email,
      phone: (lead as any).phone,
      status: 'active',
      notes: `Converted from lead: ${lead.title}`,
    });

    // 2. Update Lead
    await this.updateLead(lead.id, {
      customer_id: customer.id,
      status: 'won',
      probability: 100,
    });

    // 3. Log Activity
    await this.addActivity({
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
