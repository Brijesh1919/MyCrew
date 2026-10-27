import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  X,
  ChevronLeft,
  ShieldCheck,
  Users,
} from 'lucide-react-native';
import { RADIUS, TYPOGRAPHY } from '../../src/constants/theme';
import { MemberCard } from '../../src/components/MemberCard';
import { MemberBottomSheet } from '../../src/components/MemberBottomSheet';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useTripStore } from '../../src/store/useTripStore';
import { useUserStore } from '../../src/store/useUserStore';
import { useThemeStore } from '../../src/store/useThemeStore';
import { memberService } from '../../src/services/memberService';
import { calculateDistanceMeters } from '../../src/utils/distance';
import { formatRemainingTime } from '../../src/utils/freshness';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function PeopleScreen() {
  const router = useRouter();
  const colors = useThemeStore((state) => state.colors);
  const isDark = useThemeStore((state) => state.isDark);
  const { triggerLight, triggerSuccess } = useHapticFeedback();

  // Stores
  const currentUser = useUserStore((state) => state.currentUser);
  const activeTrip = useTripStore((state) => state.activeTrip);
  const members = useCrewStore((state) => state.members);
  const userLocation = useLocationStore((state) => state.userLocation);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'active' | 'delayed' | 'offline'

  // Bottom Sheet State
  const [selectedMember, setSelectedMember] = useState(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  // Safe check-in toggle
  const [isSelfSafe, setIsSelfSafe] = useState(true);

  // EMPTY STATE (No active crew joined)
  if (!activeTrip) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
        <View style={styles.emptyContainer}>
          <Image
            source={require('../../assets/ill_people_empty.png')}
            style={styles.emptyIllustrationImage}
            resizeMode="contain"
          />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Crew Members Yet</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Join or start a trip to see who's with you.
          </Text>
          <View style={styles.emptyBtnCol}>
            <PrimaryButton
              title="Join a Crew"
              onPress={() => router.push('/(auth)/join')}
              size="lg"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Filter & sort members
  const filtered = memberService.filterMembers(members, activeFilter, searchQuery);

  // Calculate distance & sort: YOU at top, then ORGANIZER, then nearest
  const membersWithDistance = filtered.map((m) => {
    const isMe =
      m.id === currentUser?.id ||
      m.id === 'user' ||
      m.id === 'me' ||
      m.isCurrentUser ||
      (currentUser?.name && m.name === currentUser.name);
    const canMeasure = !isMe && m.status !== 'offline' && m.coordinates;

    return {
      ...m,
      distanceMeters: canMeasure
        ? calculateDistanceMeters(userLocation, m.coordinates)
        : null,
    };
  });

  membersWithDistance.sort((a, b) => {
    const aIsMe = a.id === currentUser?.id || a.id === 'user';
    const bIsMe = b.id === currentUser?.id || b.id === 'user';
    if (aIsMe) return -1;
    if (bIsMe) return 1;

    const aIsOrg = a.role === 'organizer' || a.isOrganizer;
    const bIsOrg = b.role === 'organizer' || b.isOrganizer;
    if (aIsOrg && !bIsOrg) return -1;
    if (!aIsOrg && bIsOrg) return 1;

    const distA = a.distanceMeters !== undefined && a.distanceMeters !== null ? a.distanceMeters : 999999;
    const distB = b.distanceMeters !== undefined && b.distanceMeters !== null ? b.distanceMeters : 999999;
    return distA - distB;
  });

  // Calculate status counts
  const activeCount = members.filter((m) => m.status === 'live').length;
  const delayedCount = members.filter((m) => m.status === 'delayed').length;
  const offlineCount = members.filter((m) => m.status === 'offline').length;
  const safeCount = members.filter((m) => m.isSafe !== false).length || Math.min(11, members.length);
  const totalCount = members.length;

  // Filter pills
  const filterTabs = [
    { id: 'active', label: `${activeCount} active`, dot: '#22C55E' },
    { id: 'delayed', label: `${delayedCount} delayed`, dot: '#F59E0B' },
    { id: 'offline', label: `${offlineCount} offline`, dot: '#64748B' },
  ];

  const handleMemberPress = (member) => {
    triggerLight();
    setSelectedMember(member);
    setShowBottomSheet(true);
  };

  const handleToggleSafe = () => {
    triggerSuccess();
    setIsSelfSafe(!isSelfSafe);
  };

  const handleNavigateToMember = (member) => {
    if (!member?.coordinates) return;
    router.push({
      pathname: '/(tabs)/home',
      params: {
        targetLat: member.coordinates.latitude,
        targetLng: member.coordinates.longitude,
        targetName: member.name,
        targetType: 'person',
        showPath: 'true',
      },
    });
  };

  const handlePingMember = (member) => {
    router.push({
      pathname: '/features/chat',
      params: { memberId: member.id },
    });
  };

  const tripRemaining = activeTrip?.endTime ? formatRemainingTime(activeTrip.endTime) : 'ends in 1 d 14 h';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0B0F17' : colors.background }]} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: isDark ? '#111827' : '#F3F4F6' }]}
            onPress={() => router.push('/(tabs)/home')}
            activeOpacity={0.75}
          >
            <ChevronLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={[styles.tripTitle, { color: colors.textPrimary }]} numberOfLines={1}>
              {activeTrip.name || 'Goa Trip'}
            </Text>
            <Text style={[styles.tripSub, { color: colors.textSecondary }]}>
              Day 1 of 3 · {tripRemaining}
            </Text>
          </View>

          {/* Safe Badge at top right */}
          <View style={[styles.checkedInBadge, { backgroundColor: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.35)' }]}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>{safeCount}/{totalCount}</Text>
          </View>
        </View>

        {/* Group Check-In Card */}
        <View style={[styles.checkInCard, { backgroundColor: isDark ? '#111827' : colors.surface, borderColor: isDark ? '#1F2937' : colors.border }]}>
          <View style={styles.checkInLeft}>
            <View style={[styles.checkInIconWrap, { backgroundColor: isDark ? '#1F2937' : '#E2E8F0' }]}>
              <ShieldCheck size={20} color={isDark ? '#F9FAFB' : colors.primary} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={[styles.checkInTitle, { color: colors.textPrimary }]}>Group check-in</Text>
              <Text style={[styles.checkInSub, { color: colors.textSecondary }]}>
                {safeCount} of {totalCount} checked in safe
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.safeBtn,
              { backgroundColor: isSelfSafe ? '#4ADE80' : isDark ? '#1F2937' : '#E2E8F0' },
            ]}
            onPress={handleToggleSafe}
            activeOpacity={0.8}
          >
            <Text style={[styles.safeBtnText, { color: isSelfSafe ? '#000000' : colors.textPrimary }]}>
              {isSelfSafe ? "I'm safe" : "Check in"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Pills Row */}
        <View style={styles.filterRow}>
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isDark ? '#111827' : '#F3F4F6',
                    borderColor: isActive ? colors.primary : isDark ? '#1F2937' : '#E5E7EB',
                  },
                  isActive && { borderWidth: 1.5 },
                ]}
                onPress={() => setActiveFilter(activeFilter === tab.id ? 'all' : tab.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.pillDot, { backgroundColor: tab.dot }]} />
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isActive ? colors.textPrimary : colors.textSecondary },
                    isActive && { fontWeight: '700' },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#111827' : '#F3F4F6', borderColor: isDark ? '#1F2937' : '#E5E7EB' }]}>
          <Search size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Find someone..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Section Header: NEAREST TO YOU */}
        <Text style={styles.sectionHeader}>NEAREST TO YOU</Text>

        {/* Flat Member List */}
        <FlatList
          data={membersWithDistance}
          keyExtractor={(item, index) => (item.id ? `person_${item.id}` : `person_idx_${index}`)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <MemberCard
              member={item}
              distanceMeters={item.distanceMeters}
              isHighlighted={selectedMember?.id === item.id}
              isCurrentUser={item.id === currentUser?.id || item.id === 'user'}
              onPress={handleMemberPress}
            />
          )}
        />
      </View>

      {/* Member Bottom Sheet Modal */}
      <MemberBottomSheet
        visible={showBottomSheet}
        member={selectedMember}
        userLocation={userLocation}
        onClose={() => {
          setShowBottomSheet(false);
          setSelectedMember(null);
        }}
        onNavigate={handleNavigateToMember}
        onChat={(member) => {
          setShowBottomSheet(false);
          setSelectedMember(null);
          router.push({
            pathname: '/(tabs)/chat',
            params: { memberId: member.id, memberName: member.name },
          });
        }}
        onPing={(member) => {
          triggerSuccess();
          Alert.alert('Ping Sent!', `Sent a reunion beacon ping to ${member.name}.`);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  tripSub: {
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '500',
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#22C55E',
  },
  checkInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 12,
  },
  checkInLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkInIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  checkInSub: {
    fontSize: 12.5,
    marginTop: 2,
  },
  safeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
  },
  safeBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 23,
    paddingHorizontal: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIllustrationImage: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 24,
  },
  emptyBtnCol: {
    width: '100%',
    maxWidth: 280,
  },
});
