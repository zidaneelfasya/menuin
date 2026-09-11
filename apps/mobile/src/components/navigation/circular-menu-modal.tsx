import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname, useNavigation } from 'expo-router';
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
  const navigation = useNavigation<any>();
  const pathname = usePathname();

  // Responsive device & orientation classification
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= 600;
  const isPhoneLandscape = !isTablet && isLandscape;
  const isPhonePortrait = !isTablet && !isLandscape;
  const isTabletLandscape = isTablet && isLandscape;
  const isTabletPortrait = isTablet && !isLandscape;

  const [modalVisible, setModalVisible] = useState(isOpen);
  const animProgress = useRef(new Animated.Value(0)).current;
  const isClosingRef = useRef(false);

  // Calculate coordinates of the center button anchor
  const buttonCenterY =
    anchorY ||
    height - (Platform.OS === 'ios' ? insets.bottom + (isPhoneLandscape ? 20 : 26) : (isPhoneLandscape ? 22 : 30));
  const buttonCenterX = width / 2;

  // Maximum radius needed to fully cover the entire viewport from bottom center
  const maxRadius = Math.ceil(Math.hypot(width, height)) + 140;
  const circleDiameter = maxRadius * 2;

  // Responsive dimensions for the rotated vertical "menuin." logo (aspect ratio: 1921 / 631 ≈ 3.04)
  const logoVisualHeight = isPhoneLandscape
    ? Math.min(height * 0.46, 165)
    : isTabletLandscape
    ? Math.min(height * 0.58, 420)
    : isTabletPortrait
    ? Math.min(height * 0.44, 340)
    : width < 380
    ? Math.min(height * 0.36, 210)
    : Math.min(height * 0.42, 250);

  const logoVisualWidth = Math.round(logoVisualHeight / 3.04);

  // Responsive font sizes & gaps for the 6 menu items
  const menuItemFontSize = isPhoneLandscape
    ? 15
    : isTabletLandscape
    ? 28
    : isTabletPortrait
    ? 24
    : width < 380
    ? 17
    : 20;

  const menuItemGap = isPhoneLandscape
    ? 6
    : isTabletLandscape
    ? 26
    : isTabletPortrait
    ? 22
    : width < 380
    ? 12
    : 16;

  const menuItemPaddingY = isPhoneLandscape ? 2 : isTablet ? 6 : 4;
  const letterSpacing = isPhoneLandscape ? 1 : isTablet ? 2 : 1.4;

  const contentPaddingTop = isPhoneLandscape
    ? Math.max(insets.top, 8) + 4
    : isTablet
    ? Math.max(insets.top, 32) + 20
    : Math.max(insets.top, 20) + 14;

  const contentPaddingBottom = isPhoneLandscape
    ? insets.bottom + 48
    : isTablet
    ? insets.bottom + 80
    : insets.bottom + 70;

  const contentPaddingLeft = isPhoneLandscape
    ? Math.max(insets.left, 24) + 40
    : isTablet
    ? Math.max(insets.left, 40) + 48
    : Math.max(insets.left, 16) + 24;

  const contentPaddingRight = isPhoneLandscape
    ? Math.max(insets.right, 24) + 16
    : isTablet
    ? Math.max(insets.right, 40) + 24
    : Math.max(insets.right, 16) + 12;

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
      try {
        router.push(path as any);
      } catch {
        const routeName = path.split('/').pop();
        if (routeName) {
          navigation?.navigate?.(routeName);
        }
      }
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

        {/* Menu Layout: Left list of features, Right vertical white logo */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              paddingTop: contentPaddingTop,
              paddingBottom: contentPaddingBottom,
              paddingLeft: contentPaddingLeft,
              paddingRight: contentPaddingRight,
              opacity: contentOpacity,
            },
          ]}
          className="flex-row items-center justify-between"
        >
          {/* ============================================================ */}
          {/* SISI KIRI: DAFTAR MENU (TULISAN HURUF BESAR PUTIH TEBAL)    */}
          {/* ============================================================ */}
          <View
            pointerEvents="box-none"
            style={{
              flex: isPhonePortrait ? 1.3 : 1,
              justifyContent: 'center',
              zIndex: 30,
              elevation: 30,
            }}
          >
            <View pointerEvents="box-none" style={{ gap: menuItemGap }}>
              {MENU_ITEMS.map((item) => {
                const isActive =
                  item.id === 'pos'
                    ? pathname.includes('/pos') && !pathname.includes('/history')
                    : pathname.includes(item.id);

                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.65}
                    onPress={() => handleNavigate(item.path)}
                    hitSlop={{ left: 24, right: 36 }}
                    style={{
                      paddingVertical: isPhoneLandscape ? 6 : isTablet ? 12 : 9,
                      width: '100%',
                      flexDirection: 'row',
                      alignItems: 'center',
                      zIndex: 35,
                      elevation: 35,
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
                        textAlignVertical: 'center',
                      }}
                      className={
                        isActive
                          ? 'opacity-100 font-black'
                          : 'opacity-85 font-black active:opacity-100'
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
          </View>

          {/* ============================================================ */}
          {/* SISI KANAN: LOGO MENUIN PUTIH VERTIKAL (ROTATED 90 DERAJAT)  */}
          {/* ============================================================ */}
          <View
            pointerEvents="none"
            style={{
              flex: isPhonePortrait ? 0.7 : 1,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              elevation: 1,
            }}
          >
            <View
              pointerEvents="none"
              style={{
                width: logoVisualWidth,
                height: logoVisualHeight,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ExpoImage
                source={require('@/assets/images/menuin-putih.png')}
                style={{
                  width: logoVisualHeight,
                  height: logoVisualWidth,
                  transform: [{ rotate: '90deg' }],
                }}
                contentFit="contain"
                priority="high"
                cachePolicy="memory-disk"
                transition={0}
              />
            </View>
          </View>
        </Animated.View>

        {/* Persistent Bottom Bar at the bottom of the modal */}
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
  bottomBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
});
