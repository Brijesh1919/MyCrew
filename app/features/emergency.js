import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  Phone,
  ShieldAlert,
  Share2,
  Navigation,
  X,
  Users,
} from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { MemberAvatar } from '../../src/components/MemberAvatar';
import { useCrewStore } from '../../src/store/useCrewStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useTripStore } from '../../src/store/useTripStore';
import { locationService } from '../../src/services/locationService';
import { formatDistance } from '../../src/utils/distance';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function EmergencyScreen() {
  const router = useRouter();
  const { triggerDanger, triggerHeavy } = useHapticFeedback();

  const members = useCrewStore((state) => state.members);
  const userLocation = useLocationStore((state) => state.userLocation);
  const activeTrip = useTripStore((state) => state.activeTrip);

  const [confirmed, setConfirmed] = useState(false);

  const nearestList = locationService.getNearestMembers(userLocation, members, 3);
  const organizer = activeTrip?.organizer || { name: 'Rahul', phone: '+91 98200 12345' };

  const handleTriggerAlert = () => {
    triggerDanger();
    setConfirmed(true);
  };

  const handleCallEmergency = () => {
    Linking.openURL('tel:112');
  };

  const handleCallOrganizer = () => {
    Linking.openURL(`tel:${organizer.phone || '112'}`);
  };

  const handleShareLocation = async () => {
    try {
      await Share.share({
        message: `🚨 EMERGENCY ALERT: I need immediate help at Goa Music Festival!\nMy Coordinates: ${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}\nGoogle Maps link: https://maps.google.com/?q=${userLocation.latitude},${userLocation.longitude}`,
      });
    } catch (e) {
      // Fallback
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Dismiss Button */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>

        {!confirmed ? (
          /* CONFIRMATION STEP BEFORE TRIGGERING */
          <View style={styles.confirmBox}>
            <View style={styles.alertIconBubble}>
              <ShieldAlert size={48} color={COLORS.danger} />
            </View>
            <Text style={styles.confirmTitle}>Emergency Assistance</Text>
            <Text style={styles.confirmNotice}>
              This will broadcast an urgent emergency alert to everyone in your trip: {activeTrip?.name}.
            </Text>

            <View style={styles.disclaimerBox}>
              <Text style={styles.disclaimerText}>
                ⚠️ Notice: MyCrew is a group coordination tool and is NOT a replacement for local emergency services (Police / Ambulance).
              </Text>
            </View>

            <PrimaryButton
              title="Alert My Crew Now"
              onPress={handleTriggerAlert}
              variant="danger"
              size="lg"
              style={styles.confirmBtn}
            />

            <SecondaryButton
              title="Cancel"
              onPress={() => router.back()}
              size="md"
              variant="ghost"
            />
          </View>
        ) : (
          /* ACTIVE EMERGENCY DASHBOARD */
          <ScrollView
            style={styles.activeEmergencyScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.emergencyHeader}>
              <View style={styles.activeAlertPill}>
                <View style={styles.activeAlertDot} />
                <Text style={styles.activeAlertText}>CREW ALERTED</Text>
              </View>
              <Text style={styles.emergencyTitle}>Emergency Mode Active</Text>
              <Text style={styles.emergencySub}>
                Your crew has been notified with your live high-precision location.
              </Text>
            </View>

            {/* NEARBY CREW MEMBERS */}
            <Text style={styles.sectionLabel}>CLOSEST CREW NEARBY</Text>
            <View style={styles.nearbyList}>
              {nearestList.map((m) => (
                <View key={m.id} style={styles.nearbyRow}>
                  <MemberAvatar
                    uri={m.avatar}
                    name={m.name}
                    size="sm"
                    status={m.status}
                  />
                  <View style={styles.nearbyInfo}>
                    <Text style={styles.nearbyName}>{m.name}</Text>
                    <Text style={styles.nearbyDistance}>
                      {formatDistance(m.distanceMeters)} away
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.callIconBtn}
                    onPress={() => Linking.openURL(`tel:${m.phone || '112'}`)}
                  >
                    <Phone size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* CRITICAL ACTION BUTTONS */}
            <View style={styles.criticalActions}>
              <PrimaryButton
                title="Call Emergency Services (112)"
                onPress={handleCallEmergency}
                icon={Phone}
                variant="danger"
                size="lg"
                style={{ marginBottom: 12 }}
              />

              <SecondaryButton
                title={`Call Organizer (${organizer.name})`}
                onPress={handleCallOrganizer}
                icon={Phone}
                size="md"
                variant="subtle"
                style={{ marginBottom: 10 }}
              />

              <SecondaryButton
                title="Share GPS Coordinates"
                onPress={handleShareLocation}
                icon={Share2}
                size="md"
                variant="outline"
              />
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FEF2F2',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignSelf: 'flex-end',
  },
  confirmBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  alertIconBubble: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FECACA',
    ...SHADOWS.md,
  },
  confirmTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 26,
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmNotice: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  disclaimerBox: {
    backgroundColor: '#FFFBEB',
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 28,
  },
  disclaimerText: {
    ...TYPOGRAPHY.caption,
    color: '#92400E',
    lineHeight: 18,
    fontSize: 12,
  },
  confirmBtn: {
    marginBottom: 10,
  },
  activeEmergencyScroll: {
    flex: 1,
    marginTop: 10,
  },
  emergencyHeader: {
    marginBottom: 20,
  },
  activeAlertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  activeAlertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
    marginRight: 6,
  },
  activeAlertText: {
    ...TYPOGRAPHY.badge,
    color: COLORS.danger,
    fontSize: 11,
  },
  emergencyTitle: {
    ...TYPOGRAPHY.h1,
    fontSize: 26,
    marginBottom: 6,
  },
  emergencySub: {
    ...TYPOGRAPHY.bodySecondary,
    lineHeight: 20,
  },
  sectionLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  nearbyList: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 24,
    ...SHADOWS.sm,
  },
  nearbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  nearbyInfo: {
    marginLeft: 12,
    flex: 1,
  },
  nearbyName: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  nearbyDistance: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  callIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  criticalActions: {
    paddingBottom: 24,
  },
});
