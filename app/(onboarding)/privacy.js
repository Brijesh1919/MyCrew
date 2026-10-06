import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Shield, Clock, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { useTripStore } from '../../src/store/useTripStore';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function OnboardingScreen3() {
  const router = useRouter();
  const { triggerSuccess, triggerLight } = useHapticFeedback();
  const setOnboardingCompleted = useTripStore((state) => state.setOnboardingCompleted);

  const handleGetStarted = async () => {
    triggerSuccess();
    await setOnboardingCompleted(true);
    router.replace('/(auth)');
  };

  const handleBack = () => {
    triggerLight();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(onboarding)/intro');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Step dots */}
        <View style={styles.topHeader}>
          <View style={styles.dotsContainer}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
          </View>
        </View>

        {/* Temporary Trip & Privacy Illustration */}
        <View style={styles.visualContainer}>
          <View style={styles.shieldGlow}>
            <View style={styles.shieldCircle}>
              <Shield size={44} color={COLORS.primary} />
            </View>
          </View>

          {/* Privacy Guarantees Box */}
          <View style={styles.guaranteeBox}>
            <View style={styles.guaranteeItem}>
              <Clock size={16} color={COLORS.primary} />
              <Text style={styles.guaranteeText}>Auto-expires when the trip ends</Text>
            </View>
            <View style={styles.guaranteeItem}>
              <CheckCircle2 size={16} color={COLORS.success} />
              <Text style={styles.guaranteeText}>No permanent background tracking</Text>
            </View>
            <View style={styles.guaranteeItem}>
              <CheckCircle2 size={16} color={COLORS.success} />
              <Text style={styles.guaranteeText}>Only your crew sees your live marker</Text>
            </View>
          </View>
        </View>

        {/* Text Section */}
        <View style={styles.textSection}>
          <Text style={styles.title}>Your Crew. Only When You Need It.</Text>
          <Text style={styles.description}>
            Trips are temporary. Location sharing ends when the trip ends. No permanent family tracking.
          </Text>
        </View>

        {/* Action Buttons: Get Started + Back */}
        <View style={styles.actionSection}>
          <PrimaryButton
            title="Get Started"
            onPress={handleGetStarted}
            icon={ArrowRight}
            size="lg"
            style={{ marginBottom: 10 }}
          />
          <SecondaryButton
            title="Back"
            onPress={handleBack}
            icon={ArrowLeft}
            size="md"
            variant="ghost"
          />
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
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  topHeader: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  visualContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  shieldGlow: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  shieldCircle: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  guaranteeBox: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...SHADOWS.sm,
  },
  guaranteeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guaranteeText: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 27,
    textAlign: 'center',
    color: COLORS.textPrimary,
    marginBottom: 12,
    lineHeight: 34,
  },
  description: {
    ...TYPOGRAPHY.bodySecondary,
    fontSize: 15,
    textAlign: 'center',
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  actionSection: {
    marginTop: 16,
  },
});
