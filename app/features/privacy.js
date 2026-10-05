import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  Clock,
  Users,
  Database,
  Lock,
  EyeOff,
} from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { AppHeader } from '../../src/components/AppHeader';

export default function PrivacyDetailScreen() {
  const privacyPillars = [
    {
      icon: Clock,
      title: 'Only Active During Trips',
      desc: 'Your location is NEVER tracked in the background when no trip is active. When you are not in an active crew session, the app is completely dormant.',
    },
    {
      icon: EyeOff,
      title: 'Automatic Expiration',
      desc: 'When your event or trip ends, location sharing stops automatically. Nobody can ping or view your coordinates after expiration.',
    },
    {
      icon: Users,
      title: 'Who Can See You',
      desc: 'Only friends who entered your unique trip code or scanned your QR code can view your marker on the map. No public discovery.',
    },
    {
      icon: Database,
      title: 'Zero Location History Stored',
      desc: 'MyCrew does not maintain a breadcrumb log or past trip movement history. Coordinates are ephemeral and processed in real-time.',
    },
    {
      icon: Lock,
      title: 'No Permanent Circles',
      desc: 'MyCrew is built for temporary events — not permanent family surveillance or enterprise monitoring.',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader
        title="Your Privacy"
        subtitle="Transparent, friendly, and private by design"
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* HERO BADGE */}
        <View style={styles.heroBox}>
          <View style={styles.heroIconCircle}>
            <ShieldCheck size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.heroTitle}>Built For Friends, Not Surveillance</Text>
          <Text style={styles.heroDesc}>
            "We're together temporarily. Help us stay together." Here is our promise to you.
          </Text>
        </View>

        {/* PILLARS */}
        {privacyPillars.map((pillar, i) => {
          const Icon = pillar.icon;
          return (
            <View key={i} style={styles.pillarCard}>
              <View style={styles.pillarIconBubble}>
                <Icon size={20} color={COLORS.primary} />
              </View>
              <View style={styles.pillarInfo}>
                <Text style={styles.pillarTitle}>{pillar.title}</Text>
                <Text style={styles.pillarDesc}>{pillar.desc}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 6,
  },
  heroDesc: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  pillarIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  pillarInfo: {
    flex: 1,
  },
  pillarTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    marginBottom: 4,
  },
  pillarDesc: {
    ...TYPOGRAPHY.bodySecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});
