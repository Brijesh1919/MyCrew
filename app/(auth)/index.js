import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Users, Shield, ArrowRight } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { GoogleButton } from '../../src/components/GoogleButton';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function AuthLandingScreen() {
  const router = useRouter();
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Branding Section */}
        <View style={styles.brandSection}>
          <View style={styles.logoBadge}>
            <Users size={32} color={COLORS.primary} />
          </View>
          <Text style={styles.appName}>MyCrew</Text>
          <Text style={styles.headline}>Welcome to MyCrew</Text>
          <Text style={styles.subheadline}>
            Find your people. Stay together. Leave the trip behind when it's over.
          </Text>
        </View>

        {/* Auth Action Cards */}
        <View style={styles.actionSection}>
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

          {/* Create Account Button */}
          <PrimaryButton
            title="Create Account"
            onPress={handleCreateAccount}
            icon={ArrowRight}
            size="lg"
            style={styles.btnSpacing}
          />

          {/* Log In Button */}
          <SecondaryButton
            title="Log In"
            onPress={handleLogIn}
            size="lg"
            variant="outline"
          />

          {/* Privacy statement */}
          <View style={styles.privacyBanner}>
            <Shield size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
            <Text style={styles.privacyText}>
              Temporary by design. Your crew trip ends when the trip ends.
            </Text>
          </View>

          {/* Legal / Terms */}
          <Text style={styles.legalText}>
            By continuing, you agree to MyCrew's Terms & Privacy Policy.
          </Text>
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
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  brandSection: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 12,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  appName: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    color: COLORS.primary,
    letterSpacing: 1.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  headline: {
    ...TYPOGRAPHY.h1,
    fontSize: 28,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 10,
  },
  subheadline: {
    ...TYPOGRAPHY.bodySecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: COLORS.textSecondary,
    maxWidth: 320,
  },
  actionSection: {
    width: '100%',
    paddingBottom: 10,
  },
  googleBtn: {
    marginBottom: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  btnSpacing: {
    marginBottom: 12,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  privacyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'center',
  },
  legalText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
    lineHeight: 16,
  },
});
