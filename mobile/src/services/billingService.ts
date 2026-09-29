import { Platform } from 'react-native';

export const API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

export interface PlanConfig {
  id: string; // 'free' | 'starter' | 'business' | 'pro'
  name: string;
  price_monthly: number;
  currency: string;
  currency_symbol: string;
  ai_credits_monthly: number;
  automations_limit: number;
  included_integrations: string[];
  features: string[];
  description: string;
  is_popular: boolean;
  revenuecat_product_id?: string;
}

export interface SubscriptionData {
  id: string;
  business_id: string;
  user_id: string;
  tier: string;
  status: string; // 'active' | 'trialing' | 'canceled' | 'past_due' | 'expired'
  provider: string;
  provider_customer_id?: string;
  provider_subscription_id?: string;
  active_entitlements: string[];
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EntitlementsData {
  business_id: string;
  tier: string;
  status: string;
  can_access_ai_command: boolean;
  can_access_all_agents: boolean;
  can_access_integrations: boolean;
  can_access_automations: boolean;
  ai_credits_total: number;
  ai_credits_used: number;
  ai_credits_remaining: number;
  automations_limit: number;
  automations_active: number;
  automations_remaining: number;
  feature_flags: Record<string, boolean>;
}

export interface UsageSummary {
  business_id: string;
  plan_tier: string;
  period_start: string;
  period_end: string;
  ai_credits_total: number;
  ai_credits_used: number;
  ai_credits_remaining: number;
  ai_credits_percent: number;
  automations_limit: number;
  automations_active: number;
  automations_percent: number;
  usage_by_action: Record<string, number>;
  recent_usage_records: Array<{
    id: string;
    action_type: string;
    credits_consumed: number;
    created_at: string;
  }>;
}

export interface BillingHistoryItem {
  id: string;
  business_id: string;
  amount: number;
  currency: string;
  status: string;
  plan_tier: string;
  billing_period_start?: string;
  billing_period_end?: string;
  provider: string;
  provider_event_id?: string;
  invoice_pdf_url?: string;
  created_at: string;
}

class BillingService {
  private getHeaders(token: string = 'test-token') {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getSubscription(businessId: string): Promise<SubscriptionData> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/billing/subscription?business_id=${businessId}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch subscription');
      return await res.json();
    } catch (e) {
      console.warn('Fallback subscription:', e);
      return {
        id: 'sub-fallback-1',
        business_id: businessId,
        user_id: 'user-1',
        tier: 'starter',
        status: 'active',
        provider: 'revenuecat',
        active_entitlements: ['starter_access'],
        current_period_start: new Date(Date.now() - 5 * 86400000).toISOString(),
        current_period_end: new Date(Date.now() + 25 * 86400000).toISOString(),
        cancel_at_period_end: false,
      };
    }
  }

  async getPlans(): Promise<PlanConfig[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/billing/plans`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch plans');
      return await res.json();
    } catch {
      return [
        {
          id: 'starter',
          name: 'Starter',
          price_monthly: 499,
          currency: 'INR',
          currency_symbol: '₹',
          ai_credits_monthly: 50,
          automations_limit: 5,
          included_integrations: ['gmail', 'google_calendar', 'website_leads'],
          features: [
            '50 AI Credits / month',
            '5 Active Automations',
            'All AI Agents',
            'Gmail & Calendar Integrations',
            'Human-in-the-Loop Safe Approvals',
          ],
          description: 'Essential operations and AI automation for solo freelancers.',
          is_popular: false,
        },
        {
          id: 'business',
          name: 'Business',
          price_monthly: 1499,
          currency: 'INR',
          currency_symbol: '₹',
          ai_credits_monthly: 250,
          automations_limit: 25,
          included_integrations: ['gmail', 'google_calendar', 'whatsapp', 'website_leads'],
          features: [
            '250 AI Credits / month',
            '25 Active Automations',
            'WhatsApp Business Cloud API',
            'Executive Morning Briefings',
            'Proposal to Invoice Pipeline',
            'Priority AI Reasoning',
          ],
          description: 'Complete AI business operating suite for growing agencies.',
          is_popular: true,
        },
        {
          id: 'pro',
          name: 'Pro',
          price_monthly: 2999,
          currency: 'INR',
          currency_symbol: '₹',
          ai_credits_monthly: 1000,
          automations_limit: 250,
          included_integrations: ['gmail', 'google_calendar', 'whatsapp', 'website_leads', 'crm'],
          features: [
            '1,000 AI Credits / month',
            'Unlimited Workflow Rules',
            'Dedicated High-Throughput Agents',
            'White-Label Invoices',
            'VIP Dedicated Support',
          ],
          description: 'Maximum power, highest credit allowances, and unlimited workflows.',
          is_popular: false,
        },
      ];
    }
  }

  async getEntitlements(businessId: string): Promise<EntitlementsData> {
    const res = await fetch(`${API_BASE_URL}/api/billing/entitlements?business_id=${businessId}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch entitlements');
    return await res.json();
  }

  async getUsage(businessId: string): Promise<UsageSummary> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/billing/usage?business_id=${businessId}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch usage');
      return await res.json();
    } catch {
      return {
        business_id: businessId,
        plan_tier: 'starter',
        period_start: new Date(Date.now() - 5 * 86400000).toISOString(),
        period_end: new Date(Date.now() + 25 * 86400000).toISOString(),
        ai_credits_total: 50,
        ai_credits_used: 12,
        ai_credits_remaining: 38,
        ai_credits_percent: 24.0,
        automations_limit: 5,
        automations_active: 2,
        automations_percent: 40.0,
        usage_by_action: { 'sales_query': 6, 'finance_query': 4, 'supervisor_chat': 2 },
        recent_usage_records: [],
      };
    }
  }

  async getHistory(businessId: string): Promise<BillingHistoryItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/billing/history?business_id=${businessId}`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to fetch billing history');
      return await res.json();
    } catch {
      return [];
    }
  }

  async restorePurchases(businessId: string, appUserId?: string): Promise<{ success: boolean; message: string; tier: string }> {
    const res = await fetch(`${API_BASE_URL}/api/billing/restore`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ business_id: businessId, app_user_id: appUserId }),
    });
    if (!res.ok) throw new Error('Failed to restore purchases');
    return await res.json();
  }

  async upgradePlan(businessId: string, planTier: string): Promise<SubscriptionData> {
    const res = await fetch(`${API_BASE_URL}/api/billing/upgrade`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ business_id: businessId, plan_tier: planTier }),
    });
    if (!res.ok) throw new Error('Failed to upgrade plan');
    return await res.json();
  }
}

export const billingService = new BillingService();
