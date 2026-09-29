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
}

export const customerService = {
  async listCustomers(businessId: string, search?: string, status?: string): Promise<Customer[]> {
    let query = supabase.from('customers').select('*').eq('business_id', businessId);
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) {
      console.warn('Error listing customers from Supabase:', error.message);
      return [];
    }
    return (data || []) as Customer[];
  },

  async getCustomer(id: string): Promise<Customer | null> {
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
    if (error) throw error;
    return data as Customer;
  },

  async createCustomer(input: CreateCustomerInput): Promise<Customer> {
    const { data, error } = await supabase.from('customers').insert(input).select().single();
    if (error) throw error;
    return data as Customer;
  },

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Customer;
  },

  async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
  },
};
