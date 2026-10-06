import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, MapPin, Sparkles, ArrowRight } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useTripStore } from '../../src/store/useTripStore';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function OnboardingScreen1() {
  const router = useRouter();
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header Row with Skip button */}
        <View style={styles.topHeader}>
          {/* Step dots */}
          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Visual Map/Crew Illustration */}
        <View style={styles.graphicContainer}>
          <View style={styles.outerGlow}>
            <View style={styles.radarRing}>
              {/* Surrounding crew marker icons */}
              <View style={[styles.avatarBadge, styles.badgeTop]}>
                <Text style={styles.avatarLetter}>A</Text>
              </View>
              <View style={[styles.avatarBadge, styles.badgeRight]}>
                <Text style={styles.avatarLetter}>R</Text>
              </View>
              <View style={[styles.avatarBadge, styles.badgeBottom]}>
                <Text style={styles.avatarLetter}>P</Text>
              </View>
              <View style={[styles.avatarBadge, styles.badgeLeft]}>
                <Text style={styles.avatarLetter}>K</Text>
              </View>

              {/* Central Map Pin Hub */}
              <View style={styles.centerHub}>
                <Users size={32} color={COLORS.white} />
              </View>
            </View>
          </View>
        </View>

        {/* Text Section */}
        <View style={styles.textSection}>
          <View style={styles.taglineBadge}>
            <Sparkles size={13} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.taglineText}>GROUP LIVE COORDINATION</Text>
          </View>

          <Text style={styles.title}>Stay Together. Without the Stress.</Text>
          <Text style={styles.description}>
            MyCrew helps your group find each other in crowded places — festivals, trips, weddings, treks and more.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionSection}>
          <PrimaryButton
            title="Next"
            onPress={handleNext}
            icon={ArrowRight}
            size="lg"
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
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 10,
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
  skipText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  graphicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  outerGlow: {
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.1)',
  },
  radarRing: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
    position: 'relative',
  },
  centerHub: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  avatarBadge: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  badgeTop: {
    top: -12,
    alignSelf: 'center',
  },
  badgeRight: {
    right: -12,
    top: '42%',
    borderColor: COLORS.success,
  },
  badgeBottom: {
    bottom: -12,
    alignSelf: 'center',
    borderColor: COLORS.warning,
  },
  badgeLeft: {
    left: -12,
    top: '42%',
    borderColor: COLORS.accent,
  },
  avatarLetter: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  taglineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    marginBottom: 16,
  },
  taglineText: {
    ...TYPOGRAPHY.badge,
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
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
    paddingHorizontal: 4,
  },
  actionSection: {
    marginTop: 20,
  },
});
