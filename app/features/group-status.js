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

  const sortedByDist = locationService.getNearestMembers(userLocation, otherMembers);
  const closest = sortedByDist.length > 0 ? sortedByDist[0] : null;
  // Only show farthest if there are at least 2 other members and farthest is distinct
  const farthest =
    sortedByDist.length > 1 &&
    sortedByDist[sortedByDist.length - 1].id !== closest?.id
      ? sortedByDist[sortedByDist.length - 1]
      : null;

  // Real active members with valid GPS coordinates for group centroid
  const membersWithCoords = (members || []).filter(
    (m) =>
      m.coordinates &&
      !isNaN(m.coordinates.latitude) &&
      !isNaN(m.coordinates.longitude) &&
      m.coordinates.latitude !== 0
  );

  const nearbyActiveCount = membersWithCoords.length;
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

        {/* EXTREMES / HIGHLIGHTS CARDS */}
        <Text style={styles.sectionLabel}>CREW GEOMETRY</Text>

        {/* Closest to you */}
        {closest ? (
          <TouchableOpacity
            style={styles.highlightCard}
            onPress={() => handleSelectMember(closest)}
          >
            <View style={styles.highlightLeft}>
              <View style={[styles.iconCircle, { backgroundColor: COLORS.successBg }]}>
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
        ) : otherMembers.length === 0 ? (
          <View style={styles.emptyHighlightCard}>
            <Users size={22} color={COLORS.textMuted} />
            <Text style={styles.emptyHighlightText}>No other members in this trip yet</Text>
            <Text style={styles.emptyHighlightSub}>Share your trip code to invite friends!</Text>
          </View>
        ) : null}

        {/* Farthest (only shown if there are multiple other members) */}
        {farthest && (
          <TouchableOpacity
            style={styles.highlightCard}
            onPress={() => handleSelectMember(farthest)}
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
        )}

        {/* Dynamic Group Center / Centroid */}
        <TouchableOpacity
          style={styles.highlightCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/map')}
        >
          <View style={styles.highlightLeft}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.primaryLight }]}>
              <Compass size={18} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.highlightLabel}>GROUP CENTER (CENTROID)</Text>
              <Text style={styles.highlightName} numberOfLines={1}>
                {centerTitle}
              </Text>
            </View>
          </View>
          <View style={styles.highlightRight}>
            <Text style={styles.clusterCountTag}>
              {nearbyActiveCount > 0
                ? `${nearbyActiveCount} nearby`
                : `${totalCrew} in trip`}
            </Text>
            <ChevronRight size={16} color={COLORS.textMuted} style={{ marginLeft: 4 }} />
          </View>
        </TouchableOpacity>

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
    borderColor: '#E2E8F0',
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  sectionLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 12,
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
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    ...SHADOWS.sm,
  },
  highlightLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  highlightLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  highlightName: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    marginTop: 2,
  },
  highlightRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clusterCountTag: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginTop: 10,
  },
  safetyCardPending: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
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
  emptyHighlightCard: {
    backgroundColor: COLORS.surface,
    padding: 18,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    ...SHADOWS.sm,
  },
  emptyHighlightText: {
    ...TYPOGRAPHY.body,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  emptyHighlightSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
