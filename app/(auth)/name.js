import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  User,
  Phone,
  ArrowRight,
  ChevronLeft,
  ShieldCheck,
  Sparkles,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { authService } from '../../src/services/authService';
import { useUserStore } from '../../src/store/useUserStore';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function NameEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { triggerLight, triggerSuccess, triggerWarning } = useHapticFeedback();
  const setSession = useUserStore((state) => state.setSession);

  // Read parameters passed from Screen 1
  const phone = params.phone ? String(params.phone) : '';
  const countryCode = params.countryCode ? String(params.countryCode) : '+91';
  const initialName = params.initialName ? String(params.initialName) : '';
  const isGoogle = params.googleAuth === 'true';

  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    triggerLight();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)');
    }
  };

  const handleComplete = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Please enter your full name');
      triggerWarning();
      return;
    }

    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      triggerWarning();
      return;
    }

    triggerLight();
    setLoading(true);
    setError('');

    try {
      if (isGoogle) {
        // User already has an authenticated Google session
        const currentUser = useUserStore.getState().currentUser;
        if (currentUser?.id) {
          await authService.upsertProfile(currentUser.id, {
            full_name: trimmedName,
          });
          const updatedProfile = await authService.getProfile(currentUser.id);
          const currentSession = useUserStore.getState().session;
          setSession(currentSession, currentUser, updatedProfile);
        }
        triggerSuccess();
        router.replace('/(tabs)/home');
        return;
      }

      // Phone authentication: Login / create account with name + phone
      const result = await authService.signInWithPhone({
        fullName: trimmedName,
        phone: phone,
        countryCode: countryCode,
      });

      if (!result.success) {
        triggerWarning();
        setError(result.error || 'Failed to complete sign in. Please try again.');
        setLoading(false);
        return;
      }

      // Set user session in store
      if (result.session && result.user) {
        setSession(result.session, result.user, result.profile);
      }

      triggerSuccess();
      router.replace('/(tabs)/home');
    } catch (err) {
      console.warn('NameEntryScreen error:', err);
      triggerWarning();
      setError('Something went wrong. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header Navigation */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.stepBadge}>
          <Sparkles size={12} color="#0284C7" style={{ marginRight: 5 }} />
          <Text style={styles.stepBadgeText}>STEP 2 OF 2</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Main Title & Subtitle */}
          <View style={styles.titleSection}>
            <Text style={styles.headline}>What's your name?</Text>
            <Text style={styles.subheadline}>
              How your crew members will recognize you on the live radar, during SOS alerts, and in group calls.
            </Text>
          </View>

          {/* Connected Identity Confirmation Card */}
          <View style={styles.identityCard}>
            <View style={styles.identityLeft}>
              <View style={styles.identityIconBubble}>
                {isGoogle ? (
                  <Sparkles size={18} color="#2563EB" />
                ) : (
                  <Phone size={18} color="#10B981" />
                )}
              </View>
              <View style={styles.identityInfo}>
                <Text style={styles.identityLabel}>
                  {isGoogle ? 'Connected with Google' : 'Mobile Number'}
                </Text>
                <Text style={styles.identityValue}>
                  {isGoogle ? 'Google Account' : phone || 'Verified Mobile'}
                </Text>
              </View>
            </View>

            {!isGoogle && (
              <TouchableOpacity
                onPress={handleBack}
                style={styles.changeBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.changeBtnText}>Change</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Name Input Box */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>YOUR FULL NAME</Text>

            <View style={[styles.inputContainer, error && styles.inputError]}>
              <User size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Alex Sharma"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (error) setError('');
                }}
                autoFocus={true}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleComplete}
                maxLength={40}
              />
              {name.length > 0 && (
                <TouchableOpacity
                  onPress={() => setName('')}
                  style={styles.clearBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {/* Privacy & Safety Note */}
          <View style={styles.trustBanner}>
            <ShieldCheck size={16} color="#0284C7" style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={styles.trustBannerText}>
              Your name is only visible to active crew members inside trips you create or join. Trips expire automatically when finished.
            </Text>
          </View>

          {/* Spacer */}
          <View style={{ flex: 1, minHeight: 28 }} />

          {/* Primary Action Button */}
          <View style={styles.bottomActionSection}>
            <PrimaryButton
              title="Join MyCrew"
              onPress={handleComplete}
              loading={loading}
              icon={ArrowRight}
              size="lg"
              style={styles.completeBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
  },
  titleSection: {
    marginBottom: 24,
  },
  headline: {
    ...TYPOGRAPHY.h1,
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subheadline: {
    ...TYPOGRAPHY.bodySecondary,
    fontSize: 14,
    lineHeight: 22,
    color: '#64748B',
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  identityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  identityIconBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  identityInfo: {
    flex: 1,
  },
  identityLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  identityValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  changeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  changeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    ...TYPOGRAPHY.badge,
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 52,
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
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  clearBtn: {
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 6,
    fontWeight: '500',
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  trustBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#0369A1',
    fontWeight: '500',
  },
  bottomActionSection: {
    marginTop: 'auto',
  },
  completeBtn: {
    backgroundColor: '#2563EB',
    borderRadius: RADIUS.xl,
  },
});
