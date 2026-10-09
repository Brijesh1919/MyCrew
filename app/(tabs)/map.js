import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Users,
  Compass,
  MapPin,
  Navigation,
  Trash2,
  Plus,
  X,
  Check,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS, TYPOGRAPHY } from '../../src/constants/theme';
import { MapView } from '../../src/components/MapView';
import { BottomSheet } from '../../src/components/BottomSheet';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { StatusBadge } from '../../src/components/StatusBadge';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { LocationPermissionModal } from '../../src/components/LocationPermissionModal';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useMeetingPointStore } from '../../src/store/useMeetingPointStore';
import { useTripStore } from '../../src/store/useTripStore';
import { useUserStore } from '../../src/store/useUserStore';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';
import { calculateDistanceMeters } from '../../src/utils/distance';
import { locationService } from '../../src/services/locationService';

export default function MapScreen() {
  const router = useRouter();
  const { triggerLight, triggerSuccess, triggerWarning } = useHapticFeedback();

  // Stores
  const activeTrip = useTripStore((state) => state.activeTrip);
  const currentUser = useUserStore((state) => state.currentUser);
  const members = useCrewStore((state) => state.members);
  const getClusters = useCrewStore((state) => state.getClusters);
  const getStatusCounts = useCrewStore((state) => state.getStatusCounts);
  const setSelectedMember = useCrewStore((state) => state.setSelectedMember);
  const userLocation = useLocationStore((state) => state.userLocation);
  const meetingPoints = useMeetingPointStore((state) => state.meetingPoints);
  const addMeetingPoint = useMeetingPointStore((state) => state.addMeetingPoint);
  const deleteMeetingPoint = useMeetingPointStore((state) => state.deleteMeetingPoint);

  // States
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [selectedMemberModal, setSelectedMemberModal] = useState(null);
  const [selectedPointModal, setSelectedPointModal] = useState(null);
  const [clusterMode, setClusterMode] = useState(true);

  // Manual Pin Placement State
  const [isPinDropMode, setIsPinDropMode] = useState(false);
  const [pinCenterCoord, setPinCenterCoord] = useState(null);
  const [showCreatePointModal, setShowCreatePointModal] = useState(false);
  const [newPointName, setNewPointName] = useState('Crew Regroup Spot');
  const [newPointDesc, setNewPointDesc] = useState('');
  const [newPointRadius, setNewPointRadius] = useState(500);
  const [isCreatingPoint, setIsCreatingPoint] = useState(false);
  const [confirmDeletePointId, setConfirmDeletePointId] = useState(null);

  // Location permission states
  const [permissionState, setPermissionState] = useState('granted');
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    locationService.checkPermission().then((res) => {
      if (!isMounted) return;
      if (res.status === 'granted') {
        setPermissionState('granted');
      } else if (res.status === 'blocked' || res.canAskAgain === false) {
        setPermissionState('blocked');
      } else {
        setPermissionState('undetermined');
        if (activeTrip) {
          setShowPermissionModal(true);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeTrip?.id]);

  useEffect(() => {
    if (activeTrip?.id) {
      useMeetingPointStore.getState().fetchTripMeetingPoints(activeTrip.id, members);
    }
  }, [activeTrip?.id]);

  const handleAllowPermission = async () => {
    const res = await locationService.requestPermission();
    if (res.granted) {
      setPermissionState('granted');
      useLocationStore.getState().setPermissionStatus('granted');
      setShowPermissionModal(false);
      const pos = await locationService.getCurrentPosition(true);
      if (pos) {
        useLocationStore.getState().setUserLocation(pos);
      }
    } else {
      if (res.status === 'blocked' || res.canAskAgain === false) {
        setPermissionState('blocked');
      } else {
        setPermissionState('denied');
        setShowPermissionModal(false);
      }
    }
  };

  // EMPTY STATE (No active trip joined)
  if (!activeTrip) {
    return (
      <SafeAreaView style={styles.emptySafeContainer}>
        <View style={styles.emptyContentBox}>
          <Image
            source={require('../../assets/ill_map_empty.jpg')}
            style={styles.emptyIllustrationImage}
            resizeMode="contain"
          />
          <Text style={styles.emptyTitle}>No Crew Location Yet</Text>
          <Text style={styles.emptyDesc}>
            Join a crew to see your group on the live map.
          </Text>
          <View style={styles.emptyBtnCol}>
            <PrimaryButton
              title="Join a Crew"
              onPress={() => router.push('/(auth)/join')}
              size="lg"
              fullWidth={true}
              style={styles.emptyActionBtn}
            />
            <SecondaryButton
              title="Create a New Trip"
              onPress={() => router.push('/(auth)/create-trip')}
              size="lg"
              fullWidth={true}
              variant="outline"
              style={styles.emptyActionBtn}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const clusters = getClusters(currentUser?.id);
  const counts = getStatusCounts();

  const handleNavigateTo = (member) => {
    setSelectedMember(member);
    setSelectedMemberModal(null);
    router.push({
      pathname: '/features/navigation',
      params: { memberId: member.id },
    });
  };

  const handleDeleteMeetingPoint = () => {
    if (!selectedPointModal) return;
    Alert.alert(
      'Delete Meeting Point',
      `Are you sure you want to delete "${selectedPointModal.name}"? This regroup spot will be removed for the entire crew.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const idToDelete = selectedPointModal.id;
            setSelectedPointModal(null);
            triggerWarning();
            await deleteMeetingPoint(idToDelete);
          },
        },
      ]
    );
  };

  const handleSaveMeetingPoint = async () => {
    if (!newPointName.trim()) {
      Alert.alert('Required', 'Please enter a name for this meeting point.');
      return;
    }
    setIsCreatingPoint(true);
    try {
      const coords = pinCenterCoord || (userLocation ? { latitude: userLocation.latitude, longitude: userLocation.longitude } : { latitude: 20.5937, longitude: 78.9629 });
      await addMeetingPoint(
        {
          tripId: activeTrip.id,
          name: newPointName.trim(),
          description: newPointDesc.trim(),
          createdBy: currentUser?.name || 'You',
          createdById: currentUser?.id || 'me',
          coordinates: coords,
          radiusMeters: newPointRadius,
        },
        members
      );

      triggerSuccess();
      setShowCreatePointModal(false);
      setIsPinDropMode(false);
    } catch (e) {
      console.warn('Error saving meeting point:', e);
      Alert.alert('Error', 'Could not save meeting point. Please try again.');
    } finally {
      setIsCreatingPoint(false);
    }
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
        providerBadgeTop={100}
        controlsBottomOffset={84}
        isPinDropMode={isPinDropMode}
        onCameraChange={(coord) => setPinCenterCoord(coord)}
        style={{ flex: 1 }}
      />

      {/* Floating Header Overlay or Pin Drop Header */}
      {isPinDropMode ? (
        <SafeAreaView style={styles.pinDropTopBanner} edges={['top']}>
          <View style={styles.pinDropTopCard}>
            <View style={styles.pinDropTopIconBox}>
              <MapPin size={20} color={COLORS.white} />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.pinDropTopTitle}>Pin Meeting Point on Map</Text>
              <Text style={styles.pinDropTopSub}>
                Pan map to align center pin at desired spot.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.pinDropCloseBtn}
              onPress={() => {
                triggerLight();
                setIsPinDropMode(false);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      ) : (
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

          {/* Floating Permission Warning Banner */}
          {permissionState !== 'granted' && (
            <View style={styles.permissionBannerCard}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.permissionBannerTitle}>Location sharing is off</Text>
                <Text style={styles.permissionBannerSub}>
                  Allow location access so your crew can see where you are.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.permissionActionBtn}
                onPress={() => setShowPermissionModal(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.permissionActionBtnText}>
                  {permissionState === 'blocked' ? 'Settings' : 'Enable'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      )}

      {/* Floating Bottom Quick Bar or Pin Drop Actions */}
      {isPinDropMode ? (
        <View style={styles.floatingBottom}>
          <View style={styles.pinDropBottomCard}>
            <View style={styles.pinDropCoordRow}>
              <Compass size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.pinDropCoordText}>
                Target: {pinCenterCoord ? `${pinCenterCoord.latitude.toFixed(5)}, ${pinCenterCoord.longitude.toFixed(5)}` : 'Locating center...'}
              </Text>
            </View>
            <View style={styles.pinDropBtnRow}>
              <TouchableOpacity
                style={styles.cancelPinDropBtn}
                onPress={() => {
                  triggerLight();
                  setIsPinDropMode(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelPinDropBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmPinDropBtn}
                onPress={() => {
                  triggerSuccess();
                  setNewPointName('Regroup Spot');
                  setNewPointDesc('');
                  setShowCreatePointModal(true);
                }}
                activeOpacity={0.8}
              >
                <MapPin size={16} color={COLORS.white} style={{ marginRight: 6 }} />
                <Text style={styles.confirmPinDropBtnText} numberOfLines={1}>
                  Set Meeting Point
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
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
              onPress={() => {
                triggerLight();
                setIsPinDropMode(true);
              }}
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
      )}

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

            {selectedMemberModal.id === currentUser?.id || selectedMemberModal.id === 'me' || selectedMemberModal.isCurrentUser ? (
              <PrimaryButton
                title="Center on My Location"
                onPress={() => {
                  setSelectedMemberModal(null);
                  if (userLocation) {
                    useLocationStore.getState().setCameraCenter(userLocation);
                  }
                }}
                icon={Compass}
                size="lg"
                style={{ marginTop: 14 }}
              />
            ) : (
              <PrimaryButton
                title={`Walk to ${selectedMemberModal.name}`}
                onPress={() => handleNavigateTo(selectedMemberModal)}
                icon={Navigation}
                size="lg"
                style={{ marginTop: 14 }}
              />
            )}
          </View>
        )}
      </BottomSheet>

      {/* MEETING POINT MODAL (WITH DIRECT DELETE FEATURE) */}
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
                {selectedPointModal.nearbyCount} people are within {selectedPointModal.radiusMeters || 500} m
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

            {confirmDeletePointId === selectedPointModal.id ? (
              <View style={styles.confirmDeleteContainer}>
                <Text style={styles.confirmDeletePrompt}>
                  Delete "{selectedPointModal.name}" for the entire crew?
                </Text>
                <View style={styles.confirmDeleteBtnRow}>
                  <TouchableOpacity
                    style={styles.cancelDeleteBtn}
                    onPress={() => setConfirmDeletePointId(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelDeleteBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmDeleteBtn}
                    onPress={async () => {
                      const idToDelete = selectedPointModal.id;
                      setSelectedPointModal(null);
                      setConfirmDeletePointId(null);
                      triggerWarning();
                      await deleteMeetingPoint(idToDelete);
                    }}
                    activeOpacity={0.8}
                  >
                    <Trash2 size={14} color={COLORS.white} style={{ marginRight: 6 }} />
                    <Text style={styles.confirmDeleteBtnText}>Confirm Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.deletePointBtn}
                onPress={() => setConfirmDeletePointId(selectedPointModal.id)}
                activeOpacity={0.75}
              >
                <Trash2 size={16} color={COLORS.danger} style={{ marginRight: 6 }} />
                <Text style={styles.deletePointBtnText}>Delete Meeting Point</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </BottomSheet>

      {/* MANUAL PIN CREATION MODAL */}
      <Modal
        visible={showCreatePointModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreatePointModal(false)}
      >
        <SafeAreaView style={styles.modalSafeContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Set Meeting Point</Text>
              <Text style={styles.modalSub}>
                Pins a shared meeting spot visible to all crew members
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowCreatePointModal(false)}
              style={styles.modalCloseBtn}
            >
              <X size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Target Coordinate Info */}
            <View style={styles.selectedCoordBadge}>
              <MapPin size={18} color={COLORS.primary} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.selectedCoordLabel}>PINNED LOCATION</Text>
                <Text style={styles.selectedCoordValue}>
                  {pinCenterCoord
                    ? `${pinCenterCoord.latitude.toFixed(5)}, ${pinCenterCoord.longitude.toFixed(5)}`
                    : 'Current Center'}
                </Text>
              </View>
            </View>

            {/* Point Name Input */}
            <Text style={styles.inputLabel}>MEETING POINT NAME *</Text>
            <TextInput
              style={styles.textInput}
              value={newPointName}
              onChangeText={setNewPointName}
              placeholder="e.g. Gate 3, Food Truck Zone, Main Stage Exit"
              placeholderTextColor={COLORS.textMuted}
            />

            {/* Description / Instructions */}
            <Text style={styles.inputLabel}>LANDMARK / INSTRUCTIONS (OPTIONAL)</Text>
            <TextInput
              style={[styles.textInput, { height: 72, textAlignVertical: 'top', paddingTop: 10 }]}
              value={newPointDesc}
              onChangeText={setNewPointDesc}
              placeholder="e.g. Near the big neon sign and medical tent"
              placeholderTextColor={COLORS.textMuted}
              multiline
            />

            {/* Radius Selector */}
            <Text style={styles.inputLabel}>NOTIFICATION RADIUS</Text>
            <View style={styles.radiusRow}>
              {[
                { label: '250 m', val: 250 },
                { label: '500 m', val: 500 },
                { label: '1 km', val: 1000 },
              ].map((r) => (
                <TouchableOpacity
                  key={r.val}
                  style={[
                    styles.radiusChip,
                    newPointRadius === r.val && styles.radiusChipActive,
                  ]}
                  onPress={() => setNewPointRadius(r.val)}
                >
                  <Text
                    style={[
                      styles.radiusChipText,
                      newPointRadius === r.val && styles.radiusChipTextActive,
                    ]}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <PrimaryButton
              title={isCreatingPoint ? 'Saving Point…' : 'Drop Meeting Point'}
              onPress={handleSaveMeetingPoint}
              icon={MapPin}
              size="lg"
              disabled={isCreatingPoint}
              style={{ marginTop: 24, marginBottom: 12 }}
            />

            <SecondaryButton
              title="Cancel"
              onPress={() => setShowCreatePointModal(false)}
              size="md"
              variant="outline"
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* EXPLANATORY LOCATION PERMISSION MODAL */}
      <LocationPermissionModal
        visible={showPermissionModal}
        isPermanentlyDenied={permissionState === 'blocked'}
        onAllow={handleAllowPermission}
        onDismiss={() => setShowPermissionModal(false)}
      />
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
  permissionBannerCard: {
    marginHorizontal: 16,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    maxWidth: 440,
    width: '92%',
    alignSelf: 'center',
    ...SHADOWS.md,
  },
  permissionBannerTitle: {
    ...TYPOGRAPHY.h3,
    color: '#F87171',
    fontSize: 13,
  },
  permissionBannerSub: {
    ...TYPOGRAPHY.caption,
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2,
  },
  permissionActionBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  permissionActionBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
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
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 28,
    maxWidth: 360,
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
    marginBottom: 26,
  },
  emptyBtnCol: {
    width: '100%',
    alignItems: 'center',
  },
  emptyActionBtn: {
    width: '100%',
    marginBottom: 12,
  },
  deletePointBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 4,
  },
  deletePointBtnText: {
    ...TYPOGRAPHY.bodyPrimary,
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 14,
  },
  pinDropTopBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  pinDropTopCard: {
    marginHorizontal: 16,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(239, 68, 68, 0.6)',
    maxWidth: 440,
    width: '92%',
    alignSelf: 'center',
    ...SHADOWS.lg,
  },
  pinDropTopIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDropTopTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.white,
    fontSize: 15,
  },
  pinDropTopSub: {
    ...TYPOGRAPHY.caption,
    color: '#CBD5E1',
    fontSize: 11,
    marginTop: 2,
  },
  pinDropCloseBtn: {
    padding: 6,
  },
  pinDropBottomCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...SHADOWS.lg,
  },
  pinDropCoordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
  },
  pinDropCoordText: {
    ...TYPOGRAPHY.caption,
    color: '#93C5FD',
    fontWeight: '600',
    fontSize: 12,
  },
  pinDropBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelPinDropBtn: {
    flex: 0.85,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cancelPinDropBtnText: {
    ...TYPOGRAPHY.bodyPrimary,
    color: '#E2E8F0',
    fontWeight: '600',
    fontSize: 13,
  },
  confirmPinDropBtn: {
    flex: 1.85,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  confirmPinDropBtnText: {
    ...TYPOGRAPHY.bodyPrimary,
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  modalSafeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: COLORS.surface,
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
  },
  modalSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  selectedCoordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    padding: 14,
    borderRadius: RADIUS.lg,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  selectedCoordLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.4,
  },
  selectedCoordValue: {
    ...TYPOGRAPHY.bodyPrimary,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  inputLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  radiusRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  radiusChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radiusChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  radiusChipText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  radiusChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  confirmDeleteContainer: {
    marginTop: 14,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  confirmDeletePrompt: {
    ...TYPOGRAPHY.caption,
    color: '#991B1B',
    fontWeight: '600',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center',
  },
  confirmDeleteBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelDeleteBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    marginRight: 8,
  },
  cancelDeleteBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  confirmDeleteBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.danger,
  },
  confirmDeleteBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: COLORS.white,
    fontSize: 13,
  },
});
