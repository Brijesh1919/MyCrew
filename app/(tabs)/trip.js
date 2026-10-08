// ==========================================================
// MyCrew - Trip Screen
// Real persistent active trip management & trip history
// ==========================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Image,
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
  Plus,
  RefreshCw,
  Compass,
  History,
  Layers,
  ChevronRight,
} from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { BottomSheet } from '../../src/components/BottomSheet';
import { TripHistoryCard } from '../../src/components/TripHistoryCard';
import { HistoricalTripModal } from '../../src/components/HistoricalTripModal';
import { ActiveTripPickerModal } from '../../src/components/ActiveTripPickerModal';
import { useTripStore } from '../../src/store/useTripStore';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useUserStore } from '../../src/store/useUserStore';
import { formatRemainingTime } from '../../src/utils/freshness';
import { formatTripTime } from '../../src/utils/helpers';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function TripScreen() {
  const router = useRouter();
  const { triggerSuccess, triggerLight, triggerWarning } = useHapticFeedback();

  // Stores
  const activeTrip = useTripStore((state) => state.activeTrip);
  const userRole = useTripStore((state) => state.userRole);
  const activeTripsList = useTripStore((state) => state.activeTripsList);
  const tripHistory = useTripStore((state) => state.tripHistory);
  const selectActiveTrip = useTripStore((state) => state.selectActiveTrip);
  const endTrip = useTripStore((state) => state.endTrip);
  const leaveTrip = useTripStore((state) => state.leaveTrip);
  const checkTripExpiration = useTripStore((state) => state.checkTripExpiration);
  const currentUser = useUserStore((state) => state.currentUser);
  const members = useCrewStore((state) => state.members);

  // Local Modal States
  const [showQRModal, setShowQRModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState({ visible: false, type: null });
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [selectedHistoryTrip, setSelectedHistoryTrip] = useState(null);
  const [copied, setCopied] = useState(false);

  // Check expiration on render
  useEffect(() => {
    checkTripExpiration();
  }, [activeTrip?.id]);

  const timeLeft = formatRemainingTime(activeTrip?.endTime || activeTrip?.ends_at);

  const handleShare = async () => {
    if (!activeTrip) return;
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

  const handleConfirmAction = async () => {
    triggerWarning();
    if (showConfirmModal.type === 'end') {
      await endTrip(currentUser?.id);
    } else {
      await leaveTrip(currentUser?.id);
    }
    setShowConfirmModal({ visible: false, type: null });
  };

  // -------------------------------------------------------------
  // VIEW 1: NO ACTIVE TRIP (shows CTA + Trip History if exists)
  // -------------------------------------------------------------
  if (!activeTrip) {
    const hasHistory = tripHistory && tripHistory.length > 0;

    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.emptyScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Empty State Box */}
          <View style={styles.emptyContainer}>
            <Image
              source={require('../../assets/ill_trip_empty.jpg')}
              style={styles.emptyIllustrationImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>
              {hasHistory ? "You're not in a crew right now." : "You're not in a crew yet."}
            </Text>
            <Text style={styles.emptyDesc}>
              Join a trip with your friends or create one to get started.
            </Text>

            <View style={styles.emptyActions}>
              <PrimaryButton
                title="Join a Crew"
                onPress={() => router.push('/(auth)/join')}
                size="lg"
                style={{ marginBottom: 10 }}
              />
              <SecondaryButton
                title="Create a New Trip"
                onPress={() => router.push('/(auth)/create-trip')}
                size="lg"
                variant="outline"
              />
            </View>
          </View>

          {/* TRIP HISTORY SECTION (Survives logout/login, real Supabase data) */}
          {hasHistory && (
            <View style={styles.historySection}>
              <View style={styles.historySectionHeader}>
                <View style={styles.historyHeaderLeft}>
                  <History size={16} color={COLORS.textSecondary} />
                  <Text style={styles.historySectionTitle}>TRIP HISTORY</Text>
                </View>
                <Text style={styles.historyCountText}>{tripHistory.length} previous</Text>
              </View>

              {tripHistory.map((t) => (
                <TripHistoryCard
                  key={t.id}
                  trip={t}
                  onPress={(item) => setSelectedHistoryTrip(item)}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Read-only Historical Detail Modal */}
        <HistoricalTripModal
          visible={Boolean(selectedHistoryTrip)}
          trip={selectedHistoryTrip}
          onClose={() => setSelectedHistoryTrip(null)}
        />
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: ACTIVE TRIP EXPERIENCE + TRIP HISTORY BELOW
  // -------------------------------------------------------------
  const hasMultipleActive = activeTripsList && activeTripsList.length > 1;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Active Crew</Text>
            <Text style={styles.subtitle}>Temporary trip coordination</Text>
          </View>

          <View style={styles.headerRightActions}>
            {hasMultipleActive && (
              <TouchableOpacity
                style={styles.switchCrewBtn}
                onPress={() => setShowPickerModal(true)}
                activeOpacity={0.8}
              >
                <Layers size={14} color={COLORS.primary} />
                <Text style={styles.switchCrewText}>Switch ({activeTripsList.length})</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.newTripBtn}
              onPress={() => router.push('/(auth)/create-trip')}
              activeOpacity={0.8}
            >
              <Plus size={16} color={COLORS.primary} />
              <Text style={styles.newTripText}>New</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* HERO ACTIVE TRIP CARD */}
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
              {members.length} / {activeTrip?.totalCapacity || 25} connected
            </Text>
          </View>

          {/* Time Breakdown Cards */}
          <View style={styles.timeRow}>
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>STARTED</Text>
              <Text style={styles.timeValue}>
                {formatTripTime(activeTrip?.startTime || activeTrip?.starts_at)}
              </Text>
            </View>
            <View style={styles.timeBoxDivider} />
            <View style={styles.timeBox}>
              <Text style={styles.timeLabel}>ENDS</Text>
              <Text style={styles.timeValue}>
                {formatTripTime(activeTrip?.endTime || activeTrip?.ends_at)}
              </Text>
            </View>
          </View>

          {/* Trip Code Row */}
          <View style={styles.codeRow}>
            <View>
              <Text style={styles.codeLabel}>TRIP CODE</Text>
              <Text style={styles.codeDisplay}>{activeTrip?.code || activeTrip?.trip_code}</Text>
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

          {/* Action Buttons: QR Code & Invite */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={() => setShowQRModal(true)}
              activeOpacity={0.8}
            >
              <QrCode size={18} color={COLORS.primary} />
              <Text style={styles.actionBtnText}>Show QR Code</Text>
            </TouchableOpacity>
            <View style={{ width: 10 }} />
            <TouchableOpacity
              style={styles.actionBtnPrimary}
              onPress={handleShare}
              activeOpacity={0.85}
            >
              <Share2 size={18} color={COLORS.white} />
              <Text style={styles.actionBtnPrimaryText}>Invite People</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* HOST & PRIVACY INFO */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardLabel}>HOST & PRIVACY</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <Shield size={18} color={COLORS.primary} />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Organizer</Text>
              <Text style={styles.infoSub}>
                {activeTrip?.organizer?.name || (userRole === 'organizer' ? 'You (Host)' : 'Organizer')}
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
                Location tracking automatically ends in {timeLeft}.
              </Text>
            </View>
          </View>
        </View>

        {/* TRIP CONTROLS ACCORDING TO USER ROLE */}
        {userRole === 'organizer' ? (
          <View style={styles.dangerZoneCard}>
            <Text style={styles.dangerCardLabel}>ORGANIZER CONTROLS</Text>
            <Text style={styles.dangerCardDesc}>
              Ending the trip immediately stops all live location sharing for every participant. The trip will be saved to your Trip History.
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
              Leaving will stop sharing your location with {activeTrip?.name}.
            </Text>

            <PrimaryButton
              title="Leave Crew"
              onPress={() => setShowConfirmModal({ visible: true, type: 'leave' })}
              variant="danger"
              size="md"
            />
          </View>
        )}

        {/* TRIP HISTORY SECTION */}
        {tripHistory && tripHistory.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.historySectionHeader}>
              <View style={styles.historyHeaderLeft}>
                <History size={16} color={COLORS.textSecondary} />
                <Text style={styles.historySectionTitle}>TRIP HISTORY</Text>
              </View>
              <Text style={styles.historyCountText}>{tripHistory.length} previous</Text>
            </View>

            {tripHistory.map((t) => (
              <TripHistoryCard
                key={t.id}
                trip={t}
                onPress={(item) => setSelectedHistoryTrip(item)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* CONFIRMATION BOTTOM SHEET (END TRIP OR LEAVE CREW) */}
      <BottomSheet
        visible={showConfirmModal.visible}
        onClose={() => setShowConfirmModal({ visible: false, type: null })}
        title={showConfirmModal.type === 'end' ? 'END TRIP' : 'LEAVE CREW'}
        subtitle={activeTrip?.name}
      >
        <View style={styles.confirmModalContent}>
          <Text style={styles.confirmModalText}>
            {showConfirmModal.type === 'end'
              ? 'Are you sure you want to end this trip? Live location sharing will stop immediately for all connected members and move to your Trip History.'
              : 'Are you sure you want to leave this crew? Your location will no longer be visible on the group map.'}
          </Text>
          <PrimaryButton
            title={showConfirmModal.type === 'end' ? 'Yes, End Trip' : 'Yes, Leave Crew'}
            onPress={handleConfirmAction}
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
          <Text style={styles.qrCodeText}>{activeTrip?.code || activeTrip?.trip_code}</Text>
          <Text style={styles.qrHelpText}>
            Ask your friend to scan this QR code or enter the code manually to join your temporary crew.
          </Text>
          <SecondaryButton
            title="Share Invite Link"
            onPress={handleShare}
            icon={Share2}
            size="md"
            style={{ marginTop: 12 }}
          />
        </View>
      </BottomSheet>

      {/* READ-ONLY HISTORICAL DETAIL MODAL */}
      <HistoricalTripModal
        visible={Boolean(selectedHistoryTrip)}
        trip={selectedHistoryTrip}
        onClose={() => setSelectedHistoryTrip(null)}
      />

      {/* ACTIVE CREW PICKER MODAL */}
      <ActiveTripPickerModal
        visible={showPickerModal}
        trips={activeTripsList}
        currentTripId={activeTrip?.id}
        onSelectTrip={(t) => selectActiveTrip(t)}
        onClose={() => setShowPickerModal(false)}
      />
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
    paddingBottom: 36,
  },
  emptyScrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  emptyContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  emptyIllustrationImage: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  emptyActions: {
    width: '100%',
  },
  historySection: {
    marginTop: 8,
    marginBottom: 16,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historySectionTitle: {
    ...TYPOGRAPHY.badge,
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  historyCountText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 26,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  switchCrewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 5,
  },
  switchCrewText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  newTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  newTripText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
  heroTypeBadge: {
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroTypeText: {
    ...TYPOGRAPHY.badge,
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  activeText: {
    color: COLORS.success,
    fontWeight: '700',
    fontSize: 11,
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
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
  },
  timeRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 16,
  },
  timeBox: {
    flex: 1,
    alignItems: 'center',
  },
  timeBoxDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  timeLabel: {
    ...TYPOGRAPHY.badge,
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  timeValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  codeLabel: {
    ...TYPOGRAPHY.badge,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  codeDisplay: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 2,
    marginTop: 2,
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  copyPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 5,
  },
  btnRow: {
    flexDirection: 'row',
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  actionBtnText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 8,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
  },
  actionBtnPrimaryText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 8,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  infoCardLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 12,
    letterSpacing: 0.5,
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
    backgroundColor: COLORS.surfaceSubtle,
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
    borderColor: '#FEE2E2',
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  dangerCardLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.danger,
    fontSize: 11,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  dangerCardDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  confirmModalContent: {
    paddingVertical: 12,
  },
  confirmModalText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  qrBox: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...SHADOWS.md,
  },
  qrCodeText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 3,
    color: COLORS.primary,
    marginBottom: 8,
  },
  qrHelpText: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: 'center',
    color: COLORS.textSecondary,
    paddingHorizontal: 20,
    lineHeight: 18,
    fontSize: 13,
  },
});
