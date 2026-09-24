import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, ShoppingBag, Clock } from 'lucide-react-native';
import {
  MENUIN_BLUE,
  ActiveHomeIcon,
  ActiveReceiptIcon,
  ActiveClockIcon,
} from '@/components/navigation/nav-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: MENUIN_BLUE,
        tabBarInactiveTintColor: '#64748b',
        headerShown: true,
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 84 : 58,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Kasir',
          tabBarIcon: ({ focused }) =>
            focused ? (
              <ActiveHomeIcon size={22} color={MENUIN_BLUE} />
            ) : (
              <Home size={22} color="#64748b" strokeWidth={1.8} />
            ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pesanan',
          tabBarIcon: ({ focused }) =>
            focused ? (
              <ActiveReceiptIcon size={22} color={MENUIN_BLUE} />
            ) : (
              <ShoppingBag size={22} color="#64748b" strokeWidth={1.8} />
            ),
        }}
      />
      <Tabs.Screen
        name="shifts"
        options={{
          title: 'Shift',
          tabBarIcon: ({ focused }) =>
            focused ? (
              <ActiveClockIcon size={22} color={MENUIN_BLUE} />
            ) : (
              <Clock size={22} color="#64748b" strokeWidth={1.8} />
            ),
        }}
      />
    </Tabs>
  );
}

