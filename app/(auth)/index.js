import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  ScrollView,
  Dimensions,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, ArrowRight, Sparkles, Phone, ChevronDown, Check, X, Search } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { GoogleButton } from '../../src/components/GoogleButton';
import { authService } from '../../src/services/authService';
import { useUserStore } from '../../src/store/useUserStore';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.36);

const COUNTRY_CODES = [
  { flag: '🇮🇳', name: 'India', code: '+91' },
  { flag: '🇺🇸', name: 'United States', code: '+1' },
  { flag: '🇬🇧', name: 'United Kingdom', code: '+44' },
  { flag: '🇦🇪', name: 'United Arab Emirates', code: '+971' },
  { flag: '🇦🇺', name: 'Australia', code: '+61' },
  { flag: '🇨🇦', name: 'Canada', code: '+1' },
  { flag: '🇸🇬', name: 'Singapore', code: '+65' },
  { flag: '🇩🇪', name: 'Germany', code: '+49' },
  { flag: '🇫🇷', name: 'France', code: '+33' },
  { flag: '🇯🇵', name: 'Japan', code: '+81' },
  { flag: '🇳🇵', name: 'Nepal', code: '+977' },
  { flag: '🇧🇩', name: 'Bangladesh', code: '+880' },
  { flag: '🇵🇰', name: 'Pakistan', code: '+92' },
  { flag: '🇱🇰', name: 'Sri Lanka', code: '+94' },
];

export default function AuthLandingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { triggerLight, triggerWarning } = useHapticFeedback();

  // Phone input states
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]); // Default +91
  const [phoneError, setPhoneError] = useState('');
  const [loading, setLoading] = useState(false);

  // Country Picker Modal
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  const handlePhoneContinue = async () => {
    const rawDigits = phone.replace(/\D/g, '');
    if (!phone.trim()) {
      setPhoneError('Please enter your mobile number');
      triggerWarning();
      return;
    }
    if (rawDigits.length < 8) {
      setPhoneError('Please enter a valid mobile number with at least 8 digits');
      triggerWarning();
      return;
    }

    triggerLight();
    setLoading(true);
    setPhoneError('');

    let formattedNumber = phone.trim();
    if (!formattedNumber.startsWith('+')) {
      let trimmed = rawDigits;
      if (selectedCountry.code === '+91' && trimmed.startsWith('0')) {
        trimmed = trimmed.slice(1);
      }
      formattedNumber = `${selectedCountry.code} ${trimmed}`;
    }

    // Check if user already exists to pre-fill their name
    const checkResult = await authService.checkExistingPhone({
      phone: formattedNumber,
      countryCode: selectedCountry.code,
    });

    setLoading(false);

    // Proceed to Step 2: Name Entry Screen
    router.push({
      pathname: '/(auth)/name',
      params: {
        phone: formattedNumber,
        countryCode: selectedCountry.code,
        initialName: checkResult.name || '',
      },
    });
  };

  const handleGoogleSuccess = () => {
    // When Google sign-in succeeds, proceed to name confirmation
    const user = useUserStore.getState().currentUser;
    const profile = useUserStore.getState().profile;
    const existingName =
      profile?.full_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.name ||
      '';

    router.push({
      pathname: '/(auth)/name',
      params: {
        googleAuth: 'true',
        initialName: existingName,
        phone: profile?.phone || '',
      },
    });
  };

  const filteredCountries = COUNTRY_CODES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.includes(countrySearch)
  );

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
                <Image
                  source={require('../../assets/icon.png')}
                  style={{ width: 22, height: 22, borderRadius: 6, marginRight: 8 }}
                />
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

            {/* Option 1: Continue with Google */}
            <GoogleButton
              onSuccess={handleGoogleSuccess}
              style={styles.googleBtn}
            />

            {/* Clean OR Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with mobile number</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Option 2: Enter Phone Number */}
            <View style={styles.phoneSection}>
              <View style={styles.labelRow}>
                <Text style={styles.phoneLabel}>Mobile Number</Text>
                <Text style={styles.phoneLabelHint}>For SOS calls & crew safety</Text>
              </View>

              <View style={styles.phoneInputRow}>
                {/* Country Code Pill Button */}
                <TouchableOpacity
                  style={styles.countryBtn}
                  onPress={() => {
                    triggerLight();
                    setCountrySearch('');
                    setShowCountryModal(true);
                  }}
                  activeOpacity={0.75}
                  accessibilityLabel="Select country code"
                >
                  <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                  <Text style={styles.countryCodeText}>{selectedCountry.code}</Text>
                  <ChevronDown size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>

                {/* Number Input */}
                <View style={[styles.phoneInputBox, phoneError && styles.inputError]}>
                  <Phone size={16} color={COLORS.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="98765 43210"
                    placeholderTextColor={COLORS.textMuted}
                    value={phone}
                    onChangeText={(val) => {
                      setPhone(val);
                      if (phoneError) setPhoneError('');
                    }}
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                </View>
              </View>
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}

              {/* Continue Button */}
              <PrimaryButton
                title="Continue"
                onPress={handlePhoneContinue}
                loading={loading}
                icon={ArrowRight}
                size="lg"
                style={styles.continueBtn}
              />
            </View>

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
      </KeyboardAvoidingView>

      {/* Country Code Picker Modal */}
      <Modal
        visible={showCountryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country Code</Text>
              <TouchableOpacity
                onPress={() => setShowCountryModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchBox}>
              <Search size={16} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search country or code..."
                placeholderTextColor={COLORS.textMuted}
                value={countrySearch}
                onChangeText={setCountrySearch}
                autoCorrect={false}
              />
            </View>

            {/* Country List */}
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => `${item.name}-${item.code}`}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = selectedCountry.name === item.name && selectedCountry.code === item.code;
                return (
                  <TouchableOpacity
                    style={[styles.countryItem, isSelected && styles.countryItemSelected]}
                    onPress={() => {
                      triggerLight();
                      setSelectedCountry(item);
                      setShowCountryModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.itemFlag}>{item.flag}</Text>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemCode}>{item.code}</Text>
                    {isSelected && <Check size={18} color={COLORS.primary} style={{ marginLeft: 8 }} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
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
    height: Math.max(HERO_HEIGHT, 250),
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
    paddingTop: 26,
    paddingBottom: 24,
    ...SHADOWS.lg,
  },
  titleSection: {
    marginBottom: 18,
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
    marginBottom: 6,
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
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  phoneSection: {
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  phoneLabel: {
    ...TYPOGRAPHY.badge,
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '700',
    textTransform: 'none',
  },
  phoneLabelHint: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.md,
    height: 48,
    paddingHorizontal: 10,
    gap: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  countryFlag: {
    fontSize: 18,
  },
  countryCodeText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  phoneInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'transparent',
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
  errorText: {
    fontSize: 12,
    color: COLORS.danger,
    marginBottom: 6,
    fontWeight: '500',
  },
  continueBtn: {
    backgroundColor: '#2563EB',
    borderRadius: RADIUS.xl,
    marginTop: 6,
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 14,
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
    marginTop: 12,
    paddingHorizontal: 16,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 17,
    color: COLORS.textPrimary,
  },
  modalCloseBtn: {
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 42,
    marginVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
  },
  countryItemSelected: {
    backgroundColor: '#EFF6FF',
  },
  itemFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  itemCode: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
});
