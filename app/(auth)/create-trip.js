import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  Calendar,
  Clock,
  Check,
  Share2,
  Copy,
  ArrowRight,
  Shield,
  Users,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { TRIP_TYPES } from '../../src/constants/tripTypes';
import { AppHeader } from '../../src/components/AppHeader';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { BottomSheet } from '../../src/components/BottomSheet';
import { QRCodeView } from '../../src/components/QRCodeView';
import { useTripStore } from '../../src/store/useTripStore';
import { useUserStore } from '../../src/store/useUserStore';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function CreateTripScreen() {
  const router = useRouter();
  const { triggerSuccess, triggerLight, triggerWarning } = useHapticFeedback();
  const createTrip = useTripStore((state) => state.createTrip);
  const activeTrip = useTripStore((state) => state.activeTrip);
  const userRole = useTripStore((state) => state.userRole);
  const endTrip = useTripStore((state) => state.endTrip);
  const leaveTrip = useTripStore((state) => state.leaveTrip);
  const setOnboardingCompleted = useTripStore((state) => state.setOnboardingCompleted);
  const currentUser = useUserStore((state) => state.currentUser);

  // Active trip conflict detection
  const hasActiveTrip = Boolean(activeTrip && !activeTrip.isExpired);
  const [showActiveTripWarning, setShowActiveTripWarning] = useState(hasActiveTrip);
  const [hasConfirmedOverwrite, setHasConfirmedOverwrite] = useState(false);

  // Form State
  const [step, setStep] = useState(1); // 1: Name, 2: Type, 3: Duration, 4: Visibility, 5: Success
  const [tripName, setTripName] = useState('');
  const [selectedType, setSelectedType] = useState('event');
  const [durationHours, setDurationHours] = useState('6');
  const [visibility, setVisibility] = useState('everyone');
  const [createdTrip, setCreatedTrip] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Go back handler for header & buttons
  const handleGoBack = () => {
    triggerLight();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  };

  // Step progression
  const handleNext = () => {
    triggerLight();
    if (step === 1 && !tripName.trim()) return;
    setStep(step + 1);
  };

  const handleCreate = async () => {
    // If user has an active trip and hasn't confirmed replacing it yet, show warning modal
    if (activeTrip && !activeTrip.isExpired && !hasConfirmedOverwrite) {
      triggerWarning();
      setShowActiveTripWarning(true);
      return;
    }

    setCreateError('');
    setIsCreating(true);

    // Cleanly leave or end the current trip before initializing the new one
    if (activeTrip && !activeTrip.isExpired) {
      if (userRole === 'organizer') {
        await endTrip(currentUser?.id);
      } else {
        await leaveTrip(currentUser?.id);
      }
    }

    const hours = parseInt(durationHours, 10) || 6;
    const now = new Date();
    const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const res = await createTrip(
      {
        name: tripName.trim(),
        type: selectedType,
        startTime: now.toISOString(),
        endTime: endTime.toISOString(),
        visibility,
        organizerName: currentUser?.name || 'You',
      },
      currentUser?.id
    );

    setIsCreating(false);

    if (res.success && res.trip) {
      triggerSuccess();
      setCreatedTrip(res.trip);
      await setOnboardingCompleted(true);
      setStep(5);
    } else {
      triggerWarning();
      setCreateError(
        res.error || "Couldn't create your trip. Check your connection and try again."
      );
    }
  };

  const handleShare = async () => {
    if (!createdTrip) return;
    const tripCode = (createdTrip.code || createdTrip.trip_code || '').trim();
    const tripName = createdTrip.name || 'my crew';
    try {
      await Share.share({
        message: `Join my crew for ${tripName} on MyCrew!\n\nTrip Code: ${tripCode}\n\nOpen directly in app: mycrew://join?code=${tripCode}\n\n(Enter this code in MyCrew or tap the link to join instantly!)`,
        title: `Join ${tripName} on MyCrew`,
      });
    } catch (e) {
      // Fallback
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        title={step === 5 ? 'Trip Created!' : 'Create Your Trip'}
        subtitle={step === 5 ? 'Share code with friends' : `Step ${step} of 4`}
        showBack={step < 5}
        onBack={() => {
          if (step > 1) {
            setStep(step - 1);
          } else {
            handleGoBack();
          }
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* STEP 1: TRIP NAME */}
        {step === 1 && (
          <View style={styles.card}>
            {hasActiveTrip && (
              <View style={styles.activeTripNotice}>
                <AlertTriangle size={16} color={COLORS.warning} />
                <Text style={styles.activeTripNoticeText}>
                  Notice: Creating this trip will replace your active crew "{activeTrip?.name}".
                </Text>
              </View>
            )}

            <Text style={styles.stepTitle}>What's the occasion?</Text>
            <Text style={styles.stepDesc}>
              Give your temporary crew a memorable name.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="e.g. Goa Trip, Sunburn Festival, Rahul's Wedding"
              placeholderTextColor={COLORS.textMuted}
              value={tripName}
              onChangeText={setTripName}
              autoFocus
            />

            <PrimaryButton
              title="Next: Trip Type"
              onPress={handleNext}
              disabled={!tripName.trim()}
              size="lg"
            />

            <SecondaryButton
              title="Cancel & Go Back"
              onPress={handleGoBack}
              size="md"
              variant="subtle"
              style={{ marginTop: 12 }}
            />
          </View>
        )}

        {/* STEP 2: TRIP TYPE */}
        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>Select trip category</Text>
            <Text style={styles.stepDesc}>
              Optimizes tracking accuracy and map icons for your outing.
            </Text>

            <View style={styles.typesGrid}>
              {TRIP_TYPES.map((t) => {
                const isSelected = selectedType === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.typeItem,
                      isSelected && styles.typeItemSelected,
                    ]}
                    onPress={() => setSelectedType(t.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.typeEmoji}>{t.emoji}</Text>
                    <Text
                      style={[
                        styles.typeLabel,
                        isSelected && styles.typeLabelSelected,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <PrimaryButton
              title="Next: Duration"
              onPress={handleNext}
              size="lg"
            />
          </View>
        )}

        {/* STEP 3: DURATION */}
        {step === 3 && (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>How long will you be together?</Text>
            <Text style={styles.stepDesc}>
              MyCrew trips expire automatically so nobody is tracked forever.
            </Text>

            <View style={styles.durationOptions}>
              {['3', '6', '12', '24', '48'].map((hr) => (
                <TouchableOpacity
                  key={hr}
                  style={[
                    styles.durationPill,
                    durationHours === hr && styles.durationPillActive,
                  ]}
                  onPress={() => setDurationHours(hr)}
                >
                  <Text
                    style={[
                      styles.durationTxt,
                      durationHours === hr && styles.durationTxtActive,
                    ]}
                  >
                    {hr} hours
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.autoExpireNotice}>
              <Clock size={16} color={COLORS.primary} />
              <Text style={styles.expireNoticeText}>
                Trip will expire in {durationHours} hours. Location sharing will stop automatically.
              </Text>
            </View>

            <PrimaryButton
              title="Next: Privacy & Visibility"
              onPress={handleNext}
              size="lg"
            />
          </View>
        )}

        {/* STEP 4: VISIBILITY */}
        {step === 4 && (
          <View style={styles.card}>
            <Text style={styles.stepTitle}>Who can see me?</Text>
            <Text style={styles.stepDesc}>
              Choose who can see your live marker inside this trip.
            </Text>

            {[
              {
                id: 'everyone',
                title: 'Everyone in trip',
                desc: 'All friends who join can see each other on the live map',
              },
              {
                id: 'organizer_only',
                title: 'Only organizer',
                desc: 'Only the trip host can view all participant markers',
              },
              {
                id: 'selected',
                title: 'Selected people',
                desc: 'Custom permissions per friend',
              },
            ].map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.visOption,
                  visibility === option.id && styles.visOptionActive,
                ]}
                onPress={() => setVisibility(option.id)}
              >
                <View style={styles.visRadio}>
                  {visibility === option.id && <View style={styles.visRadioInner} />}
                </View>
                <View style={styles.visTextContainer}>
                  <Text style={styles.visTitle}>{option.title}</Text>
                  <Text style={styles.visDesc}>{option.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {createError ? (
              <View style={styles.errorBox}>
                <AlertCircle size={18} color={COLORS.danger} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.errorTitle}>Couldn't create your trip</Text>
                  <Text style={styles.errorSub}>{createError}</Text>
                </View>
                <TouchableOpacity onPress={handleCreate} style={styles.retryBtn}>
                  <Text style={styles.retryBtnText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <PrimaryButton
              title="Create Trip"
              onPress={handleCreate}
              loading={isCreating}
              icon={Sparkles}
              size="lg"
              style={{ marginTop: 12 }}
            />
          </View>
        )}

        {/* STEP 5: SUCCESS / CREATED CODE & QR */}
        {step === 5 && createdTrip && (
          <View style={styles.card}>
            <View style={styles.successIconBubble}>
              <Check size={32} color={COLORS.white} />
            </View>

            <Text style={styles.successHeading}>Your Crew is Ready!</Text>
            <Text style={styles.successSub}>
              Share this code or QR code with friends to join {createdTrip.name}.
            </Text>

            {/* Trip Code Box */}
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>CREW TRIP CODE</Text>
              <Text style={styles.codeDisplay}>{createdTrip.code}</Text>
            </View>

            {/* Dynamic Scannable QR Code */}
            <View style={{ alignItems: 'center', marginVertical: 14 }}>
              <QRCodeView
                value={`mycrew://join?code=${createdTrip.code || createdTrip.trip_code || ''}`}
                size={180}
              />
            </View>

            <View style={styles.actionButtonsRow}>
              <PrimaryButton
                title="Go to Live Map"
                onPress={() => router.replace('/(tabs)/home')}
                size="lg"
                style={{ marginBottom: 10 }}
              />
              <SecondaryButton
                title="Share Invite Link"
                onPress={handleShare}
                icon={Share2}
                size="md"
                variant="subtle"
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* ONGOING TRIP WARNING POPUP */}
      <BottomSheet
        visible={showActiveTripWarning}
        onClose={handleGoBack}
        title="ACTIVE TRIP IN PROGRESS"
        subtitle={activeTrip?.name}
        showClose={true}
      >
        <View style={styles.warningModalContent}>
          <View style={styles.warningIconCircle}>
            <AlertTriangle size={32} color={COLORS.warning} />
          </View>

          <Text style={styles.warningModalTitle}>
            You already have an active trip
          </Text>

          <View style={styles.currentTripBadge}>
            <Text style={styles.currentTripBadgeLabel}>CURRENT ACTIVE CREW</Text>
            <Text style={styles.currentTripBadgeName}>{activeTrip?.name}</Text>
            <Text style={styles.currentTripBadgeRole}>
              Your Role: {userRole === 'organizer' ? 'Trip Organizer / Host' : 'Crew Member'}
            </Text>
          </View>

          <Text style={styles.warningModalDesc}>
            {userRole === 'organizer'
              ? `Creating a new trip will automatically end "${activeTrip?.name}" and stop live location sharing for all participants.`
              : `Creating a new trip will remove you from "${activeTrip?.name}" and stop sharing your live location with that crew.`}
          </Text>

          <PrimaryButton
            title={`Keep "${activeTrip?.name}" & Go Back`}
            onPress={handleGoBack}
            size="lg"
            style={{ marginBottom: 12 }}
          />

          <SecondaryButton
            title={userRole === 'organizer' ? 'End Current Trip & Create New' : 'Leave Crew & Create New'}
            onPress={() => {
              triggerWarning();
              setShowActiveTripWarning(false);
              setHasConfirmedOverwrite(true);
            }}
            size="md"
            variant="outline"
            style={{ borderColor: COLORS.danger }}
            textStyle={{ color: COLORS.danger, fontWeight: '700' }}
          />
        </View>
      </BottomSheet>
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
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.md,
  },
  stepTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 22,
    marginBottom: 6,
  },
  stepDesc: {
    ...TYPOGRAPHY.bodySecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 24,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  typeItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.primary,
  },
  typeEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  typeLabel: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  typeLabelSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  durationPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  durationPillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  durationTxt: {
    fontWeight: '600',
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  durationTxtActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  autoExpireNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 24,
  },
  expireNoticeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    marginLeft: 8,
    flex: 1,
  },
  visOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.surfaceSubtle,
    padding: 14,
    borderRadius: RADIUS.md,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  visOptionActive: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.primary,
  },
  visRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginRight: 12,
  },
  visRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  visTextContainer: {
    flex: 1,
  },
  visTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  visDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  successIconBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 14,
    ...SHADOWS.md,
  },
  successHeading: {
    ...TYPOGRAPHY.h1,
    textAlign: 'center',
    fontSize: 24,
    marginBottom: 6,
  },
  successSub: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  codeContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    marginBottom: 16,
  },
  codeLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontSize: 11,
  },
  codeDisplay: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 6,
    color: COLORS.primary,
  },
  qrCard: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrMock: {
    width: 130,
    height: 130,
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  qrSub: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  actionButtonsRow: {
    marginTop: 6,
  },
  activeTripNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningBg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 8,
  },
  activeTripNoticeText: {
    fontSize: 13,
    color: '#92400E',
    flex: 1,
    lineHeight: 18,
  },
  warningModalContent: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  warningIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.warningBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningModalTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
  currentTripBadge: {
    width: '100%',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  currentTripBadgeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  currentTripBadgeName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 3,
    textAlign: 'center',
  },
  currentTripBadgeRole: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  warningModalDesc: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginTop: 12,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
  },
  errorSub: {
    fontSize: 12,
    color: COLORS.danger,
    marginTop: 1,
  },
  retryBtn: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    marginLeft: 8,
  },
  retryBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
