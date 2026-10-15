import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  MapPin,
  Users,
  Navigation,
  Share2,
  Plus,
  Check,
  Compass,
  Trash2,
  X,
  ChevronRight,
} from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { AppHeader } from '../../src/components/AppHeader';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { MapView } from '../../src/components/MapView';
import { useMeetingPointStore } from '../../src/store/useMeetingPointStore';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useUserStore } from '../../src/store/useUserStore';
import { useTripStore } from '../../src/store/useTripStore';
import { calculateDistanceMeters, formatDistance } from '../../src/utils/distance';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function MeetingPointScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { triggerSuccess, triggerLight, triggerWarning } = useHapticFeedback();

  const meetingPoints = useMeetingPointStore((state) => state.meetingPoints);
  const addMeetingPoint = useMeetingPointStore((state) => state.addMeetingPoint);
  const deleteMeetingPoint = useMeetingPointStore((state) => state.deleteMeetingPoint);
  const members = useCrewStore((state) => state.members);
  const userLocation = useLocationStore((state) => state.userLocation);
  const currentUser = useUserStore((state) => state.currentUser);
  const activeTrip = useTripStore((state) => state.activeTrip);

  // Initial custom coordinates if passed in via navigation params
  const initialCustomCoords =
    params.customLat && params.customLon
      ? {
          latitude: parseFloat(params.customLat),
          longitude: parseFloat(params.customLon),
        }
      : null;

  const [isCreating, setIsCreating] = useState(Boolean(initialCustomCoords));
  const [pointName, setPointName] = useState(params.suggestedName || 'Crew Meeting Point');
  const [pointDesc, setPointDesc] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Selective Location States
  const [selectedCoords, setSelectedCoords] = useState(initialCustomCoords);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [tempPickerCoord, setTempPickerCoord] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // If user tapped "Drop Meeting Point" before selecting location, we drop automatically after map confirmation
  const isPendingDropRef = useRef(false);

  // Open the interactive Map Pin Drop picker
  const openMapPicker = () => {
    triggerLight();
    const startCoord =
      selectedCoords ||
      (userLocation && !isNaN(userLocation.latitude)
        ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
        : { latitude: 20.5937, longitude: 78.9629 });

    setTempPickerCoord(startCoord);
    setIsMapPickerOpen(true);
  };

  // Explicitly select current GPS location if desired
  const handleUseCurrentLocation = () => {
    triggerLight();
    if (userLocation && !isNaN(userLocation.latitude)) {
      setSelectedCoords({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
      setIsUsingCurrentLocation(true);
    } else {
      Alert.alert(
        'GPS Location Unavailable',
        'Could not detect your current location. Please pan and drop the pin on the map instead.'
      );
    }
  };

  // Confirm spot from map modal
  const handleConfirmMapPicker = async () => {
    triggerSuccess();
    const finalCoords =
      tempPickerCoord ||
      userLocation ||
      { latitude: 20.5937, longitude: 78.9629 };

    setSelectedCoords(finalCoords);
    setIsUsingCurrentLocation(false);
    setIsMapPickerOpen(false);

    if (isPendingDropRef.current) {
      isPendingDropRef.current = false;
      await saveMeetingPointWithCoords(finalCoords);
    }
  };

  // Core save meeting point logic
  const saveMeetingPointWithCoords = async (coords) => {
    if (!pointName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for the meeting point.');
      return;
    }

    setIsSaving(true);
    try {
      await addMeetingPoint(
        {
          tripId: activeTrip?.id,
          name: pointName.trim(),
          description: pointDesc.trim(),
          createdBy: currentUser?.name || 'You',
          createdById: currentUser?.id || 'me',
          coordinates: coords,
          radiusMeters: 500,
        },
        members
      );

      triggerSuccess();
      setIsCreating(false);
      setSelectedCoords(null);
      setIsUsingCurrentLocation(false);
      setPointName('Crew Meeting Point');
      setPointDesc('');
    } catch (e) {
      Alert.alert('Error', 'Could not save meeting point. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle clicking "Drop Meeting Point" button in form
  const handleCreatePoint = async () => {
    if (!pointName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for the meeting point.');
      return;
    }

    // If no selective location has been picked yet, automatically launch the map pin drop picker!
    if (!selectedCoords) {
      triggerLight();
      isPendingDropRef.current = true;
      openMapPicker();
      return;
    }

    await saveMeetingPointWithCoords(selectedCoords);
  };

  const handleDeletePoint = (point) => {
    Alert.alert(
      'Delete Meeting Point',
      `Are you sure you want to delete "${point.name}"? This regroup spot will be removed for the entire crew.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            triggerWarning();
            await deleteMeetingPoint(point.id);
          },
        },
      ]
    );
  };

  const handleSharePoint = async (point) => {
    try {
      await Share.share({
        message: `📍 Crew Regroup Point: "${point.name}"\n${point.description}\nMeet here using MyCrew!`,
      });
    } catch (e) {
      // Fallback
    }
  };

  const handleNavigateToPoint = (point) => {
    router.push({
      pathname: '/features/navigation',
      params: {
        destName: point.name,
        destLat: point.coordinates.latitude,
        destLon: point.coordinates.longitude,
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader
        title="Meeting Points"
        subtitle="Regroup with your whole crew"
        showBack={true}
        rightComponent={
          !isCreating ? (
            <TouchableOpacity
              style={styles.addIconBtn}
              onPress={() => {
                triggerLight();
                setIsCreating(true);
              }}
            >
              <Plus size={18} color={COLORS.primary} />
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* CREATE FORM */}
        {isCreating && (
          <View style={styles.createCard}>
            <Text style={styles.createTitle}>Set New Meeting Point</Text>
            <Text style={styles.createSub}>
              Pins a shared meeting spot visible to all friends in the trip.
            </Text>

            <Text style={styles.inputLabel}>MEETING POINT NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Gate 3, Food Truck Zone, Main Stage Exit"
              placeholderTextColor={COLORS.textMuted}
              value={pointName}
              onChangeText={setPointName}
              autoFocus={!selectedCoords}
            />

            <Text style={styles.inputLabel}>LANDMARK / INSTRUCTIONS (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Beside the big neon sign"
              placeholderTextColor={COLORS.textMuted}
              value={pointDesc}
              onChangeText={setPointDesc}
            />

            {/* LOCATION TARGET SELECTOR */}
            <Text style={styles.inputLabel}>MEETING SPOT LOCATION *</Text>
            {selectedCoords ? (
              <View style={styles.selectedLocCard}>
                <View style={styles.selectedLocHeader}>
                  <View
                    style={[
                      styles.selectedLocIconBox,
                      isUsingCurrentLocation && { backgroundColor: '#0284C7' },
                    ]}
                  >
                    <MapPin size={18} color={COLORS.white} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.selectedLocTitle}>
                      {isUsingCurrentLocation ? 'Current Location (GPS)' : 'Selective Map Location'}
                    </Text>
                    <Text style={styles.selectedLocCoords}>
                      {selectedCoords.latitude.toFixed(5)}, {selectedCoords.longitude.toFixed(5)}
                      {userLocation && !isUsingCurrentLocation
                        ? ` • ${formatDistance(calculateDistanceMeters(userLocation, selectedCoords))} away`
                        : ''}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.changeLocBtn}
                    onPress={openMapPicker}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.changeLocBtnText}>Change Pin</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.pickOnMapCard}
                onPress={openMapPicker}
                activeOpacity={0.8}
              >
                <View style={styles.pickOnMapIconBox}>
                  <MapPin size={20} color={COLORS.white} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.pickOnMapTitle}>Select Pin Point on Map</Text>
                  <Text style={styles.pickOnMapSub}>
                    Pan map to align pin at your desired regroup spot
                  </Text>
                </View>
                <View style={styles.pickOnMapBadge}>
                  <Text style={styles.pickOnMapBadgeText}>Select</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Alternative: use current location */}
            <View style={styles.locAlternativeRow}>
              {!isUsingCurrentLocation ? (
                <TouchableOpacity
                  style={styles.altLocBtn}
                  onPress={handleUseCurrentLocation}
                  activeOpacity={0.7}
                >
                  <Compass size={13} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.altLocBtnText}>Or use my current GPS location</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.altLocBtn}
                  onPress={openMapPicker}
                  activeOpacity={0.7}
                >
                  <MapPin size={13} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.altLocBtnText}>Pick a selective spot on map instead</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.createBtnRow}>
              <PrimaryButton
                title={isSaving ? 'Dropping Point…' : 'Drop Meeting Point'}
                onPress={handleCreatePoint}
                icon={MapPin}
                size="md"
                disabled={isSaving}
                style={{ flex: 1, marginRight: 8 }}
              />
              <SecondaryButton
                title="Cancel"
                onPress={() => {
                  setIsCreating(false);
                  setSelectedCoords(null);
                  setIsUsingCurrentLocation(false);
                }}
                size="md"
                variant="outline"
                style={{ flex: 0.6 }}
              />
            </View>
          </View>
        )}

        {/* ACTIVE MEETING POINTS LIST */}
        <Text style={styles.sectionHeading}>ACTIVE CREW REGROUP POINTS</Text>

        {/* EMPTY STATE */}
        {meetingPoints.length === 0 && !isCreating && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MapPin size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Meeting Points Set</Text>
            <Text style={styles.emptySub}>
              Set a shared regroup location so everyone in your crew knows exactly where to meet up.
            </Text>
            <PrimaryButton
              title="Pin Point on Map"
              icon={Plus}
              size="md"
              onPress={() => {
                triggerLight();
                setIsCreating(true);
                openMapPicker();
              }}
              style={{ marginTop: 18, width: '100%', maxWidth: 260 }}
            />
          </View>
        )}

        {meetingPoints.map((point) => {
          const dist = calculateDistanceMeters(userLocation, point.coordinates);
          return (
            <View key={point.id} style={styles.pointCard}>
              <View style={styles.pointTop}>
                <View style={styles.pointIconBubble}>
                  <MapPin size={22} color={COLORS.white} />
                </View>
                <View style={styles.pointHeaderInfo}>
                  <Text style={styles.pointName}>{point.name}</Text>
                  <Text style={styles.pointCreator}>
                    Created by {point.createdBy}
                  </Text>
                </View>
                <View style={styles.distPill}>
                  <Text style={styles.distText}>{formatDistance(dist)}</Text>
                </View>
              </View>

              {point.description ? (
                <Text style={styles.pointDesc}>{point.description}</Text>
              ) : null}

              {/* Nearby People Count */}
              <View style={styles.nearbyPill}>
                <Users size={15} color={COLORS.primary} />
                <Text style={styles.nearbyText}>
                  {point.nearbyCount || 1} people are within {point.radiusMeters || 500} m
                </Text>
              </View>

              {/* Buttons: Navigate, Share & Delete */}
              {confirmDeleteId === point.id ? (
                <View style={styles.cardConfirmBox}>
                  <Text style={styles.cardConfirmPrompt}>Delete for whole crew?</Text>
                  <View style={styles.cardConfirmActions}>
                    <TouchableOpacity
                      style={styles.cardCancelBtn}
                      onPress={() => setConfirmDeleteId(null)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cardCancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cardDoDeleteBtn}
                      onPress={async () => {
                        triggerWarning();
                        setConfirmDeleteId(null);
                        await deleteMeetingPoint(point.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cardDoDeleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.actionsRow}>
                  <PrimaryButton
                    title="Navigate"
                    onPress={() => handleNavigateToPoint(point)}
                    icon={Navigation}
                    size="sm"
                    style={{ flex: 1, marginRight: 8 }}
                  />
                  <SecondaryButton
                    title="Share"
                    onPress={() => handleSharePoint(point)}
                    icon={Share2}
                    size="sm"
                    variant="subtle"
                    style={{ flex: 0.9, marginRight: 8 }}
                  />
                  <TouchableOpacity
                    style={styles.deleteCardBtn}
                    onPress={() => setConfirmDeleteId(point.id)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* FULL-SCREEN INTERACTIVE MAP PIN-DROP PICKER MODAL */}
      <Modal
        visible={isMapPickerOpen}
        animationType="slide"
        onRequestClose={() => {
          isPendingDropRef.current = false;
          setIsMapPickerOpen(false);
        }}
      >
        <View style={styles.mapModalContainer}>
          {/* Responsive MapView with center crosshair pin */}
          <MapView
            userLocation={userLocation}
            members={members}
            meetingPoints={meetingPoints}
            center={tempPickerCoord || userLocation}
            height="100%"
            interactive={true}
            showClusters={false}
            showMeetingPoints={true}
            controlsBottomOffset={140}
            isPinDropMode={true}
            onCameraChange={(coord) => setTempPickerCoord(coord)}
            style={{ flex: 1 }}
          />

          {/* Floating Top Banner Header */}
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
                  isPendingDropRef.current = false;
                  setIsMapPickerOpen(false);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Floating Bottom Action Card */}
          <View style={styles.floatingPinDropBottom}>
            <View style={styles.pinDropBottomCard}>
              <View style={styles.pinDropCoordRow}>
                <Compass size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.pinDropCoordText}>
                  Target: {tempPickerCoord ? `${tempPickerCoord.latitude.toFixed(5)}, ${tempPickerCoord.longitude.toFixed(5)}` : 'Locating center...'}
                  {userLocation && tempPickerCoord
                    ? ` • ${formatDistance(calculateDistanceMeters(userLocation, tempPickerCoord))} from you`
                    : ''}
                </Text>
              </View>

              <View style={styles.pinDropBtnRow}>
                <TouchableOpacity
                  style={styles.cancelPinDropBtn}
                  onPress={() => {
                    triggerLight();
                    isPendingDropRef.current = false;
                    setIsMapPickerOpen(false);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelPinDropBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmPinDropBtn}
                  onPress={handleConfirmMapPicker}
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
        </View>
      </Modal>
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
  addIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  createTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    marginBottom: 4,
  },
  createSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  inputLabel: {
    ...TYPOGRAPHY.badge,
    color: '#64748B',
    fontSize: 10,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 14,
  },
  pickOnMapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 10,
  },
  pickOnMapIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickOnMapTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  pickOnMapSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  pickOnMapBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  pickOnMapBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 11,
  },
  selectedLocCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#86EFAC',
    marginBottom: 10,
  },
  selectedLocHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedLocIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedLocTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 13,
    color: '#15803D',
  },
  selectedLocCoords: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  changeLocBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  changeLocBtnText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    color: '#15803D',
    fontSize: 11,
  },
  locAlternativeRow: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  altLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  altLocBtnText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  createBtnRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  sectionHeading: {
    ...TYPOGRAPHY.badge,
    color: '#64748B',
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 44,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
    ...SHADOWS.sm,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    marginBottom: 6,
  },
  emptySub: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  pointCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  pointTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pointIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointHeaderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  pointName: {
    ...TYPOGRAPHY.h2,
    fontSize: 16,
  },
  pointCreator: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontSize: 11,
  },
  distPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  distText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  pointDesc: {
    ...TYPOGRAPHY.bodySecondary,
    marginBottom: 10,
    color: COLORS.textPrimary,
    fontSize: 13,
  },
  nearbyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  nearbyText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 11,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteCardBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardConfirmBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardConfirmPrompt: {
    ...TYPOGRAPHY.caption,
    color: '#991B1B',
    fontWeight: '700',
    fontSize: 12,
  },
  cardConfirmActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 6,
  },
  cardCancelBtnText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 11,
  },
  cardDoDeleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.danger,
  },
  cardDoDeleteBtnText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 11,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
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
  floatingPinDropBottom: {
    position: 'absolute',
    bottom: 28,
    left: 16,
    right: 16,
    zIndex: 20,
    maxWidth: 440,
    alignSelf: 'center',
    width: '92%',
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
});
