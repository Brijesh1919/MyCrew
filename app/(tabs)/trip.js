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
  ChevronLeft,
} from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { useThemeStore } from '../../src/store/useThemeStore';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { BottomSheet } from '../../src/components/BottomSheet';
import { TripHistoryCard } from '../../src/components/TripHistoryCard';
import { HistoricalTripModal } from '../../src/components/HistoricalTripModal';
import { ActiveTripPickerModal } from '../../src/components/ActiveTripPickerModal';
import { QRCodeView } from '../../src/components/QRCodeView';
import { useTripStore } from '../../src/store/useTripStore';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useUserStore } from '../../src/store/useUserStore';
import { formatRemainingTime } from '../../src/utils/freshness';
import { formatTripTime } from '../../src/utils/helpers';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function TripScreen() {
  const router = useRouter();
  const { triggerSuccess, triggerLight, triggerWarning } = useHapticFeedback();
  const colors = useThemeStore((state) => state.colors);
  const isDark = useThemeStore((state) => state.isDark);

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
    const tripCode = (activeTrip.code || activeTrip.trip_code || '').trim();
    const tripName = activeTrip.name || 'our crew';
    try {
      await Share.share({
        message: `Join our temporary crew for ${tripName} on MyCrew!\n\nTrip Code: ${tripCode}\n\nOpen directly in app: mycrew://join?code=${tripCode}\n\n(Enter this code in MyCrew or tap the link to join instantly!)`,
        title: `Join ${tripName} on MyCrew`,
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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        {/* Top Header with Back Button */}
        <View style={[styles.header, { paddingHorizontal: 16, paddingTop: 8, marginBottom: 4 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Trip History</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Past and completed crew trips</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.emptyScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Empty State Box */}
          <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Image
              source={require('../../assets/ill_trip_empty.png')}
              style={styles.emptyIllustrationImage}
              resizeMode="contain"
            />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {hasHistory ? "You're not in a crew right now." : "You're not in a crew yet."}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
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
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>TRIP HISTORY</Text>
                <Text style={[styles.historyCountText, { color: colors.textSecondary }]}>{tripHistory.length} previous</Text>
              </View>

              <View style={styles.historyGroupContainer}>
                {tripHistory.map((t) => (
                  <TripHistoryCard
                    key={t.id}
                    trip={t}
                    variant="row"
                    onPress={(item) => setSelectedHistoryTrip(item)}
                  />
                ))}
              </View>
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header with Back button */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Active Crew</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Temporary trip coordination</Text>
            </View>
          </View>

          <View style={styles.headerRightActions}>
            {hasMultipleActive && (
              <TouchableOpacity
                style={[styles.switchCrewBtn, { backgroundColor: colors.surfaceSubtle }]}
                onPress={() => setShowPickerModal(true)}
                activeOpacity={0.8}
              >
                <Layers size={14} color={colors.primary} />
                <Text style={[styles.switchCrewText, { color: colors.primary }]}>Switch ({activeTripsList.length})</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.newTripBtn,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: isDark ? '#374151' : colors.border,
                },
              ]}
              onPress={() => router.push('/(auth)/create-trip')}
              activeOpacity={0.8}
            >
              <Plus size={16} color={colors.primary} />
              <Text style={[styles.newTripText, { color: colors.primary }]}>New</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* HERO ACTIVE TRIP CARD */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.heroHeader}>
            <View style={styles.heroBadgeRow}>
              <Text style={styles.heroEmoji}>{activeTrip?.emoji || '🎪'}</Text>
              <View style={[styles.heroTypeBadge, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.16)' : '#EFF6FF' }]}>
                <Text style={[styles.heroTypeText, { color: colors.primary }]}>
                  {activeTrip?.type?.toUpperCase() || 'EVENT'}
                </Text>
              </View>
            </View>
            <View style={[styles.activePill, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.16)' : '#DCFCE7' }]}>
              <View style={[styles.activeDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.activeText, { color: colors.success }]}>Active Sharing</Text>
            </View>
          </View>

          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{activeTrip?.name}</Text>

          <View style={styles.heroConnectedRow}>
            <Users size={16} color={colors.primary} />
            <Text style={[styles.heroConnectedText, { color: colors.textSecondary }]}>
              {members.length} / {activeTrip?.totalCapacity || 25} connected
            </Text>
          </View>

          {/* Time Breakdown Cards */}
          <View style={[styles.timeRow, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
            <View style={styles.timeBox}>
              <Text style={[styles.timeLabel, { color: colors.textMuted }]}>STARTED</Text>
              <Text style={[styles.timeValue, { color: colors.textPrimary }]}>
                {formatTripTime(activeTrip?.startTime || activeTrip?.starts_at)}
              </Text>
            </View>
            <View style={[styles.timeBoxDivider, { backgroundColor: colors.border }]} />
            <View style={styles.timeBox}>
              <Text style={[styles.timeLabel, { color: colors.textMuted }]}>ENDS</Text>
              <Text style={[styles.timeValue, { color: colors.textPrimary }]}>
                {formatTripTime(activeTrip?.endTime || activeTrip?.ends_at)}
              </Text>
            </View>
          </View>

          {/* Trip Code Row */}
          <View style={[styles.codeRow, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
            <View>
              <Text style={[styles.codeLabel, { color: colors.textMuted }]}>TRIP CODE</Text>
              <Text style={[styles.codeDisplay, { color: colors.primary }]}>{activeTrip?.code || activeTrip?.trip_code}</Text>
            </View>
            <TouchableOpacity
              style={[styles.copyPill, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.16)' : '#EFF6FF' }]}
              onPress={handleCopyCode}
              activeOpacity={0.7}
            >
              <Copy size={14} color={colors.primary} />
              <Text style={[styles.copyPillText, { color: colors.primary }]}>{copied ? 'Copied!' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons: QR Code & Invite */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[
                styles.actionBtnOutline,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderColor: isDark ? '#374151' : colors.border,
                },
              ]}
              onPress={() => setShowQRModal(true)}
              activeOpacity={0.8}
            >
              <QrCode size={18} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Show QR Code</Text>
            </TouchableOpacity>
            <View style={{ width: 10 }} />
            <TouchableOpacity
              style={[styles.actionBtnPrimary, { backgroundColor: colors.primary }]}
              onPress={handleShare}
              activeOpacity={0.85}
            >
              <Share2 size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnPrimaryText}>Invite People</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. TRIP DETAILS & CONTROLS (Inset Grouped Section) */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>TRIP DETAILS & CONTROLS</Text>
          <View style={[styles.menuBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <View style={[styles.menuIconBox, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.16)' : '#EFF6FF' }]}>
                <Shield size={18} color={colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>Organizer</Text>
                <Text style={[styles.infoSub, { color: colors.textSecondary }]}>
                  {activeTrip?.organizer?.name || (userRole === 'organizer' ? 'You' : 'Organizer')}
                </Text>
              </View>
            </View>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <View style={styles.infoRow}>
              <View style={[styles.menuIconBox, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.16)' : '#EFF6FF' }]}>
                <Clock size={18} color={colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>Auto-Expiration</Text>
                <Text style={[styles.infoSub, { color: colors.textSecondary }]}>
                  Location tracking automatically ends in {timeLeft}.
                </Text>
              </View>
            </View>

            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

            <View style={styles.controlActionBox}>
              {userRole === 'organizer' ? (
                <PrimaryButton
                  title="End Trip & Stop Sharing"
                  onPress={() => setShowConfirmModal({ visible: true, type: 'end' })}
                  variant="danger"
                  size="md"
                  fullWidth={true}
                />
              ) : (
                <PrimaryButton
                  title="Leave Crew"
                  onPress={() => setShowConfirmModal({ visible: true, type: 'leave' })}
                  variant="danger"
                  size="md"
                  fullWidth={true}
                />
              )}
            </View>
          </View>
        </View>

        {/* 3. TRIP HISTORY SECTION (Inset Grouped) */}
        <View style={styles.historySection}>
          <View style={styles.historySectionHeader}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>TRIP HISTORY</Text>
            <Text style={[styles.historyCountText, { color: colors.textSecondary }]}>
              {tripHistory?.length ? `${tripHistory.length} completed` : '0 completed'}
            </Text>
          </View>

          <View style={[styles.historyGroupContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {tripHistory && tripHistory.length > 0 ? (
              tripHistory.map((t) => (
                <TripHistoryCard
                  key={t.id}
                  trip={t}
                  variant="row"
                  onPress={(item) => setSelectedHistoryTrip(item)}
                />
              ))
            ) : (
              <View style={styles.emptyHistoryRow}>
                <History size={22} color={colors.textMuted} style={{ marginBottom: 6 }} />
                <Text style={[styles.emptyHistoryTitle, { color: colors.textPrimary }]}>No Past Trips Yet</Text>
                <Text style={[styles.emptyHistoryDesc, { color: colors.textSecondary }]}>
                  When this active trip ends, it will be automatically archived here with its crew history.
                </Text>
              </View>
            )}
          </View>
        </View>
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
          <View
            style={[
              styles.qrBox,
              {
                backgroundColor: '#FFFFFF',
                padding: 14,
                borderRadius: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 4,
              },
            ]}
          >
            <QRCodeView
              value={`mycrew://join?code=${activeTrip?.code || activeTrip?.trip_code || ''}`}
              size={180}
            />
          </View>
          <Text style={[styles.qrCodeText, { color: colors.primary }]}>
            {activeTrip?.code || activeTrip?.trip_code}
          </Text>
          <Text style={[styles.qrHelpText, { color: colors.textSecondary }]}>
            Ask your friend to scan this QR code or enter the code manually to join your temporary crew.
          </Text>
          <SecondaryButton
            title="Share Invite Link"
            onPress={handleShare}
            icon={Share2}
            size="md"
            style={{ marginTop: 14 }}
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
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
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
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  newTripText: {
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 18,
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
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
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
    marginBottom: 6,
  },
  heroConnectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroConnectedText: {
    ...TYPOGRAPHY.bodySecondary,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 6,
  },
  timeRow: {
    flexDirection: 'row',
    borderRadius: RADIUS.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  timeBox: {
    flex: 1,
    alignItems: 'center',
  },
  timeBoxDivider: {
    width: 1,
  },
  timeLabel: {
    ...TYPOGRAPHY.badge,
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  timeValue: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    fontSize: 13,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  codeLabel: {
    ...TYPOGRAPHY.badge,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  codeDisplay: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 2,
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  copyPillText: {
    fontSize: 12,
    fontWeight: '700',
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
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  actionBtnText: {
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 8,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
  },
  actionBtnPrimaryText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 8,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionLabel: {
    ...TYPOGRAPHY.badge,
    color: '#64748B',
    fontSize: 11,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.8,
  },
  menuBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  infoSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 1,
    fontSize: 12,
  },
  menuDivider: {
    height: 1,
    marginLeft: 64,
  },
  controlActionBox: {
    padding: 14,
  },
  historyGroupContainer: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  emptyHistoryRow: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  emptyHistoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyHistoryDesc: {
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
  confirmModalContent: {
    paddingVertical: 12,
  },
  confirmModalText: {
    ...TYPOGRAPHY.body,
    lineHeight: 22,
    marginBottom: 20,
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  qrBox: {
    marginBottom: 14,
  },
  qrCodeText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: 8,
  },
  qrHelpText: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
    fontSize: 13,
  },
});
