import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, LogBox, Image as RNImage } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

// Prefetch critical mobile logo assets into native memory cache immediately on app launch
const whiteLogoUri = RNImage.resolveAssetSource(require('@/assets/images/menuin-putih.png'))?.uri;
const blueLogoUri = RNImage.resolveAssetSource(require('@/assets/images/menuin.png'))?.uri;
if (whiteLogoUri) {
  ExpoImage.prefetch(whiteLogoUri, 'memory-disk');
}
if (blueLogoUri) {
  ExpoImage.prefetch(blueLogoUri, 'memory-disk');
}

// Disable Reanimated strict mode logger warnings (triggered by react-native-css-interop / NativeWind transitions)
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

LogBox.ignoreLogs([
  '[Reanimated] Reading from `value` during component render.',
  '[Reanimated] Writing to `value` during component render.',
]);

const queryClient = new QueryClient();

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Slot />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
