import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { safeHaptic } from '../utils/haptics';
import { Colors, Shadows } from '../constants/theme';
import { Sparkles, Bell, ChevronDown } from 'lucide-react-native';
import { WorkspaceSwitcherModal } from './WorkspaceSwitcherModal';

interface HeaderProps {
  userName?: string;
  businessName?: string;
  subtitle?: string;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  showAiBadge?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  userName = 'Alex',
  businessName = 'Rivera Studio',
  subtitle,
  onNotificationPress,
  onProfilePress,
  showAiBadge = true,
}) => {
  const [switcherVisible, setSwitcherVisible] = useState(false);

  const handleSwitcherOpen = () => {
    safeHaptic.light();
    setSwitcherVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        <View style={styles.tagRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.businessSwitcherTrigger}
            onPress={handleSwitcherOpen}
          >
            <View style={styles.businessActiveDot} />
            <Text style={styles.businessTag} numberOfLines={1}>{businessName}</Text>
            <ChevronDown size={12} color="#64748B" />
          </TouchableOpacity>

          {showAiBadge ? (
            <View style={styles.aiBadge}>
              <Sparkles size={11} color={Colors.primary} />
              <Text style={styles.aiBadgeText}>AI Active</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.greetingText}>Good morning, {userName}</Text>
        {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
      </View>

      <View style={styles.rightContainer}>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => {
            safeHaptic.light();
            onNotificationPress?.();
          }}
          style={styles.iconButton}
        >
          <Bell size={18} color="#475569" />
          <View style={styles.unreadDot} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            safeHaptic.light();
            onProfilePress?.();
          }}
          style={styles.avatarButton}
        >
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120' }}
            style={styles.avatarImage}
          />
        </TouchableOpacity>
      </View>

      <WorkspaceSwitcherModal
        visible={switcherVisible}
        onClose={() => setSwitcherVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
  },
  leftContainer: {
    flex: 1,
    marginRight: 12,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 4,
  },
  businessSwitcherTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.sm,
  },
  businessActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  businessTag: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.1,
    maxWidth: 130,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.2,
  },
  greetingText: {
    fontSize: 21,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Shadows.sm,
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});
