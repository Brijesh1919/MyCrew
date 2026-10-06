import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
import { locationService } from '../../src/services/locationService';

export default function FindNearestScreen() {
  const router = useRouter();

  const members = useCrewStore((state) => state.members);
  const setSelectedMember = useCrewStore((state) => state.setSelectedMember);
  const userLocation = useLocationStore((state) => state.userLocation);

  const nearestList = locationService.getNearestMembers(userLocation, members);

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader
        title="Find Nearest"
        subtitle="Who's closest to you?"
        showBack={true}
      />

      <FlatList
        data={nearestList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.itemCard, index === 0 && styles.closestCard]}
            activeOpacity={0.8}
            onPress={() => handleSelectMember(item)}
          >
            {/* Rank index */}
            <View style={[styles.rankBox, index === 0 && styles.rankBoxClosest]}>
              <Text style={[styles.rankText, index === 0 && styles.rankTextClosest]}>
                #{index + 1}
              </Text>
            </View>

            <MemberAvatar
              uri={item.avatar}
              name={item.name}
              size="md"
              status={item.status}
            />

            <View style={styles.info}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.name}</Text>
                {index === 0 && (
                  <View style={styles.closestPill}>
                    <Text style={styles.closestPillText}>Closest</Text>
                  </View>
                )}
              </View>
              <View style={styles.statusRow}>
                <StatusBadge
                  status={item.status}
                  lastSeenSecondsAgo={item.lastSeenSecondsAgo}
                  size="sm"
                />
              </View>
            </View>

            <View style={styles.rightSection}>
              <DistanceBadge meters={item.distanceMeters} isHighlight={index === 0} />
              <TouchableOpacity
                style={styles.walkBtn}
                onPress={() => handleDirectNavigate(item)}
              >
                <Navigation size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon={Users}
            title={!userLocation ? "Finding your GPS location…" : "No crew members nearby"}
            description={
              !userLocation
                ? "Waiting for accurate device GPS coordinates to calculate real distances."
                : "None of your crew members have active location sharing turned on right now."
            }
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: RADIUS.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.sm,
  },
  closestCard: {
    borderColor: COLORS.primary,
    backgroundColor: '#F8FAFF',
  },
  rankBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  rankBoxClosest: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankText: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  rankTextClosest: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
  },
  closestPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
  },
  closestPillText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  statusRow: {
    marginTop: 3,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walkBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
