import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Menu, Store, Receipt, Clock } from 'lucide-react-native';
import { useNavigation, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrders } from '@/hooks/use-orders';
import {
  MENUIN_BLUE,
  ActiveHomeIcon,
  ActiveReceiptIcon,
  ActiveClockIcon,
} from './nav-icons';

export type BottomBarTab = {
  id: string;
  title: string;
  icon?: React.ReactNode;
  badge?: number;
};

interface GlobalBottomBarProps {
  tabs?: BottomBarTab[];
  activeTab?: string;
  onTabPress?: (tabId: string) => void;
  hideOutletName?: boolean;
}

export function GlobalBottomBar({ tabs, activeTab, onTabPress }: GlobalBottomBarProps) {
  const navigation = useNavigation();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const { data: ordersData } = useOrders();
  const newOrdersCount = ordersData?.data?.filter((o) => o.status === 'NEW')?.length || 0;

  // IMPORTANT: Do NOT render bottom bar on Tablet Landscape. Tablet uses TabletAppHeader.
  if (isTablet) {
    return null;
  }

  const openDrawer = () => {
    navigation.dispatch({ type: 'OPEN_DRAWER' });
  };

  const bottomPadding = Platform.OS === 'ios' ? Math.max(insets.bottom, 6) : 6;
  const iconSize = 21;

  // Default phone tabs if custom tabs are not provided
  const isCurrentActive = (target: string) => {
    if (target === 'pos')
      return (
        (pathname.includes('/pos') || pathname.includes('/dashboard')) &&
        !pathname.includes('/orders') &&
        !pathname.includes('/custom')
      );
    if (target === 'orders') return pathname.includes('/orders');
    if (target === 'shift') return pathname.includes('/shift');
    return false;
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: bottomPadding,
          minHeight: 54,
        },
      ]}
      className="bg-white border-t border-gray-200/90 px-2 pt-1.5 shadow-2xs z-50"
    >
      <View className="flex-row items-center justify-around w-full">
        {/* Tab 1: Kasir (POS) */}
        <TouchableOpacity
          onPress={() => router.replace('/(main)/(cashier)/pos' as any)}
          activeOpacity={0.7}
          className="flex-1 flex-col items-center justify-center py-1 bg-transparent"
        >
          {isCurrentActive('pos') ? (
            <ActiveHomeIcon size={iconSize} color={MENUIN_BLUE} />
          ) : (
            <Store size={iconSize} color="#64748b" strokeWidth={1.8} />
          )}
          <Text
            style={{
              color: isCurrentActive('pos') ? MENUIN_BLUE : '#64748b',
              fontWeight: isCurrentActive('pos') ? '700' : '500',
            }}
            className="text-[10.5px] mt-1 tracking-tight leading-tight"
          >
            Kasir
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Pesanan (Orders) */}
        <TouchableOpacity
          onPress={() => router.replace('/(main)/(cashier)/pos/orders' as any)}
          activeOpacity={0.7}
          className="flex-1 flex-col items-center justify-center py-1 bg-transparent"
        >
          <View className="relative items-center justify-center">
            {isCurrentActive('orders') ? (
              <ActiveReceiptIcon size={iconSize} color={MENUIN_BLUE} />
            ) : (
              <Receipt size={iconSize} color="#64748b" strokeWidth={1.8} />
            )}
            {newOrdersCount > 0 && (
              <View className="absolute -top-1 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 items-center justify-center border border-white">
                <Text className="text-[9px] font-black text-white leading-none">
                  {newOrdersCount}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={{
              color: isCurrentActive('orders') ? MENUIN_BLUE : '#64748b',
              fontWeight: isCurrentActive('orders') ? '700' : '500',
            }}
            className="text-[10.5px] mt-1 tracking-tight leading-tight"
          >
            Pesanan
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Shift */}
        <TouchableOpacity
          onPress={() => router.replace('/(main)/(cashier)/shift' as any)}
          activeOpacity={0.7}
          className="flex-1 flex-col items-center justify-center py-1 bg-transparent"
        >
          {isCurrentActive('shift') ? (
            <ActiveClockIcon size={iconSize} color={MENUIN_BLUE} />
          ) : (
            <Clock size={iconSize} color="#64748b" strokeWidth={1.8} />
          )}
          <Text
            style={{
              color: isCurrentActive('shift') ? MENUIN_BLUE : '#64748b',
              fontWeight: isCurrentActive('shift') ? '700' : '500',
            }}
            className="text-[10.5px] mt-1 tracking-tight leading-tight"
          >
            Shift
          </Text>
        </TouchableOpacity>

        {/* Tab 4: Drawer Menu Trigger */}
        <TouchableOpacity
          onPress={openDrawer}
          activeOpacity={0.7}
          className="flex-1 flex-col items-center justify-center py-1 bg-transparent"
        >
          <Menu size={iconSize} color="#64748b" strokeWidth={1.8} />
          <Text
            style={{
              color: '#64748b',
              fontWeight: '500',
            }}
            className="text-[10.5px] mt-1 tracking-tight leading-tight"
          >
            Menu
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    elevation: 4,
    zIndex: 50,
  }
});
