import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Image,
  Modal,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { AdaptiveBottomBar } from './adaptive-bottom-bar';

export const MENUIN_BLUE = '#014FFD';

interface CircularMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  anchorY?: number; // Center of the floating bottom button
}

interface MenuItem {
  id: string;
  label: string;
  path: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'DASHBOARD',
    path: '/(main)/(cashier)/dashboard',
  },
  {
    id: 'pos',
    label: 'POINT OF SALES',
    path: '/(main)/(cashier)/pos',
  },
  {
    id: 'history',
    label: 'TRANSACTIONS',
    path: '/(main)/(cashier)/history',
  },
  {
    id: 'shift',
    label: 'SHIFTS',
    path: '/(main)/(cashier)/shift',
  },
  {
    id: 'items',
    label: 'LIST OF ITEMS',
    path: '/(main)/(cashier)/items',
  },
  {
    id: 'settings',
    label: 'SETTINGS',
    path: '/(main)/(cashier)/settings',
  },
];

export function CircularMenuModal({ isOpen, onClose, anchorY }: CircularMenuModalProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  // Responsive device & orientation classification (identically matching AppTopHeader)
  const isLandscape = width > height;
  const isTablet = width >= 768;
  const isPhoneLandscape = !isTablet && isLandscape;
  const isTabletLandscape = isTablet && isLandscape;
  const isTabletPortrait = isTablet && !isLandscape;

  const [modalVisible, setModalVisible] = useState(isOpen);
  const animProgress = useRef(new Animated.Value(0)).current;
  const isClosingRef = useRef(false);

  // Exact coordinates matching AppTopHeader blue logo
  const topPadding = Math.max(insets.top, Platform.OS === 'ios' ? 12 : 8);
  const headerHeight = topPadding + 46;
  const logoWidth = isTablet ? 110 : 88;
  const logoHeight = isTablet ? 26 : 22;

  // Bottom bar layout dimensions
  const bottomBarPaddingBottom =
    Platform.OS === 'ios'
      ? Math.max(insets.bottom, isPhoneLandscape ? 4 : 6)
      : isPhoneLandscape ? 4 : 6;
  const bottomBarHeight =
    (isPhoneLandscape ? 46 : isTablet ? 58 : 54) + bottomBarPaddingBottom + 6;

  // Center button anchor for circular reveal animation
  const buttonCenterY =
    anchorY ||
    height - (Platform.OS === 'ios' ? insets.bottom + (isPhoneLandscape ? 20 : 26) : (isPhoneLandscape ? 22 : 30));
  const buttonCenterX = width / 2;

  // Maximum radius needed to fully cover the entire viewport from bottom center
  const maxRadius = Math.ceil(Math.hypot(width, height)) + 140;
  const circleDiameter = maxRadius * 2;

  // Responsive font sizes & gaps for the centered menu items
  const menuItemFontSize = isPhoneLandscape
    ? 16
    : isTabletLandscape
    ? 30
    : isTabletPortrait
    ? 26
    : width < 380
    ? 18
    : 22;

  const menuItemGap = isPhoneLandscape
    ? 8
    : isTabletLandscape
    ? 26
    : isTabletPortrait
    ? 22
    : width < 380
    ? 12
    : 16;

  const menuItemPaddingY = isPhoneLandscape ? 4 : isTablet ? 8 : 6;
  const letterSpacing = isPhoneLandscape ? 1 : isTablet ? 2 : 1.5;

  useEffect(() => {
    if (isOpen) {
      isClosingRef.current = false;
      setModalVisible(true);
      Animated.timing(animProgress, {
        toValue: 1,
        duration: 280,
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        useNativeDriver: true,
      }).start();
    } else if (modalVisible && !isClosingRef.current) {
      handleClose();
    }
  }, [isOpen]);

  const handleClose = (callback?: () => void) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    Animated.timing(animProgress, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      onClose();
      isClosingRef.current = false;
      if (callback) {
        callback();
      }
    });
  };

  const handleNavigate = (path: string) => {
    // 1. Immediately close the overlay modal
    handleClose();

    // 2. Perform navigation to requested screen
    try {
      router.navigate(path as any);
    } catch {
      router.push(path as any);
    }
  };

  if (!modalVisible) return null;

  const scale = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.01, 1],
  });

  const contentOpacity = animProgress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      statusBarTranslucent={true}
      animationType="none"
      supportedOrientations={[
        'portrait',
        'portrait-upside-down',
        'landscape',
        'landscape-left',
        'landscape-right',
      ]}
      onRequestClose={() => handleClose()}
    >
      <View style={StyleSheet.absoluteFill}>
        {/* Animated Expanding Circular Surface in Menuin Blue (#014FFD) */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.circleContainer,
            {
              width: circleDiameter,
              height: circleDiameter,
              borderRadius: maxRadius,
              left: buttonCenterX - maxRadius,
              top: buttonCenterY - maxRadius,
              transform: [{ scale }],
            },
          ]}
        />

        {/* 1. TOP LOGO: EXACT SAME PIXEL POSITION AS APPTOPHEADER BLUE LOGO */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.topLogoContainer,
            {
              height: headerHeight,
              paddingTop: topPadding,
              paddingBottom: 8,
              opacity: contentOpacity,
            },
          ]}
        >
          <Image
            source={require('@/assets/images/menuin-putih.png')}
            style={{
              width: logoWidth,
              height: logoHeight,
            }}
            resizeMode="contain"
          />
        </Animated.View>

        {/* 2. CENTER CONTENT: SCROLLABLE VERTICALLY & HORIZONTALLY CENTERED MENU ITEMS */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              top: headerHeight,
              bottom: bottomBarHeight + (isPhoneLandscape ? 8 : 16),
              opacity: contentOpacity,
            },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            <View style={{ gap: menuItemGap, alignItems: 'center', width: '100%' }}>
              {MENU_ITEMS.map((item) => {
                const isActive =
                  item.id === 'pos'
                    ? (pathname.includes('/pos') || pathname.includes('/orders') || pathname.includes('/custom')) &&
                      !pathname.includes('/history')
                    : pathname.includes(item.id);

                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.65}
                    onPress={() => handleNavigate(item.path)}
                    hitSlop={{ top: 8, bottom: 8, left: 32, right: 32 }}
                    style={{
                      paddingVertical: menuItemPaddingY,
                      paddingHorizontal: 20,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      pointerEvents="none"
                      style={{
                        fontSize: menuItemFontSize,
                        letterSpacing,
                        fontWeight: '900',
                        color: '#ffffff',
                        includeFontPadding: false,
                        textAlign: 'center',
                      }}
                      className={
                        isActive
                          ? 'opacity-100 font-black'
                          : 'opacity-80 font-black active:opacity-100'
                      }
                    >
                      {item.label}
                    </Text>
                    {isActive && (
                      <View
                        pointerEvents="none"
                        style={{
                          width: isPhoneLandscape ? 6 : 8,
                          height: isPhoneLandscape ? 6 : 8,
                          borderRadius: 4,
                          marginLeft: isPhoneLandscape ? 8 : 12,
                          backgroundColor: '#ffffff',
                        }}
                        className="shadow-xs"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </Animated.View>

        {/* 3. Persistent Bottom Bar at the bottom of the modal */}
        <View style={styles.bottomBarWrapper}>
          <AdaptiveBottomBar
            isMenuOpen={true}
            onToggleMenu={() => handleClose()}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  circleContainer: {
    position: 'absolute',
    backgroundColor: MENUIN_BLUE,
  },
  topLogoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  bottomBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
});
