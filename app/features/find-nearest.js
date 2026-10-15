import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Navigation, Users } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { AppHeader } from '../../src/components/AppHeader';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { StatusBadge } from '../../src/components/StatusBadge';
import { DistanceBadge } from '../../src/components/DistanceBadge';
import { EmptyState } from '../../src/components/EmptyState';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useUserStore } from '../../src/store/useUserStore';
import { locationService } from '../../src/services/locationService';

export default function FindNearestScreen() {
  const router = useRouter();

  const members = useCrewStore((state) => state.members);
  const setSelectedMember = useCrewStore((state) => state.setSelectedMember);
  const userLocation = useLocationStore((state) => state.userLocation);
  const currentUser = useUserStore((state) => state.currentUser);

  const otherMembers = useMemo(() => {
    const myId = String(currentUser?.id || currentUser?.user_id || '');
    const myName = currentUser?.name;
    return (members || []).filter((m) => {
      const isMe =
        Boolean(m.isCurrentUser) ||
        m.id === 'user' ||
        m.id === 'me' ||
        (myId && (String(m.id) === myId || String(m.user_id) === myId)) ||
        (myName && m.name === myName);
      return !isMe;
    });
  }, [members, currentUser]);

  const nearestList = useMemo(() => {
    return locationService.getNearestMembers(userLocation, otherMembers);
  }, [userLocation, otherMembers]);

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    router.push({
      pathname: '/features/person',
      params: { memberId: member.id },
    });
  };

  const handleDirectNavigate = (member) => {
    setSelectedMember(member);
    router.push({
      pathname: '/features/navigation',
      params: { memberId: member.id },
    });
  };

  const closestMember = nearestList && nearestList.length > 0 ? nearestList[0] : null;
  const otherNearest = nearestList && nearestList.length > 1 ? nearestList.slice(1) : [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader
        title="Find Nearest"
        subtitle="Who's closest to you?"
        showBack={true}
      />

      {nearestList.length === 0 ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={Users}
            title={!userLocation ? "Finding your GPS location…" : "No crew members nearby"}
            description={
              !userLocation
                ? "Waiting for accurate device GPS coordinates to calculate real distances."
                : "None of your crew members have active location sharing turned on right now."
            }
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* #1 FEATURED CLOSEST MEMBER HERO */}
          {closestMember && (
            <View style={styles.featuredSection}>
              <View style={styles.featuredCard}>
                <View style={styles.featuredTopRow}>
                  <View style={styles.featuredPill}>
                    <Text style={styles.featuredPillText}>#1 CLOSEST TO YOU</Text>
                  </View>
                  <DistanceBadge meters={closestMember.distanceMeters} isHighlight={true} />
                </View>

                <TouchableOpacity
                  style={styles.featuredBody}
                  activeOpacity={0.8}
                  onPress={() => handleSelectMember(closestMember)}
                >
                  <MemberAvatar
                    uri={closestMember.avatar}
                    name={closestMember.name}
                    size="lg"
                    status={closestMember.status}
                  />
                  <View style={styles.featuredInfo}>
                    <Text style={styles.featuredName}>{closestMember.name}</Text>
                    <View style={{ marginTop: 4 }}>
                      <StatusBadge
                        status={closestMember.status}
                        lastSeenSecondsAgo={closestMember.lastSeenSecondsAgo}
                        size="sm"
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.featuredNavBtn}
                  onPress={() => handleDirectNavigate(closestMember)}
                  activeOpacity={0.85}
                >
                  <Navigation size={16} color={COLORS.white} style={{ marginRight: 6 }} />
                  <Text style={styles.featuredNavBtnText}>
                    Walk to {closestMember.name}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* OTHER NEARBY CREW MEMBERS (INSET GROUPED LIST) */}
          {otherNearest.length > 0 && (
            <View style={styles.otherSection}>
              <Text style={styles.otherSectionLabel}>OTHER CREW MEMBERS</Text>
              <View style={styles.groupedContainer}>
                {otherNearest.map((item, idx) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.rowItem,
                      idx < otherNearest.length - 1 && styles.rowItemBorder,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleSelectMember(item)}
                  >
                    <View style={styles.rankBox}>
                      <Text style={styles.rankText}>#{idx + 2}</Text>
                    </View>

                    <MemberAvatar
                      uri={item.avatar}
                      name={item.name}
                      size="sm"
                      status={item.status}
                    />

                    <View style={styles.info}>
                      <Text style={styles.name}>{item.name}</Text>
                      <View style={styles.statusRow}>
                        <StatusBadge
                          status={item.status}
                          lastSeenSecondsAgo={item.lastSeenSecondsAgo}
                          size="sm"
                        />
                      </View>
                    </View>

                    <View style={styles.rightSection}>
                      <DistanceBadge meters={item.distanceMeters} isHighlight={false} />
                      <TouchableOpacity
                        style={styles.walkBtn}
                        onPress={() => handleDirectNavigate(item)}
                      >
                        <Navigation size={14} color={COLORS.primary} />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
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
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  featuredSection: {
    marginBottom: 20,
  },
  featuredCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    ...SHADOWS.sm,
  },
  featuredTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  featuredPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  featuredPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  featuredBody: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featuredInfo: {
    marginLeft: 14,
    flex: 1,
  },
  featuredName: {
    ...TYPOGRAPHY.h2,
    fontSize: 19,
  },
  featuredNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
  },
  featuredNavBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  otherSection: {
    marginBottom: 20,
  },
  otherSectionLabel: {
    ...TYPOGRAPHY.badge,
    color: '#64748B',
    fontSize: 11,
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.8,
  },
  groupedContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  rowItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rankBox: {
    width: 28,
    marginRight: 6,
  },
  rankText: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textMuted,
    fontSize: 12,
  },
  info: {
    marginLeft: 10,
    flex: 1,
  },
  name: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  statusRow: {
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walkBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
