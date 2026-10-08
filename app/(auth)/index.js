import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Shield, ArrowRight, Sparkles } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { GoogleButton } from '../../src/components/GoogleButton';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.38);

export default function AuthLandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { triggerLight } = useHapticFeedback();

  const handleCreateAccount = () => {
    triggerLight();
    router.push('/(auth)/signup');
  };

  const handleLogIn = () => {
    triggerLight();
    router.push('/(auth)/login');
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Hero Photography with Gradient Scrim */}
        <View style={styles.heroSection}>
          <Image
            source={require('../../assets/auth_hero.jpg')}
            style={styles.heroImage}
            resizeMode="cover"
          />

          {/* Top subtle scrim for status bar clarity */}
          <LinearGradient
            colors={['rgba(15, 23, 42, 0.65)', 'transparent']}
            style={styles.heroTopScrim}
            pointerEvents="none"
          />

          {/* Bottom gradient fade into the card */}
          <LinearGradient
            colors={['transparent', 'rgba(15, 23, 42, 0.35)', 'rgba(15, 23, 42, 0.75)']}
            style={styles.heroBottomScrim}
            pointerEvents="none"
          />

          {/* Floating Brand Emblem & Badge */}
          <View
            style={[
              styles.heroBadgeSafe,
              { paddingTop: Math.max(insets.top, 16) },
            ]}
          >
            <View style={styles.brandHeroBadge}>
              <View style={styles.brandIconCircle}>
                <Users size={16} color="#38BDF8" strokeWidth={2.4} />
              </View>
              <Text style={styles.brandHeroText}>MYCREW</Text>
            </View>

            <View style={styles.taglineChip}>
              <Sparkles size={11} color="#38BDF8" style={{ marginRight: 5 }} />
              <Text style={styles.taglineChipText}>GROUP LIVE COORDINATION</Text>
            </View>
          </View>
        </View>

        {/* Elevated Bottom Action Card */}
        <View style={styles.cardSection}>
          {/* Card Header Typography */}
          <View style={styles.titleSection}>
            <Text style={styles.headline}>Welcome to MyCrew</Text>
            <Text style={styles.subheadline}>
              Find your people. Stay together. Leave the trip behind when it's over.
            </Text>
          </View>

          {/* Continue with Google */}
          <GoogleButton
            onSuccess={() => router.replace('/(tabs)/home')}
            style={styles.googleBtn}
          />

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with email</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Primary CTA: Create Account */}
          <PrimaryButton
            title="Create Account"
            onPress={handleCreateAccount}
            icon={ArrowRight}
            size="lg"
            style={styles.createBtn}
          />

          {/* Secondary CTA: Log In */}
          <SecondaryButton
            title="Log In"
            onPress={handleLogIn}
            size="lg"
            variant="outline"
            style={styles.loginBtn}
          />

          {/* Privacy Guarantee Banner */}
          <View style={styles.privacyBanner}>
            <Shield size={14} color="#0284C7" style={{ marginRight: 7 }} />
            <Text style={styles.privacyText}>
              Temporary by design. Your crew trip ends when the trip ends.
            </Text>
          </View>

          {/* Legal / Terms */}
          <Text style={styles.legalText}>
            By continuing, you agree to MyCrew's Terms & Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#0F172A',
  },
  heroSection: {
    height: Math.max(HERO_HEIGHT, 260),
    width: '100%',
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  heroTopScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    zIndex: 1,
  },
  heroBottomScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },
  heroBadgeSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    justifyContent: 'space-between',
    paddingBottom: 32,
    zIndex: 10,
    elevation: 10,
  },
  brandHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  brandIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  brandHeroText: {
    ...TYPOGRAPHY.badge,
    fontSize: 12,
    color: '#F8FAFC',
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  taglineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  taglineChipText: {
    ...TYPOGRAPHY.badge,
    fontSize: 10,
    color: '#38BDF8',
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    ...SHADOWS.lg,
  },
  titleSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headline: {
    ...TYPOGRAPHY.h1,
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subheadline: {
    ...TYPOGRAPHY.bodySecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#64748B',
    maxWidth: 320,
  },
  googleBtn: {
    marginBottom: 14,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  createBtn: {
    backgroundColor: '#2563EB',
    borderRadius: RADIUS.xl,
    marginBottom: 12,
  },
  loginBtn: {
    borderRadius: RADIUS.xl,
    borderColor: '#CBD5E1',
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  privacyText: {
    fontSize: 12,
    color: '#0369A1',
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center',
  },
  legalText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
    lineHeight: 16,
  },
});

