import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Users,
  AlertTriangle,
  MapPin,
  Compass,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  UserPlus,
  PlusCircle,
  User,
  Phone,
  MessageSquare,
  X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, RADIUS, SHADOWS, TYPOGRAPHY } from '../../src/constants/theme';
import { useThemeStore } from '../../src/store/useThemeStore';
import { MapView } from '../../src/components/MapView';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { QuickAction } from '../../src/components/QuickAction';
import { BottomSheet } from '../../src/components/BottomSheet';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { StatusBadge } from '../../src/components/StatusBadge';
import { DistanceBadge } from '../../src/components/DistanceBadge';
import { ActiveTripPickerModal } from '../../src/components/ActiveTripPickerModal';
import { CrewFacepileCapsule } from '../../src/components/CrewFacepileCapsule';
import { ContactNumberModal, PHONE_PROMPT_STORAGE_KEY } from '../../src/components/ContactNumberModal';
import { MeetingPointBottomSheet } from '../../src/components/MeetingPointBottomSheet';
import { MemberBottomSheet } from '../../src/components/MemberBottomSheet';
import { NearestPeopleBottomSheet } from '../../src/components/NearestPeopleBottomSheet';
import { ShareTripModal } from '../../src/components/ShareTripModal';
import { useTripStore } from '../../src/store/useTripStore';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useMeetingPointStore } from '../../src/store/useMeetingPointStore';
import { useUserStore } from '../../src/store/useUserStore';
import { useLocationEngine } from '../../src/hooks/useLocationEngine';
import { useChatStore } from '../../src/store/useChatStore';
import { formatRemainingTime } from '../../src/utils/freshness';
import { calculateDistanceMeters, formatDistance } from '../../src/utils/distance';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();

  // Theme
  const isDark = useThemeStore((state) => state.isDark);
  const colors = useThemeStore((state) => state.colors);

  // Zustand state
  const activeTrip = useTripStore((state) => state.activeTrip);
  const activeTripsList = useTripStore((state) => state.activeTripsList);
  const tripHistory = useTripStore((state) => state.tripHistory);
  const selectActiveTrip = useTripStore((state) => state.selectActiveTrip);
  const members = useCrewStore((state) => state.members);
  const getClusters = useCrewStore((state) => state.getClusters);
  const getStatusCounts = useCrewStore((state) => state.getStatusCounts);
  const setSelectedMember = useCrewStore((state) => state.setSelectedMember);
  const userLocation = useLocationStore((state) => state.userLocation);
  const isLocationSharingActive = useLocationStore((state) => state.isLocationSharingActive);
  const currentUser = useUserStore((state) => state.currentUser);
  const meetingPoints = useMeetingPointStore((state) => state.meetingPoints);
  const unreadTotal = useChatStore((state) =>
    Object.values(state.unreadCounts || {}).reduce((sum, c) => sum + (c || 0), 0)
  );

  // Local bottom sheet states
  const [selectedClusterData, setSelectedClusterData] = useState(null);
  const [selectedPersonSheet, setSelectedPersonSheet] = useState(null);
  const [showNearestPeopleSheet, setShowNearestPeopleSheet] = useState(false);
  const [selectedMeetingPointSheet, setSelectedMeetingPointSheet] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTripPicker, setShowTripPicker] = useState(false);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [activeRouteTarget, setActiveRouteTarget] = useState(null);

  // Read incoming navigation params from Meet tab or People bottom sheet
  const params = useLocalSearchParams();
  useEffect(() => {
    if (params?.showPath === 'true' && params?.targetLat && params?.targetLng) {
      const lat = parseFloat(params.targetLat);
      const lng = parseFloat(params.targetLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        setActiveRouteTarget({
          name: params.targetName || 'Meeting Point',
          type: params.targetType || 'meeting_point',
          coordinates: { latitude: lat, longitude: lng },
        });
      }
    }
  }, [params?.showPath, params?.targetLat, params?.targetLng, params?.targetName, params?.targetType]);

  // Check whether to show contact number prompt modal on mount
  useEffect(() => {
    let timeoutId;
    const checkContactNumberPrompt = async () => {
      if (!currentUser?.id || currentUser?.phone) return;

      try {
        const dismissedAt = await AsyncStorage.getItem(PHONE_PROMPT_STORAGE_KEY);
        if (dismissedAt) {
          const elapsedMs = Date.now() - parseInt(dismissedAt, 10);
          const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
          if (elapsedMs < TWENTY_FOUR_HOURS_MS) {
            return;
          }
        }
        // Smooth delay so the screen renders first
        timeoutId = setTimeout(() => {
          setShowContactModal(true);
        }, 1200);
      } catch (e) {
        console.warn('Phone prompt check error:', e);
      }
    };

    checkContactNumberPrompt();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentUser?.id, currentUser?.phone]);

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
    const myId = String(currentUser?.id || currentUser?.user_id || '');
    const isMe =
      Boolean(member?.isCurrentUser) ||
      member?.id === 'user' ||
      member?.id === 'me' ||
      (myId && (String(member?.id) === myId || String(member?.user_id) === myId));
    if (isMe) {
      return;
    }
    setSelectedPersonSheet(member);
  };

  // Handle meeting point tap on map
  const handleMeetingPointPress = (point) => {
    setSelectedMeetingPointSheet(point);
  };

  // Navigate to meeting point and plot route on map
  const handleNavigateToMeetingPoint = (point) => {
    const coords =
      point.coordinates ||
      (point.latitude && point.longitude
        ? { latitude: Number(point.latitude), longitude: Number(point.longitude) }
        : null);
    if (!coords || isNaN(coords.latitude) || isNaN(coords.longitude)) {
      Alert.alert('Location Unavailable', 'This meeting point does not have valid GPS coordinates.');
      return;
    }
    setActiveRouteTarget({
      name: point.name || 'Meeting Point',
      type: 'meeting_point',
      coordinates: coords,
    });
    setSelectedMeetingPointSheet(null);
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
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.emptyScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.emptyHeader}>
            <View style={styles.emptyHeaderLeft}>
              <Text style={[styles.greetingText, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                {greeting}, {userName} 👋
              </Text>
              <View style={styles.emptyHeaderSubRow}>
                <View style={[styles.privacyPill, { backgroundColor: colors.surfaceSubtle }]}>
                  <ShieldCheck size={12} color={colors.primary} />
                  <Text style={[styles.privacyPillText, { color: colors.primary }]}>Live Coordination Ready</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Tactical Hero Visual Banner */}
          <View style={[styles.heroBannerWrap, { borderColor: colors.border }]}>
            <Image
              source={require('../../assets/auth_hero.jpg')}
              style={styles.heroBannerImage}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(10, 14, 23, 0.88)']}
              style={styles.heroBannerScrim}
            />
            <View style={styles.heroBannerContent}>
              <Text style={styles.heroBannerTitle}>Ready for your next event?</Text>
              <Text style={styles.heroBannerSubtitle}>
                Create a temporary crew or enter a code to locate friends in real time.
              </Text>
            </View>
          </View>

          {/* Quick Action Tiles (Side-by-Side Tactical Cards) */}
          <View style={styles.actionTilesRow}>
            <TouchableOpacity
              style={[styles.actionTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => router.push('/(auth)/create-trip')}
            >
              <View style={[styles.tileIconBubble, { backgroundColor: colors.tileBgPrimary }]}>
                <PlusCircle size={22} color={colors.primary} />
              </View>
              <Text style={[styles.tileTitle, { color: colors.textPrimary }]}>Create Trip</Text>
              <Text style={[styles.tileDesc, { color: colors.textSecondary }]}>Start a new crew & invite friends</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionTile, { backgroundColor: colors.surface, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => router.push('/(auth)/join')}
            >
              <View style={[styles.tileIconBubble, { backgroundColor: colors.surfaceSubtle }]}>
                <UserPlus size={22} color={colors.primary} />
              </View>
              <Text style={[styles.tileTitle, { color: colors.textPrimary }]}>Join Trip</Text>
              <Text style={[styles.tileDesc, { color: colors.textSecondary }]}>Enter 6-digit code or scan QR</Text>
            </TouchableOpacity>
          </View>

          {/* Past Trips / History Section if available */}
          {tripHistory?.length > 0 && (
            <View style={styles.pastTripsSection}>
              <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>RECENT CREW TRIPS</Text>
              {tripHistory.slice(0, 3).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.historyRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  activeOpacity={0.7}
                  onPress={() => router.push('/(tabs)/trip')}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.historyName, { color: colors.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.historyMeta, { color: colors.textSecondary }]}>
                      {item.members_count || 1} members • Completed
                    </Text>
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Privacy Guarantee Note */}
          <View style={[styles.privacyNoticeCard, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
            <ShieldCheck size={16} color={colors.primary} />
            <Text style={[styles.privacyNoticeText, { color: colors.textSecondary }]}>
              Temporary by design. Location sharing stops when your trip ends. Zero permanent tracking.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* 1. MINIMAL TACTICAL HEADER */}
      <View style={[styles.headerMinimal, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeftCol}>
          <View style={styles.headerTripTitleRow}>
            <Text style={styles.tripEmoji}>{activeTrip?.emoji || '🎪'}</Text>
            <Text style={[styles.tripTitleMinimal, { color: colors.textPrimary }]} numberOfLines={1}>
              {activeTrip?.name || 'Active Trip'}
            </Text>
            {activeTripsList && activeTripsList.length > 1 && (
              <TouchableOpacity
                style={[styles.switchTripPill, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
                onPress={() => setShowTripPicker(true)}
                activeOpacity={0.8}
              >
                <Text style={[styles.switchTripPillText, { color: colors.primary }]}>Switch</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.liveStatusRow}>
            <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.liveStatusText, { color: colors.textSecondary }]}>
              {statusCounts.online || statusCounts.active || 1} online • Ends in {timeLeft}
            </Text>
          </View>
        </View>

        {/* Header Right Actions: Trip Share / Add People Button */}
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={[styles.headerShareBtn, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}
            activeOpacity={0.75}
            onPress={() => setShowShareModal(true)}
            accessibilityLabel="Add People or Share Trip"
          >
            <UserPlus size={16} color={colors.primary} style={{ marginRight: 5 }} />
            <Text style={[styles.headerShareBtnText, { color: colors.textPrimary }]}>Add People</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. FULLSCREEN LIVE MAP CANVAS (Zero Clutter, Dark Tactical Radar) */}
      <View style={styles.fullscreenMapContainer}>
        <MapView
          userLocation={userLocation}
          members={members}
          clusters={clusters}
          meetingPoints={meetingPoints}
          onSelectCluster={handleClusterPress}
          onSelectMember={handleMemberPress}
          onSelectMeetingPoint={handleMeetingPointPress}
          selectedMeetingPoint={selectedMeetingPointSheet}
          showRoute={Boolean(activeRouteTarget)}
          routeDestination={activeRouteTarget}
          center={activeRouteTarget ? activeRouteTarget.coordinates : null}
          height="100%"
          interactive={true}
          showClusters={true}
          showStylePicker={false}
          compactControls={true}
          controlsBottomOffset={130}
        />

        {/* ACTIVE NAVIGATION HUD BANNER (Top floating tactical route card) */}
        {activeRouteTarget && (
          <View
            style={[
              styles.navHUDCard,
              {
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.97)',
                borderColor: colors.primary,
              },
            ]}
          >
            <View style={styles.navHUDMain}>
              <View style={[styles.navHUDIconBubble, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]}>
                <Compass size={22} color={colors.primary} strokeWidth={2.4} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.navHUDSubtitle}>
                  {activeRouteTarget.type === 'meeting_point' ? 'RALLY POINT ROUTE' : 'CREW MEMBER ROUTE'}
                </Text>
                <Text style={[styles.navHUDTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {activeRouteTarget.name}
                </Text>
                {userLocation && (
                  <Text style={styles.navHUDDistance}>
                    {formatDistance(calculateDistanceMeters(userLocation, activeRouteTarget.coordinates))} away
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.navHUDExitBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' }]}
              onPress={() => setActiveRouteTarget(null)}
              activeOpacity={0.8}
            >
              <X size={15} color="#EF4444" style={{ marginRight: 4 }} strokeWidth={2.5} />
              <Text style={styles.navHUDExitText}>End</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 3. FLOATING TACTICAL BOTTOM HUD (Directly above bottom tabs) */}
        <View style={styles.floatingBottomHUD}>
          {/* Status Metrics Bar */}
          <TouchableOpacity
            style={[
              styles.floatingStatusRow,
              {
                backgroundColor: isDark ? 'rgba(22, 27, 34, 0.94)' : 'rgba(255, 255, 255, 0.96)',
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.85}
            onPress={() => router.push('/(tabs)/people')}
          >
            <View style={styles.statusPillItem}>
              <View style={[styles.statusDotSmall, { backgroundColor: colors.success }]} />
              <Text style={[styles.statusPillText, { color: colors.textPrimary }]}>
                {statusCounts.active} Active
              </Text>
            </View>
            <View style={[styles.statusPillDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statusPillItem}>
              <View style={[styles.statusDotSmall, { backgroundColor: colors.warning }]} />
              <Text style={[styles.statusPillText, { color: colors.textPrimary }]}>
                {statusCounts.delayed} Delayed
              </Text>
            </View>
            <View style={[styles.statusPillDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statusPillItem}>
              <View style={[styles.statusDotSmall, { backgroundColor: colors.textMuted }]} />
              <Text style={[styles.statusPillText, { color: colors.textSecondary }]}>
                {statusCounts.offline} Offline
              </Text>
            </View>
          </TouchableOpacity>

          {/* Action Buttons Row */}
          <View style={styles.floatingActionsRow}>
            {/* Primary Find My People Button (~64%) */}
            <TouchableOpacity
              style={[styles.findPeopleActionBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
              onPress={() => setShowNearestPeopleSheet(true)}
            >
              <Compass size={20} color="#FFFFFF" strokeWidth={2.4} style={{ marginRight: 8 }} />
              <Text style={styles.findPeopleActionText}>Find My People</Text>
            </TouchableOpacity>

            {/* I'm Lost Button (~34%) */}
            <TouchableOpacity
              style={[
                styles.imLostActionBtn,
                {
                  backgroundColor: isDark ? 'rgba(30, 18, 22, 0.94)' : '#FEF2F2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.45)' : '#FECACA',
                },
              ]}
              activeOpacity={0.85}
              onPress={() => router.push('/features/im-lost')}
            >
              <AlertTriangle size={18} color={colors.danger} strokeWidth={2.2} style={{ marginRight: 6 }} />
              <Text style={[styles.imLostActionText, { color: colors.danger }]}>I'm Lost</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>


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
            {selectedClusterData?.members?.map((m, idx) => {
              const dist = calculateDistanceMeters(userLocation, m.coordinates);
              const clusterMemberKey = m.id ? `cluster_m_${m.id}` : `cluster_m_idx_${idx}`;
              return (
                <TouchableOpacity
                  key={clusterMemberKey}
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
      <MemberBottomSheet
        visible={Boolean(selectedPersonSheet)}
        member={selectedPersonSheet}
        userLocation={userLocation}
        onClose={() => setSelectedPersonSheet(null)}
        onNavigate={(member) => {
          if (!member?.coordinates) return;
          setActiveRouteTarget({
            name: member.name,
            type: 'person',
            coordinates: member.coordinates,
          });
          setSelectedPersonSheet(null);
        }}
        onChat={(member) => {
          setSelectedPersonSheet(null);
          router.push({
            pathname: '/(tabs)/chat',
            params: { memberId: member.id, memberName: member.name },
          });
        }}
        onPing={(member) => {
          Alert.alert('Ping Sent!', `Sent a reunion beacon ping to ${member.name}.`);
        }}
      />

      {/* NEAREST PEOPLE BOTTOM SHEET */}
      <NearestPeopleBottomSheet
        visible={showNearestPeopleSheet}
        onClose={() => setShowNearestPeopleSheet(false)}
        members={members}
        userLocation={userLocation}
        currentUser={currentUser}
        onSelectMember={(member) => {
          setShowNearestPeopleSheet(false);
          const myId = String(currentUser?.id || currentUser?.user_id || '');
          const isMe =
            Boolean(member?.isCurrentUser) ||
            member?.id === 'user' ||
            member?.id === 'me' ||
            (myId && (String(member?.id) === myId || String(member?.user_id) === myId));
          if (isMe) {
            return;
          }
          setSelectedPersonSheet(member);
        }}
        onSeeEveryone={() => {
          setShowNearestPeopleSheet(false);
          router.push('/(tabs)/people');
        }}
      />

      {/* MEETING POINT DETAILS BOTTOM SHEET */}
      <MeetingPointBottomSheet
        visible={Boolean(selectedMeetingPointSheet)}
        meetingPoint={selectedMeetingPointSheet}
        userLocation={userLocation}
        onClose={() => setSelectedMeetingPointSheet(null)}
        onNavigate={handleNavigateToMeetingPoint}
      />

      {/* TRIP SHARE & ADD PEOPLE MODAL */}
      <ShareTripModal
        visible={showShareModal}
        trip={activeTrip}
        onClose={() => setShowShareModal(false)}
      />

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

      {/* CONTACT NUMBER MODAL */}
      <ContactNumberModal
        visible={showContactModal}
        onClose={() => setShowContactModal(false)}
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
  // Minimal Tactical Header
  headerMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerLeftCol: {
    flex: 1,
    marginRight: 10,
  },
  headerTripTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripTitleMinimal: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  liveStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  liveStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
  },
  headerShareBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    position: 'relative',
    marginRight: 8,
  },
  headerChatBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  headerBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },

  // Fullscreen Map Container
  fullscreenMapContainer: {
    flex: 1,
    position: 'relative',
    width: '100%',
  },
  mapFloatingCapsule: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 10,
  },

  // Floating Tactical Bottom HUD
  floatingBottomHUD: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    zIndex: 20,
    gap: 8,
  },
  floatingStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    ...SHADOWS.md,
  },
  statusPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDotSmall: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusPillDivider: {
    width: 1,
    height: 14,
    opacity: 0.6,
  },

  // Dual Action Buttons Row
  floatingActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  findPeopleActionBtn: {
    flex: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
  },
  findPeopleActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  imLostActionBtn: {
    flex: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    ...SHADOWS.md,
  },
  imLostActionText: {
    fontSize: 14,
    fontWeight: '800',
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
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileAvatarBtn: {
    borderRadius: RADIUS.full,
    padding: 2,
    borderWidth: 2,
    borderColor: '#BAE6FD',
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
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
  mapViewport: {
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.md,
  },
  mapTopPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    ...SHADOWS.sm,
  },
  mapLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  mapTopPillText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  mapFacepileContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    maxWidth: '80%',
  },
  primaryActionSection: {
    marginBottom: 14,
  },
  findMyPeopleBtn: {
    height: 54,
    borderRadius: RADIUS.lg,
  },
  quickActionsRow: {
    flexDirection: 'row',
    marginBottom: 18,
    gap: 10,
  },
  statusSection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  sectionLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionLinkText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
    marginRight: 2,
  },
  statusUnifiedContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  statusPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusStatPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: RADIUS.md,
    minWidth: 0,
  },
  statusMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusStatValue: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    fontWeight: '700',
  },
  statusDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  checkInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkInLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkInTitle: {
    ...TYPOGRAPHY.body,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  checkInSub: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  checkInBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  checkInBtnSafe: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  checkInBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  checkInBtnTextSafe: {
    color: COLORS.primary,
  },
  radarTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  radarTileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  radarSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
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
  sheetActionChatBtn: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
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
  emptyHeaderLeft: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  emptyHeaderSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 3,
    gap: 8,
  },
  emptyHeaderSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  privacyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  privacyPillText: {
    color: COLORS.success,
    fontWeight: '700',
    fontSize: 11,
    marginLeft: 4,
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
  phonePromptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  phonePromptIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  phonePromptTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  phonePromptTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    fontSize: 14,
    color: '#1E1B4B',
  },
  phonePromptSubtitle: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: '#4338CA',
    marginTop: 2,
  },
  phonePromptActionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  phonePromptActionText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  heroBannerWrap: {
    height: 160,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
    borderWidth: 1,
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
  },
  heroBannerScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
  },
  heroBannerContent: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
  },
  heroBannerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  heroBannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    lineHeight: 16,
  },
  actionTilesRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionTile: {
    flex: 1,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 120,
  },
  tileIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  tileDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  pastTripsSection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
    paddingLeft: 2,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  historyName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  historyMeta: {
    fontSize: 12,
  },
  navHUDCard: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    zIndex: 20,
    ...SHADOWS.md,
  },
  navHUDMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  navHUDIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  navHUDSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: 0.6,
  },
  navHUDTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 1,
  },
  navHUDDistance: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 1,
  },
  navHUDExitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  navHUDExitText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
});
