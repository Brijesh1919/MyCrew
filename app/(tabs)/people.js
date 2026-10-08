import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, X, Users, UserPlus, Filter } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { MemberCard } from '../../src/components/MemberCard';
import { EmptyState } from '../../src/components/EmptyState';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useTripStore } from '../../src/store/useTripStore';
import { useUserStore } from '../../src/store/useUserStore';
import { memberService } from '../../src/services/memberService';
import { calculateDistanceMeters } from '../../src/utils/distance';
import { PrimaryButton } from '../../src/components/PrimaryButton';

export default function PeopleScreen() {
  const router = useRouter();

  // Stores
  const currentUser = useUserStore((state) => state.currentUser);
  const activeTrip = useTripStore((state) => state.activeTrip);
  const members = useCrewStore((state) => state.members);
  const setSelectedMember = useCrewStore((state) => state.setSelectedMember);
  const userLocation = useLocationStore((state) => state.userLocation);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'active' | 'delayed' | 'offline'

  // EMPTY STATE (No active crew joined)
  if (!activeTrip) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.emptyContainer}>
          <Image
            source={require('../../assets/ill_people_empty.jpg')}
            style={styles.emptyIllustrationImage}
            resizeMode="contain"
          />
          <Text style={styles.emptyTitle}>No Crew Members Yet</Text>
          <Text style={styles.emptyDesc}>
            Join a trip to see who's with you.
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
  const membersWithDistance = filtered.map((m) => ({
    ...m,
    distanceMeters: calculateDistanceMeters(userLocation, m.coordinates),
  }));

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

  const filterTabs = [
    { id: 'all', label: 'All', count: members.length },
    {
      id: 'active',
      label: 'Active',
      count: members.filter((m) => m.status === 'live').length,
    },
    {
      id: 'delayed',
      label: 'Delayed',
      count: members.filter((m) => m.status === 'delayed').length,
    },
    {
      id: 'offline',
      label: 'Offline',
      count: members.filter((m) => m.status === 'offline').length,
    },
  ];

  const handleSelectMember = (member) => {
    setSelectedMember(member);
    router.push({
      pathname: '/features/person',
      params: { memberId: member.id },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Your Crew</Text>
            <Text style={styles.subtitle}>{members.length} members connected</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/trip')}
          >
            <UserPlus size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={18} color={COLORS.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search people..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter Tabs */}
        <View style={styles.filterTabsRow}>
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.filterTab, isActive && styles.filterTabActive]}
                onPress={() => setActiveFilter(tab.id)}
              >
                <Text
                  style={[
                    styles.filterTabTxt,
                    isActive && styles.filterTabTxtActive,
                  ]}
                >
                  {tab.label} ({tab.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Member List */}
        <FlatList
          data={membersWithDistance}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <MemberCard
              member={item}
              distanceMeters={item.distanceMeters}
              isCurrentUser={item.id === currentUser?.id || item.id === 'user'}
              onPress={handleSelectMember}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={Users}
              title="No crew members found"
              description={
                searchQuery
                  ? `No one matched "${searchQuery}" in this filter.`
                  : 'No members in this category right now.'
              }
              actionLabel={searchQuery ? 'Clear Search' : undefined}
              onAction={() => setSearchQuery('')}
            />
          }
        />
      </View>
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
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  title: {
    ...TYPOGRAPHY.h1,
    fontSize: 24,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontSize: 13,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  filterTabsRow: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 6,
  },
  filterTab: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTabTxtActive: {
    color: COLORS.white,
    fontWeight: '700',
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
    color: COLORS.textSecondary,
    marginBottom: 24,
  },
  emptyBtnCol: {
    width: '100%',
    maxWidth: 280,
  },
});
