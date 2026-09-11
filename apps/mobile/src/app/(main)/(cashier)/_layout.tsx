import React, { useState } from 'react';
import { Drawer } from 'expo-router/drawer';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import {
  LayoutDashboard,
  Store,
  History,
  Package,
  Clock,
  Settings,
  LogOut,
  ChevronRight,
  User,
  Receipt,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/auth-store';
import { useActiveShift } from '@/hooks/use-shifts';
import { useOrders } from '@/hooks/use-orders';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { AdaptiveBottomBar } from '@/components/navigation/adaptive-bottom-bar';
import { CircularMenuModal } from '@/components/navigation/circular-menu-modal';
import { AppTopHeader } from '@/components/navigation/app-top-header';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  isActive: boolean;
  onPress: () => void;
  isCompact?: boolean;
}

function DrawerNavItem({ icon, label, badge, isActive, onPress, isCompact }: NavItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`flex-row items-center justify-between px-3.5  ${
        isCompact ? 'py-2 rounded-lg mb-0.5' : 'py-3 rounded-xl mb-1'
      } ${
        isActive ? 'bg-blue-50 border border-blue-100' : 'bg-transparent'
      }`}
    >
      <View className="flex-row items-center">
        <View className={`${isCompact ? 'w-7 h-7 rounded-md mr-2.5' : 'w-8 h-8 rounded-lg mr-3'} items-center justify-center ${
          isActive ? 'bg-blue-600' : 'bg-gray-100'
        }`}>
          {React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement<any>, {
                size: isCompact ? 16 : 18,
                color: isActive ? '#ffffff' : '#4b5563',
              })
            : icon}
        </View>
        <Text className={`${isCompact ? 'text-xs' : 'text-sm'} font-semibold ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
          {label}
        </Text>
      </View>

      <View className="flex-row items-center">
        {badge && (
          <View className="px-2 py-0.5 rounded-full bg-blue-100 mr-1.5">
            <Text className="text-[10px] font-bold text-blue-700">{badge}</Text>
          </View>
        )}
        <ChevronRight size={16} color={isActive ? '#2563eb' : '#d1d5db'} />
      </View>
    </TouchableOpacity>
  );
}

function CustomDrawerContent(props: any) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 600;
  const isPhoneLandscape = !isTablet && isLandscape;

  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logoutUser = useAuthStore((state) => state.logoutUser);
  const { data: shiftData } = useActiveShift();
  const activeShift = shiftData?.data;
  const { data: ordersData } = useOrders();
  const newOrdersCount = ordersData?.data?.filter(o => o.status === 'NEW')?.length || 0;

  const navigateTo = (path: string) => {
    props.navigation.closeDrawer();
    router.push(path as any);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff', paddingLeft: Math.max(insets.left, 0) }}>
      {/* Top Header Card (Modern Clean Tokopedia/SaaS Style) */}
      <View
        style={{
          paddingTop: isPhoneLandscape ? Math.max(insets.top, 8) + 4 : Math.max(insets.top, 16) + 8,
          paddingBottom: isPhoneLandscape ? 10 : 20,
        }}
        className="px-4 bg-gray-50/80 border-b border-gray-100"
      >
        <View className={`flex-row items-center justify-between ${isPhoneLandscape ? 'mb-1.5' : 'mb-3'}`}>
          {/* Outlet Avatar & Name */}
          <View className="flex-row items-center flex-1 mr-2">
            <View className={`${isPhoneLandscape ? 'w-8 h-8 rounded-lg' : 'w-11 h-11 rounded-xl'} bg-blue-600 items-center justify-center shadow-sm mr-2.5`}>
              <Text className={`text-white font-black ${isPhoneLandscape ? 'text-sm' : 'text-lg'}`}>
                {user?.name?.charAt(0)?.toUpperCase() || 'M'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className={`${isPhoneLandscape ? 'text-xs' : 'text-base'} font-bold text-gray-900 leading-tight`} numberOfLines={1}>
                {user?.name || 'Menuin Outlet'}
              </Text>
              <View className="flex-row items-center mt-0.5">
                <User size={10} color="#6b7280" />
                <Text className="text-[10px] text-gray-500 font-medium ml-1">
                  {user?.role || 'Staff'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Live Shift Status Banner */}
        <View
          className={`flex-row items-center justify-between px-3 py-2 rounded-xl border ${
            activeShift
              ? 'bg-emerald-50/70 border-emerald-200'
              : 'bg-amber-50/70 border-amber-200'
          }`}
        >
          <View className="flex-row items-center">
            <View
              className={`w-2 h-2 rounded-full mr-2 ${
                activeShift ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <Text
              className={`text-xs font-semibold ${
                activeShift ? 'text-emerald-800' : 'text-amber-800'
              }`}
            >
              {activeShift ? 'Shift Aktif' : 'Shift Belum Dibuka'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigateTo('/(main)/(cashier)/shift')}
            activeOpacity={0.7}
          >
            <Text
              className={`text-[11px] font-bold underline ${
                activeShift ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              Kelola
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Drawer Navigation Items */}
      <ScrollView
        className="flex-1 px-3 py-3 "
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Overview */}
        <Text className={`text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 ${isPhoneLandscape ? 'mb-1 mt-0.5' : 'mb-2 mt-1'}`}>
          Ringkasan & Bisnis
        </Text>
        <DrawerNavItem
          icon={<LayoutDashboard />}
          label="Dashboard"
          isCompact={isPhoneLandscape}
          isActive={pathname.includes('/dashboard')}
          onPress={() => navigateTo('/(main)/(cashier)/dashboard')}
        />

        {/* Section: Operasional */}
        <Text className={`text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 ${isPhoneLandscape ? 'mb-1 mt-2.5' : 'mb-2 mt-5'}`}>
          Operasional Kasir
        </Text>
        <DrawerNavItem
          icon={<Store />}
          label="Kasir (POS)"
          isCompact={isPhoneLandscape}
          isActive={pathname.includes('/pos') && !pathname.includes('/orders')}
          onPress={() => navigateTo('/(main)/(cashier)/pos')}
        />
        <DrawerNavItem
          icon={<Receipt />}
          label="Pesanan & Dapur"
          isCompact={isPhoneLandscape}
          badge={newOrdersCount > 0 ? `${newOrdersCount} Baru` : undefined}
          isActive={pathname.includes('/orders')}
          onPress={() => navigateTo('/(main)/(cashier)/pos/orders')}
        />
        <DrawerNavItem
          icon={<Clock />}
          label="Manajemen Shift"
          isCompact={isPhoneLandscape}
          isActive={pathname.includes('/shift')}
          onPress={() => navigateTo('/(main)/(cashier)/shift')}
        />

        {/* Section: Manajemen */}
        <Text className={`text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 ${isPhoneLandscape ? 'mb-1 mt-2.5' : 'mb-2 mt-5'}`}>
          Manajemen Outlet
        </Text>
        <DrawerNavItem
          icon={<Package />}
          label="Katalog Menu & Item"
          isCompact={isPhoneLandscape}
          isActive={pathname.includes('/items')}
          onPress={() => navigateTo('/(main)/(cashier)/items')}
        />
        <DrawerNavItem
          icon={<History />}
          label="Riwayat Transaksi"
          isCompact={isPhoneLandscape}
          isActive={pathname.includes('/history')}
          onPress={() => navigateTo('/(main)/(cashier)/history')}
        />

        {/* Section: Sistem */}
        <Text className={`text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 ${isPhoneLandscape ? 'mb-1 mt-2.5' : 'mb-2 mt-5'}`}>
          Sistem & Preferensi
        </Text>
        <DrawerNavItem
          icon={<Settings />}
          label="Pengaturan"
          isCompact={isPhoneLandscape}
          isActive={pathname.includes('/settings')}
          onPress={() => navigateTo('/(main)/(cashier)/settings')}
        />
      </ScrollView>

      {/* Footer / Account & Logout */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom, isPhoneLandscape ? 6 : 12) }}
        className={`${isPhoneLandscape ? 'p-2.5' : 'p-4'} border-t border-gray-100 bg-white`}
      >
        <TouchableOpacity
          onPress={() => logoutUser()}
          activeOpacity={0.7}
          className={`flex-row items-center justify-between ${isPhoneLandscape ? 'p-2' : 'p-3'} rounded-xl bg-gray-50 border border-gray-200 active:bg-red-50 active:border-red-200`}
        >
          <View className="flex-row items-center">
            <View className={`${isPhoneLandscape ? 'w-7 h-7' : 'w-8 h-8'} rounded-lg bg-red-100 items-center justify-center mr-2.5`}>
              <LogOut size={isPhoneLandscape ? 14 : 16} color="#ef4444" />
            </View>
            <View>
              <Text className="text-xs font-bold text-gray-900">Keluar Akun</Text>
              <Text className="text-[10px] text-gray-500">Akhiri sesi di perangkat ini</Text>
            </View>
          </View>
          <ChevronRight size={16} color="#9ca3af" />
        </TouchableOpacity>

        {!isPhoneLandscape && (
          <Text className="text-center text-[10px] text-gray-400 font-medium mt-3">
            MENUIN POS v1.0.0
          </Text>
        )}
      </View>
    </View>
  );
}

export default function CashierDrawerLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const isCartScreen = pathname.includes('/cart');

  // Responsive drawer width: 75% on mobile, capped at 340 on tablet/landscape
  const drawerWidth = Math.min(Math.max(width * 0.75, 260), 340);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Universal Top Header (Outlet & Profile / Logo Menuin / User Role) */}
      {!isCartScreen && <AppTopHeader />}

      <View style={{ flex: 1 }}>
        <Drawer
          drawerContent={(props) => <CustomDrawerContent {...props} />}
          screenOptions={{
            headerShown: false,
            drawerStyle: {
              width: drawerWidth,
              backgroundColor: '#ffffff',
            },
            swipeEnabled: false,
          }}
        >
          <Drawer.Screen name="dashboard" options={{ title: 'Dashboard' }} />
          <Drawer.Screen name="pos" options={{ title: 'Point of Sales' }} />
          <Drawer.Screen name="history" options={{ title: 'Riwayat Transaksi' }} />
          <Drawer.Screen name="items" options={{ title: 'List Item' }} />
          <Drawer.Screen name="shift" options={{ title: 'Manajemen Shift' }} />
          <Drawer.Screen name="settings" options={{ title: 'Pengaturan' }} />
          <Drawer.Screen
            name="cart"
            options={{
              drawerItemStyle: { display: 'none' },
            }}
          />
        </Drawer>
      </View>

      {/* Seamless Circular Reveal Menu Modal */}
      <CircularMenuModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      {/* Persistent Adaptive Bottom Bar (hidden on checkout screen) */}
      {!isCartScreen && (
        <AdaptiveBottomBar
          isMenuOpen={isMenuOpen}
          onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
        />
      )}
    </View>
  );
}
