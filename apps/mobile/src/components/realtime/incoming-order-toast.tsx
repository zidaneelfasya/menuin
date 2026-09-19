import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { useOrders } from '@/hooks/use-orders';
import { ChefHat, Check, User, Hash, X, Clock } from 'lucide-react-native';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';

export function GlobalIncomingOrderToast() {
  const { data: ordersData, updateStatus } = useOrders();
  const [dismissedOrderIds, setDismissedOrderIds] = useState<Set<string>>(new Set());
  const [isAccepting, setIsAccepting] = useState(false);
  
  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(price));
  };

  const newOrders = ordersData?.data.filter(o => o.status === 'NEW' && !dismissedOrderIds.has(o.id)) || [];
  const currentOrder = newOrders[0];

  useEffect(() => {
    if (!currentOrder) return;
    
    // Auto dismiss after 10 seconds to not block UI forever
    const timer = setTimeout(() => {
      setDismissedOrderIds(prev => new Set(prev).add(currentOrder.id));
    }, 10000);
    
    return () => clearTimeout(timer);
  }, [currentOrder?.id]);

  if (!currentOrder) return null;

  const handleDismiss = () => {
    setDismissedOrderIds(prev => new Set(prev).add(currentOrder.id));
  };

  const handleAccept = () => {
    setIsAccepting(true);
    updateStatus({ orderId: currentOrder.id, status: 'PROCESSING' }, {
      onSuccess: () => {
        setIsAccepting(false);
        handleDismiss();
      },
      onError: () => {
        setIsAccepting(false);
      }
    });
  };

  return (
    <Animated.View 
      entering={SlideInRight.springify()} 
      exiting={SlideOutRight}
      style={styles.container}
    >
      <View style={styles.card}>
        {/* Top blue bar */}
        <View style={styles.topBar} />
        
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <ChefHat size={16} color="#2563eb" />
              </View>
              <View>
                <Text style={styles.titleText}>Pesanan Baru</Text>
                <Text style={styles.orderTypeText}>
                  {currentOrder.orderType.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              {newOrders.length > 1 && (
                <View style={styles.badgeCount}>
                  <Text style={styles.badgeText}>1 of {newOrders.length}</Text>
                </View>
              )}
              <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color="#9ca3af" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Customer Info */}
          <View style={styles.customerBox}>
            <View style={styles.customerLeft}>
              {currentOrder.tableNumber ? <Hash size={16} color="#9ca3af" /> : <User size={16} color="#9ca3af" />}
              <View style={{ marginLeft: 8 }}>
                <Text style={styles.customerLabel}>{currentOrder.tableNumber ? 'Meja' : 'Pelanggan'}</Text>
                <Text style={styles.customerName}>
                  {currentOrder.tableNumber || currentOrder.customerName || 'Tamu'}
                </Text>
              </View>
            </View>
            <View style={styles.totalRight}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(currentOrder.grandTotal)}</Text>
            </View>
          </View>

          {/* Items */}
          <View style={styles.itemsContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {currentOrder.items.map((item, idx) => (
                <View key={item.id || idx} style={styles.itemRow}>
                  <View style={styles.itemDetails}>
                    <View style={styles.qtyBadge}>
                      <Text style={styles.qtyText}>{item.quantity}x</Text>
                    </View>
                    <Text style={styles.itemTitle} numberOfLines={1}>{item.productName}</Text>
                  </View>
                  <Text style={styles.itemPrice}>{formatPrice(item.subtotal)}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity 
              onPress={handleDismiss}
              style={styles.dismissBtn}
              activeOpacity={0.7}
            >
              <Clock size={14} color="#4b5563" />
              <Text style={styles.dismissText}>Nanti Saja</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleAccept}
              disabled={isAccepting}
              style={styles.acceptBtn}
              activeOpacity={0.8}
            >
              {isAccepting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={14} color="#ffffff" />
                  <Text style={styles.acceptText}>Terima</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = {
  container: {
    position: 'absolute',
    top: 64,
    right: 16,
    width: 320,
    zIndex: 9999,
  } as ViewStyle,
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
  } as ViewStyle,
  topBar: {
    height: 6,
    width: '100%',
    backgroundColor: '#2563eb',
  } as ViewStyle,
  content: {
    padding: 14,
  } as ViewStyle,
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  } as ViewStyle,
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  iconBox: {
    backgroundColor: '#eff6ff',
    padding: 6,
    borderRadius: 8,
    marginRight: 8,
  } as ViewStyle,
  titleText: {
    fontWeight: '700',
    color: '#0f172a',
    fontSize: 13,
  } as TextStyle,
  orderTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563eb',
    textTransform: 'uppercase',
  } as TextStyle,
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  badgeCount: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginRight: 8,
  } as ViewStyle,
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  } as TextStyle,
  closeBtn: {
    padding: 4,
  } as ViewStyle,
  customerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 10,
  } as ViewStyle,
  customerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,
  customerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  } as TextStyle,
  customerName: {
    fontWeight: '800',
    color: '#0f172a',
    fontSize: 13,
  } as TextStyle,
  totalRight: {
    alignItems: 'flex-end',
  } as ViewStyle,
  totalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  } as TextStyle,
  totalValue: {
    fontWeight: '900',
    color: '#2563eb',
    fontSize: 13,
  } as TextStyle,
  itemsContainer: {
    maxHeight: 96,
    marginBottom: 12,
  } as ViewStyle,
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  } as ViewStyle,
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  } as ViewStyle,
  qtyBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 4,
    borderRadius: 4,
    marginRight: 6,
    height: 18,
    justifyContent: 'center',
  } as ViewStyle,
  qtyText: {
    fontWeight: '700',
    color: '#334155',
    fontSize: 10,
  } as TextStyle,
  itemTitle: {
    fontWeight: '600',
    color: '#334155',
    fontSize: 11,
    flex: 1,
  } as TextStyle,
  itemPrice: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 11,
  } as TextStyle,
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  } as ViewStyle,
  dismissBtn: {
    flex: 1,
    paddingVertical: 9,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  } as ViewStyle,
  dismissText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 6,
  } as TextStyle,
  acceptBtn: {
    flex: 1,
    paddingVertical: 9,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  acceptText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 6,
  } as TextStyle,
};
