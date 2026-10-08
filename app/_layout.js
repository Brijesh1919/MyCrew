import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from '../src/constants/theme';
import { analytics } from '../src/services/analyticsService';

export default function RootLayout() {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width > 520;

  useEffect(() => {
    analytics.logAppOpen();
  }, []);

  return (
    <SafeAreaProvider style={styles.provider}>
      <StatusBar style="dark" backgroundColor={COLORS.background} />
      <View style={[styles.rootWrapper, isDesktopWeb && styles.desktopWrapper]}>
        <View style={[styles.appShell, isDesktopWeb && styles.desktopShell]}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.background },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
            <Stack.Screen
              name="features/find-people"
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="features/find-nearest"
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="features/im-lost"
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="features/navigation"
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="features/person"
              options={{
                presentation: 'modal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="features/meeting-point"
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="features/group-status"
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="features/group-radar"
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="features/check-in"
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="features/emergency"
              options={{
                presentation: 'fullScreenModal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen
              name="features/smart-tracking"
              options={{ presentation: 'card' }}
            />
            <Stack.Screen
              name="features/privacy"
              options={{ presentation: 'card' }}
            />
          </Stack>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  provider: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  rootWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
  },
  desktopWrapper: {
    backgroundColor: '#0F172A', // Sleek dark canvas on desktop
    justifyContent: 'center',
    alignItems: 'center',
  },
  appShell: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.background,
  },
  desktopShell: {
    maxWidth: 460,
    maxHeight: 920,
    height: '96%',
    borderRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 16px 36px rgba(0, 0, 0, 0.45)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.45,
        shadowRadius: 36,
      },
    }),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
});
