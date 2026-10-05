import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Users,
  Compass,
  MapPin,
  Navigation,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, TYPOGRAPHY } from '../../src/constants/theme';
import { MapView } from '../../src/components/MapView';
import { BottomSheet } from '../../src/components/BottomSheet';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { StatusBadge } from '../../src/components/StatusBadge';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useMeetingPointStore } from '../../src/store/useMeetingPointStore';
import { useTripStore } from '../../src/store/useTripStore';
import { calculateDistanceMeters } from '../../src/utils/distance';
import { SecondaryButton } from '../../src/components/SecondaryButton';

export default function MapScreen() {
  const router = useRouter();

  // Stores
  const activeTrip = useTripStore((state) => state.activeTrip);
  const members = useCrewStore((state) => state.members);
  const getClusters = useCrewStore((state) => state.getClusters);
  const getStatusCounts = useCrewStore((state) => state.getStatusCounts);
  const setSelectedMember = useCrewStore((state) => state.setSelectedMember);
  const userLocation = useLocationStore((state) => state.userLocation);
  const meetingPoints = useMeetingPointStore((state) => state.meetingPoints);

  // States
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedMemberModal, setSelectedMemberModal] = useState(null);
  const [selectedPointModal, setSelectedPointModal] = useState(null);
  const [clusterMode, setClusterMode] = useState(true);

  // EMPTY STATE (No active trip joined)
  if (!activeTrip) {
    return (
      <SafeAreaView style={styles.emptySafeContainer}>
        <View style={styles.emptyContentBox}>
          <View style={styles.emptyIconCircle}>
            <MapPin size={40} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Crew Location Yet</Text>
          <Text style={styles.emptyDesc}>
            Join a crew to see your group on the live map.
          </Text>
          <View style={styles.emptyBtnCol}>
            <PrimaryButton
              title="Join a Crew"
              onPress={() => router.push('/(auth)/join')}
              size="lg"
              style={{ marginBottom: 12 }}
            />
            <SecondaryButton
              title="Create a New Trip"
              onPress={() => router.push('/(auth)/create-trip')}
              size="md"
              variant="outline"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const clusters = getClusters();
  const counts = getStatusCounts();

  const handleNavigateTo = (member) => {
    setSelectedMember(member);
    setSelectedMemberModal(null);
    router.push({
      pathname: '/features/navigation',
      params: { memberId: member.id },
    });
  };

  return (
    <View style={styles.container}>
      {/* Full-screen responsive MapView */}
      <MapView
        userLocation={userLocation}
        members={members}
        clusters={clusters}
        meetingPoints={meetingPoints}
        onSelectCluster={(c) => setSelectedCluster(c)}
        onSelectMember={(m) => setSelectedMemberModal(m)}
        onSelectMeetingPoint={(mp) => setSelectedPointModal(mp)}
        height="100%"
        interactive={true}
        showClusters={clusterMode}
        showMeetingPoints={true}
        style={{ flex: 1 }}
      />

      {/* Floating Header Overlay */}
      <SafeAreaView style={styles.floatingHeader} edges={['top']}>
        <View style={styles.headerBar}>
          <View style={styles.titleInfo}>
            <Text style={styles.headerTitle}>Crew Live Map</Text>
            <Text style={styles.headerSub}>
              {counts.active} Active • {clusters.length} Clusters
            </Text>
          </View>

          {/* Toggle between Cluster view and Individual pins */}
          <TouchableOpacity
            style={[styles.clusterToggleBtn, !clusterMode && styles.clusterToggleBtnActive]}
            onPress={() => setClusterMode((prev) => !prev)}
          >
            <Text style={[styles.clusterToggleTxt, !clusterMode && styles.clusterToggleTxtActive]}>
              {clusterMode ? 'Clusters' : 'All Pins'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Floating Bottom Quick Bar */}
      <View style={styles.floatingBottom}>
        <View style={styles.bottomBarCard}>
          <TouchableOpacity
            style={styles.quickBarBtn}
            onPress={() => router.push('/features/find-nearest')}
          >
            <Users size={18} color={COLORS.primary} />
            <Text style={styles.quickBarBtnText}>Nearest</Text>
          </TouchableOpacity>

          <View style={styles.barDivider} />

          <TouchableOpacity
            style={styles.quickBarBtn}
            onPress={() => router.push('/features/meeting-point')}
          >
            <MapPin size={18} color={COLORS.primary} />
            <Text style={styles.quickBarBtnText}>Set Meeting Point</Text>
          </TouchableOpacity>

          <View style={styles.barDivider} />

          <TouchableOpacity
            style={styles.quickBarBtn}
            onPress={() => router.push('/features/group-radar')}
          >
            <Compass size={18} color={COLORS.primary} />
            <Text style={styles.quickBarBtnText}>Radar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CLUSTER MODAL */}
      <BottomSheet
        visible={Boolean(selectedCluster)}
        onClose={() => setSelectedCluster(null)}
        title={selectedCluster?.name || 'Cluster'}
        subtitle={`${selectedCluster?.count || 0} People Gathered`}
      >
        <View>
          <Text style={styles.clusterSub}>{selectedCluster?.description}</Text>
          <View style={styles.sheetList}>
            {selectedCluster?.members?.map((m) => {
              const dist = calculateDistanceMeters(userLocation, m.coordinates);
              return (
                <TouchableOpacity
                  key={m.id}
                  style={styles.sheetRow}
                  onPress={() => {
                    setSelectedCluster(null);
                    setSelectedMemberModal(m);
                  }}
                >
                  <MemberAvatar
                    uri={m.avatar}
                    name={m.name}
                    size="sm"
                    status={m.status}
                  />
                  <View style={styles.sheetInfo}>
                    <Text style={styles.sheetName}>{m.name}</Text>
                    <Text style={styles.sheetDistance}>
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
        </View>
      </BottomSheet>

      {/* MEMBER DETAIL MODAL */}
      <BottomSheet
        visible={Boolean(selectedMemberModal)}
        onClose={() => setSelectedMemberModal(null)}
        title={selectedMemberModal?.name?.toUpperCase()}
        subtitle={
          selectedMemberModal
            ? `${calculateDistanceMeters(userLocation, selectedMemberModal.coordinates)} m away`
            : ''
        }
      >
        {selectedMemberModal && (
          <View>
            <View style={styles.memberModalRow}>
              <MemberAvatar
                uri={selectedMemberModal.avatar}
                name={selectedMemberModal.name}
                size="lg"
                status={selectedMemberModal.status}
              />
              <View style={styles.memberModalInfo}>
                <Text style={styles.modalMemberName}>{selectedMemberModal.name}</Text>
                <StatusBadge
                  status={selectedMemberModal.status}
                  lastSeenSecondsAgo={selectedMemberModal.lastSeenSecondsAgo}
                  showDetail={true}
                />
                <Text style={styles.modalMemberSub}>
                  Cluster: {selectedMemberModal.cluster || 'General Grounds'}
                </Text>
              </View>
            </View>

            <PrimaryButton
              title={`Walk to ${selectedMemberModal.name}`}
              onPress={() => handleNavigateTo(selectedMemberModal)}
              icon={Navigation}
              size="lg"
              style={{ marginTop: 14 }}
            />
          </View>
        )}
      </BottomSheet>

      {/* MEETING POINT MODAL */}
      <BottomSheet
        visible={Boolean(selectedPointModal)}
        onClose={() => setSelectedPointModal(null)}
        title={selectedPointModal?.name}
        subtitle={`Created by ${selectedPointModal?.createdBy}`}
      >
        {selectedPointModal && (
          <View>
            <Text style={styles.pointDesc}>
              {selectedPointModal.description || 'Designated crew regroup spot'}
            </Text>
            <View style={styles.pointStatBox}>
              <Users size={16} color={COLORS.primary} />
              <Text style={styles.pointStatText}>
                {selectedPointModal.nearbyCount} people are within 600 m
              </Text>
            </View>

            <PrimaryButton
              title="Navigate to Meeting Point"
              onPress={() => {
                setSelectedPointModal(null);
                router.push({
                  pathname: '/features/navigation',
                  params: {
                    destName: selectedPointModal.name,
                    destLat: selectedPointModal.coordinates.latitude,
                    destLon: selectedPointModal.coordinates.longitude,
                  },
                });
              }}
              icon={MapPin}
              size="lg"
              style={{ marginTop: 12 }}
            />
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerBar: {
    marginHorizontal: 16,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    maxWidth: 440,
    width: '92%',
    alignSelf: 'center',
    ...SHADOWS.md,
  },
  titleInfo: {
    flex: 1,
  },
  headerTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
    fontSize: 16,
  },
  headerSub: {
    ...TYPOGRAPHY.caption,
    color: '#94A3B8',
    marginTop: 2,
    fontSize: 11,
  },
  clusterToggleBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  clusterToggleBtnActive: {
    backgroundColor: COLORS.primary,
  },
  clusterToggleTxt: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  clusterToggleTxtActive: {
    color: COLORS.white,
  },
  floatingBottom: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  bottomBarCard: {
    width: '92%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.lg,
  },
  quickBarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  quickBarBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginLeft: 6,
    fontSize: 12,
  },
  barDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  clusterSub: {
    ...TYPOGRAPHY.bodySecondary,
    marginBottom: 14,
  },
  sheetList: {
    maxHeight: 280,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    padding: 10,
    borderRadius: RADIUS.md,
    marginBottom: 8,
  },
  sheetInfo: {
    marginLeft: 10,
    flex: 1,
  },
  sheetName: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
  },
  sheetDistance: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  memberModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  memberModalInfo: {
    marginLeft: 16,
    flex: 1,
  },
  modalMemberName: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    marginBottom: 4,
  },
  modalMemberSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  pointDesc: {
    ...TYPOGRAPHY.bodySecondary,
    marginBottom: 12,
  },
  pointStatBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 14,
  },
  pointStatText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 13,
  },
  emptySafeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContentBox: {
    alignItems: 'center',
    paddingHorizontal: 24,
    maxWidth: 360,
  },
  emptyIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
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
  },
});
