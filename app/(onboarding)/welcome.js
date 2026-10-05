import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, MapPin, Compass, ArrowRight } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleNext = () => {
    router.push('/(onboarding)/intro');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Step dots */}
        <View style={styles.dotsContainer}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Visual Graphic */}
        <View style={styles.graphicContainer}>
          <View style={styles.outerGlow}>
            <View style={styles.innerCircle}>
              <View style={styles.iconBadgeTop}>
                <MapPin size={22} color={COLORS.primary} />
              </View>
              <View style={styles.iconBadgeLeft}>
                <Compass size={20} color={COLORS.accent} />
              </View>
              <View style={styles.iconBadgeRight}>
                <Users size={20} color={COLORS.success} />
              </View>

              <Text style={styles.graphicEmoji}>🎪</Text>
            </View>
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.textSection}>
          <View style={styles.taglineBadge}>
            <Text style={styles.taglineText}>NEVER LOSE YOUR GROUP AGAIN</Text>
          </View>
          <Text style={styles.title}>Going somewhere with friends?</Text>
          <Text style={styles.description}>
            Create a temporary crew and stay connected wherever you go — festivals, treks, weddings, or trips.
          </Text>
        </View>

        {/* CTA */}
        <View style={styles.actionSection}>
          <PrimaryButton
            title="Get Started"
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
  graphicContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  outerGlow: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...SHADOWS.lg,
  },
  graphicEmoji: {
    fontSize: 54,
  },
  iconBadgeTop: {
    position: 'absolute',
    top: -12,
    backgroundColor: COLORS.primaryLight,
    padding: 8,
    borderRadius: 20,
    ...SHADOWS.sm,
  },
  iconBadgeLeft: {
    position: 'absolute',
    left: -12,
    backgroundColor: '#E0F2FE',
    padding: 8,
    borderRadius: 20,
    ...SHADOWS.sm,
  },
  iconBadgeRight: {
    position: 'absolute',
    right: -12,
    backgroundColor: COLORS.successBg,
    padding: 8,
    borderRadius: 20,
    ...SHADOWS.sm,
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  taglineBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 12,
  },
  taglineText: {
    ...TYPOGRAPHY.badge,
    color: COLORS.primary,
    fontSize: 11,
  },
  title: {
    ...TYPOGRAPHY.h1,
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 28,
  },
  description: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 16,
  },
  actionSection: {
    paddingBottom: 16,
  },
});
