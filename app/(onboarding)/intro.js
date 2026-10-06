import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Navigation, Compass, ArrowRight, ArrowLeft, MapPin } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function OnboardingScreen2() {
  const router = useRouter();
  const { triggerLight } = useHapticFeedback();

  const handleNext = () => {
    triggerLight();
    router.push('/(onboarding)/privacy');
  };

  const handleBack = () => {
    triggerLight();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(onboarding)/welcome');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Step dots */}
        <View style={styles.topHeader}>
          <View style={styles.dotsContainer}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* Feature Visual Preview Card */}
        <View style={styles.visualContainer}>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={styles.liveDot} />
              <Text style={styles.previewTitle}>Find My People • Live Map</Text>
            </View>

            {/* Simulated Live Distance Cards */}
            <View style={styles.personItem}>
              <View style={[styles.miniAvatar, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.avatarTxt}>YOU</Text>
              </View>
              <View style={styles.personInfo}>
                <Text style={styles.personName}>Your Location</Text>
                <Text style={styles.personSub}>Central Stage • High accuracy</Text>
              </View>
              <View style={styles.liveStatusPill}>
                <Text style={styles.liveStatusTxt}>Live</Text>
              </View>
            </View>

            <View style={styles.personItem}>
              <View style={[styles.miniAvatar, { backgroundColor: '#10B981' }]}>
                <Text style={styles.avatarTxt}>P</Text>
              </View>
              <View style={styles.personInfo}>
                <Text style={styles.personName}>Priya</Text>
                <Text style={styles.personSub}>Food Court Cluster</Text>
              </View>
              <View style={styles.distPill}>
                <Navigation size={11} color={COLORS.primary} style={{ marginRight: 3 }} />
                <Text style={styles.distTxt}>82 m</Text>
              </View>
            </View>

            <View style={styles.personItem}>
              <View style={[styles.miniAvatar, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.avatarTxt}>R</Text>
              </View>
              <View style={styles.personInfo}>
                <Text style={styles.personName}>Rahul</Text>
                <Text style={styles.personSub}>Main Gate Entrance</Text>
              </View>
              <View style={styles.distPill}>
                <Navigation size={11} color={COLORS.primary} style={{ marginRight: 3 }} />
                <Text style={styles.distTxt}>146 m</Text>
              </View>
            </View>

            {/* Quick emergency preview feature pill */}
            <View style={styles.lostBanner}>
              <Compass size={15} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.lostBannerText}>Instant "I'm Lost" compass navigation</Text>
            </View>
          </View>
        </View>

        {/* Text Section */}
        <View style={styles.textSection}>
          <Text style={styles.title}>Find Your People Fast</Text>
          <Text style={styles.description}>
            See where your crew is, find the nearest person, or use “I'm Lost” when you can't find your group.
          </Text>
        </View>

        {/* Action Buttons: Next + Back */}
        <View style={styles.actionSection}>
          <PrimaryButton
            title="Next"
            onPress={handleNext}
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
  previewCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.md,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 8,
  },
  previewTitle: {
    ...TYPOGRAPHY.badge,
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  miniAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarTxt: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  personSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  liveStatusPill: {
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  liveStatusTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  distPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  distTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  lostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 10,
  },
  lostBannerText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
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
