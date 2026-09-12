import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useNavigation, usePathname, useRouter } from 'expo-router';
import { Menu, Store, Receipt, Clock, Package, History, Settings, User } from 'lucide-react-native';
import { useAuthStore } from '@/store/auth-store';
import { useActiveShift } from '@/hooks/use-shifts';
import { useOrders } from '@/hooks/use-orders';
import { Badge } from '@/components/ui';

export function TabletAppHeader() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const navigation = useNavigation();
  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);
  const { data: shiftData } = useActiveShift();
  const activeShift = shiftData?.data;
  const { data: ordersData } = useOrders();
  const newOrdersCount = ordersData?.data?.filter(o => o.status === 'NEW')?.length || 0;

  // Only render on tablet / landscape screens
  if (!isTablet) return null;

  const openDrawer = () => {
    navigation.dispatch({ type: 'OPEN_DRAWER' });
  };

  const navItems = [
    {
      id: 'pos',
      label: 'Kasir',
      path: '/(main)/(cashier)/pos',
      icon: Store,
      isActive: pathname.includes('/pos') && !pathname.includes('/orders'),
    },
    {
      id: 'orders',
      label: 'Pesanan',
      path: '/(main)/(cashier)/pos/orders',
      icon: Receipt,
      badge: newOrdersCount > 0 ? newOrdersCount : undefined,
      isActive: pathname.includes('/orders'),
    },
    {
      id: 'shift',
      label: 'Shift',
      path: '/(main)/(cashier)/shift',
      icon: Clock,
      isActive: pathname.includes('/shift'),
    },
    {
      id: 'items',
      label: 'Katalog',
      path: '/(main)/(cashier)/items',
      icon: Package,
      isActive: pathname.includes('/items'),
    },
    {
      id: 'history',
      label: 'Riwayat',
      path: '/(main)/(cashier)/history',
      icon: History,
      isActive: pathname.includes('/history'),
    },
  ];

  return (
    <View className="bg-white border-b border-gray-200 px-4 py-2 flex-row items-center justify-between z-30 shadow-2xs">
      {/* Left: Drawer Trigger + Outlet & Shift Context */}
      <View className="flex-row items-center">
        <TouchableOpacity
          onPress={openDrawer}
          activeOpacity={0.7}
          className="w-9 h-9 bg-gray-50 rounded-xl border border-gray-200 items-center justify-center mr-3 active:bg-gray-100"
        >
          <Menu size={18} color="#1f2937" />
        </TouchableOpacity>

        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-lg bg-blue-600 items-center justify-center mr-2 shadow-2xs">
            <Text className="text-white font-black text-xs">
              {user?.tenantName?.charAt(0) || user?.name?.charAt(0) || 'M'}
            </Text>
          </View>
          <View>
            <View className="flex-row items-center">
              <Text className="text-xs font-black text-gray-900 leading-tight mr-2" numberOfLines={1}>
                {user?.tenantName || user?.name || 'Menuin Outlet'}
              </Text>
              <View className="flex-row items-center bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200/80">
                <View
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    activeShift ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                />
                <Text
                  className={`text-[10px] font-bold ${
                    activeShift ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {activeShift ? 'Shift Aktif' : 'Shift Ditutup'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Center: Tablet Nav Switcher */}
      <View className="flex-row items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200/60 gap-1">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.7}
              onPress={() => router.replace(item.path as any)}
              className={`flex-row items-center px-3 py-1.5 rounded-lg ${
                item.isActive
                  ? 'bg-white shadow-xs border border-gray-200/80'
                  : 'bg-transparent'
              }`}
            >
              <IconComponent
                size={14}
                color={item.isActive ? '#2563eb' : '#6b7280'}
              />
              <Text
                className={`ml-1.5 text-xs font-bold ${
                  item.isActive ? 'text-blue-700' : 'text-gray-600'
                }`}
              >
                {item.label}
              </Text>
              {item.badge !== undefined && (
                <View className="ml-1.5 px-1.5 py-0.2 bg-red-500 rounded-full">
                  <Text className="text-[9px] font-bold text-white">{item.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Right: Staff Chip & Settings */}
      <View className="flex-row items-center gap-2">
        <View className="flex-row items-center bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200">
          <User size={12} color="#6b7280" />
          <Text className="text-xs font-bold text-gray-800 ml-1.5 mr-1.5">
            {user?.name || 'Kasir'}
          </Text>
          <Badge label={user?.role || 'Staff'} variant="primary" size="sm" />
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/(main)/(cashier)/settings' as any)}
          className={`w-9 h-9 rounded-xl border items-center justify-center ${
            pathname.includes('/settings')
              ? 'bg-blue-50 border-blue-200'
              : 'bg-gray-50 border-gray-200 active:bg-gray-100'
          }`}
        >
          <Settings
            size={16}
            color={pathname.includes('/settings') ? '#2563eb' : '#4b5563'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
