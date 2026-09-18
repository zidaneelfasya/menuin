import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

export const MENUIN_BLUE = '#014FFD';
const LOGO_ASPECT_RATIO = 960 / 315; // ~3.0476
const LIQUID_EASING = Easing.bezier(0.45, 0, 0.15, 1);
const DEFAULT_DURATION = 800; // Exact match to website (0.8s)

export interface MenuinLoaderProps {
  /** Size preset or explicit width */
  size?: 'sm' | 'md' | 'lg' | number;
  /** Whether to continuously loop the liquid fill animation */
  loop?: boolean;
  /** Duration in ms for one fill cycle (default 800ms) */
  duration?: number;
  /** Callback fired when one fill cycle completes (useful when loop is false) */
  onComplete?: () => void;
  style?: ViewStyle;
}

/**
 * MenuinLoader renders the white Menuin logo with a bottom-to-top liquid fill animation
 * on top of a 20% opacity dimmed silhouette, mirroring the MENUIN web transition loader.
 */
export function MenuinLoader({
  size = 'md',
  loop = true,
  duration = DEFAULT_DURATION,
  onComplete,
  style,
}: MenuinLoaderProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Calculate responsive dimensions
  const isTablet = Math.min(windowWidth, windowHeight) >= 600;
  const isLandscape = windowWidth > windowHeight;

  let computedWidth: number;
  if (typeof size === 'number') {
    computedWidth = size;
  } else if (size === 'sm') {
    computedWidth = 140;
  } else if (size === 'lg' || isTablet) {
    computedWidth = isLandscape ? Math.min(280, windowHeight * 0.45 * LOGO_ASPECT_RATIO) : 280;
  } else {
    // 'md' default
    computedWidth = isLandscape
      ? Math.min(220, windowHeight * 0.4 * LOGO_ASPECT_RATIO)
      : Math.min(220, windowWidth * 0.58);
  }

  // Ensure logo does not exceed reasonable constraints
  computedWidth = Math.max(120, Math.min(computedWidth, 340));
  const computedHeight = Math.round(computedWidth / LOGO_ASPECT_RATIO);

  const fillProgress = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    if (loop) {
      // Looping indeterminate animation:
      // 1. Fills from bottom to top (800ms) with cubic bezier
      // 2. Holds full for 350ms
      // 3. Smoothly fades slightly & resets to refill
      fillProgress.value = withRepeat(
        withSequence(
          withTiming(1, { duration, easing: LIQUID_EASING }),
          withDelay(
            350,
            withTiming(0, {
              duration: 350,
              easing: Easing.inOut(Easing.cubic),
            })
          )
        ),
        -1,
        false
      );
    } else {
      // One-shot animation (for splash / page transition)
      fillProgress.value = withTiming(
        1,
        { duration, easing: LIQUID_EASING },
        (finished) => {
          if (finished && onComplete) {
            runOnJS(onComplete)();
          }
        }
      );
    }
  }, [loop, duration, onComplete]);

  const animatedFillStyle = useAnimatedStyle(() => {
    return {
      height: computedHeight * fillProgress.value,
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.loaderContainer,
        { width: computedWidth, height: computedHeight },
        animatedContainerStyle,
        style,
      ]}
    >
      {/* 1. Dimmed Base Silhouette (opacity 20%, exactly as web: opacity-20) */}
      <Image
        source={require('@/assets/images/menuin-putih.png')}
        style={[styles.logoImage, { width: computedWidth, height: computedHeight, opacity: 0.2 }]}
        contentFit="contain"
        priority="high"
      />

      {/* 2. Liquid Fill Mask (bottom-to-top reveal) */}
      <Animated.View
        style={[
          styles.fillMask,
          { width: computedWidth },
          animatedFillStyle,
        ]}
      >
        <View
          style={[
            styles.innerImageContainer,
            { width: computedWidth, height: computedHeight },
          ]}
        >
          <Image
            source={require('@/assets/images/menuin-putih.png')}
            style={[styles.logoImage, { width: computedWidth, height: computedHeight }]}
            contentFit="contain"
            priority="high"
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

export interface LoadingScreenProps {
  /** Optional status or subtitle message */
  message?: string;
  /** Whether to continuously loop (default: true) */
  loop?: boolean;
  /** Optional callback when one-shot fill completes */
  onComplete?: () => void;
  style?: ViewStyle;
}

/**
 * Fullscreen loading screen with MENUIN brand blue (#014FFD) background
 * and centered responsive liquid fill logo.
 */
export function LoadingScreen({
  message,
  loop = true,
  onComplete,
  style,
}: LoadingScreenProps) {
  const pulseOpacity = useSharedValue(0.7);

  useEffect(() => {
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.6, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, []);

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={[styles.screenContainer, style]}>
      <StatusBar style="light" />

      <View style={styles.centerContent}>
        <MenuinLoader loop={loop} onComplete={onComplete} />

        {message ? (
          <Animated.Text style={[styles.messageText, animatedTextStyle]}>
            {message}
          </Animated.Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: MENUIN_BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loaderContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  fillMask: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  innerImageContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  messageText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginTop: 20,
    textAlign: 'center',
  },
});
