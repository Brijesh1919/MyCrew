import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Shield, Lock, EyeOff, Clock, CheckCircle2 } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { useTripStore } from '../../src/store/useTripStore';

export default function PrivacyScreen() {
  const router = useRouter();
  const setOnboardingCompleted = useTripStore((state) => state.setOnboardingCompleted);

  const handleFinish = () => {
    setOnboardingCompleted(true);
    router.replace('/(tabs)/home');
  };

  const handleJoinOrCreate = (route) => {
    setOnboardingCompleted(true);
    router.push(route);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Step dots */}
        <View style={styles.dotsContainer}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        {/* Privacy Icon Badge */}
        <View style={styles.iconContainer}>
          <View style={styles.shieldGlow}>
            <View style={styles.shieldCircle}>
              <Shield size={44} color={COLORS.primary} />
            </View>
          </View>
        </View>

        {/* Text Section */}
        <View style={styles.textSection}>
          <Text style={styles.title}>Private by design.</Text>
          <Text style={styles.description}>
            Your location is only shared inside the active trip and automatically stops when the trip ends.
          </Text>

          {/* Privacy Guarantee List */}
          <View style={styles.guaranteeBox}>
            <View style={styles.guaranteeItem}>
              <CheckCircle2 size={16} color={COLORS.success} />
              <Text style={styles.guaranteeText}>No permanent background tracking</Text>
            </View>
            <View style={styles.guaranteeItem}>
              <CheckCircle2 size={16} color={COLORS.success} />
              <Text style={styles.guaranteeText}>Only your crew sees your live marker</Text>
            </View>
            <View style={styles.guaranteeItem}>
              <CheckCircle2 size={16} color={COLORS.success} />
              <Text style={styles.guaranteeText}>Automatic expiration & data cleanup</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <PrimaryButton
            title="Let's Go"
            onPress={handleFinish}
            size="lg"
            style={styles.primaryBtn}
          />
          <View style={styles.altButtonsRow}>
            <SecondaryButton
              title="Join a Crew"
              onPress={() => handleJoinOrCreate('/(auth)/join')}
              size="sm"
              variant="subtle"
              style={styles.halfBtn}
            />
            <View style={{ width: 10 }} />
            <SecondaryButton
              title="+ Create Trip"
              onPress={() => handleJoinOrCreate('/(auth)/create-trip')}
              size="sm"
              variant="outline"
              style={styles.halfBtn}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  shieldGlow: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shieldCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    ...TYPOGRAPHY.h1,
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 28,
  },
  description: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 16,
    marginBottom: 20,
  },
  guaranteeBox: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  guaranteeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  guaranteeText: {
    ...TYPOGRAPHY.bodySecondary,
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  actionSection: {
    paddingBottom: 16,
  },
  primaryBtn: {
    marginBottom: 12,
  },
  altButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  halfBtn: {
    flex: 1,
  },
});
