import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import {
  Menu,
  X,
  Receipt,
  LayoutGrid,
  Home,
  Settings,
  Store,
} from 'lucide-react-native';
import { useAuthStore } from '@/store/auth-store';
import { useOrders } from '@/hooks/use-orders';
import { useActiveShift } from '@/hooks/use-shifts';

export const MENUIN_BLUE = '#014FFD';

export type BottomBarMode = 'pos' | 'dashboard' | 'standard';

interface AdaptiveBottomBarProps {
  mode?: BottomBarMode;
  isMenuOpen?: boolean;
  onToggleMenu: () => void;
  onMorePress?: () => void;
}

export function AdaptiveBottomBar({
  mode,
  isMenuOpen = false,
  onToggleMenu,
}: AdaptiveBottomBarProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 600;
  const isPhoneLandscape = !isTablet && isLandscape;

  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);
  const { data: ordersData } = useOrders();
  const { data: shiftData } = useActiveShift();
  const activeShift = shiftData?.data;
  const newOrdersCount = ordersData?.data?.filter((o) => o.status === 'NEW')?.length || 0;

  // Infer mode if not explicitly passed
  const currentMode: BottomBarMode =
    mode ||
    (pathname.includes('/dashboard')
      ? 'dashboard'
      : pathname.includes('/pos') || pathname.includes('/settings')
      ? 'pos'
      : 'standard');

  const bottomPadding = Platform.OS === 'ios' ? Math.max(insets.bottom, isPhoneLandscape ? 4 : 8) : (isPhoneLandscape ? 4 : 8);
  const centerButtonSize = isPhoneLandscape ? 44 : isTablet ? 56 : 52;
  const centerButtonTop = isPhoneLandscape ? -16 : isTablet ? -22 : -20;
  const centerIconSize = isPhoneLandscape ? 22 : isTablet ? 28 : 24;

  const navigateTo = (path: string) => {
    if (isMenuOpen && onToggleMenu) {
      onToggleMenu();
    }
    try {
      router.navigate(path as any);
    } catch {
      router.push(path as any);
    }
  };

  // Check active state for POS tabs
  const isHomeActive = pathname.includes('/pos') && !pathname.includes('/orders') && !pathname.includes('/custom');
  const isOrdersActive = pathname.includes('/pos/orders');
  const isCustomActive = pathname.includes('/pos/custom');
  const isSettingsActive = pathname.includes('/settings');

  return (
    <View
      style={[
        styles.barContainer,
        {
          minHeight: isPhoneLandscape ? 46 : isTablet ? 62 : 56,
          paddingBottom: bottomPadding,
          paddingLeft: Math.max(insets.left, isPhoneLandscape ? 16 : 8),
          paddingRight: Math.max(insets.right, isPhoneLandscape ? 16 : 8),
        },
      ]}
      className="bg-white border-t border-gray-200/90 shadow-lg pt-2 z-50"
    >
      {/* Elevated Floating Center Hamburger / X Button */}
      <View
        style={[
          styles.centerButtonWrapper,
          {
            top: centerButtonTop,
          },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          onPress={onToggleMenu}
          activeOpacity={0.85}
          style={[
            styles.centerButton,
            {
              width: centerButtonSize,
              height: centerButtonSize,
              borderRadius: centerButtonSize / 2,
            },
          ]}
          className="shadow-md"
        >
          {isMenuOpen ? (
            <X size={centerIconSize} color="#ffffff" strokeWidth={2.8} />
          ) : (
            <Menu size={centerIconSize} color="#ffffff" strokeWidth={2.2} />
          )}
        </TouchableOpacity>
      </View>

      {/* Mode 1: POINT OF SALES (POS) - 4 Tabs: Home, Orders, Custom, Settings */}
      {currentMode === 'pos' && (
        <View
          style={{
            maxWidth: isTablet ? 720 : '100%',
            width: '100%',
            alignSelf: 'center',
          }}
          className="flex-row items-center justify-between px-1"
        >
          {/* Left Wing (Home & Orders) */}
          <View className="flex-row items-center flex-1 justify-around pr-8">
            {/* Tab 1: Home */}
            <TouchableOpacity
              onPress={() => navigateTo('/(main)/(cashier)/pos')}
              activeOpacity={0.7}
              style={{
                backgroundColor: isHomeActive ? '#eff4ff' : 'transparent',
              }}
              className="flex-row items-center justify-center py-1.5 px-3.5 rounded-full"
            >
              <Home
                size={18}
                color={isHomeActive ? MENUIN_BLUE : '#6b7280'}
                strokeWidth={isHomeActive ? 2.5 : 2}
              />
              <Text
                style={{
                  color: isHomeActive ? MENUIN_BLUE : '#6b7280',
                  fontWeight: isHomeActive ? '700' : '500',
                }}
                className="text-xs ml-1.5"
              >
                Home
              </Text>
            </TouchableOpacity>

            {/* Tab 2: Orders */}
            <TouchableOpacity
              onPress={() => navigateTo('/(main)/(cashier)/pos/orders')}
              activeOpacity={0.7}
              style={{
                backgroundColor: isOrdersActive ? '#eff4ff' : 'transparent',
              }}
              className="flex-row items-center justify-center py-1.5 px-3.5 rounded-full relative"
            >
              <Receipt
                size={18}
                color={isOrdersActive ? MENUIN_BLUE : '#6b7280'}
                strokeWidth={isOrdersActive ? 2.5 : 2}
              />
              <Text
                style={{
                  color: isOrdersActive ? MENUIN_BLUE : '#6b7280',
                  fontWeight: isOrdersActive ? '700' : '500',
                }}
                className="text-xs ml-1.5"
              >
                Orders
              </Text>
              {newOrdersCount > 0 && (
                <View className="absolute -top-1 right-0 min-w-[16px] h-4 px-1 rounded-full bg-red-500 items-center justify-center border border-white">
                  <Text className="text-[9px] font-bold text-white leading-none">
                    {newOrdersCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Spacer for Center Button */}
          <View style={{ width: 48 }} />

          {/* Right Wing (Custom & Settings) */}
          <View className="flex-row items-center flex-1 justify-around pl-8">
            {/* Tab 3: Custom Numpad */}
            <TouchableOpacity
              onPress={() => navigateTo('/(main)/(cashier)/pos/custom')}
              activeOpacity={0.7}
              style={{
                backgroundColor: isCustomActive ? '#eff4ff' : 'transparent',
              }}
              className="flex-row items-center justify-center py-1.5 px-3.5 rounded-full"
            >
              <LayoutGrid
                size={18}
                color={isCustomActive ? MENUIN_BLUE : '#6b7280'}
                strokeWidth={isCustomActive ? 2.5 : 2}
              />
              <Text
                style={{
                  color: isCustomActive ? MENUIN_BLUE : '#6b7280',
                  fontWeight: isCustomActive ? '700' : '500',
                }}
                className="text-xs ml-1.5"
              >
                Custom
              </Text>
            </TouchableOpacity>

            {/* Tab 4: Settings */}
            <TouchableOpacity
              onPress={() => navigateTo('/(main)/(cashier)/settings')}
              activeOpacity={0.7}
              style={{
                backgroundColor: isSettingsActive ? '#eff4ff' : 'transparent',
              }}
              className="flex-row items-center justify-center py-1.5 px-3.5 rounded-full"
            >
              <Settings
                size={18}
                color={isSettingsActive ? MENUIN_BLUE : '#6b7280'}
                strokeWidth={isSettingsActive ? 2.5 : 2}
              />
              <Text
                style={{
                  color: isSettingsActive ? MENUIN_BLUE : '#6b7280',
                  fontWeight: isSettingsActive ? '700' : '500',
                }}
                className="text-xs ml-1.5"
              >
                Settings
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Mode 2: DASHBOARD - Outlet Branding on Left, Shift on Right */}
      {currentMode === 'dashboard' && (
        <View
          style={{
            maxWidth: isTablet ? 720 : '100%',
            width: '100%',
            alignSelf: 'center',
          }}
          className="flex-row items-center justify-between px-3 py-1"
        >
          {/* Left Wing: Outlet Logo & Name */}
          <View className="flex-row items-center flex-1 pr-6">
            <View
              style={{ backgroundColor: MENUIN_BLUE }}
              className="w-9 h-9 rounded-xl items-center justify-center mr-2.5 shadow-2xs"
            >
              <Text className="text-white font-black text-sm">
                {user?.tenantName?.charAt(0) || user?.name?.charAt(0) || 'M'}
              </Text>
            </View>
            <View className="flex-1">
              <Text
                className="text-xs font-bold text-gray-900 leading-tight"
                numberOfLines={1}
              >
                {user?.tenantName || user?.name || 'Menuin Outlet'}
              </Text>
              <View className="flex-row items-center mt-0.5">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                <Text className="text-[10px] font-semibold text-emerald-700">
                  Online & Aktif
                </Text>
              </View>
            </View>
          </View>

          {/* Spacer for Center Button */}
          <View style={{ width: 52 }} />

          {/* Right Wing: Shift Status Pill & Kasir Shortcut */}
          <View className="flex-row items-center justify-end flex-1 pl-6 gap-2">
            <View
              className={`px-2.5 py-1 rounded-full border flex-row items-center ${
                activeShift
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <View
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  activeShift ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <Text
                className={`text-[10px] font-bold ${
                  activeShift ? 'text-emerald-800' : 'text-amber-800'
                }`}
              >
                {activeShift ? 'Shift Aktif' : 'Shift Tutup'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => navigateTo('/(main)/(cashier)/pos')}
              activeOpacity={0.7}
              style={{ backgroundColor: '#e8f5fa', borderColor: '#bce1ef' }}
              className="px-2.5 py-1 rounded-full border flex-row items-center"
            >
              <Store size={12} color={MENUIN_BLUE} className="mr-1" />
              <Text style={{ color: MENUIN_BLUE }} className="text-[10px] font-bold">
                Buka POS
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Mode 3: STANDARD (Riwayat, Items, Shift, etc.) */}
      {currentMode === 'standard' && (
        <View
          style={{
            maxWidth: isTablet ? 720 : '100%',
            width: '100%',
            alignSelf: 'center',
          }}
          className="flex-row items-center justify-between px-3 py-1"
        >
          {/* Left Wing: Back to Dashboard */}
          <TouchableOpacity
            onPress={() => navigateTo('/(main)/(cashier)/dashboard')}
            activeOpacity={0.7}
            className="flex-row items-center py-1.5 px-3 rounded-full bg-gray-50 border border-gray-200"
          >
            <Home size={14} color="#4b5563" />
            <Text className="text-xs font-semibold text-gray-700 ml-1.5">
              Dashboard
            </Text>
          </TouchableOpacity>

          {/* Spacer for Center Button */}
          <View style={{ width: 52 }} />

          {/* Right Wing: Quick go to POS */}
          <TouchableOpacity
            onPress={() => navigateTo('/(main)/(cashier)/pos')}
            activeOpacity={0.7}
            style={{ backgroundColor: '#e8f5fa', borderColor: '#bce1ef' }}
            className="flex-row items-center py-1.5 px-3 rounded-full border"
          >
            <Store size={14} color={MENUIN_BLUE} />
            <Text style={{ color: MENUIN_BLUE }} className="text-xs font-bold ml-1.5">
              Kasir (POS)
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    position: 'relative',
    minHeight: 56,
  },
  centerButtonWrapper: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
  },
  centerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: MENUIN_BLUE, // #014FFD
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: MENUIN_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
});
