import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, ArrowRight } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useTripStore } from '../../src/store/useTripStore';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function OnboardingScreen1() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { triggerLight } = useHapticFeedback();
  const setOnboardingCompleted = useTripStore((state) => state.setOnboardingCompleted);

  const handleNext = () => {
    triggerLight();
    router.push('/(onboarding)/intro');
  };

  const handleSkip = async () => {
    triggerLight();
    await setOnboardingCompleted(true);
    router.replace('/(auth)');
  };

  return (
    <ImageBackground
      source={require('../../assets/onboarding_1.jpg')}
      style={styles.rootContainer}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Layer 1: Cinematic Gradient Scrim (Darkens bottom for high-contrast readability) */}
      <LinearGradient
        colors={[
          'rgba(15, 23, 42, 0.45)',
          'rgba(15, 23, 42, 0.25)',
          'rgba(15, 23, 42, 0.85)',
          'rgba(15, 23, 42, 0.98)',
        ]}
        locations={[0, 0.38, 0.7, 1]}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      {/* Layer 2: Interactive In-flow Foreground Content with Safe Insets */}
      <View
        style={[
          styles.contentContainer,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        {/* Top Bar: Progress Indicator & Skip Pill */}
        <View style={styles.topHeader}>
          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>

          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Spacer to push content towards bottom */}
        <View style={{ flex: 1 }} />

        {/* Bottom Card Content */}
        <View style={styles.bottomSection}>
          {/* Brand Concept Tag */}
          <View style={styles.badgePill}>
            <Sparkles size={13} color="#38BDF8" style={{ marginRight: 6 }} />
            <Text style={styles.badgeText}>GROUP LIVE COORDINATION</Text>
          </View>

          {/* Headline */}
          <Text style={styles.title}>Stay Together. Without the Stress.</Text>

          {/* Subtitle Description */}
          <Text style={styles.description}>
            MyCrew helps your group find each other in crowded places — festivals, road trips, concerts, and adventures.
          </Text>

          {/* Actions */}
          <View style={styles.actionSection}>
            <PrimaryButton
              title="Next"
              onPress={handleNext}
              icon={ArrowRight}
              size="lg"
              style={styles.nextBtn}
            />

            <TouchableOpacity
              onPress={handleSkip}
              style={styles.signInRow}
              activeOpacity={0.7}
            >
              <Text style={styles.signInMuted}>Already have an account? </Text>
              <Text style={styles.signInBold}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  dotActive: {
    width: 28,
    backgroundColor: '#38BDF8',
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  skipText: {
    ...TYPOGRAPHY.caption,
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  bottomSection: {
    paddingBottom: 10,
  },
  badgePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    marginBottom: 16,
  },
  badgeText: {
    ...TYPOGRAPHY.badge,
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 38,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  description: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    color: '#CBD5E1',
    lineHeight: 23,
    marginBottom: 28,
  },
  actionSection: {
    width: '100%',
  },
  nextBtn: {
    backgroundColor: '#2563EB',
    borderRadius: RADIUS.xl,
    ...SHADOWS.lg,
  },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    paddingVertical: 4,
  },
  signInMuted: {
    ...TYPOGRAPHY.caption,
    color: '#94A3B8',
    fontSize: 13,
  },
  signInBold: {
    ...TYPOGRAPHY.caption,
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
});
