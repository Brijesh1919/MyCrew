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
import { locationService } from '../../src/services/locationService';
import { formatDistance } from '../../src/utils/distance';

export default function GroupStatusScreen() {
  const router = useRouter();

  const members = useCrewStore((state) => state.members);
  const getStatusCounts = useCrewStore((state) => state.getStatusCounts);
  const setSelectedMember = useCrewStore((state) => state.setSelectedMember);
  const userLocation = useLocationStore((state) => state.userLocation);
  const activeTrip = useTripStore((state) => state.activeTrip);

  const counts = getStatusCounts();
  const sortedByDist = locationService.getNearestMembers(userLocation, members);

  const closest = sortedByDist[0];
  const farthest = sortedByDist[sortedByDist.length - 1];

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
        {closest && (
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
        )}

        {/* Farthest */}
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

        {/* Group center */}
        <View style={styles.highlightCard}>
          <View style={styles.highlightLeft}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.primaryLight }]}>
              <Compass size={18} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.highlightLabel}>GROUP CENTER (CENTROID)</Text>
              <Text style={styles.highlightName}>Main Stage Grounds</Text>
            </View>
          </View>
          <View style={styles.highlightRight}>
            <Text style={styles.clusterCountTag}>12 nearby</Text>
          </View>
        </View>

        {/* SAFETY STATUS CARD */}
        <TouchableOpacity
          style={styles.safetyCard}
          onPress={() => router.push('/features/check-in')}
        >
          <View style={styles.safetyCardLeft}>
            <ShieldCheck size={20} color={COLORS.success} />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.safetyTitle}>Safety Status Check-In</Text>
              <Text style={styles.safetySub}>
                19 of 20 friends have checked in as safe
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
  safetyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
