import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
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
            <ChevronDown size={13} color={Colors.textSecondary} />
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
          <Bell size={19} color={Colors.textSecondary} />
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
    paddingTop: 12,
    paddingBottom: 16,
  },
  leftContainer: {
    flex: 1,
    marginRight: 12,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  businessSwitcherTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    ...Shadows.sm,
  },
  businessActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  businessTag: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 0.2,
    maxWidth: 130,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryDark,
    letterSpacing: 0.2,
  },
  greetingText: {
    fontSize: 23,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Shadows.card,
  },
  unreadDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    overflow: 'hidden',
    ...Shadows.glowSubtle,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});

