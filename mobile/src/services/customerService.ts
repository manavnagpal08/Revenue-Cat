import { supabase } from '../lib/supabase';
import { Customer } from '../types';

export interface CreateCustomerInput {
  business_id: string;
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  notes?: string;
  status?: 'active' | 'inactive' | 'archived';
  total_revenue?: number;
}

// In-memory cache for instant CRM sync
const customerCache = new Map<string, Customer[]>();

export const customerService = {
  async listCustomers(businessId: string, search?: string, status?: string): Promise<Customer[]> {
    let dbCustomers: Customer[] = [];
    try {
      let query = supabase.from('customers').select('*').eq('business_id', businessId);
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) {
        dbCustomers = data as Customer[];
      }
    } catch (err) {
      console.warn('Error listing customers from Supabase:', err);
    }

    const cached = customerCache.get(businessId) || [];
    const custMap = new Map<string, Customer>();

    for (const c of cached) {
      custMap.set(c.id, c);
      if (c.email) custMap.set(`email:${c.email}`, c);
    }
    for (const c of dbCustomers) {
      custMap.set(c.id, c);
    }

    let combined = Array.from(new Set(custMap.values()));
    if (status && status !== 'all') {
      combined = combined.filter((c) => c.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      combined = combined.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.company_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q)
      );
    }

    return combined.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
  },

  async getCustomer(id: string): Promise<Customer | null> {
    try {
      const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
      if (!error && data) return data as Customer;
    } catch {}

    for (const list of customerCache.values()) {
      const found = list.find((c) => c.id === id);
      if (found) return found;
    }
    return null;
  },

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    const tempId = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newCustomer: Customer = {
      id: tempId,
      business_id: input.business_id,
      name: input.name,
      company_name: input.company_name || input.name,
      email: input.email || '',
      phone: input.phone || '',
      website: input.website || '',
      address: input.address || '',
      notes: input.notes || '',
      status: input.status || 'active',
      total_revenue: input.total_revenue || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any;

    try {
      const { data, error } = await supabase.from('customers').insert({
        business_id: newCustomer.business_id,
        name: newCustomer.name,
        company_name: newCustomer.company_name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        website: newCustomer.website,
        address: newCustomer.address,
        notes: newCustomer.notes,
        status: newCustomer.status,
      }).select().single();

      if (!error && data) {
        Object.assign(newCustomer, data);
      }
    } catch (e) {
      console.warn('Customer insert fallback to memory:', e);
    }

    const existing = customerCache.get(input.business_id) || [];
    customerCache.set(input.business_id, [newCustomer, ...existing.filter((c) => c.email !== newCustomer.email)]);

    return newCustomer;
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data as Customer;
    } catch {}

    for (const [bizId, list] of customerCache.entries()) {
      const idx = list.findIndex((c) => c.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() };
        customerCache.set(bizId, [...list]);
        return list[idx];
      }
    }

    return updates as Customer;
  },

  async deleteCustomer(id: string): Promise<void> {
    try {
      await supabase.from('customers').delete().eq('id', id);
    } catch {}

    for (const [bizId, list] of customerCache.entries()) {
      customerCache.set(
        bizId,
        list.filter((c) => c.id !== id)
      );
    }
  },
};
