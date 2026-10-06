import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTripStore } from '../src/store/useTripStore';
import { useUserStore } from '../src/store/useUserStore';
import { COLORS, TYPOGRAPHY } from '../src/constants/theme';

export default function IndexScreen() {
  const router = useRouter();

  // Stores
  const isTripInitialized = useTripStore((state) => state.isInitialized);
  const isOnboardingCompleted = useTripStore((state) => state.isOnboardingCompleted);
  const initializeTripStore = useTripStore((state) => state.initializeStore);

  const isAuthInitialized = useUserStore((state) => state.isAuthInitialized);
  const authStatus = useUserStore((state) => state.authStatus);
  const initializeAuth = useUserStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
    initializeTripStore();
  }, []);

  useEffect(() => {
    if (!isAuthInitialized || !isTripInitialized || authStatus === 'loading') {
      return;
    }

    const timer = setTimeout(() => {
      if (authStatus === 'authenticated') {
        router.replace('/(tabs)/home');
      } else {
        if (isOnboardingCompleted) {
          router.replace('/(auth)');
        } else {
          router.replace('/(onboarding)/welcome');
        }
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isAuthInitialized, isTripInitialized, authStatus, isOnboardingCompleted, router]);

  return (
    <View style={styles.container}>
      <View style={styles.splashContent}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText}>MC</Text>
        </View>
        <Text style={styles.brandTitle}>MyCrew</Text>
        <Text style={styles.tagline}>Keeping your crew{'\n'}together.</Text>

        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },
  splashContent: {
    alignItems: 'center',
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: '0px 8px 16px rgba(37, 99, 235, 0.28)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 16,
        elevation: 8,
      },
    }),
  },
  logoBadgeText: {
    color: COLORS.white,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
  },
  brandTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    ...TYPOGRAPHY.bodySecondary,
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 36,
  },
  loaderWrap: {
    marginTop: 8,
  },
});
