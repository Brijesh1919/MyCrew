import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Users,
  AlertTriangle,
  MapPin,
  Compass,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  UserPlus,
  PlusCircle,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, TYPOGRAPHY } from '../../src/constants/theme';
import { MapView } from '../../src/components/MapView';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { QuickAction } from '../../src/components/QuickAction';
import { BottomSheet } from '../../src/components/BottomSheet';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { StatusBadge } from '../../src/components/StatusBadge';
import { DistanceBadge } from '../../src/components/DistanceBadge';
import { ActiveTripPickerModal } from '../../src/components/ActiveTripPickerModal';
import { useTripStore } from '../../src/store/useTripStore';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useMeetingPointStore } from '../../src/store/useMeetingPointStore';
import { useUserStore } from '../../src/store/useUserStore';
import { useLocationEngine } from '../../src/hooks/useLocationEngine';
import { formatRemainingTime } from '../../src/utils/freshness';
import { calculateDistanceMeters } from '../../src/utils/distance';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();

  // Zustand state
  const activeTrip = useTripStore((state) => state.activeTrip);
  const activeTripsList = useTripStore((state) => state.activeTripsList);
  const selectActiveTrip = useTripStore((state) => state.selectActiveTrip);
  const members = useCrewStore((state) => state.members);
  const getClusters = useCrewStore((state) => state.getClusters);
  const getStatusCounts = useCrewStore((state) => state.getStatusCounts);
  const setSelectedMember = useCrewStore((state) => state.setSelectedMember);
  const userLocation = useLocationStore((state) => state.userLocation);
  const currentUser = useUserStore((state) => state.currentUser);
  const meetingPoints = useMeetingPointStore((state) => state.meetingPoints);

  // Local bottom sheet states
  const [selectedClusterData, setSelectedClusterData] = useState(null);
  const [selectedPersonSheet, setSelectedPersonSheet] = useState(null);
  const [showTripPicker, setShowTripPicker] = useState(false);

  const statusCounts = getStatusCounts();
  const clusters = getClusters(currentUser?.id);
  const timeLeft = formatRemainingTime(activeTrip?.endTime);

  // Greeting based on hour
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'GOOD MORNING' : hour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  const userName = currentUser?.name?.toUpperCase() || 'FRIEND';

  // Handle cluster tap
  const handleClusterPress = (cluster) => {
    setSelectedClusterData(cluster);
  };

  // Handle member tap
  const handleMemberPress = (member) => {
    setSelectedPersonSheet(member);
  };

  // Navigate to person navigation screen
  const handleNavigateToPerson = (member) => {
    setSelectedMember(member);
    setSelectedPersonSheet(null);
    router.push({
      pathname: '/features/navigation',
      params: { memberId: member.id },
    });
  };

  // NO ACTIVE TRIP VIEW (Fresh user / Not joined any crew yet)
  if (!activeTrip) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.emptyScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.emptyHeader}>
            <View>
              <Text style={styles.greetingText}>
                {greeting}, {userName} 👋
              </Text>
              <Text style={styles.emptyHeaderSub}>Welcome to MyCrew</Text>
            </View>
            <View style={styles.privacyPill}>
              <ShieldCheck size={14} color={COLORS.success} />
              <Text style={styles.privacyPillText}>Location Private</Text>
            </View>
          </View>

          {/* Main Empty State Card */}
          <View style={styles.emptyHeroCard}>
            {/* Friendly Crew / Radar Illustration */}
            <View style={styles.illustrationWrapper}>
              <Image
                source={require('../../assets/ill_home_empty.jpg')}
                style={styles.emptyIllustrationImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.emptyTitle}>You're not in a crew yet</Text>
            <Text style={styles.emptySubtitle}>
              Join a trip with your friends or create one to get started.
            </Text>

            {/* Action Buttons */}
            <View style={styles.emptyActionsContainer}>
              <TouchableOpacity
                style={styles.primaryJoinButton}
                activeOpacity={0.88}
                onPress={() => router.push('/(auth)/join')}
              >
                <View style={styles.btnIconWrap}>
                  <UserPlus size={22} color={COLORS.white} />
                </View>
                <View style={styles.btnTextCol}>
                  <Text style={styles.primaryJoinBtnTitle}>Join a Crew</Text>
                  <Text style={styles.primaryJoinBtnSub}>Scan a QR code or enter a trip code</Text>
                </View>
                <ChevronRight size={18} color="rgba(255, 255, 255, 0.7)" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryCreateButton}
                activeOpacity={0.85}
                onPress={() => router.push('/(auth)/create-trip')}
              >
                <View style={[styles.btnIconWrap, styles.btnIconWrapOutlined]}>
                  <PlusCircle size={22} color={COLORS.primary} />
                </View>
                <View style={styles.btnTextCol}>
                  <Text style={styles.secondaryCreateBtnTitle}>Create a New Trip</Text>
                  <Text style={styles.secondaryCreateBtnSub}>Start a temporary crew & invite your people</Text>
                </View>
                <ChevronRight size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Privacy Guarantee Note */}
            <View style={styles.privacyNoticeCard}>
              <ShieldCheck size={16} color={COLORS.success} />
              <Text style={styles.privacyNoticeText}>
                Your location stays private until you join a trip.
              </Text>
            </View>
          </View>
        </ScrollView>
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
        {/* HEADER: GREETING & TRIP BADGE */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greetingText}>
                {greeting}, {userName} 👋
              </Text>
              <View style={styles.tripBadgeRow}>
                <Text style={styles.tripEmoji}>{activeTrip?.emoji || '🎪'}</Text>
                <Text style={styles.tripTitle}>{activeTrip?.name || 'Active Trip'}</Text>
                {activeTripsList && activeTripsList.length > 1 && (
                  <TouchableOpacity
                    style={styles.switchTripPill}
                    onPress={() => setShowTripPicker(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.switchTripPillText}>Switch</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.emergencyIconBtn}
              activeOpacity={0.75}
              onPress={() => router.push('/features/emergency')}
            >
              <ShieldAlert size={20} color={COLORS.danger} />
            </TouchableOpacity>
          </View>

          <View style={styles.presenceRow}>
            <View style={styles.liveIndicator}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveCountText}>
                {statusCounts.online} people online
              </Text>
            </View>

            <View style={styles.timerPill}>
              <Clock size={13} color={COLORS.textSecondary} />
              <Text style={styles.timerText}>Ends in {timeLeft}</Text>
            </View>
          </View>
        </View>

        {/* 1. LIVE GROUP MAP */}
        <View style={styles.mapCard}>
          <View style={styles.mapHeaderRow}>
            <Text style={styles.mapSectionLabel}>LIVE GROUP MAP</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/map')}
              style={styles.expandMapLink}
            >
              <Text style={styles.expandMapText}>Full Map</Text>
              <ChevronRight size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.mapFrame}>
            <MapView
              userLocation={userLocation}
              members={members}
              clusters={clusters}
              meetingPoints={meetingPoints}
              onSelectCluster={handleClusterPress}
              onSelectMember={handleMemberPress}
              height={270}
              interactive={true}
              showClusters={true}
              controlsBottomOffset={12}
            />

            {/* Quick Live Members Overlay Strip */}
            <View style={styles.mapOverlayStrip}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.avatarStripContent}
              >
                {members.slice(0, 6).map((m) => {
                  const dist = calculateDistanceMeters(userLocation, m.coordinates);
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={styles.miniMemberChip}
                      activeOpacity={0.8}
                      onPress={() => handleMemberPress(m)}
                    >
                      <MemberAvatar
                        uri={m.avatar}
                        name={m.name}
                        size="xs"
                        status={m.status}
                      />
                      <Text style={styles.miniMemberName} numberOfLines={1}>
                        {m.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* 2. PRIMARY ACTION: FIND MY PEOPLE */}
        <View style={styles.primaryActionSection}>
          <PrimaryButton
            title="FIND MY PEOPLE"
            onPress={() => router.push('/features/find-people')}
            icon={Compass}
            size="lg"
            style={styles.findMyPeopleBtn}
          />
        </View>

        {/* 3. QUICK ACTIONS: FIND NEAREST | I'M LOST | MEET HERE */}
        <View style={styles.quickActionsRow}>
          <QuickAction
            title="Find Nearest"
            icon={Users}
            onPress={() => router.push('/features/find-nearest')}
            variant="default"
          />
          <QuickAction
            title="I'm Lost"
            icon={AlertTriangle}
            onPress={() => router.push('/features/im-lost')}
            variant="danger"
          />
          <QuickAction
            title="Meet Here"
            icon={MapPin}
            onPress={() => router.push('/features/meeting-point')}
            variant="default"
          />
        </View>

        {/* 4. GROUP STATUS */}
        <TouchableOpacity
          style={styles.groupStatusCard}
          activeOpacity={0.85}
          onPress={() => router.push('/features/group-status')}
        >
          <View style={styles.statusCardHeader}>
            <Text style={styles.statusCardLabel}>GROUP STATUS</Text>
            <View style={styles.viewDetailsRow}>
              <Text style={styles.viewDetailsText}>Overview</Text>
              <ChevronRight size={14} color={COLORS.textSecondary} />
            </View>
          </View>

          <View style={styles.statusPillsRow}>
            <View style={[styles.statusStatPill, { backgroundColor: COLORS.successBg }]}>
              <View style={[styles.statusMiniDot, { backgroundColor: COLORS.success }]} />
              <Text style={[styles.statusStatValue, { color: COLORS.success }]}>
                {statusCounts.active} Active
              </Text>
            </View>

            <View style={[styles.statusStatPill, { backgroundColor: COLORS.warningBg }]}>
              <View style={[styles.statusMiniDot, { backgroundColor: COLORS.warning }]} />
              <Text style={[styles.statusStatValue, { color: COLORS.warning }]}>
                {statusCounts.delayed} Delayed
              </Text>
            </View>

            <View style={[styles.statusStatPill, { backgroundColor: COLORS.dangerBg }]}>
              <View style={[styles.statusMiniDot, { backgroundColor: COLORS.danger }]} />
              <Text style={[styles.statusStatValue, { color: COLORS.danger }]}>
                {statusCounts.offline} Offline
              </Text>
            </View>
          </View>

          {/* Quick Check-in CTA banner */}
          <View style={styles.checkInStrip}>
            <View style={styles.checkInLeft}>
              <ShieldCheck size={16} color={COLORS.success} />
              <Text style={styles.checkInText}>
                {currentUser?.isSafe ? "You're checked in as Safe" : 'Not checked in yet'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/features/check-in')}
              style={styles.checkInBtn}
            >
              <Text style={styles.checkInBtnText}>Check In</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {/* 5. GROUP RADAR LINK BANNER */}
        <TouchableOpacity
          style={styles.radarBanner}
          activeOpacity={0.85}
          onPress={() => router.push('/features/group-radar')}
        >
          <View style={styles.radarBannerLeft}>
            <View style={styles.radarCircle}>
              <Compass size={20} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.radarTitle}>Group Radar</Text>
              <Text style={styles.radarSub}>
                See who is ahead and behind you in real-time
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </ScrollView>

      {/* CLUSTER DETAILS BOTTOM SHEET */}
      <BottomSheet
        visible={Boolean(selectedClusterData)}
        onClose={() => setSelectedClusterData(null)}
        title={selectedClusterData?.name?.toUpperCase() || 'CLUSTER'}
        subtitle={`${selectedClusterData?.count || 0} CREW MEMBERS`}
      >
        <View style={styles.clusterSheetContainer}>
          <Text style={styles.clusterSubheader}>
            {selectedClusterData?.description || 'Gathered in this location'}
          </Text>

          <View style={styles.clusterMemberList}>
            {selectedClusterData?.members?.map((m) => {
              const dist = calculateDistanceMeters(userLocation, m.coordinates);
              return (
                <TouchableOpacity
                  key={m.id}
                  style={styles.clusterMemberItem}
                  onPress={() => {
                    setSelectedClusterData(null);
                    handleMemberPress(m);
                  }}
                >
                  <MemberAvatar
                    uri={m.avatar}
                    name={m.name}
                    size="sm"
                    status={m.status}
                  />
                  <View style={styles.clusterMemberInfo}>
                    <Text style={styles.clusterMemberName}>{m.name}</Text>
                    <Text style={styles.clusterMemberSub}>
                      {dist ? `${dist} m away` : 'Nearby'}
                    </Text>
                  </View>
                  <StatusBadge
                    status={m.status}
                    lastSeenSecondsAgo={m.lastSeenSecondsAgo}
                    size="sm"
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <PrimaryButton
            title="View Group on Map"
            onPress={() => {
              setSelectedClusterData(null);
              router.push('/(tabs)/map');
            }}
            size="md"
            style={{ marginTop: 12 }}
          />
        </View>
      </BottomSheet>

      {/* PERSON DETAILS BOTTOM SHEET */}
      <BottomSheet
        visible={Boolean(selectedPersonSheet)}
        onClose={() => setSelectedPersonSheet(null)}
        title={selectedPersonSheet?.name?.toUpperCase() || 'PERSON'}
        subtitle={
          selectedPersonSheet
            ? `${calculateDistanceMeters(userLocation, selectedPersonSheet.coordinates)} m away`
            : ''
        }
      >
        {selectedPersonSheet && (
          <View style={styles.personSheetContainer}>
            <View style={styles.personSheetTopRow}>
              <MemberAvatar
                uri={selectedPersonSheet.avatar}
                name={selectedPersonSheet.name}
                size="lg"
                status={selectedPersonSheet.status}
              />
              <View style={styles.personSheetInfo}>
                <Text style={styles.personSheetName}>{selectedPersonSheet.name}</Text>
                <StatusBadge
                  status={selectedPersonSheet.status}
                  lastSeenSecondsAgo={selectedPersonSheet.lastSeenSecondsAgo}
                  showDetail={true}
                />
                <Text style={styles.personSheetDistance}>
                  {calculateDistanceMeters(userLocation, selectedPersonSheet.coordinates)} m away from you
                </Text>
              </View>
            </View>

            <View style={styles.personSheetActions}>
              <PrimaryButton
                title={`Walk to ${selectedPersonSheet.name}`}
                onPress={() => handleNavigateToPerson(selectedPersonSheet)}
                size="lg"
                style={{ marginBottom: 10 }}
              />
              <View style={styles.personSheetBtnRow}>
                <TouchableOpacity
                  style={styles.sheetActionHalfBtn}
                  onPress={() => {
                    setSelectedPersonSheet(null);
                    router.push({
                      pathname: '/features/meeting-point',
                      params: {
                        customLat: selectedPersonSheet.coordinates.latitude,
                        customLon: selectedPersonSheet.coordinates.longitude,
                        suggestedName: `Meet near ${selectedPersonSheet.name}`,
                      },
                    });
                  }}
                >
                  <MapPin size={16} color={COLORS.primary} />
                  <Text style={styles.sheetActionBtnText}>Meet Here</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetActionHalfBtn}
                  onPress={() => {
                    setSelectedPersonSheet(null);
                    router.push('/(tabs)/map');
                  }}
                >
                  <Compass size={16} color={COLORS.primary} />
                  <Text style={styles.sheetActionBtnText}>View on Map</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </BottomSheet>

      {/* MULTIPLE ACTIVE TRIPS PICKER MODAL */}
      <ActiveTripPickerModal
        visible={showTripPicker}
        trips={activeTripsList}
        selectedTripId={activeTrip?.id}
        onSelectTrip={(t) => {
          selectActiveTrip(t);
          setShowTripPicker(false);
        }}
        onClose={() => setShowTripPicker(false)}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 14,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greetingText: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  tripBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  tripEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  tripTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 22,
  },
  switchTripPill: {
    marginLeft: 8,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  switchTripPillText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  emergencyIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  presenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  liveCountText: {
    ...TYPOGRAPHY.bodySecondary,
    fontWeight: '600',
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginLeft: 5,
    fontSize: 11,
    fontWeight: '600',
  },
  mapCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...SHADOWS.md,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mapSectionLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  expandMapLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandMapText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
    marginRight: 2,
  },
  mapFrame: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  mapOverlayStrip: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 64, // Leave clear column on the right for map controls
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderRadius: RADIUS.pill,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  avatarStripContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniMemberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    marginRight: 6,
  },
  miniMemberName: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 5,
    maxWidth: 55,
  },
  primaryActionSection: {
    marginBottom: 14,
  },
  findMyPeopleBtn: {
    height: 56,
  },
  quickActionsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  groupStatusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  statusCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusCardLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginRight: 2,
  },
  statusPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 6,
  },
  statusStatPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: RADIUS.md,
    minWidth: 0,
  },
  statusMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusStatValue: {
    ...TYPOGRAPHY.badge,
    fontSize: 11,
  },
  checkInStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  checkInLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkInText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textPrimary,
    marginLeft: 8,
    fontWeight: '600',
  },
  checkInBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  checkInBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  radarBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  radarBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radarTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  radarSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  clusterSheetContainer: {
    paddingBottom: 10,
  },
  clusterSubheader: {
    ...TYPOGRAPHY.bodySecondary,
    marginBottom: 14,
  },
  clusterMemberList: {
    maxHeight: 260,
  },
  clusterMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: 8,
  },
  clusterMemberInfo: {
    marginLeft: 10,
    flex: 1,
  },
  clusterMemberName: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
  },
  clusterMemberSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  personSheetContainer: {
    paddingBottom: 10,
  },
  personSheetTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  personSheetInfo: {
    marginLeft: 16,
    flex: 1,
  },
  personSheetName: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    marginBottom: 4,
  },
  personSheetDistance: {
    ...TYPOGRAPHY.bodySecondary,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  personSheetActions: {
    marginTop: 8,
  },
  personSheetBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  sheetActionHalfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sheetActionBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  emptyScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyHeaderSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontSize: 13,
  },
  privacyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  privacyPillText: {
    color: COLORS.success,
    fontWeight: '700',
    fontSize: 11,
    marginLeft: 5,
  },
  emptyHeroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 16,
    ...SHADOWS.md,
  },
  illustrationWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  emptyIllustrationImage: {
    width: 130,
    height: 130,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 22,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  emptyActionsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  primaryJoinButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: RADIUS.lg,
    ...SHADOWS.sm,
  },
  btnIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  btnIconWrapOutlined: {
    backgroundColor: COLORS.primaryLight,
  },
  btnTextCol: {
    flex: 1,
  },
  primaryJoinBtnTitle: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  primaryJoinBtnSub: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 12,
    marginTop: 2,
  },
  secondaryCreateButton: {
    width: '100%',
    backgroundColor: COLORS.surfaceSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  secondaryCreateBtnTitle: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryCreateBtnSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  privacyNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  privacyNoticeText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginLeft: 8,
    fontWeight: '500',
  },
});
