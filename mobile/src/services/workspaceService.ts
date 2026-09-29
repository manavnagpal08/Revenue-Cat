import { supabase } from '../lib/supabase';
import { Business } from '../types';

export interface CreateBusinessInput {
  name: string;
  industry?: string;
  currency?: string;
  currency_symbol?: string;
  phone?: string;
  website?: string;
  address?: string;
  tax_number?: string;
}

export const workspaceService = {
  /**
   * Fetches all businesses the user has access to.
   */
  async getUserBusinesses(userId: string): Promise<Business[]> {
    // 1. Query businesses owned directly
    const { data: ownedBusinesses, error: ownedErr } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', userId);

    if (ownedErr) {
      console.warn('Error fetching owned businesses:', ownedErr.message);
    }

    // 2. Query businesses where user is a member
    const { data: memberRecords, error: memberErr } = await supabase
      .from('business_members')
      .select('business_id, role, businesses(*)')
      .eq('user_id', userId);

    if (memberErr) {
      console.warn('Error fetching member businesses:', memberErr.message);
    }

    const businessMap = new Map<string, Business>();

    if (ownedBusinesses) {
      for (const b of ownedBusinesses) {
        businessMap.set(b.id, b as Business);
      }
    }

    if (memberRecords) {
      for (const m of memberRecords) {
        if (m.businesses && !Array.isArray(m.businesses)) {
          businessMap.set(m.business_id, m.businesses as unknown as Business);
        }
      }
    }

    return Array.from(businessMap.values());
  },

  /**
   * Creates a new business workspace and sets up membership and default settings.
   */
  async createBusiness(userId: string, input: CreateBusinessInput): Promise<Business> {
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .insert({
        owner_id: userId,
        name: input.name.trim(),
        slug: input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        industry: input.industry?.trim() || 'Consulting & Services',
        currency: input.currency || 'INR',
        currency_symbol: input.currency_symbol || '₹',
        phone: input.phone?.trim() || null,
        website: input.website?.trim() || null,
        address: input.address?.trim() || null,
        tax_number: input.tax_number?.trim() || null,
      })
      .select()
      .single();

    if (bizError) throw bizError;

    // Create owner membership
    const { error: memError } = await supabase.from('business_members').insert({
      business_id: business.id,
      user_id: userId,
      role: 'owner',
    });
    if (memError) console.warn('Membership record created with note:', memError.message);

    // Create default settings
    const { error: setErrors } = await supabase.from('business_settings').insert({
      business_id: business.id,
      ai_tone: 'professional',
      default_invoice_due_days: 14,
      default_tax_rate: 18.00,
    });
    if (setErrors) console.warn('Settings record created with note:', setErrors.message);

    return business as Business;
  },

  /**
   * Updates an existing business workspace.
   */
  async updateBusiness(businessId: string, updates: Partial<Business>): Promise<Business> {
    const { data, error } = await supabase
      .from('businesses')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', businessId)
      .select()
      .single();

    if (error) throw error;
    return data as Business;
  },
};
