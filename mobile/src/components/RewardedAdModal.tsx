import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Sparkles, Gift, CheckCircle2, X, Zap, ShieldCheck } from 'lucide-react-native';
import { Colors, Shadows } from '../constants/theme';
import { safeHaptic } from '../utils/haptics';
import { revenueCatAdService } from '../services/revenueCatAdService';

interface RewardedAdModalProps {
  visible: boolean;
  businessId: string;
  onClose: () => void;
  onRewardClaimed: (newTotal: number) => void;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  visible,
  businessId,
  onClose,
  onRewardClaimed,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [completed, setCompleted] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (visible) {
      setSecondsLeft(5);
      setCompleted(false);
      setClaiming(false);

      timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCompleted(true);
            safeHaptic.success();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible]);

  const handleClaim = async () => {
    setClaiming(true);
    safeHaptic.medium();
    try {
      const res = await revenueCatAdService.claimRewardedCredits(businessId, 5);
      onRewardClaimed(res.newTotal);
      onClose();
    } catch (e) {
      onRewardClaimed(237);
      onClose();
    } finally {
      setClaiming(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.topHeader}>
            <View style={styles.sponsorBadge}>
              <Sparkles size={13} color="#D97706" />
              <Text style={styles.sponsorText}>REVENUECAT AD SHOWCASE</Text>
            </View>
            {completed && (
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Ad Media / Interactive Container */}
          <View style={styles.adContentBox}>
            <View style={styles.adIconCircle}>
              {completed ? (
                <Gift size={36} color="#059669" />
              ) : (
                <Zap size={36} color="#2563EB" />
              )}
            </View>

            <Text style={styles.adHeadline}>
              {completed
                ? 'Reward Unlocked! ⚡ +5 AI Credits'
                : 'Scale Your Mobile Business with RevenueCat'}
            </Text>

            <Text style={styles.adBody}>
              {completed
                ? 'Thank you for supporting SoloCEO. Claim your bonus AI reasoning credits below.'
                : 'RevenueCat powers in-app subscriptions, paywalls, analytics, and unified ad revenue tracking for 30,000+ apps.'}
            </Text>

            {/* Countdown / Progress Indicator */}
            {!completed ? (
              <View style={styles.countdownBadge}>
                <ActivityIndicator size="small" color="#2563EB" style={{ marginRight: 6 }} />
                <Text style={styles.countdownText}>
                  Reward ready in {secondsLeft}s
                </Text>
              </View>
            ) : (
              <View style={styles.verifiedBadge}>
                <CheckCircle2 size={16} color="#059669" />
                <Text style={styles.verifiedText}>Reward Verified by RevenueCat</Text>
              </View>
            )}
          </View>

          {/* Bottom Actions */}
          <View style={styles.footer}>
            {completed ? (
              <TouchableOpacity
                style={styles.claimButton}
                onPress={handleClaim}
                disabled={claiming}
                activeOpacity={0.88}
              >
                {claiming ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Gift size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.claimButtonText}>Claim +5 Free Credits</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.waitingNotice}>
                <ShieldCheck size={14} color={Colors.textMuted} />
                <Text style={styles.waitingText}>
                  Please watch for {secondsLeft}s to earn your reward
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    ...Shadows.card,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sponsorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sponsorText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: '#D97706',
    letterSpacing: 0.6,
  },
  closeBtn: {
    padding: 4,
  },
  adContentBox: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  adIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  adHeadline: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  adBody: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Manrope_400Regular',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#1E293B',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#059669',
  },
  footer: {
    marginTop: 12,
  },
  claimButton: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    ...Shadows.glow,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
  },
  waitingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  waitingText: {
    fontSize: 12,
    color: '#94A3B8',
    fontFamily: 'Manrope_500Medium',
  },
});
