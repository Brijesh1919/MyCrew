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
  Compass,
  ArrowUp,
  ArrowDown,
  Users,
  Radio,
  ChevronRight,
  Navigation,
} from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { AppHeader } from '../../src/components/AppHeader';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { DistanceBadge } from '../../src/components/DistanceBadge';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useUserStore } from '../../src/store/useUserStore';
import { locationService } from '../../src/services/locationService';
import { calculateBearing, getRelativeDirection } from '../../src/utils/distance';

export default function GroupRadarScreen() {
  const router = useRouter();

  const members = useCrewStore((state) => state.members);
  const setSelectedMember = useCrewStore((state) => state.setSelectedMember);
  const userLocation = useLocationStore((state) => state.userLocation);
  const currentUser = useUserStore((state) => state.currentUser);

  // Filter out the current user so they are not compared against themselves on the radar
  const otherMembers = (members || []).filter((m) => {
    if (!m) return false;
    if (currentUser?.id && m.id === currentUser.id) return false;
    if (m.id === 'user' || m.id === 'me' || m.isCurrentUser) return false;
    if (currentUser?.name && m.name === currentUser.name) return false;
    return true;
  });

  const nearestList = locationService.getNearestMembers(userLocation, otherMembers);

  // Classify ahead vs behind based on relative bearing
  let aheadCount = 0;
  let behindCount = 0;
  const offlineCount = otherMembers.filter((m) => m.status === 'offline').length;

  nearestList.forEach((m) => {
    const bearing = userLocation && m.coordinates ? calculateBearing(userLocation, m.coordinates) : 0;
    const rel = getRelativeDirection(userLocation?.heading || 0, bearing);
    if (rel.direction === 'ahead' || rel.direction === 'slight_right' || rel.direction === 'slight_left') {
      aheadCount++;
    } else {
      behindCount++;
    }
  });

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    router.push({
      pathname: '/features/navigation',
      params: { memberId: member.id },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader
        title="Group Radar"
        subtitle="Orientation & proximity breakdown"
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* RADAR ORIENTATION SUMMARY */}
        <View style={styles.radarCard}>
          <View style={styles.radarCircleGraphic}>
            <View style={styles.userCenterPin}>
              <View style={styles.userCenterDot} />
              <Text style={styles.userCenterLabel}>YOU</Text>
            </View>
          </View>

          <View style={styles.orientationStatsRow}>
            <View style={styles.statCol}>
              <ArrowUp size={20} color={COLORS.primary} />
              <Text style={styles.statCount}>{aheadCount}</Text>
              <Text style={styles.statLabel}>Ahead of you</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <ArrowDown size={20} color={COLORS.secondary} />
              <Text style={styles.statCount}>{behindCount}</Text>
              <Text style={styles.statLabel}>Behind you</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statCol}>
              <Radio size={20} color={COLORS.danger} />
              <Text style={styles.statCount}>{offlineCount}</Text>
              <Text style={styles.statLabel}>Offline</Text>
            </View>
          </View>
        </View>

        {/* NEARBY MEMBERS PROXIMITY LIST */}
        <Text style={styles.sectionLabel}>CREW PROXIMITY</Text>

        {nearestList.length === 0 ? (
          <View style={styles.emptyRadarBox}>
            <Users size={24} color={COLORS.textMuted} />
            <Text style={styles.emptyRadarTxt}>
              {otherMembers.length > 0
                ? 'All other crew members have paused location sharing'
                : 'No other crew members connected yet'}
            </Text>
          </View>
        ) : (
          nearestList.map((m) => {
            const bearing = userLocation && m.coordinates ? calculateBearing(userLocation, m.coordinates) : 0;
            const rel = getRelativeDirection(userLocation?.heading || 0, bearing);

            return (
              <TouchableOpacity
                key={m.id}
                style={styles.memberRow}
                activeOpacity={0.8}
                onPress={() => handleSelectMember(m)}
              >
                <View style={styles.bearingArrowBox}>
                  <Text style={styles.bearingArrow}>{rel.arrow}</Text>
                </View>

                <MemberAvatar
                  uri={m.avatar}
                  name={m.name}
                  size="md"
                  status={m.status}
                />

                <View style={styles.info}>
                  <Text style={styles.name}>{m.name}</Text>
                  <Text style={styles.relText}>{rel.label}</Text>
                </View>

                <DistanceBadge meters={m.distanceMeters} />
                <ChevronRight size={16} color={COLORS.textMuted} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyRadarBox: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  emptyRadarTxt: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  radarCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    ...SHADOWS.md,
  },
  radarCircleGraphic: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(37, 99, 235, 0.2)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  userCenterPin: {
    alignItems: 'center',
  },
  userCenterDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.success,
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOWS.sm,
  },
  userCenterLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textPrimary,
    fontSize: 10,
    marginTop: 4,
  },
  orientationStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: 10,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E2E8F0',
  },
  statCount: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  sectionLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: RADIUS.lg,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  bearingArrowBox: {
    width: 32,
    alignItems: 'center',
    marginRight: 8,
  },
  bearingArrow: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  name: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  relText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
});
