import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  MapPin,
  Compass,
  Navigation,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Sparkles,
  FileText,
  LocateFixed,
} from 'lucide-react-native';
import { RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { MapView } from '../../src/components/MapView';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useMeetingPointStore } from '../../src/store/useMeetingPointStore';
import { useTripStore } from '../../src/store/useTripStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useThemeStore } from '../../src/store/useThemeStore';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';
import { calculateDistanceMeters, formatDistance, getProximityColor } from '../../src/utils/distance';

export default function MeetScreen() {
  const router = useRouter();
  const { triggerLight, triggerSuccess, triggerWarning } = useHapticFeedback();

  // Stores
  const activeTrip = useTripStore((state) => state.activeTrip);
  const meetingPoints = useMeetingPointStore((state) => state.meetingPoints);
  const addMeetingPoint = useMeetingPointStore((state) => state.addMeetingPoint);
  const deleteMeetingPoint = useMeetingPointStore((state) => state.deleteMeetingPoint);
  const userLocation = useLocationStore((state) => state.userLocation);
  const members = useCrewStore((state) => state.members);

  // Theme store
  const isDark = useThemeStore((state) => state.isDark);
  const colors = useThemeStore((state) => state.colors);

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pointName, setPointName] = useState('');
  const [landmarkNote, setLandmarkNote] = useState('');
  const [pointTime, setPointTime] = useState('');

  // Pinned location for new meeting point
  const defaultCoord = userLocation?.latitude
    ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
    : { latitude: 15.2993, longitude: 74.1240 };
  const [selectedCoord, setSelectedCoord] = useState(defaultCoord);

  const openCreateModal = () => {
    triggerLight();
    const initCoord = userLocation?.latitude
      ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
      : { latitude: 15.2993, longitude: 74.1240 };
    setSelectedCoord(initCoord);
    setPointName('');
    setLandmarkNote('');
    setPointTime('');
    setShowCreateModal(true);
  };

  const handleCenterOnUser = () => {
    triggerLight();
    if (userLocation?.latitude) {
      setSelectedCoord({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
    }
  };

  const handleCreatePoint = async () => {
    if (!pointName.trim()) {
      triggerWarning();
      Alert.alert('Required', 'Please enter a name for the rendezvous point.');
      return;
    }

    triggerLight();
    const finalCoord = selectedCoord?.latitude
      ? selectedCoord
      : userLocation?.latitude
        ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
        : { latitude: 15.2993, longitude: 74.1240 };

    await addMeetingPoint({
      tripId: activeTrip?.id,
      name: pointName.trim(),
      description: landmarkNote.trim(),
      landmarkNote: landmarkNote.trim(),
      scheduledTime: pointTime.trim() || 'Whenever separated',
      coordinates: finalCoord,
      latitude: finalCoord.latitude,
      longitude: finalCoord.longitude,
    }, members);

    triggerSuccess();
    setPointName('');
    setLandmarkNote('');
    setPointTime('');
    setShowCreateModal(false);
  };

  const handleDelete = (id) => {
    triggerWarning();
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' && window.confirm
        ? window.confirm('Delete Meeting Point: Remove this rally point for the crew?')
        : true;
      if (confirmed) {
        triggerLight();
        deleteMeetingPoint(id);
      }
      return;
    }

    Alert.alert('Delete Meeting Point', 'Remove this rally point for the crew?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          triggerLight();
          deleteMeetingPoint(id);
        },
      },
    ]);
  };

  const handleNavigateToPoint = (point) => {
    triggerLight();
    const lat = point.latitude || point.coordinates?.latitude || 15.2993;
    const lng = point.longitude || point.coordinates?.longitude || 74.1240;

    // Route directly to Map screen and show path
    router.push({
      pathname: '/(tabs)/home',
      params: {
        targetLat: lat,
        targetLng: lng,
        targetName: point.name,
        targetType: 'meeting_point',
        showPath: 'true',
      },
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0B0F17' : colors.background }]} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>Meet Points</Text>
            <Text style={[styles.screenSubtitle, { color: colors.textSecondary }]}>
              Shared rendezvous spots for your crew
            </Text>
          </View>

          {activeTrip && (
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={openCreateModal}
              activeOpacity={0.75}
            >
              <Plus size={16} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 4 }} />
              <Text style={[styles.addBtnText, { color: '#FFFFFF' }]}>Set Point</Text>
            </TouchableOpacity>
          )}
        </View>

        {!activeTrip ? (
          <View style={[styles.emptyCard, { backgroundColor: isDark ? '#111827' : colors.surface, borderColor: isDark ? '#1F2937' : colors.border }]}>
            <View style={[styles.emptyIconBubble, { backgroundColor: isDark ? '#1E293B' : colors.surfaceSubtle }]}>
              <MapPin size={28} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Active Crew Trip</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Join or create a crew trip to set shared rendezvous points with auto-distance tracking.
            </Text>
            <PrimaryButton
              title="Go to Home"
              onPress={() => router.replace('/(tabs)/home')}
              size="md"
              style={{ marginTop: 14 }}
            />
          </View>
        ) : meetingPoints.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: isDark ? '#111827' : colors.surface, borderColor: isDark ? '#1F2937' : colors.border }]}>
            <View style={[styles.emptyIconBubble, { backgroundColor: isDark ? '#1E293B' : colors.surfaceSubtle }]}>
              <Sparkles size={28} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Meeting Point Set</Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              Create a rally point like "Main Stage Exit" or "Food Court" so your friends can find each other if lost.
            </Text>
            <PrimaryButton
              title="Set Rally Point"
              onPress={openCreateModal}
              icon={Plus}
              size="md"
              style={{ marginTop: 14 }}
            />
          </View>
        ) : (
          meetingPoints.map((point) => {
            const pointCoord = point.coordinates || { latitude: point.latitude, longitude: point.longitude };
            const distMeters = userLocation && pointCoord?.latitude
              ? calculateDistanceMeters(userLocation, pointCoord)
              : null;
            const distFormatted = distMeters !== null ? formatDistance(distMeters) : null;
            const proximity = getProximityColor(distMeters, isDark, colors.primary);
            const noteText = point.landmarkNote || point.description;

            return (
              <View
                key={point.id}
                style={[
                  styles.pointCard,
                  {
                    backgroundColor: isDark ? '#111827' : colors.surface,
                    borderColor: isDark ? '#1F2937' : colors.border,
                  },
                ]}
              >
                <View style={styles.pointCardHeader}>
                  <View style={[styles.pointIconBubble, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]}>
                    <MapPin size={20} color={colors.primary} strokeWidth={2.2} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pointName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {point.name}
                    </Text>
                    {point.scheduledTime ? (
                      <View style={styles.timeRow}>
                        <Clock size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={[styles.pointTime, { color: colors.textSecondary }]}>
                          {point.scheduledTime}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(point.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Optional Landmark Instruction Note */}
                {noteText ? (
                  <View
                    style={[
                      styles.landmarkNoteCard,
                      {
                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.08)' : '#EFF6FF',
                        borderColor: isDark ? 'rgba(59, 130, 246, 0.22)' : '#BFDBFE',
                      },
                    ]}
                  >
                    <View style={styles.landmarkNoteHeader}>
                      <FileText size={13} color={colors.primary} strokeWidth={2.2} style={{ marginRight: 5 }} />
                      <Text style={[styles.landmarkNoteLabel, { color: colors.primary }]}>LANDMARK NOTE</Text>
                    </View>
                    <Text style={[styles.landmarkNoteText, { color: colors.textPrimary }]}>
                      {noteText}
                    </Text>
                  </View>
                ) : null}

                {/* Distance Badge */}
                {distFormatted && (
                  <View style={styles.distanceBadgeRow}>
                    <Navigation size={14} color={proximity.accent} style={{ marginRight: 6 }} />
                    <Text style={[styles.distanceText, { color: proximity.accent }]}>
                      {distFormatted} away from your position
                    </Text>
                  </View>
                )}

                {/* Direct Map Navigation Button */}
                <TouchableOpacity
                  style={[styles.navigateBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleNavigateToPoint(point)}
                  activeOpacity={0.8}
                >
                  <Compass size={17} color="#FFFFFF" strokeWidth={2.4} style={{ marginRight: 6 }} />
                  <Text style={[styles.navigateBtnText, { color: '#FFFFFF' }]}>Navigate to Meeting Point</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Set Meeting Point Modal with Map Pinpoint */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            <View style={[styles.modalCard, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderColor: isDark ? '#1F2937' : '#E5E7EB' }]}>
              {/* Header */}
              <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#1F2937' : colors.border }]}>
                <View>
                  <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Set Meeting Point</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                    Pin location on map & add instructions
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowCreateModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ maxHeight: 520 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 14 }}
              >
                {/* 1. Pinpoint On Map Container */}
                <View style={styles.mapPinSection}>
                  <View style={styles.mapLabelRow}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                      PINPOINT LOCATION ON MAP
                    </Text>
                    <Text style={styles.dragHintText}>Drag map to position pin</Text>
                  </View>

                  <View style={[styles.mapContainerBox, { borderColor: isDark ? '#374151' : '#CBD5E1' }]}>
                    <MapView
                      userLocation={userLocation}
                      center={selectedCoord}
                      zoom={16}
                      height={200}
                      interactive={true}
                      isPinDropMode={true}
                      showClusters={false}
                      showMeetingPoints={false}
                      compactControls={true}
                      onCameraChange={(coord) => setSelectedCoord(coord)}
                    />

                    {/* Center on My Location Floating Button */}
                    {userLocation?.latitude && (
                      <TouchableOpacity
                        style={[styles.recenterBtn, { backgroundColor: isDark ? 'rgba(17, 24, 39, 0.92)' : 'rgba(255, 255, 255, 0.95)' }]}
                        activeOpacity={0.8}
                        onPress={handleCenterOnUser}
                      >
                        <LocateFixed size={14} color={colors.primary} style={{ marginRight: 5 }} />
                        <Text style={[styles.recenterText, { color: colors.textPrimary }]}>My Location</Text>
                      </TouchableOpacity>
                    )}

                    {/* Coordinate Indicator Pill */}
                    <View style={styles.coordsIndicatorPill}>
                      <MapPin size={11} color={colors.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.coordsIndicatorText}>
                        Pin: {selectedCoord?.latitude?.toFixed(4)}, {selectedCoord?.longitude?.toFixed(4)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* 2. Spot Name / Landmark (Required) */}
                <View style={styles.inputBlock}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    SPOT NAME / LANDMARK *
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: isDark ? '#1F2937' : colors.surfaceSubtle,
                        color: colors.textPrimary,
                        borderColor: isDark ? '#374151' : colors.border,
                      },
                    ]}
                    placeholder="e.g. Main Stage Exit Gate 4"
                    placeholderTextColor={colors.textMuted}
                    value={pointName}
                    onChangeText={setPointName}
                  />
                </View>

                {/* 3. Landmark Instruction Note (Optional) */}
                <View style={styles.inputBlock}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    LANDMARK INSTRUCTION NOTE (OPTIONAL)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInputArea,
                      {
                        backgroundColor: isDark ? '#1F2937' : colors.surfaceSubtle,
                        color: colors.textPrimary,
                        borderColor: isDark ? '#374151' : colors.border,
                      },
                    ]}
                    placeholder="e.g. Wait near red food truck beside the lights, look for oak tree"
                    placeholderTextColor={colors.textMuted}
                    value={landmarkNote}
                    onChangeText={setLandmarkNote}
                    multiline={true}
                    numberOfLines={2}
                  />
                </View>

                {/* 4. Meet Time (Optional) */}
                <View style={styles.inputBlock}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    MEET TIME (OPTIONAL)
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: isDark ? '#1F2937' : colors.surfaceSubtle,
                        color: colors.textPrimary,
                        borderColor: isDark ? '#374151' : colors.border,
                      },
                    ]}
                    placeholder="e.g. 10:30 PM after headliner"
                    placeholderTextColor={colors.textMuted}
                    value={pointTime}
                    onChangeText={setPointTime}
                  />
                </View>

                <PrimaryButton
                  title="Create Rally Point"
                  onPress={handleCreatePoint}
                  icon={CheckCircle2}
                  size="lg"
                  style={{ marginTop: 6 }}
                />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  screenTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  emptyCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  pointCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  pointCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pointIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pointName: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  pointTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  deleteBtn: {
    padding: 6,
  },
  landmarkNoteCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  landmarkNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  landmarkNoteLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#22C55E',
    letterSpacing: 0.6,
  },
  landmarkNoteText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  distanceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '700',
  },
  navigateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  navigateBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  mapPinSection: {
    marginBottom: 16,
  },
  mapLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dragHintText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '700',
  },
  mapContainerBox: {
    height: 200,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  recenterBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    zIndex: 10,
    ...SHADOWS.sm,
  },
  recenterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  coordsIndicatorPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 10,
  },
  coordsIndicatorText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
  },
  inputBlock: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '500',
  },
  textInputArea: {
    minHeight: 58,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '500',
    textAlignVertical: 'top',
  },
});
