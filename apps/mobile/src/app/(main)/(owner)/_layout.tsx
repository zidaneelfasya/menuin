import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { LayoutDashboard, Store, Receipt, Settings } from 'lucide-react-native';
import {
  MENUIN_BLUE,
  ActiveDashboardIcon,
  ActiveHomeIcon,
  ActiveReceiptIcon,
  ActiveSettingsIcon,
} from '@/components/navigation/nav-icons';

export default function OwnerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: MENUIN_BLUE,
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 84 : 58,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f3f4f6',
        },
        headerTitleStyle: {
          color: '#111827',
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) =>
            focused ? (
              <ActiveDashboardIcon size={22} color={MENUIN_BLUE} />
            ) : (
              <LayoutDashboard size={22} color="#64748b" strokeWidth={1.8} />
            ),
        }}
      />
      <Tabs.Screen
        name="pos"
        options={{
          title: 'Kasir',
          tabBarIcon: ({ focused }) =>
            focused ? (
              <ActiveHomeIcon size={22} color={MENUIN_BLUE} />
            ) : (
              <Store size={22} color="#64748b" strokeWidth={1.8} />
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
              <Receipt size={22} color="#64748b" strokeWidth={1.8} />
            ),
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: 'Manage',
          tabBarIcon: ({ focused }) =>
            focused ? (
              <ActiveSettingsIcon size={22} color={MENUIN_BLUE} />
            ) : (
              <Settings size={22} color="#64748b" strokeWidth={1.8} />
            ),
        }}
      />
    </Tabs>
  );
}

