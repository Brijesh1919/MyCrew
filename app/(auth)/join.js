import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  QrCode,
  KeyRound,
  MapPin,
  Users,
  Shield,
  Check,
  ArrowRight,
  Clock,
  User,
  ShieldCheck,
  Camera,
  RefreshCw,
} from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { AppHeader } from '../../src/components/AppHeader';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { useTripStore } from '../../src/store/useTripStore';
import { useUserStore } from '../../src/store/useUserStore';
import { tripService } from '../../src/services/tripService';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

const BARCODE_SCANNER_SETTINGS = {
  barcodeTypes: ['qr'],
};

export default function JoinTripScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { triggerSuccess, triggerWarning, triggerLight } = useHapticFeedback();
  const joinTrip = useTripStore((state) => state.joinTrip);
  const setOnboardingCompleted = useTripStore((state) => state.setOnboardingCompleted);
  const setUserName = useUserStore((state) => state.setUserName);
  const currentUser = useUserStore((state) => state.currentUser);

  // Steps:
  // 1: Code / QR input
  // 2: Trip Confirmation Preview
  // 3: Name & Permission Confirmation
  const [step, setStep] = useState(1);
  const [tripCode, setTripCode] = useState(
    params.code ? String(params.code).replace(/[^A-Za-z0-9]/g, '').toUpperCase() : ''
  );
  const [tripPreview, setTripPreview] = useState(null);
  const [name, setName] = useState(currentUser?.name || 'You');
  const [scanMode, setScanMode] = useState(false);
  const [error, setError] = useState('');

  const [isVerifying, setIsVerifying] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isScanningActive, setIsScanningActive] = useState(true);

  // Proactively handle deep linking param (e.g. mycrew://join?code=K7N9XP)
  useEffect(() => {
    if (params.code) {
      const code = String(params.code).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      if (code) {
        setTripCode(code);
        handleVerifyCode(code);
      }
    }
  }, [params.code]);

  const handleToggleScanMode = async (enableScan) => {
    setScanMode(enableScan);
    setError('');
    if (enableScan) {
      setIsScanningActive(true);
      if (!cameraPermission?.granted && cameraPermission?.canAskAgain !== false) {
        try {
          await requestCameraPermission();
        } catch (e) {}
      }
    }
  };

  const handleGoBack = () => {
    triggerLight();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const extractCodeFromQr = (raw) => {
    if (!raw) return '';
    const str = String(raw).trim();
    // 1. Check for ?code= or &code= from deep link or web URL
    if (str.includes('code=')) {
      const match = str.match(/[?&]code=([a-zA-Z0-9_%-]+)/i);
      if (match && match[1]) {
        return decodeURIComponent(match[1]).replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
      }
    }
    // 2. Check JSON payload
    if (str.startsWith('{') && str.endsWith('}')) {
      try {
        const parsed = JSON.parse(str);
        const cand = parsed.code || parsed.tripCode;
        if (cand) return String(cand).replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6);
      } catch (e) {}
    }
    // 3. Fallback: clean raw alphanumeric characters
    const clean = str.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return clean.slice(0, 6);
  };

  const handleBarcodeScanned = ({ data }) => {
    if (!isScanningActive || isVerifying || !data) return;
    setIsScanningActive(false);
    triggerSuccess();
    const code = extractCodeFromQr(data);
    if (code) {
      setTripCode(code);
      handleVerifyCode(code);
    } else {
      setError('Unrecognized QR code. Please try again.');
      setTimeout(() => setIsScanningActive(true), 2500);
    }
  };

  // Step 1: Validate manual code entry
  const handleVerifyCode = async (codeToVerify) => {
    const rawTarget = codeToVerify || tripCode;
    const targetCode = String(rawTarget).replace(/[^A-Za-z0-9]/g, '').toUpperCase();

    if (!targetCode) {
      setError('Please enter a trip code');
      triggerWarning();
      return;
    }

    setIsVerifying(true);
    setError('');

    const preview = await tripService.getTripPreview(targetCode);

    setIsVerifying(false);

    if (!preview) {
      setError('Trip not found. Check the code with your organizer and try again.');
      triggerWarning();
      setIsScanningActive(true);
      return;
    }

    setTripPreview(preview);
    triggerSuccess();
    setStep(2); // Move to Confirmation Preview
  };

  // Step 2: From Confirmation Preview -> Proceed to Name & Permission
  const handleConfirmPreview = () => {
    triggerSuccess();
    setStep(3);
  };

  // Step 3: Complete join flow
  const handleCompleteJoin = async () => {
    triggerSuccess();
    const cleanName = name.trim() || currentUser?.name || 'Friend';
    if (cleanName) {
      setUserName(cleanName);
    }

    const result = await joinTrip(tripPreview.code, {
      ...currentUser,
      name: cleanName,
    });

    if (result.success) {
      await setOnboardingCompleted(true);
      router.replace('/(tabs)/home');
    } else {
      setError(result.error || 'Failed to join trip');
      setStep(1);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={step === 1 ? 'Join a Crew' : step === 2 ? 'Trip Confirmation' : 'Complete Setup'}
        subtitle={
          step === 1
            ? 'Scan QR or enter code'
            : step === 2
            ? 'Verify crew details'
            : 'Your name & location'
        }
        showBack={true}
        onBack={() => {
          if (step > 1) {
            setStep(step - 1);
            setError('');
          } else {
            handleGoBack();
          }
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================ */}
        {/* STEP 1: ENTER CODE OR SCAN QR                                */}
        {/* ============================================================ */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            {/* Mode Switch Tabs */}
            <View style={styles.tabToggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, !scanMode && styles.toggleBtnActive]}
                onPress={() => handleToggleScanMode(false)}
              >
                <KeyRound size={16} color={!scanMode ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[styles.toggleTxt, !scanMode && styles.toggleTxtActive]}>
                  Enter Code
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, scanMode && styles.toggleBtnActive]}
                onPress={() => handleToggleScanMode(true)}
              >
                <QrCode size={16} color={scanMode ? COLORS.primary : COLORS.textSecondary} />
                <Text style={[styles.toggleTxt, scanMode && styles.toggleTxtActive]}>
                  Scan QR Code
                </Text>
              </TouchableOpacity>
            </View>

            {/* SCAN QR MODE */}
            {scanMode ? (
              <View style={styles.scannerBox}>
                <View style={styles.viewfinder}>
                  {cameraPermission?.granted ? (
                    <>
                      <CameraView
                        style={[StyleSheet.absoluteFillObject, { width: '100%', height: '100%' }]}
                        facing="back"
                        barcodeScannerSettings={BARCODE_SCANNER_SETTINGS}
                        onBarcodeScanned={isScanningActive ? handleBarcodeScanned : undefined}
                      />
                      <View style={styles.viewfinderOverlay} pointerEvents="none">
                        <View style={[styles.finderCorner, styles.finderTL]} />
                        <View style={[styles.finderCorner, styles.finderTR]} />
                        <View style={[styles.finderCorner, styles.finderBL]} />
                        <View style={[styles.finderCorner, styles.finderBR]} />
                        <View style={styles.scanBeam} />
                      </View>
                    </>
                  ) : (
                    <View style={styles.cameraPermissionPrompt}>
                      <Camera size={38} color={COLORS.primary} style={{ marginBottom: 12 }} />
                      <Text style={styles.cameraPermissionTitle}>Camera Access Required</Text>
                      <Text style={styles.cameraPermissionSub}>
                        {cameraPermission && !cameraPermission.canAskAgain
                          ? 'Camera permission is blocked in system settings. Tap below to enable it.'
                          : "Allow camera access to scan your crew's invite QR code directly."}
                      </Text>
                      {cameraPermission && !cameraPermission.canAskAgain ? (
                        <TouchableOpacity
                          style={styles.enableCameraBtn}
                          onPress={() => Linking.openSettings()}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.enableCameraBtnText}>Open Settings</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.enableCameraBtn}
                          onPress={requestCameraPermission}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.enableCameraBtnText}>Enable Camera</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

                {error ? (
                  <View style={[styles.errorBox, { marginTop: 14, width: '100%', maxWidth: 300 }]}>
                    <Text style={styles.errorTitle}>Scan Error</Text>
                    <Text style={styles.errorDesc}>{error}</Text>
                  </View>
                ) : null}

                <Text style={styles.scanPrompt}>
                  {isVerifying
                    ? 'Verifying scanned trip code...'
                    : cameraPermission?.granted
                    ? 'Point your camera directly at the crew QR code'
                    : 'Grant camera access to start scanning'}
                </Text>

                {!isScanningActive && !isVerifying && (
                  <TouchableOpacity
                    style={styles.rescanBtn}
                    onPress={() => {
                      setIsScanningActive(true);
                      setError('');
                    }}
                  >
                    <RefreshCw size={14} color={COLORS.primary} />
                    <Text style={styles.rescanBtnText}>Scan Again</Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.scanHelpSub}>
                  Point your camera at the QR code displayed on the organizer's MyCrew screen to automatically join.
                </Text>
              </View>
            ) : (
              /* ENTER MANUAL TRIP CODE MODE */
              <View style={styles.inputCard}>
                <Text style={styles.inputLabel}>ENTER TRIP CODE</Text>
                <TextInput
                  style={[styles.codeInput, error && styles.codeInputError]}
                  placeholder="e.g. 6-CHARACTER CODE"
                  placeholderTextColor={COLORS.textMuted}
                  value={tripCode}
                  onChangeText={(text) => {
                    const clean = text.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                    setTripCode(clean);
                    setError('');
                  }}
                  autoCapitalize="characters"
                  maxLength={6}
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={() => handleVerifyCode()}
                />

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorTitle}>Trip not found</Text>
                    <Text style={styles.errorDesc}>{error}</Text>
                  </View>
                ) : null}

                <PrimaryButton
                  title="Verify Code"
                  onPress={() => handleVerifyCode()}
                  loading={isVerifying}
                  size="lg"
                  style={styles.actionButton}
                />
              </View>
            )}
          </View>
        )}

        {/* ============================================================ */}
        {/* STEP 2: TRIP CONFIRMATION PREVIEW                            */}
        {/* ============================================================ */}
        {step === 2 && tripPreview && (
          <View style={styles.stepContainer}>
            <View style={styles.previewContainer}>
              <Text style={styles.previewSubheading}>You're about to join:</Text>
              <Text style={styles.previewHeading}>Join {tripPreview.name}?</Text>

              {/* Verified Trip Card */}
              <View style={styles.confirmationCard}>
                <View style={styles.confirmationHeader}>
                  <Text style={styles.confirmationEmoji}>{tripPreview.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.confirmationName}>{tripPreview.name}</Text>
                    <Text style={styles.confirmationLocation}>{tripPreview.locationName}</Text>
                  </View>
                </View>

                <View style={styles.detailDivider} />

                {/* Details Grid */}
                <View style={styles.detailRow}>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>ORGANIZER</Text>
                    <Text style={styles.detailValue}>{tripPreview.organizerName}</Text>
                  </View>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>CONNECTED</Text>
                    <Text style={styles.detailValue}>{tripPreview.memberCount} people</Text>
                  </View>
                </View>

                <View style={[styles.detailRow, { marginTop: 12 }]}>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>TRIP ENDS</Text>
                    <Text style={styles.detailValue}>{tripPreview.endTimeFormatted}</Text>
                  </View>
                  <View style={styles.detailCol}>
                    <Text style={styles.detailLabel}>CODE</Text>
                    <Text style={[styles.detailValue, { color: COLORS.primary, fontWeight: '800' }]}>
                      {tripPreview.code}
                    </Text>
                  </View>
                </View>

                {/* Privacy Badge */}
                <View style={styles.privacyGuaranteeBadge}>
                  <ShieldCheck size={16} color={COLORS.success} />
                  <Text style={styles.privacyGuaranteeText}>
                    Location sharing starts only when you join and stops when the trip ends.
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.previewActions}>
                <PrimaryButton
                  title="Join This Crew"
                  onPress={handleConfirmPreview}
                  size="lg"
                  style={{ marginBottom: 10 }}
                />
                <SecondaryButton
                  title="Not your trip? Go Back"
                  onPress={() => setStep(1)}
                  size="md"
                  variant="subtle"
                />
              </View>
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* STEP 3: NAME & LOCATION PERMISSION                           */}
        {/* ============================================================ */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <View style={styles.avatarPreviewCircle}>
              <Text style={styles.avatarInitial}>{name.charAt(0) || 'F'}</Text>
            </View>

            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>WHAT SHOULD YOUR CREW CALL YOU?</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.textMuted}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError('');
                }}
                autoFocus
              />

              <Text style={styles.helperText}>
                No account or password needed. This name will appear on the crew live map for{' '}
                <Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>
                  {tripPreview?.name}
                </Text>
                .
              </Text>

              <View style={styles.permGuarantees}>
                <View style={styles.guaranteeRow}>
                  <Shield size={16} color={COLORS.success} />
                  <Text style={styles.guaranteeTxt}>
                    Location stops automatically when trip expires
                  </Text>
                </View>
                <View style={styles.guaranteeRow}>
                  <Users size={16} color={COLORS.success} />
                  <Text style={styles.guaranteeTxt}>
                    Only visible to your crew members
                  </Text>
                </View>
              </View>

              <PrimaryButton
                title="Enter Live Crew"
                onPress={handleCompleteJoin}
                size="lg"
                style={{ marginTop: 14 }}
              />
            </View>
          </View>
        )}
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
    padding: 20,
    flexGrow: 1,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  toggleTxt: {
    ...TYPOGRAPHY.bodySecondary,
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 13,
  },
  toggleTxtActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  scannerBox: {
    alignItems: 'center',
  },
  viewfinder: {
    width: 260,
    height: 260,
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.xl,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  scanBeam: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: COLORS.primary,
    ...Platform.select({
      web: {
        boxShadow: '0px 0px 6px rgba(37, 99, 235, 0.8)',
      },
      default: {
        shadowColor: COLORS.primary,
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
    }),
  },
  finderCorner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: COLORS.primary,
  },
  finderTL: {
    top: 14,
    left: 14,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  finderTR: {
    top: 14,
    right: 14,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  finderBL: {
    bottom: 14,
    left: 14,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  finderBR: {
    bottom: 14,
    right: 14,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  viewfinderOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraPermissionPrompt: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPermissionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
    fontSize: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  cameraPermissionSub: {
    ...TYPOGRAPHY.caption,
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  enableCameraBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  enableCameraBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  rescanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  rescanBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  scanPrompt: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 18,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  simScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
  },
  simScanText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6,
  },
  scanHelpSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 20,
    fontSize: 11,
  },
  inputCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.md,
  },
  inputLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontSize: 11,
  },
  codeInput: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 4,
    textAlign: 'center',
    color: COLORS.textPrimary,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginBottom: 14,
  },
  codeInputError: {
    borderColor: COLORS.danger,
    backgroundColor: '#FEF2F2',
  },
  textInput: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 12,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  errorTitle: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  errorDesc: {
    color: '#991B1B',
    fontSize: 12,
    marginTop: 2,
  },
  actionButton: {
    marginTop: 4,
  },
  codeHintBox: {
    marginTop: 18,
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  codeHintLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 9,
    marginBottom: 2,
  },
  codeHintValue: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  previewContainer: {
    width: '100%',
  },
  previewSubheading: {
    ...TYPOGRAPHY.bodySecondary,
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  previewHeading: {
    ...TYPOGRAPHY.h1,
    fontSize: 24,
    marginBottom: 16,
  },
  confirmationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    ...SHADOWS.md,
  },
  confirmationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmationEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  confirmationName: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
  },
  confirmationLocation: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 10,
    marginBottom: 2,
  },
  detailValue: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
  },
  privacyGuaranteeBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: RADIUS.md,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  privacyGuaranteeText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    lineHeight: 16,
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
  previewActions: {
    marginTop: 4,
  },
  avatarPreviewCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    ...SHADOWS.md,
  },
  avatarInitial: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: '800',
  },
  helperText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  permGuarantees: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 14,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  guaranteeTxt: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginLeft: 8,
    fontWeight: '500',
  },
});
