import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTripStore } from '../src/store/useTripStore';
import { COLORS } from '../src/constants/theme';

export default function IndexScreen() {
  const router = useRouter();
  const isInitialized = useTripStore((state) => state.isInitialized);
  const isOnboardingCompleted = useTripStore((state) => state.isOnboardingCompleted);
  const initializeStore = useTripStore((state) => state.initializeStore);

  useEffect(() => {
    initializeStore();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const timer = setTimeout(() => {
      if (isOnboardingCompleted) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(onboarding)/welcome');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isInitialized, isOnboardingCompleted, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
