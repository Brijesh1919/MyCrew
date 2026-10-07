import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Share,
  Alert,
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
} from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { AppHeader } from '../../src/components/AppHeader';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
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

  const [isCreating, setIsCreating] = useState(Boolean(params.customLat));
  const [pointName, setPointName] = useState(params.suggestedName || 'Crew Meeting Point');
  const [pointDesc, setPointDesc] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleCreatePoint = () => {
    if (!pointName.trim()) return;
    triggerSuccess();

    const coords =
      params.customLat && params.customLon
        ? {
            latitude: parseFloat(params.customLat),
            longitude: parseFloat(params.customLon),
          }
        : (userLocation && !isNaN(userLocation.latitude))
        ? {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }
        : { latitude: 20.5937, longitude: 78.9629 };

    addMeetingPoint(
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

    setIsCreating(false);
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

            <Text style={styles.inputLabel}>MEETING POINT NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Gate 3, Food Truck Zone, Main Stage Exit"
              placeholderTextColor={COLORS.textMuted}
              value={pointName}
              onChangeText={setPointName}
              autoFocus
            />

            <Text style={styles.inputLabel}>LANDMARK / INSTRUCTIONS (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Beside the big neon sign"
              placeholderTextColor={COLORS.textMuted}
              value={pointDesc}
              onChangeText={setPointDesc}
            />

            <View style={styles.createBtnRow}>
              <PrimaryButton
                title="Drop Meeting Point"
                onPress={handleCreatePoint}
                icon={MapPin}
                size="md"
                style={{ flex: 1, marginRight: 8 }}
              />
              <SecondaryButton
                title="Cancel"
                onPress={() => setIsCreating(false)}
                size="md"
                variant="outline"
                style={{ flex: 0.6 }}
              />
            </View>
          </View>
        )}

        {/* ACTIVE MEETING POINTS LIST */}
        <Text style={styles.sectionHeading}>ACTIVE CREW REGROUP POINTS</Text>

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
                  {point.nearbyCount || 11} people are within {point.radiusMeters || 600} m
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
                        setConfirmDeleteId(null);
                        triggerWarning();
                        await deleteMeetingPoint(point.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <Trash2 size={13} color={COLORS.white} style={{ marginRight: 4 }} />
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
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    marginBottom: 20,
    ...SHADOWS.md,
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
    color: COLORS.textSecondary,
    fontSize: 10,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 14,
  },
  createBtnRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  sectionHeading: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  pointCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  pointTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pointIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pointHeaderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  pointName: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
  },
  pointCreator: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  distPill: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  distText: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  pointDesc: {
    ...TYPOGRAPHY.bodySecondary,
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
  nearbyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    marginBottom: 14,
  },
  nearbyText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  halfBtn: {
    flex: 1,
  },
  deleteCardBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
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
});
