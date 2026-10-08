import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, Clock, CheckCircle2, ArrowRight, ArrowLeft, Lock } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useTripStore } from '../../src/store/useTripStore';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function OnboardingScreen3() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    <ImageBackground
      source={require('../../assets/onboarding_3.jpg')}
      style={styles.rootContainer}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Layer 1: Cinematic Gradient Scrim */}
      <LinearGradient
        colors={[
          'rgba(15, 23, 42, 0.4)',
          'rgba(15, 23, 42, 0.25)',
          'rgba(15, 23, 42, 0.82)',
          'rgba(15, 23, 42, 0.98)',
        ]}
        locations={[0, 0.32, 0.65, 1]}
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
          {/* Top Header: Step Dots */}
          <View style={styles.topHeader}>
            <View style={styles.dotsContainer}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={[styles.dot, styles.dotActive]} />
            </View>

            <TouchableOpacity
              onPress={handleGetStarted}
              style={styles.skipBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.skipText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Frosted Glass Privacy Guarantees Card */}
          <View style={styles.visualContainer}>
            <View style={styles.shieldGlow}>
              <View style={styles.shieldCircle}>
                <ShieldCheck size={40} color="#38BDF8" strokeWidth={2} />
              </View>
            </View>

            <View style={styles.guaranteeBox}>
              <View style={styles.guaranteeItem}>
                <Clock size={16} color="#38BDF8" style={{ marginRight: 10 }} />
                <Text style={styles.guaranteeText}>Auto-expires when the trip ends</Text>
              </View>
              <View style={styles.guaranteeItem}>
                <CheckCircle2 size={16} color="#34D399" style={{ marginRight: 10 }} />
                <Text style={styles.guaranteeText}>No permanent background tracking</Text>
              </View>
              <View style={styles.guaranteeItem}>
                <Lock size={16} color="#38BDF8" style={{ marginRight: 10 }} />
                <Text style={styles.guaranteeText}>Only your crew sees your live marker</Text>
              </View>
            </View>
          </View>

          {/* Bottom Text & Actions */}
          <View style={styles.bottomSection}>
            <View style={styles.badgePill}>
              <Lock size={12} color="#38BDF8" style={{ marginRight: 6 }} />
              <Text style={styles.badgeText}>PRIVACY BY DESIGN</Text>
            </View>

            <Text style={styles.title}>Your Crew. Only When You Need It.</Text>
            <Text style={styles.description}>
              Trips are temporary. Location sharing stops the moment the event ends. Zero permanent family surveillance.
            </Text>

            {/* Action Buttons: Get Started + Back */}
            <View style={styles.actionSection}>
              <PrimaryButton
                title="Get Started"
                onPress={handleGetStarted}
                icon={ArrowRight}
                size="lg"
                style={styles.startBtn}
              />

              <TouchableOpacity
                onPress={handleBack}
                style={styles.backBtn}
                activeOpacity={0.7}
              >
                <ArrowLeft size={16} color="#94A3B8" style={{ marginRight: 6 }} />
                <Text style={styles.backBtnText}>Back</Text>
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
  visualContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  shieldGlow: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.md,
  },
  shieldCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guaranteeBox: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.76)',
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    ...SHADOWS.lg,
  },
  guaranteeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  guaranteeText: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: '#F1F5F9',
    fontWeight: '600',
    flex: 1,
  },
  bottomSection: {
    paddingBottom: 6,
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
    marginBottom: 14,
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
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 10,
    lineHeight: 36,
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
    marginBottom: 24,
  },
  actionSection: {
    width: '100%',
  },
  startBtn: {
    backgroundColor: '#2563EB',
    borderRadius: RADIUS.xl,
    ...SHADOWS.lg,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 6,
  },
  backBtnText: {
    ...TYPOGRAPHY.caption,
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
});
