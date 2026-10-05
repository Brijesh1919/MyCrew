import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  QrCode,
  Share2,
  Copy,
  Clock,
  Users,
  Shield,
  Settings,
  AlertCircle,
  Plus,
  RefreshCw,
  PowerOff,
  Compass,
} from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { BottomSheet } from '../../src/components/BottomSheet';
import { useTripStore } from '../../src/store/useTripStore';
import { useCrewStore } from '../../src/store/useCrewStore';
import { formatRemainingTime } from '../../src/utils/freshness';
import { formatTripTime } from '../../src/utils/helpers';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function TripScreen() {
  const router = useRouter();
  const { triggerSuccess, triggerWarning } = useHapticFeedback();

  // Stores
  const activeTrip = useTripStore((state) => state.activeTrip);
  const userRole = useTripStore((state) => state.userRole);
  const endTrip = useTripStore((state) => state.endTrip);
  const leaveTrip = useTripStore((state) => state.leaveTrip);
  const resetDemoTrip = useTripStore((state) => state.resetDemoTrip);
  const members = useCrewStore((state) => state.members);

  const [showQRModal, setShowQRModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState({ visible: false, type: null });
  const [copied, setCopied] = useState(false);

  // NO ACTIVE TRIP VIEW (Clean empty state for unjoined users)
  if (!activeTrip) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Compass size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Active Trip</Text>
          <Text style={styles.emptyDesc}>
            You're not currently part of a crew. Join a trip with your friends or create your own to get started.
          </Text>

          <View style={styles.emptyActions}>
            <PrimaryButton
              title="Join a Crew"
              onPress={() => router.push('/(auth)/join')}
              size="lg"
              style={{ marginBottom: 12 }}
            />
            <SecondaryButton
              title="Create a New Trip"
              onPress={() => router.push('/(auth)/create-trip')}
              size="lg"
              variant="outline"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const isExpired = activeTrip?.isExpired;
  const timeLeft = formatRemainingTime(activeTrip?.endTime);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join our temporary crew for ${activeTrip.name} on MyCrew!\nTrip Code: ${activeTrip.code}\nJoin here: https://mycrew.app/join?code=${activeTrip.code}`,
      });
    } catch (e) {
      // Fallback
    }
  };

  const handleCopyCode = () => {
    triggerSuccess();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // TRIP ENDED / EXPIRED SCREEN VIEW
  if (isExpired) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.expiredContainer}>
          <View style={styles.expiredIconBox}>
            <PowerOff size={44} color={COLORS.danger} />
          </View>
          <Text style={styles.expiredTitle}>Trip Ended</Text>
          <Text style={styles.expiredDesc}>
            Your location sharing has automatically stopped. Nobody in your crew can see your location anymore.
          </Text>

          <View style={styles.expiredSummaryCard}>
            <Text style={styles.summaryLabel}>TRIP SUMMARY</Text>
            <Text style={styles.summaryName}>{activeTrip.name}</Text>
            <Text style={styles.summaryStats}>
              {members.length} friends connected • {activeTrip.locationName}
            </Text>
          </View>

          <View style={styles.expiredActions}>
            <PrimaryButton
              title="Create New Trip"
              onPress={() => router.push('/(auth)/create-trip')}
              size="lg"
              style={{ marginBottom: 10 }}
            />
            <SecondaryButton
              title="Return to Home"
              onPress={() => {
                leaveTrip();
                router.replace('/(tabs)/home');
              }}
              icon={RefreshCw}
              size="md"
              variant="subtle"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Active Crew</Text>
            <Text style={styles.subtitle}>Temporary trip coordination</Text>
          </View>

          <TouchableOpacity
            style={styles.newTripBtn}
            onPress={() => router.push('/(auth)/create-trip')}
          >
            <Plus size={16} color={COLORS.primary} />
            <Text style={styles.newTripText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* HERO TRIP DETAILS CARD */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadgeRow}>
              <Text style={styles.heroEmoji}>{activeTrip?.emoji || '🎪'}</Text>
              <View style={styles.heroTypeBadge}>
                <Text style={styles.heroTypeText}>
                  {activeTrip?.type?.toUpperCase() || 'EVENT'}
                </Text>
              </View>
            </View>
            <View style={styles.activePill}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Active Sharing</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>{activeTrip?.name}</Text>

          <View style={styles.heroConnectedRow}>
            <Users size={16} color={COLORS.primary} />
            <Text style={styles.heroConnectedText}>
              {members.length} / {activeTrip?.totalCapacity || 20} connected
            </Text>
          </View>

          {/* Time Breakdown Cards */}
          <View style={styles.timeRow}>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>STARTED</Text>
              <Text style={styles.timeValue}>{formatTripTime(activeTrip?.startTime)}</Text>
            </View>
            <View style={styles.timeBoxDivider} />
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>ENDS</Text>
              <Text style={styles.timeValue}>{formatTripTime(activeTrip?.endTime)}</Text>
            </View>
          </View>

          {/* Trip Code Row */}
          <View style={styles.codeRow}>
            <View>
              <Text style={styles.codeLabel}>TRIP CODE</Text>
              <Text style={styles.codeDisplay}>{activeTrip?.code}</Text>
            </View>
            <TouchableOpacity
              style={styles.copyPill}
              onPress={handleCopyCode}
              activeOpacity={0.7}
            >
              <Copy size={14} color={COLORS.primary} />
              <Text style={styles.copyPillText}>{copied ? 'Copied!' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Buttons: QR Code & Invite */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={() => setShowQRModal(true)}
            >
              <QrCode size={18} color={COLORS.primary} />
              <Text style={styles.actionBtnText}>Show QR Code</Text>
            </TouchableOpacity>
            <View style={{ width: 10 }} />
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={handleShare}
            >
              <Share2 size={18} color={COLORS.white} />
              <Text style={styles.actionBtnPrimaryText}>Invite People</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ORGANIZER & PRIVACY CARD */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardLabel}>HOST & PRIVACY</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Shield size={18} color={COLORS.primary} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Organizer</Text>
              <Text style={styles.infoSub}>
                {activeTrip?.organizer?.name || 'Rahul'} ({activeTrip?.organizer?.phone || '+91 98200 12345'})
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Clock size={18} color={COLORS.primary} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Auto-Expiration</Text>
              <Text style={styles.infoSub}>
                Location tracking automatically self-destructs in {timeLeft}.
              </Text>
            </View>
          </View>
        </View>

        {/* TRIP CONTROLS ACCORDING TO USER ROLE */}
        {userRole === 'organizer' ? (
          <View style={styles.dangerZoneCard}>
            <Text style={styles.dangerCardLabel}>ORGANIZER CONTROLS</Text>
            <Text style={styles.dangerCardDesc}>
              Ending the trip immediately stops all live location updates for every participant.
            </Text>

            <PrimaryButton
              title="End Trip & Stop Sharing"
              onPress={() => setShowConfirmModal({ visible: true, type: 'end' })}
              variant="danger"
              size="md"
            />
          </View>
        ) : (
          <View style={styles.dangerZoneCard}>
            <Text style={styles.dangerCardLabel}>CREW MEMBERSHIP</Text>
            <Text style={styles.dangerCardDesc}>
              Leaving will stop sharing your location and disconnect you from {activeTrip?.name}.
            </Text>

            <PrimaryButton
              title="Leave Crew"
              onPress={() => setShowConfirmModal({ visible: true, type: 'leave' })}
              variant="danger"
              size="md"
            />
          </View>
        )}
      </ScrollView>

      {/* CONFIRMATION MODAL (END TRIP OR LEAVE CREW) */}
      <BottomSheet
        visible={showConfirmModal.visible}
        onClose={() => setShowConfirmModal({ visible: false, type: null })}
        title={showConfirmModal.type === 'end' ? 'END TRIP' : 'LEAVE CREW'}
        subtitle={activeTrip?.name}
      >
        <View style={styles.confirmModalContent}>
          <Text style={styles.confirmModalText}>
            {showConfirmModal.type === 'end'
              ? 'Are you sure you want to end this trip? This will stop location sharing for all connected members immediately.'
              : 'Are you sure you want to leave this crew? Your location will no longer be visible on the group map.'}
          </Text>
          <PrimaryButton
            title={showConfirmModal.type === 'end' ? 'Yes, End Trip' : 'Yes, Leave Crew'}
            onPress={async () => {
              if (showConfirmModal.type === 'end') {
                await endTrip();
              } else {
                await leaveTrip();
              }
              setShowConfirmModal({ visible: false, type: null });
            }}
            variant="danger"
            size="lg"
            style={{ marginBottom: 10 }}
          />
          <SecondaryButton
            title="Cancel"
            onPress={() => setShowConfirmModal({ visible: false, type: null })}
            size="md"
            variant="subtle"
          />
        </View>
      </BottomSheet>

      {/* QR CODE MODAL */}
      <BottomSheet
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        title="JOIN CREW"
        subtitle={activeTrip?.name}
      >
        <View style={styles.qrContainer}>
          <View style={styles.qrBox}>
            <QrCode size={160} color="#0F172A" />
          </View>
          <Text style={styles.qrCodeText}>{activeTrip?.code}</Text>
          <Text style={styles.qrHelpText}>
            Ask your friend to scan this QR code using MyCrew or enter the code manually.
          </Text>
          <SecondaryButton
            title="Share Invite Link"
            onPress={handleShare}
            icon={Share2}
            size="md"
            variant="subtle"
            style={{ marginTop: 14 }}
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
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 24,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontSize: 13,
  },
  newTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  newTripText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...SHADOWS.md,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 22,
    marginRight: 6,
  },
  heroTypeBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroTypeText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 5,
  },
  activeText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '700',
  },
  heroTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 22,
    marginBottom: 8,
  },
  heroConnectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroConnectedText: {
    ...TYPOGRAPHY.bodySecondary,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 14,
  },
  timeRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 14,
  },
  timeBox: {
    flex: 1,
  },
  timeBoxDivider: {
    width: 1,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 12,
  },
  timeLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 10,
    marginBottom: 2,
  },
  timeValue: {
    ...TYPOGRAPHY.h3,
    fontSize: 13,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    marginBottom: 16,
  },
  codeLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  codeDisplay: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 3,
    color: COLORS.primary,
    marginTop: 2,
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  copyPillText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 4,
  },
  btnRow: {
    flexDirection: 'row',
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  actionBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  actionBtnPrimaryText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  infoCardLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
  },
  infoSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontSize: 12,
  },
  dangerZoneCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    ...SHADOWS.sm,
  },
  dangerCardLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.danger,
    fontSize: 11,
    marginBottom: 4,
  },
  dangerCardDesc: {
    ...TYPOGRAPHY.bodySecondary,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 14,
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  qrBox: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.md,
  },
  qrCodeText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
    color: COLORS.primary,
    marginTop: 16,
  },
  qrHelpText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
    fontSize: 13,
    lineHeight: 18,
  },
  expiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  expiredIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  expiredTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 26,
    marginBottom: 10,
    textAlign: 'center',
  },
  expiredDesc: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 15,
    marginBottom: 24,
  },
  expiredSummaryCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    ...SHADOWS.sm,
  },
  summaryLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 10,
    marginBottom: 4,
  },
  summaryName: {
    ...TYPOGRAPHY.h2,
    fontSize: 17,
  },
  summaryStats: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  expiredActions: {
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  emptyTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textSecondary,
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  emptyActions: {
    width: '100%',
    maxWidth: 340,
  },
  confirmModalContent: {
    paddingVertical: 8,
  },
  confirmModalText: {
    ...TYPOGRAPHY.body,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
});
