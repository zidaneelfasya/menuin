import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Menu, Store, Receipt, Clock } from 'lucide-react-native';
import { useNavigation, usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOrders } from '@/hooks/use-orders';

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
  const newOrdersCount = ordersData?.data?.filter(o => o.status === 'NEW')?.length || 0;

  // IMPORTANT: Do NOT render bottom bar on Tablet Landscape. Tablet uses TabletAppHeader.
  if (isTablet) {
    return null;
  }

  const openDrawer = () => {
    navigation.dispatch({ type: 'OPEN_DRAWER' });
  };

  const bottomPadding = Platform.OS === 'ios' ? Math.max(insets.bottom, 6) : 6;

  // Default phone tabs if custom tabs are not provided
  const isCurrentActive = (target: string) => {
    if (target === 'pos') return pathname.includes('/pos') && !pathname.includes('/orders');
    if (target === 'orders') return pathname.includes('/orders');
    if (target === 'shift') return pathname.includes('/shift');
    return false;
  };

  return (
    <View 
      style={[
        styles.container, 
        { paddingBottom: bottomPadding }
      ]}
      className="bg-white border-t border-gray-200 px-2 pt-1.5 shadow-sm"
    >
      <View className="flex-row items-center justify-around w-full">
        {/* Tab 1: Kasir (POS) */}
        <TouchableOpacity 
          onPress={() => router.replace('/(main)/(cashier)/pos' as any)} 
          activeOpacity={0.7}
          className="flex-1 items-center justify-center py-1"
        >
          <Store size={20} color={isCurrentActive('pos') ? '#2563eb' : '#6b7280'} />
          <Text className={`text-[10px] font-bold mt-0.5 ${isCurrentActive('pos') ? 'text-blue-600' : 'text-gray-500'}`}>
            Kasir
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Pesanan (Orders) */}
        <TouchableOpacity 
          onPress={() => router.replace('/(main)/(cashier)/pos/orders' as any)} 
          activeOpacity={0.7}
          className="flex-1 items-center justify-center py-1 relative"
        >
          <Receipt size={20} color={isCurrentActive('orders') ? '#2563eb' : '#6b7280'} />
          <Text className={`text-[10px] font-bold mt-0.5 ${isCurrentActive('orders') ? 'text-blue-600' : 'text-gray-500'}`}>
            Pesanan
          </Text>
          {newOrdersCount > 0 && (
            <View className="absolute top-0 right-1/4 px-1.5 py-0.2 rounded-full bg-red-500">
              <Text className="text-[8px] font-bold text-white">{newOrdersCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Tab 3: Shift */}
        <TouchableOpacity 
          onPress={() => router.replace('/(main)/(cashier)/shift' as any)} 
          activeOpacity={0.7}
          className="flex-1 items-center justify-center py-1"
        >
          <Clock size={20} color={isCurrentActive('shift') ? '#2563eb' : '#6b7280'} />
          <Text className={`text-[10px] font-bold mt-0.5 ${isCurrentActive('shift') ? 'text-blue-600' : 'text-gray-500'}`}>
            Shift
          </Text>
        </TouchableOpacity>

        {/* Tab 4: Drawer Menu Trigger */}
        <TouchableOpacity 
          onPress={openDrawer} 
          activeOpacity={0.7}
          className="flex-1 items-center justify-center py-1"
        >
          <Menu size={20} color="#6b7280" />
          <Text className="text-[10px] font-medium text-gray-500 mt-0.5">Menu</Text>
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
