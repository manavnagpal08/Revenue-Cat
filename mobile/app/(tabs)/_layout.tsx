import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Home, TrendingUp, DollarSign, Sparkles, MoreHorizontal } from 'lucide-react-native';
import { Colors, Shadows, Gradients } from '../../src/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 12,
          left: 16,
          right: 16,
          height: 68,
          borderRadius: 30,
          backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.88)' : '#FFFFFF',
          borderWidth: 1.5,
          borderColor: 'rgba(255, 255, 255, 0.95)',
          paddingBottom: Platform.OS === 'ios' ? 18 : 10,
          paddingTop: 10,
          ...Shadows.glass,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabPill : null}>
              <Home size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Sales',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabPill : null}>
              <TrendingUp size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'SoloCEO',
          tabBarIcon: ({ focused }) => (
            <View style={styles.aiTabWrapper}>
              <LinearGradient
                colors={Gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.aiTabIconContainer,
                  focused && styles.aiTabIconContainerFocused,
                ]}
              >
                <Sparkles size={22} color="#FFFFFF" strokeWidth={2.4} />
              </LinearGradient>
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '800',
            color: Colors.primaryDark,
          },
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Finance',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabPill : null}>
              <DollarSign size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeTabPill : null}>
              <MoreHorizontal size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeTabPill: {
    transform: [{ scale: 1.05 }],
  },
  aiTabWrapper: {
    marginTop: -20,
  },
  aiTabIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...Shadows.glow,
  },
  aiTabIconContainerFocused: {
    transform: [{ scale: 1.08 }],
    shadowOpacity: 0.45,
  },
});

