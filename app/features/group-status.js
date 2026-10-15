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
import { locationService } from '../../src/services/locationService';
import { formatDistance } from '../../src/utils/distance';

export default function GroupStatusScreen() {
  const router = useRouter();

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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader
        title="Group Status"
        subtitle={activeTrip?.name || 'Active Trip'}
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* CREW HEALTH OVERVIEW CARD */}
        <View style={styles.overviewCard}>
          <Text style={styles.sectionLabel}>YOUR CREW</Text>

          <View style={styles.statusGrid}>
            <View style={[styles.statusBox, { backgroundColor: COLORS.successBg }]}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
              <Text style={[styles.statusCount, { color: COLORS.success }]}>
                {counts.active}
              </Text>
              <Text style={styles.statusName}>Active Live</Text>
            </View>

            <View style={[styles.statusBox, { backgroundColor: COLORS.warningBg }]}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.warning }]} />
              <Text style={[styles.statusCount, { color: COLORS.warning }]}>
                {counts.delayed}
              </Text>
              <Text style={styles.statusName}>Delayed</Text>
            </View>

            <View style={[styles.statusBox, { backgroundColor: COLORS.dangerBg }]}>
              <View style={[styles.statusDot, { backgroundColor: COLORS.danger }]} />
              <Text style={[styles.statusCount, { color: COLORS.danger }]}>
                {counts.offline}
              </Text>
              <Text style={styles.statusName}>Offline</Text>
            </View>
          </View>
        </View>

        {/* CREW GEOMETRY (INSET GROUPED SECTION) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionLabel}>CREW GEOMETRY</Text>
          <View style={styles.groupedContainer}>
            {/* Closest to you */}
            {closest ? (
              <TouchableOpacity
                style={styles.groupedRow}
                onPress={() => handleSelectMember(closest)}
                activeOpacity={0.7}
              >
                <View style={styles.highlightLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
                    <Users size={18} color={COLORS.success} />
                  </View>
                  <View>
                    <Text style={styles.highlightLabel}>CLOSEST TO YOU</Text>
                    <Text style={styles.highlightName}>{closest.name}</Text>
                  </View>
                </View>
                <View style={styles.highlightRight}>
                  <DistanceBadge meters={closest.distanceMeters} isHighlight={true} />
                  <ChevronRight size={16} color={COLORS.textMuted} />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyHighlightRow}>
                <Users size={20} color={COLORS.textMuted} />
                <Text style={styles.emptyHighlightText}>
                  {otherMembers.length > 0
                    ? 'No members sharing live location'
                    : 'No other members in this trip yet'}
                </Text>
              </View>
            )}

            {/* Farthest (only shown if there are multiple other sharing members) */}
            {farthest && (
              <>
                <View style={styles.hairlineDivider} />
                <TouchableOpacity
                  style={styles.groupedRow}
                  onPress={() => handleSelectMember(farthest)}
                  activeOpacity={0.7}
                >
                  <View style={styles.highlightLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: '#F1F5F9' }]}>
                      <ArrowUpRight size={18} color={COLORS.textSecondary} />
                    </View>
                    <View>
                      <Text style={styles.highlightLabel}>FARTHEST IN TRIP</Text>
                      <Text style={styles.highlightName}>{farthest.name}</Text>
                    </View>
                  </View>
                  <View style={styles.highlightRight}>
                    <DistanceBadge meters={farthest.distanceMeters} />
                    <ChevronRight size={16} color={COLORS.textMuted} />
                  </View>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.hairlineDivider} />

            {/* Dynamic Group Center / Midpoint */}
            <TouchableOpacity
              style={styles.groupedRow}
              activeOpacity={0.7}
              onPress={() => router.push('/(tabs)/map')}
            >
              <View style={styles.highlightLeft}>
                <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <Compass size={18} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.highlightLabel}>GROUP CENTER</Text>
                  <Text style={styles.highlightName} numberOfLines={1}>
                    {centerTitle}
                  </Text>
                </View>
              </View>
              <View style={styles.highlightRight}>
                <Text style={styles.clusterCountTag}>
                  {nearbyActiveCount > 0 ? `${nearbyActiveCount} live` : 'Paused'}
                </Text>
                <ChevronRight size={16} color={COLORS.textMuted} style={{ marginLeft: 4 }} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* SAFETY STATUS CARD */}
        <TouchableOpacity
          style={[styles.safetyCard, !isAllSafe && styles.safetyCardPending]}
          activeOpacity={0.8}
          onPress={() => router.push('/features/check-in')}
        >
          <View style={styles.safetyCardLeft}>
            <View
              style={[
                styles.safetyIconCircle,
                { backgroundColor: isAllSafe ? '#DCFCE7' : '#FEF3C7' },
              ]}
            >
              {isAllSafe ? (
                <ShieldCheck size={20} color={COLORS.success} />
              ) : (
                <ShieldAlert size={20} color={COLORS.warning} />
              )}
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.safetyTitle}>Safety Status Check-In</Text>
              <Text style={styles.safetySub}>
                {totalCrew > 0
                  ? `${safeCrew} of ${totalCrew} ${
                      totalCrew === 1 ? 'friend has' : 'friends have'
                    } checked in as safe`
                  : "Tap to check in and let your crew know you're safe"}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
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
    padding: 16,
    paddingBottom: 32,
  },
  overviewCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionLabel: {
    ...TYPOGRAPHY.badge,
    color: '#64748B',
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
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
    color: COLORS.textPrimary,
  },
  groupedContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#F1F5F9',
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
    backgroundColor: '#F1F5F9',
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
    color: COLORS.textMuted,
    fontSize: 10,
  },
  highlightName: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    marginTop: 1,
  },
  highlightRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clusterCountTag: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
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
    color: COLORS.textSecondary,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginTop: 10,
  },
  safetyCardPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
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
  },
  safetySub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
