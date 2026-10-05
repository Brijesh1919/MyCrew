import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Navigation, Compass, ArrowRight, UserCheck } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';

export default function IntroScreen() {
  const router = useRouter();

  const handleNext = () => {
    router.push('/(onboarding)/privacy');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Step dots */}
        <View style={styles.dotsContainer}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        {/* Feature Visual Preview */}
        <View style={styles.visualContainer}>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={styles.liveDot} />
              <Text style={styles.previewTitle}>Live Group Radar</Text>
            </View>

            {/* Simulated mini person cards */}
            <View style={styles.personItem}>
              <View style={[styles.miniAvatar, { backgroundColor: '#3B82F6' }]}>
                <Text style={styles.avatarTxt}>P</Text>
              </View>
              <View style={styles.personInfo}>
                <Text style={styles.personName}>Priya</Text>
                <Text style={styles.personSub}>82 m away • Live</Text>
              </View>
              <View style={styles.distPill}>
                <Text style={styles.distTxt}>82 m</Text>
              </View>
            </View>

            <View style={styles.personItem}>
              <View style={[styles.miniAvatar, { backgroundColor: '#10B981' }]}>
                <Text style={styles.avatarTxt}>R</Text>
              </View>
              <View style={styles.personInfo}>
                <Text style={styles.personName}>Rahul</Text>
                <Text style={styles.personSub}>146 m away • Live</Text>
              </View>
              <View style={styles.distPill}>
                <Text style={styles.distTxt}>146 m</Text>
              </View>
            </View>

            <View style={[styles.clusterRow]}>
              <View style={styles.clusterPill}>
                <Text style={styles.clusterTxt}>🔵 12 people at Main Stage</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Text Section */}
        <View style={styles.textSection}>
          <Text style={styles.title}>One map. Everyone together.</Text>
          <Text style={styles.description}>
            See your crew, find who's closest, and meet up without endless "where are you?" messages.
          </Text>
        </View>

        {/* Action */}
        <View style={styles.actionSection}>
          <PrimaryButton
            title="Continue"
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
  visualContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  previewCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.md,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
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
    color: COLORS.textPrimary,
    fontSize: 12,
  },
  personItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: 8,
  },
  miniAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTxt: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  personInfo: {
    marginLeft: 10,
    flex: 1,
  },
  personName: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
  },
  personSub: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  distPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  distTxt: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  clusterRow: {
    alignItems: 'center',
    marginTop: 6,
  },
  clusterPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  clusterTxt: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  title: {
    ...TYPOGRAPHY.h1,
    textAlign: 'center',
    marginBottom: 12,
    fontSize: 27,
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
