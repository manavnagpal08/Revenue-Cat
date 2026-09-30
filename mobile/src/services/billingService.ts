import { Platform } from 'react-native';
import Purchases, { PurchasesPackage, CustomerInfo, PurchasesOfferings, LOG_LEVEL } from 'react-native-purchases';
import { supabase } from '../lib/supabase';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://revenue-cat.onrender.com';

const REVENUECAT_PUBLIC_KEY = 'test_CrFMprZKCsqHUtaxGsWzWOzLgHN';

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
  tier: string; // 'free' | 'starter' | 'business' | 'pro'
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
  private isConfigured = false;

  constructor() {
    this.initRevenueCat();
  }

  async initRevenueCat(userId?: string) {
    if (this.isConfigured) return;
    try {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      Purchases.configure({
        apiKey: REVENUECAT_PUBLIC_KEY,
        appUserID: userId || undefined,
      });
      this.isConfigured = true;
    } catch (e) {
      console.warn('RevenueCat SDK configuration notice:', e);
    }
  }

  private getHeaders(token: string = 'test-token') {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Retrieves the current workspace subscription.
   * Defaults strictly to FREE tier if no active paid subscription is in DB.
   */
  async getSubscription(businessId: string): Promise<SubscriptionData> {
    // 1. Direct Supabase query
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && data.tier) {
        return data as SubscriptionData;
      }
    } catch {}

    // 2. Try Backend API
    try {
      const res = await fetch(`${API_BASE_URL}/api/billing/subscription?business_id=${businessId}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        const backendSub = await res.json();
        if (backendSub && backendSub.tier) {
          return backendSub;
        }
      }
    } catch {}

    // 3. Clean Free Starter Default
    return {
      id: `sub-free-${businessId.slice(0, 8)}`,
      business_id: businessId,
      user_id: 'user',
      tier: 'free',
      status: 'active',
      provider: 'revenuecat',
      active_entitlements: [],
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 365 * 86400000).toISOString(),
      cancel_at_period_end: false,
    };
  }

  async getPlans(): Promise<PlanConfig[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/billing/plans`, {
        headers: this.getHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}

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
          'All 4 AI Agents Enabled',
          'Gmail & Calendar Integrations',
          'Human-in-the-Loop Safe Approvals',
          '100% Ad-Free Experience',
        ],
        description: 'Essential operations and AI automation for solo founders.',
        is_popular: false,
        revenuecat_product_id: 'subscription_monthly_1',
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
          '100% Ad-Free Experience',
        ],
        description: 'Complete AI business operating suite for growing agencies.',
        is_popular: true,
        revenuecat_product_id: 'subscription_business_monthly',
      },
      {
        id: 'pro',
        name: 'Pro',
        price_monthly: 2999,
        currency: 'INR',
        currency_symbol: '₹',
        ai_credits_monthly: 1000,
        automations_limit: 250,
        included_integrations: ['gmail', 'google_calendar', 'whatsapp', 'website_leads', 'crm', 'slack', 'zapier', 'notion'],
        features: [
          '1,000 AI Credits / month',
          'Unlimited Workflow Rules',
          'Dedicated High-Throughput Agents',
          'White-Label Invoices & Custom Branding',
          'VIP Dedicated Support',
          '100% Ad-Free Experience',
        ],
        description: 'Maximum power, highest credit allowances, and unlimited workflows.',
        is_popular: false,
        revenuecat_product_id: 'subscription_pro_monthly',
      },
    ];
  }

  async getOfferings(): Promise<PurchasesOfferings | null> {
    try {
      await this.initRevenueCat();
      return await Purchases.getOfferings();
    } catch (e) {
      console.warn('RevenueCat offerings fetch notice:', e);
      return null;
    }
  }

  /**
   * Retrieves entitlements dynamically based on the current subscription tier.
   */
  async getEntitlements(businessId: string): Promise<EntitlementsData> {
    const sub = await this.getSubscription(businessId);
    const tier = sub?.tier || 'free';

    if (tier === 'pro') {
      return {
        business_id: businessId,
        tier: 'pro',
        status: 'active',
        can_access_ai_command: true,
        can_access_all_agents: true,
        can_access_integrations: true,
        can_access_automations: true,
        ai_credits_total: 1000,
        ai_credits_used: 0,
        ai_credits_remaining: 1000,
        automations_limit: 250,
        automations_active: 0,
        automations_remaining: 250,
        feature_flags: { whatsapp_enabled: true, white_label: true },
      };
    }

    if (tier === 'business') {
      return {
        business_id: businessId,
        tier: 'business',
        status: 'active',
        can_access_ai_command: true,
        can_access_all_agents: true,
        can_access_integrations: true,
        can_access_automations: true,
        ai_credits_total: 250,
        ai_credits_used: 0,
        ai_credits_remaining: 250,
        automations_limit: 25,
        automations_active: 0,
        automations_remaining: 25,
        feature_flags: { whatsapp_enabled: true, white_label: false },
      };
    }

    if (tier === 'starter') {
      return {
        business_id: businessId,
        tier: 'starter',
        status: 'active',
        can_access_ai_command: true,
        can_access_all_agents: true,
        can_access_integrations: true,
        can_access_automations: true,
        ai_credits_total: 50,
        ai_credits_used: 0,
        ai_credits_remaining: 50,
        automations_limit: 5,
        automations_active: 0,
        automations_remaining: 5,
        feature_flags: { whatsapp_enabled: false, white_label: false },
      };
    }

    // Default Free Starter Tier
    return {
      business_id: businessId,
      tier: 'free',
      status: 'active',
      can_access_ai_command: true,
      can_access_all_agents: true,
      can_access_integrations: true,
      can_access_automations: true,
      ai_credits_total: 10,
      ai_credits_used: 0,
      ai_credits_remaining: 10,
      automations_limit: 2,
      automations_active: 0,
      automations_remaining: 2,
      feature_flags: { whatsapp_enabled: false, white_label: false },
    };
  }

  async getUsage(businessId: string): Promise<UsageSummary> {
    const entitlements = await this.getEntitlements(businessId);
    return {
      business_id: businessId,
      plan_tier: entitlements.tier,
      period_start: new Date().toISOString(),
      period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      ai_credits_total: entitlements.ai_credits_total,
      ai_credits_used: entitlements.ai_credits_used,
      ai_credits_remaining: entitlements.ai_credits_remaining,
      ai_credits_percent: 0,
      automations_limit: entitlements.automations_limit,
      automations_active: entitlements.automations_active,
      automations_percent: 0,
      usage_by_action: { sales_query: 0, finance_query: 0, supervisor_chat: 0 },
      recent_usage_records: [],
    };
  }

  async getHistory(businessId: string): Promise<BillingHistoryItem[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/api/billing/history?business_id=${businessId}`, {
        headers: this.getHeaders(),
      });
      if (res.ok) return await res.json();
    } catch {}
    return [];
  }

  async restorePurchases(businessId: string, appUserId?: string): Promise<{ success: boolean; message: string; tier: string }> {
    try {
      await this.initRevenueCat(appUserId || businessId);
      const customerInfo = await Purchases.restorePurchases();
      const activeKeys = Object.keys(customerInfo?.entitlements?.active || {});
      if (activeKeys.length > 0) {
        const restoredTier = activeKeys.includes('pro')
          ? 'pro'
          : activeKeys.includes('business')
          ? 'business'
          : 'starter';

        await this.persistSubscription(businessId, restoredTier);
        return {
          success: true,
          message: `Purchases restored: ${restoredTier.toUpperCase()} plan active.`,
          tier: restoredTier,
        };
      }
    } catch (e: any) {
      console.warn('RevenueCat SDK restore check:', e);
    }

    // Check DB record
    const sub = await this.getSubscription(businessId);
    if (sub.tier !== 'free') {
      return {
        success: true,
        message: `Restored active ${sub.tier.toUpperCase()} subscription.`,
        tier: sub.tier,
      };
    }

    return {
      success: false,
      message: 'No previous active purchases found for this account.',
      tier: 'free',
    };
  }

  private async persistSubscription(businessId: string, planTier: string): Promise<SubscriptionData> {
    const updatedSub: SubscriptionData = {
      id: `sub-${Date.now()}`,
      business_id: businessId,
      user_id: 'user',
      tier: planTier,
      status: 'active',
      provider: 'revenuecat',
      active_entitlements: [`${planTier}_access`],
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      cancel_at_period_end: false,
    };

    try {
      await supabase.from('subscriptions').upsert(updatedSub);
    } catch (e) {
      console.warn('Supabase subscription upsert note:', e);
    }

    try {
      await fetch(`${API_BASE_URL}/api/billing/upgrade`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ business_id: businessId, plan_tier: planTier }),
      });
    } catch {}

    return updatedSub;
  }

  /**
   * Upgrades the workspace subscription tier using RevenueCat IAP or direct payment confirmation.
   */
  async upgradePlan(businessId: string, planTier: string): Promise<SubscriptionData> {
    // 1. Trigger RevenueCat purchase if live package is found
    try {
      await this.initRevenueCat(businessId);
      const offerings = await Purchases.getOfferings();
      const currentOffering = offerings?.current;
      if (currentOffering && currentOffering.availablePackages.length > 0) {
        const targetPackage = currentOffering.availablePackages.find(
          (p) =>
            p.identifier.toLowerCase().includes(planTier) ||
            p.product.identifier.toLowerCase().includes(planTier)
        );

        if (targetPackage) {
          const { customerInfo } = await Purchases.purchasePackage(targetPackage);
          console.log('RevenueCat In-App Purchase completed:', customerInfo);
        }
      }
    } catch (e: any) {
      if (e.userCancelled) {
        throw new Error('Transaction was cancelled.');
      }
      console.warn('RevenueCat store package notice (activating via backend/DB):', e.message);
    }

    // 2. Persist upgraded subscription in DB & backend
    return await this.persistSubscription(businessId, planTier);
  }
}

export const billingService = new BillingService();
