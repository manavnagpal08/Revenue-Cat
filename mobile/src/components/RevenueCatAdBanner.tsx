import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Gift } from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { safeHaptic } from '../utils/haptics';

interface RevenueCatAdBannerProps {
  variant?: 'hero' | 'rewarded' | 'compact' | 'sales';
  style?: ViewStyle;
  onClaimReward?: () => void;
}

export const RevenueCatAdBanner: React.FC<RevenueCatAdBannerProps> = ({
  variant = 'hero',
  style,
  onClaimReward,
}) => {
  const router = useRouter();

  const handlePress = () => {
    safeHaptic.medium();
    if (variant === 'rewarded' && onClaimReward) {
      onClaimReward();
    } else {
      router.push('/paywall');
    }
  };

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, style]}
        onPress={handlePress}
        activeOpacity={0.88}
      >
        <View style={styles.rcBadgeSmall}>
          <ShieldCheck size={12} color="#059669" />
          <Text style={styles.rcBadgeTextSmall}>SECURED BY REVENUECAT</Text>
        </View>
        <Text style={styles.compactText}>100% Encrypted In-App Purchases & Instant Entitlements</Text>
        <ArrowRight size={13} color="#059669" />
      </TouchableOpacity>
    );
  }

  if (variant === 'rewarded') {
    return (
      <TouchableOpacity
        style={[styles.rewardedContainer, style]}
        onPress={handlePress}
        activeOpacity={0.88}
      >
        <View style={styles.rewardIconWrap}>
          <Gift size={20} color="#D97706" />
        </View>
        <View style={styles.rewardContent}>
          <View style={styles.adLabelRow}>
            <Text style={styles.adSponsoredLabel}>SPONSORED BY REVENUECAT</Text>
            <View style={styles.freeCreditsPill}>
              <Text style={styles.freeCreditsPillText}>+5 CREDITS</Text>
            </View>
          </View>
          <Text style={styles.rewardTitle}>Claim Free AI Power-Up Credits</Text>
          <Text style={styles.rewardSub}>Tap to view partner benefits & top up your balance</Text>
        </View>
        <View style={styles.claimBtn}>
          <Text style={styles.claimBtnText}>Claim</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'sales') {
    return (
      <TouchableOpacity
        style={[styles.salesContainer, style]}
        onPress={handlePress}
        activeOpacity={0.88}
      >
        <View style={styles.salesLeft}>
          <View style={styles.salesIconCircle}>
            <Zap size={18} color="#059669" />
          </View>
          <View style={styles.salesTextWrap}>
            <View style={styles.rcHeaderRow}>
              <Text style={styles.rcTag}>REVENUECAT POWER-UP</Text>
            </View>
            <Text style={styles.salesTitle}>Unlock WhatsApp Business CRM</Text>
            <Text style={styles.salesSub}>Automate lead messages in 30s with Business Plan</Text>
          </View>
        </View>
        <View style={styles.salesCtaBtn}>
          <Text style={styles.salesCtaText}>Upgrade</Text>
          <ArrowRight size={12} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    );
  }

  // Default: HERO Variant
  return (
    <TouchableOpacity
      style={[styles.heroContainer, style]}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <View style={styles.heroTopRow}>
        <View style={styles.sponsorBadge}>
          <Sparkles size={12} color="#D97706" />
          <Text style={styles.sponsorBadgeText}>REVENUECAT PARTNER OFFER</Text>
        </View>
        <View style={styles.activePlanPill}>
          <Text style={styles.activePlanText}>UPGRADE</Text>
        </View>
      </View>

      <Text style={styles.heroHeadline}>Supercharge SoloCEO with RevenueCat In-App Subscriptions</Text>
      <Text style={styles.heroDesc}>
        Unlock 250+ monthly AI reasoning credits, WhatsApp Cloud API integration, and unlimited autonomous workflows.
      </Text>

      <View style={styles.heroFooterRow}>
        <View style={styles.benefitChips}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>✓ Instant Activation</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>✓ Cancel Anytime</Text>
          </View>
        </View>
        <View style={styles.heroActionBtn}>
          <Text style={styles.heroActionText}>Explore Plans</Text>
          <ArrowRight size={13} color="#FFFFFF" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  heroContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    ...Shadows.sm,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sponsorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sponsorBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: '#D97706',
    letterSpacing: 0.6,
  },
  activePlanPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activePlanText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: '#059669',
  },
  heroHeadline: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: '#0F172A',
    lineHeight: 21,
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Manrope_400Regular',
    lineHeight: 17,
    marginBottom: 12,
  },
  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  benefitChips: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipText: {
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#475569',
  },
  heroActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    ...Shadows.glow,
  },
  heroActionText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#FFFFFF',
  },
  rewardedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    gap: 12,
    ...Shadows.sm,
  },
  rewardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardContent: {
    flex: 1,
  },
  adLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  adSponsoredLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  freeCreditsPill: {
    backgroundColor: '#D97706',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  freeCreditsPillText: {
    fontSize: 8.5,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: '#FFFFFF',
  },
  rewardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: '#0F172A',
  },
  rewardSub: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'Manrope_400Regular',
    marginTop: 1,
  },
  claimBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  claimBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#FFFFFF',
  },
  salesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    ...Shadows.sm,
  },
  salesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  salesIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  salesTextWrap: {
    flex: 1,
  },
  rcHeaderRow: {
    marginBottom: 2,
  },
  rcTag: {
    fontSize: 9.5,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: '#059669',
    letterSpacing: 0.5,
  },
  salesTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: '#0F172A',
  },
  salesSub: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'Manrope_400Regular',
    marginTop: 1,
  },
  salesCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  salesCtaText: {
    fontSize: 11.5,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#FFFFFF',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rcBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rcBadgeTextSmall: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: '#059669',
  },
  compactText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'Manrope_400Regular',
    flex: 1,
    marginHorizontal: 8,
  },
});
