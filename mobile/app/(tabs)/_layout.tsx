import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Home, TrendingUp, DollarSign, Sparkles, MoreHorizontal } from 'lucide-react-native';
import { Colors, Shadows } from '../../src/constants/theme';

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
          borderRadius: 28,
          backgroundColor: Colors.glass,
          borderWidth: 1,
          borderColor: Colors.borderGlass,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          ...Shadows.glass,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Sales',
          tabBarIcon: ({ color, size }) => <TrendingUp size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'SoloCEO',
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.aiTabIconContainer,
                focused && styles.aiTabIconContainerFocused,
              ]}
            >
              <Sparkles size={22} color={focused ? '#FFFFFF' : Colors.primary} />
            </View>
          ),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            color: Colors.primary,
          },
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: 'Finance',
          tabBarIcon: ({ color, size }) => <DollarSign size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => <MoreHorizontal size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  aiTabIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Shadows.glow,
  },
  aiTabIconContainerFocused: {
    backgroundColor: Colors.primary,
  },
});
