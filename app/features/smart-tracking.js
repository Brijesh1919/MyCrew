import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BatteryCharging, Cpu, Check, Clock, Zap } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { APP_CONFIG } from '../../src/constants/config';
import { AppHeader } from '../../src/components/AppHeader';
import { useUserStore } from '../../src/store/useUserStore';
import { useLocationStore } from '../../src/store/useLocationStore';
import { useTripStore } from '../../src/store/useTripStore';
import { useCrewStore } from '../../src/store/useCrewStore';
import { tripService } from '../../src/services/tripService';
import { locationService } from '../../src/services/locationService';
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';
import { batteryService } from '../../src/services/batteryService';

export default function SmartTrackingScreen() {
  const { triggerLight } = useHapticFeedback();

  const currentUser = useUserStore((state) => state.currentUser);
  const setTrackingMode = useUserStore((state) => state.setTrackingMode);
  const activeTrip = useTripStore((state) => state.activeTrip);
  const isSharing = useLocationStore((state) => state.isLocationSharingActive);
  const setIsSharing = useLocationStore((state) => state.setIsLocationSharingActive);

  const [realBattery, setRealBattery] = useState(null);

  useEffect(() => {
    let isMounted = true;
    batteryService.getBatteryLevel().then((lvl) => {
      if (isMounted && typeof lvl === 'number') {
        setRealBattery(lvl);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedMode = currentUser?.trackingMode || 'crowded';

  const handleSelectMode = (modeId) => {
    triggerLight();
    setTrackingMode(modeId);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <AppHeader
        title="Smart Tracking"
        subtitle="Battery & frequency optimization"
        showBack={true}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* CURRENT STATUS HERO CARD */}
        <View style={styles.statusCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.liveBadge, !isSharing && { backgroundColor: COLORS.dangerBg }]}>
              <View style={[styles.liveDot, !isSharing && { backgroundColor: COLORS.danger }]} />
              <Text style={[styles.liveText, !isSharing && { color: COLORS.danger }]}>
                {isSharing ? 'Enabled' : 'Paused'}
              </Text>
            </View>

            <Switch
              value={isSharing}
              onValueChange={async (val) => {
                triggerLight();
                setIsSharing(val);
                if (currentUser?.id) {
                  useCrewStore.getState().setUserLocationSharingState(currentUser.id, val);
                }
                if (activeTrip?.id && currentUser?.id) {
                  if (!val) {
                    try {
                      await tripService.pauseLocationSharing({
                        tripId: activeTrip.id,
                        userId: currentUser.id,
                      });
                    } catch (e) {
                      console.warn('Error pausing sharing in smart-tracking:', e);
                    }
                  } else {
                    try {
                      const pos = await locationService.getCurrentPosition(true);
                      if (pos) {
                        useLocationStore.getState().setUserLocation(pos);
                        await tripService.updateMemberLocation({
                          tripId: activeTrip.id,
                          userId: currentUser.id,
                          latitude: pos.latitude,
                          longitude: pos.longitude,
                          accuracy: pos.accuracy,
                          heading: pos.heading,
                          speed: pos.speed,
                          force: true,
                        });
                      }
                    } catch (e) {
                      console.warn('Error resuming sharing in smart-tracking:', e);
                    }
                  }
                }
              }}
              trackColor={{ false: '#CBD5E1', true: COLORS.primaryLight }}
              thumbColor={isSharing ? COLORS.primary : '#F1F5F9'}
            />
          </View>

          <Text style={styles.desc}>
            Automatically adjusts location ping frequency to balance sub-meter precision and battery life.
          </Text>

          {/* Device Telemetry Strip */}
          <View style={styles.telemetryRow}>
            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>CURRENT MODE</Text>
              <Text style={styles.telemetryVal}>
                {APP_CONFIG.trackingModes.find((m) => m.id === selectedMode)?.label || 'Crowded'}
              </Text>
            </View>

            <View style={styles.telemetryDivider} />

            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>BATTERY</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <BatteryCharging size={16} color={COLORS.success} />
                <Text style={[styles.telemetryVal, { marginLeft: 4 }]}>
                  {typeof realBattery === 'number' ? `${realBattery}%` : `${currentUser?.batteryLevel || 100}%`}
                </Text>
              </View>
            </View>

            <View style={styles.telemetryDivider} />

            <View style={styles.telemetryItem}>
              <Text style={styles.telemetryLabel}>LAST UPDATE</Text>
              <Text style={styles.telemetryVal}>8 sec ago</Text>
            </View>
          </View>
        </View>

        {/* MODES GROUPED CONTAINER */}
        <Text style={styles.sectionLabel}>TRACKING FREQUENCY MODES</Text>
        <View style={styles.modesGroupContainer}>
          {APP_CONFIG.trackingModes.map((mode, idx) => {
            const isSelected = selectedMode === mode.id;
            return (
              <React.Fragment key={mode.id}>
                {idx > 0 && <View style={styles.modeDivider} />}
                <TouchableOpacity
                  style={[styles.modeRow, isSelected && styles.modeRowSelected]}
                  activeOpacity={0.7}
                  onPress={() => handleSelectMode(mode.id)}
                >
                  <View style={styles.modeCardLeft}>
                    <View
                      style={[
                        styles.radioCircle,
                        isSelected && styles.radioCircleSelected,
                      ]}
                    >
                      {isSelected && <View style={styles.radioInner} />}
                    </View>

                    <View style={styles.modeInfo}>
                      <Text style={[styles.modeTitle, isSelected && styles.modeTitleSelected]}>
                        {mode.label}
                      </Text>
                      <Text style={styles.modeDetails}>
                        Updates every {mode.intervalSec}s • {mode.accuracy} precision
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.impactPill, isSelected && styles.impactPillSelected]}>
                    <Zap size={12} color={isSelected ? COLORS.primary : COLORS.textMuted} />
                    <Text style={[styles.impactText, isSelected && styles.impactTextSelected]}>
                      {mode.batteryImpact}
                    </Text>
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>
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
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  liveText: {
    color: COLORS.success,
    fontWeight: '700',
    fontSize: 12,
  },
  desc: {
    ...TYPOGRAPHY.bodySecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  telemetryRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: 12,
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
  },
  telemetryDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
  },
  telemetryLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 9,
    marginBottom: 4,
  },
  telemetryVal: {
    ...TYPOGRAPHY.h3,
    fontSize: 13,
  },
  sectionLabel: {
    ...TYPOGRAPHY.badge,
    color: COLORS.textSecondary,
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  modesGroupContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 64,
  },
  modeRowSelected: {
    backgroundColor: '#F8FAFF',
  },
  modeDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 48,
  },
  modeCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  modeTitleSelected: {
    color: COLORS.primary,
  },
  modeDetails: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  impactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  impactPillSelected: {
    backgroundColor: '#EFF6FF',
  },
  impactText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  impactTextSelected: {
    color: COLORS.primary,
  },
});
