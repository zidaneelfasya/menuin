import { Tabs } from 'expo-router';
import { Home, ShoppingBag, Clock } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: '#2563eb', 
      tabBarInactiveTintColor: '#64748b',
      headerShown: true,
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        backgroundColor: '#ffffff'
      }
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Kasir',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pesanan',
          tabBarIcon: ({ color }) => <ShoppingBag color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="shifts"
        options={{
          title: 'Shift',
          tabBarIcon: ({ color }) => <Clock color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
