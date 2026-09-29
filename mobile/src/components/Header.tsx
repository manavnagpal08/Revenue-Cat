import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors, Shadows } from '../constants/theme';
import { Sparkles, Bell } from 'lucide-react-native';

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
  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        <View style={styles.tagRow}>
          <Text style={styles.businessTag}>{businessName}</Text>
          {showAiBadge ? (
            <View style={styles.aiBadge}>
              <Sparkles size={12} color={Colors.primary} />
              <Text style={styles.aiBadgeText}>AI Active</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.greetingText}>Good morning, {userName}</Text>
        {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
      </View>

      <View style={styles.rightContainer}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onNotificationPress}
          style={styles.iconButton}
        >
          <Bell size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onProfilePress}
          style={styles.avatarButton}
        >
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }}
            style={styles.avatarImage}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  leftContainer: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  businessTag: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  greetingText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.4,
  },
  subtitleText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  avatarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});
