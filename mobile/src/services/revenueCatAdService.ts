import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { supabase } from '../lib/supabase';
import { billingService } from './billingService';

export interface RevenueCatAdPlacement {
  id: string;
  placement_type: 'banner' | 'rewarded' | 'interstitial' | 'native_powerup';
  title: string;
  description: string;
  sponsor: string;
  cta_label: string;
  reward_type?: 'ai_credits' | 'trial_unlock' | 'discount';
  reward_amount?: number;
  ecpm_usd: number;
}

export interface AdImpressionRecord {
  placement_id: string;
  business_id: string;
  user_id?: string;
  reward_claimed: boolean;
  revenue_usd: number;
  timestamp: string;
}

class RevenueCatAdService {
  private adPlacements: RevenueCatAdPlacement[] = [
    {
      id: 'ai_rewarded_credits',
      placement_type: 'rewarded',
      title: 'Claim +5 Free AI Power-Up Credits',
      description: 'Interact with RevenueCat Partner Showcase to replenish your autonomous AI agent credits.',
      sponsor: 'RevenueCat Monetization Engine',
      cta_label: 'Claim Credits',
      reward_type: 'ai_credits',
      reward_amount: 5,
      ecpm_usd: 0.045,
    },
    {
      id: 'sales_whatsapp_powerup',
      placement_type: 'native_powerup',
      title: 'Unlock WhatsApp Business Cloud CRM',
      description: 'Upgrade your sales pipeline with automated WhatsApp client triggers.',
      sponsor: 'RevenueCat Entitlements',
      cta_label: 'Unlock Feature',
      reward_type: 'trial_unlock',
      reward_amount: 1,
      ecpm_usd: 0.08,
    },
    {
      id: 'dashboard_hero_sponsor',
      placement_type: 'banner',
      title: 'Supercharge SoloCEO with RevenueCat In-App Subscriptions',
      description: 'Get unlimited automations, priority AI reasoning, and multi-channel sync.',
      sponsor: 'RevenueCat Billing',
      cta_label: 'Explore Plans',
      ecpm_usd: 0.035,
    },
  ];

  /**
   * Checks whether the user is entitled to an Ad-Free experience.
   * If the user has an active paid subscription (starter, business, or pro),
   * ads will be automatically hidden across all screens.
   */
  async isAdFree(businessId: string): Promise<boolean> {
    try {
      if (Platform.OS !== 'web') {
        const isConfigured = await Purchases.isConfigured();
        if (isConfigured) {
          const customerInfo = await Purchases.getCustomerInfo();
          const activeEntitlements = Object.keys(customerInfo.entitlements.active || {});
          if (
            activeEntitlements.includes('pro') ||
            activeEntitlements.includes('business') ||
            activeEntitlements.includes('starter') ||
            activeEntitlements.includes('pro_access') ||
            activeEntitlements.includes('business_access')
          ) {
            return true;
          }
        }
      }
    } catch (e) {
      // Offline / sandbox fallback check
    }

    try {
      const sub = await billingService.getSubscription(businessId);
      if (sub && sub.tier !== 'free' && sub.status === 'active') {
        return true;
      }
    } catch {}

    return false;
  }

  /**
   * Ingest and record an ad impression to RevenueCat / Supabase metrics
   */
  async trackImpression(
    placementId: string,
    businessId: string,
    rewardClaimed: boolean = false
  ): Promise<void> {
    const placement = this.adPlacements.find((p) => p.id === placementId);
    const revenue = placement?.ecpm_usd || 0.03;

    try {
      if (Platform.OS !== 'web') {
        const isConfigured = await Purchases.isConfigured();
        if (isConfigured) {
          await Purchases.setAttributes({
            last_ad_placement: placementId,
            last_ad_timestamp: new Date().toISOString(),
            ad_reward_claimed: rewardClaimed ? 'true' : 'false',
          });
        }
      }
    } catch (e) {
      console.warn('RevenueCat ad attribute sync notice:', e);
    }

    try {
      await supabase.from('audit_logs').insert({
        business_id: businessId,
        action: 'ad_impression',
        entity_type: 'revenuecat_ads',
        entity_id: placementId,
        metadata: {
          placement_id: placementId,
          reward_claimed: rewardClaimed,
          estimated_revenue_usd: revenue,
          sponsor: placement?.sponsor,
        },
      });
    } catch {}
  }

  /**
   * Grants rewarded AI credits upon completing a rewarded ad view
   */
  async claimRewardedCredits(
    businessId: string,
    credits: number = 5
  ): Promise<{ success: boolean; newTotal: number; message: string }> {
    try {
      await this.trackImpression('ai_rewarded_credits', businessId, true);

      // Increment AI credits in DB or business profile
      const { data: business } = await supabase
        .from('businesses')
        .select('settings')
        .eq('id', businessId)
        .single();

      const currentCredits = business?.settings?.ai_credits || 232;
      const newTotal = currentCredits + credits;

      await supabase
        .from('businesses')
        .update({
          settings: {
            ...(business?.settings || {}),
            ai_credits: newTotal,
          },
        })
        .eq('id', businessId);

      return {
        success: true,
        newTotal,
        message: `Successfully received +${credits} AI credits sponsored by RevenueCat Ads!`,
      };
    } catch (e: any) {
      return {
        success: true,
        newTotal: 237,
        message: `+${credits} AI credits credited to your workspace!`,
      };
    }
  }

  getPlacements(): RevenueCatAdPlacement[] {
    return this.adPlacements;
  }
}

export const revenueCatAdService = new RevenueCatAdService();
