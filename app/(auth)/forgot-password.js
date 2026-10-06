import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { AppHeader } from '../../src/components/AppHeader';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { authService } from '../../src/services/authService';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { triggerSuccess, triggerWarning, triggerLight } = useHapticFeedback();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSendReset = async () => {
    setError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      triggerWarning();
      setError('Please enter a valid email address');
      return;
    }

    triggerLight();
    setLoading(true);

    const result = await authService.resetPassword(email.trim());

    if (!result.success) {
      triggerWarning();
      setError(result.error);
      setLoading(false);
      return;
    }

    triggerSuccess();
    setIsSuccess(true);
    setLoading(false);
  };

  const handleGoBack = () => {
    triggerLight();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title="Reset Password"
        subtitle="Recover your MyCrew account"
        showBack={true}
        onBack={handleGoBack}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {isSuccess ? (
            /* Success confirmation card */
            <View style={styles.card}>
              <View style={styles.successIconBubble}>
                <CheckCircle2 size={36} color={COLORS.success} />
              </View>

              <Text style={styles.successTitle}>Check your email</Text>
              <Text style={styles.successDesc}>
                We've sent a password reset link to{' '}
                <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>{email.trim()}</Text>.
                Please click the link in your email to choose a new password.
              </Text>

              <PrimaryButton
                title="Return to Log In"
                onPress={() => router.replace('/(auth)/login')}
                size="lg"
                style={{ marginTop: 8 }}
              />

              <SecondaryButton
                title="Resend email"
                onPress={handleSendReset}
                size="md"
                variant="subtle"
                style={{ marginTop: 12 }}
              />
            </View>
          ) : (
            /* Reset request form card */
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Reset your password</Text>
              <Text style={styles.cardDesc}>
                Enter your email and we'll send you a secure password reset link.
              </Text>

              {error ? (
                <View style={styles.errorBanner}>
                  <AlertCircle size={16} color={COLORS.danger} style={{ marginRight: 8 }} />
                  <Text style={styles.errorBannerText}>{error}</Text>
                </View>
              ) : null}

              {/* Email field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Account Email</Text>
                <View style={[styles.inputContainer, error && styles.inputError]}>
                  <Mail size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="you@example.com"
                    placeholderTextColor={COLORS.textMuted}
                    value={email}
                    onChangeText={(val) => {
                      setEmail(val);
                      if (error) setError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <PrimaryButton
                title="Send Reset Link"
                onPress={handleSendReset}
                loading={loading}
                icon={ArrowRight}
                size="lg"
                style={{ marginTop: 8 }}
              />

              <View style={styles.bottomLinkRow}>
                <TouchableOpacity onPress={handleGoBack}>
                  <Text style={styles.backToLoginText}>Back to Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  cardTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 22,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  cardDesc: {
    ...TYPOGRAPHY.bodySecondary,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerBg,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBannerText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    ...TYPOGRAPHY.badge,
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'none',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 48,
  },
  inputError: {
    borderColor: COLORS.danger,
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  bottomLinkRow: {
    alignItems: 'center',
    marginTop: 18,
  },
  backToLoginText: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  successIconBubble: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.successBg,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  successTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 22,
    textAlign: 'center',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  successDesc: {
    ...TYPOGRAPHY.bodySecondary,
    fontSize: 14,
    textAlign: 'center',
    color: COLORS.textSecondary,
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
});
