import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Navigation, Compass, ArrowRight, ArrowLeft, MapPin } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useTripStore } from '../../src/store/useTripStore';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function OnboardingScreen2() {
  const router = useRouter();
  const { triggerLight } = useHapticFeedback();
  const setOnboardingCompleted = useTripStore((state) => state.setOnboardingCompleted);

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

  const handleSkip = async () => {
    triggerLight();
    await setOnboardingCompleted(true);
    router.replace('/(auth)');
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full-screen Background Photography */}
      <Image
        source={require('../../assets/onboarding_2.jpg')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      {/* Cinematic Gradient Scrim */}
      <LinearGradient
        colors={[
          'rgba(15, 23, 42, 0.4)',
          'rgba(15, 23, 42, 0.25)',
          'rgba(15, 23, 42, 0.82)',
          'rgba(15, 23, 42, 0.98)',
        ]}
        locations={[0, 0.32, 0.65, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          {/* Top Header: Step Dots & Skip Button */}
          <View style={styles.topHeader}>
            <View style={styles.dotsContainer}>
              <View style={styles.dot} />
              <View style={[styles.dot, styles.dotActive]} />
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

          {/* Center Frosted Glass Preview Card */}
          <View style={styles.visualContainer}>
            <View style={styles.previewCard}>
              {/* Card Header */}
              <View style={styles.previewHeader}>
                <View style={styles.liveBeaconDot} />
                <Text style={styles.previewTitle}>Find My People • Live Map</Text>
              </View>

              {/* Simulated Live Distance Cards */}
              <View style={styles.personItem}>
                <View style={[styles.miniAvatar, { backgroundColor: '#2563EB' }]}>
                  <Text style={styles.avatarTxt}>YOU</Text>
                </View>
                <View style={styles.personInfo}>
                  <Text style={styles.personName}>Your Location</Text>
                  <Text style={styles.personSub}>Central Viewpoint • High accuracy</Text>
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
                  <Navigation size={11} color="#38BDF8" style={{ marginRight: 3 }} />
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
                  <Navigation size={11} color="#38BDF8" style={{ marginRight: 3 }} />
                  <Text style={styles.distTxt}>146 m</Text>
                </View>
              </View>

              {/* Instant Compass Footer Pill */}
              <View style={styles.compassBanner}>
                <Compass size={14} color="#38BDF8" style={{ marginRight: 6 }} />
                <Text style={styles.compassBannerText}>Instant "I'm Lost" compass navigation</Text>
              </View>
            </View>
          </View>

          {/* Bottom Text & Actions */}
          <View style={styles.bottomSection}>
            <View style={styles.badgePill}>
              <MapPin size={12} color="#38BDF8" style={{ marginRight: 6 }} />
              <Text style={styles.badgeText}>REAL-TIME RADAR & COMPASS</Text>
            </View>

            <Text style={styles.title}>Find Your People Fast</Text>
            <Text style={styles.description}>
              See where your crew is in real-time, locate the nearest person, or use one-tap compass navigation when you can't find your group.
            </Text>

            {/* Action Buttons: Next + Back */}
            <View style={styles.actionSection}>
              <PrimaryButton
                title="Next"
                onPress={handleNext}
                icon={ArrowRight}
                size="lg"
                style={styles.nextBtn}
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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
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
    justifyContent: 'center',
    marginVertical: 12,
  },
  previewCard: {
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.76)',
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    ...SHADOWS.lg,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  liveBeaconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  previewTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  miniAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarTxt: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  personSub: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: '#94A3B8',
  },
  liveStatusPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  liveStatusTxt: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
  },
  distPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  distTxt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  compassBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  compassBannerText: {
    ...TYPOGRAPHY.caption,
    color: '#E0F2FE',
    fontWeight: '600',
    fontSize: 11,
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
  nextBtn: {
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
