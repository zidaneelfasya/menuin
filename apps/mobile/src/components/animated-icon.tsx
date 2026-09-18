import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { MenuinLoader, MENUIN_BLUE } from '@/components/ui/loading-screen';

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const [isReadyToAnimate, setIsReadyToAnimate] = useState(false);
  const overlayOpacity = useSharedValue(1);

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const handleFillComplete = () => {
    // Fade out overlay smoothly after fill animation finishes
    overlayOpacity.value = withTiming(0, { duration: 350 }, (finished) => {
      if (finished) {
        runOnJS(setVisible)(false);
      }
    });
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.splashOverlay, animatedOverlayStyle]}
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setIsReadyToAnimate(true);
        });
      }}
    >
      <StatusBar style="light" />
      {isReadyToAnimate && (
        <MenuinLoader
          loop={false}
          duration={800}
          onComplete={handleFillComplete}
        />
      )}
    </Animated.View>
  );
}

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Image
        style={styles.image}
        source={require('@/assets/images/menuin-putih.png')}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: MENUIN_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    width: 96,
    height: 32,
  },
});
