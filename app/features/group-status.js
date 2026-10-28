import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Users,
  Compass,
  MapPin,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { AppHeader } from '../../src/components/AppHeader';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { StatusBadge } from '../../src/components/StatusBadge';
import { DistanceBadge } from '../../src/components/DistanceBadge';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useTripStore } from '../../src/store/useTripStore';
import { useUserStore } from '../../src/store/useUserStore';
import { useThemeStore } from '../../src/store/useThemeStore';
import { locationService } from '../../src/services/locationService';
import { formatDistance } from '../../src/utils/distance';

export default function GroupStatusScreen() {
  const router = useRouter();

  const isDark = useThemeStore((state) => state.isDark);
  const colors = useThemeStore((state) => state.colors);

  const members = useCrewStore((state) => state.members);
  const getStatusCounts = useCrewStore((state) => state.getStatusCounts);
  const setSelectedMember = useCrewStore((state) => state.setSelectedMember);
  const userLocation = useLocationStore((state) => state.userLocation);
  const activeTrip = useTripStore((state) => state.activeTrip);
  const currentUser = useUserStore((state) => state.currentUser);

  const counts = getStatusCounts();

  // Filter out the current user so they are never compared against themselves
  const otherMembers = (members || []).filter((m) => {
    if (!m) return false;
    if (currentUser?.id && m.id === currentUser.id) return false;
    if (m.id === 'user' || m.id === 'me' || m.isCurrentUser) return false;
    if (currentUser?.name && m.name === currentUser.name) return false;
    return true;
  });

  // Only calculate closest/farthest among members who are actively sharing location
  const otherMembersSharing = otherMembers.filter(
    (m) =>
      m.status !== 'offline' &&
      m.coordinates &&
      !isNaN(m.coordinates.latitude) &&
      !isNaN(m.coordinates.longitude) &&
      m.coordinates.latitude !== 0
  );

  const sortedByDist = userLocation
    ? locationService.getNearestMembers(userLocation, otherMembersSharing)
    : [];
  const closest = sortedByDist.length > 0 ? sortedByDist[0] : null;
  // Only show farthest if there are at least 2 other sharing members and farthest is distinct
  const farthest =
    sortedByDist.length > 1 &&
      sortedByDist[sortedByDist.length - 1].id !== closest?.id
      ? sortedByDist[sortedByDist.length - 1]
      : null;

  // Real active members actively sharing valid GPS coordinates for group center
  const membersSharingLive = (members || []).filter(
    (m) =>
      m.status !== 'offline' &&
      m.coordinates &&
      !isNaN(m.coordinates.latitude) &&
      !isNaN(m.coordinates.longitude) &&
      m.coordinates.latitude !== 0
  );

  const nearbyActiveCount = membersSharingLive.length;
  const centerTitle =
    activeTrip?.locationName ||
    activeTrip?.destination ||
    activeTrip?.name ||
    'Trip Center Area';

  // Real safety check-in status from crew members
  const totalCrew = members.length;
  const safeCrew = members.filter((m) => m.isSafe !== false).length;
  const isAllSafe = totalCrew > 0 && safeCrew === totalCrew;

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    router.push({
      pathname: '/features/person',
      params: { memberId: member.id },
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0B0F17' : colors.background }]} edges={['top', 'left', 'right']}>
      <AppHeader
        title="Group Status"
        subtitle={activeTrip?.name || 'Active Trip'}
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* CREW HEALTH OVERVIEW CARD */}
        <View
          style={[
            styles.overviewCard,
            {
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              borderColor: isDark ? '#1F2937' : '#E2E8F0',
            },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
            YOUR CREW
          </Text>

          <View style={styles.statusGrid}>
            <View
              style={[
                styles.statusBox,
                {
                  backgroundColor: isDark ? 'rgba(34, 197, 94, 0.12)' : COLORS.successBg,
                  borderColor: isDark ? 'rgba(34, 197, 94, 0.25)' : 'transparent',
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: '#22C55E' }]} />
              <Text style={[styles.statusCount, { color: '#22C55E' }]}>
                {counts.active}
              </Text>
              <Text style={[styles.statusName, { color: isDark ? '#F9FAFB' : COLORS.textPrimary }]}>
                Active Live
              </Text>
            </View>

            <View
              style={[
                styles.statusBox,
                {
                  backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : COLORS.warningBg,
                  borderColor: isDark ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.statusCount, { color: '#F59E0B' }]}>
                {counts.delayed}
              </Text>
              <Text style={[styles.statusName, { color: isDark ? '#F9FAFB' : COLORS.textPrimary }]}>
                Delayed
              </Text>
            </View>

            <View
              style={[
                styles.statusBox,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : COLORS.dangerBg,
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : 'transparent',
                  borderWidth: isDark ? 1 : 0,
                },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
              <Text style={[styles.statusCount, { color: '#EF4444' }]}>
                {counts.offline}
              </Text>
              <Text style={[styles.statusName, { color: isDark ? '#F9FAFB' : COLORS.textPrimary }]}>
                Offline
              </Text>
            </View>
          </View>
        </View>

        {/* CREW GEOMETRY (INSET GROUPED SECTION) */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
            CREW GEOMETRY
          </Text>
          <View
            style={[
              styles.groupedContainer,
              {
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                borderColor: isDark ? '#1F2937' : '#E2E8F0',
              },
            ]}
          >
            {/* Closest to you */}
            {closest ? (
              <TouchableOpacity
                style={styles.groupedRow}
                onPress={() => handleSelectMember(closest)}
                activeOpacity={0.7}
              >
                <View style={styles.highlightLeft}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.18)' : '#EFF6FF' },
                    ]}
                  >
                    <Users size={18} color="#3B82F6" />
                  </View>
                  <View>
                    <Text style={[styles.highlightLabel, { color: isDark ? '#9CA3AF' : COLORS.textMuted }]}>
                      CLOSEST TO YOU
                    </Text>
                    <Text style={[styles.highlightName, { color: isDark ? '#F9FAFB' : colors.textPrimary }]}>
                      {closest.name}
                    </Text>
                  </View>
                </View>
                <View style={styles.highlightRight}>
                  <DistanceBadge meters={closest.distanceMeters} isHighlight={true} />
                  <ChevronRight size={16} color={isDark ? '#6B7280' : COLORS.textMuted} />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyHighlightRow}>
                <Users size={20} color={isDark ? '#6B7280' : COLORS.textMuted} />
                <Text style={[styles.emptyHighlightText, { color: isDark ? '#9CA3AF' : colors.textSecondary }]}>
                  {otherMembers.length > 0
                    ? 'No members sharing live location'
                    : 'No other members in this trip yet'}
                </Text>
              </View>
            )}

            {/* Farthest (only shown if there are multiple other sharing members) */}
            {farthest && (
              <>
                <View
                  style={[
                    styles.hairlineDivider,
                    { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' },
                  ]}
                />
                <TouchableOpacity
                  style={styles.groupedRow}
                  onPress={() => handleSelectMember(farthest)}
                  activeOpacity={0.7}
                >
                  <View style={styles.highlightLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' },
                      ]}
                    >
                      <ArrowUpRight size={18} color={isDark ? '#9CA3AF' : COLORS.textSecondary} />
                    </View>
                    <View>
                      <Text style={[styles.highlightLabel, { color: isDark ? '#9CA3AF' : COLORS.textMuted }]}>
                        FARTHEST IN TRIP
                      </Text>
                      <Text style={[styles.highlightName, { color: isDark ? '#F9FAFB' : colors.textPrimary }]}>
                        {farthest.name}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.highlightRight}>
                    <DistanceBadge meters={farthest.distanceMeters} />
                    <ChevronRight size={16} color={isDark ? '#6B7280' : COLORS.textMuted} />
                  </View>
                </TouchableOpacity>
              </>
            )}

            <View
              style={[
                styles.hairlineDivider,
                { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' },
              ]}
            />

            {/* Dynamic Group Center / Midpoint */}
            <TouchableOpacity
              style={styles.groupedRow}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/home')}
            >
              <View style={styles.highlightLeft}>
                <View
                  style={[
                    styles.iconCircle,
                    { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.18)' : '#EFF6FF' },
                  ]}
                >
                  <Compass size={18} color="#3B82F6" />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.highlightLabel, { color: isDark ? '#9CA3AF' : COLORS.textMuted }]}>
                    GROUP CENTER
                  </Text>
                  <Text
                    style={[styles.highlightName, { color: isDark ? '#F9FAFB' : colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {centerTitle}
                  </Text>
                </View>
              </View>
              <View style={styles.highlightRight}>
                <Text style={styles.clusterCountTag}>
                  {nearbyActiveCount > 0 ? `${nearbyActiveCount} live` : 'Paused'}
                </Text>
                <ChevronRight size={16} color={isDark ? '#6B7280' : COLORS.textMuted} style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* SAFETY STATUS CARD */}
        <TouchableOpacity
          style={[
            styles.safetyCard,
            {
              backgroundColor: isDark
                ? isAllSafe
                  ? 'rgba(34, 197, 94, 0.12)'
                  : 'rgba(245, 158, 11, 0.12)'
                : isAllSafe
                  ? '#F0FDF4'
                  : '#FFFBEB',
              borderColor: isDark
                ? isAllSafe
                  ? 'rgba(34, 197, 94, 0.3)'
                  : 'rgba(245, 158, 11, 0.3)'
                : isAllSafe
                  ? '#DCFCE7'
                  : '#FEF3C7',
            },
          ]}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/people')}
        >
          <View style={styles.safetyCardLeft}>
            <View
              style={[
                styles.safetyIconCircle,
                {
                  backgroundColor: isDark
                    ? isAllSafe
                      ? 'rgba(34, 197, 94, 0.22)'
                      : 'rgba(245, 158, 11, 0.22)'
                    : isAllSafe
                      ? '#DCFCE7'
                      : '#FEF3C7',
                },
              ]}
            >
              {isAllSafe ? (
                <ShieldCheck size={20} color="#22C55E" />
              ) : (
                <ShieldAlert size={20} color="#F59E0B" />
              )}
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.safetyTitle, { color: isDark ? '#F9FAFB' : colors.textPrimary }]}>
                Safety Status Check-In
              </Text>
              <Text style={[styles.safetySub, { color: isDark ? '#9CA3AF' : colors.textSecondary }]}>
                {totalCrew > 0
                  ? `${safeCrew} of ${totalCrew} ${totalCrew === 1 ? 'friend has' : 'friends have'
                  } checked in as safe`
                  : "Tap to check in and let your crew know you're safe"}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={isDark ? '#9CA3AF' : colors.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  overviewCard: {
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionLabel: {
    ...TYPOGRAPHY.badge,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: '800',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusBox: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    position: 'relative',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  statusCount: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 2,
  },
  statusName: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  groupedContainer: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  groupedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  hairlineDivider: {
    height: 1,
    marginLeft: 64,
  },
  highlightLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  highlightLabel: {
    ...TYPOGRAPHY.badge,
    fontSize: 10,
    fontWeight: '800',
  },
  highlightName: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    marginTop: 1,
    fontWeight: '700',
  },
  highlightRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clusterCountTag: {
    ...TYPOGRAPHY.caption,
    color: '#3B82F6',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
  },
  emptyHighlightText: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginTop: 10,
  },
  safetyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  safetyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    fontWeight: '700',
  },
  safetySub: {
    ...TYPOGRAPHY.caption,
    marginTop: 2,
  },
});
