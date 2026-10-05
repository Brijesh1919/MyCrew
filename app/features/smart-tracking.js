import React from 'react';
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
import { useHapticFeedback } from '../../src/hooks/useHapticFeedback';

export default function SmartTrackingScreen() {
  const { triggerLight } = useHapticFeedback();

  const currentUser = useUserStore((state) => state.currentUser);
  const setTrackingMode = useUserStore((state) => state.setTrackingMode);
  const isSharing = useLocationStore((state) => state.isLocationSharingActive);
  const setIsSharing = useLocationStore((state) => state.setIsLocationSharingActive);

  const selectedMode = currentUser.trackingMode || 'crowded';

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
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>
                {isSharing ? 'Enabled' : 'Paused'}
              </Text>
            </View>

            <Switch
              value={isSharing}
              onValueChange={setIsSharing}
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
                  {currentUser.batteryLevel || 64}%
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

        {/* MODES LIST */}
        <Text style={styles.sectionLabel}>TRACKING FREQUENCY MODES</Text>

        {APP_CONFIG.trackingModes.map((mode) => {
          const isSelected = selectedMode === mode.id;
          return (
            <TouchableOpacity
              key={mode.id}
              style={[styles.modeCard, isSelected && styles.modeCardSelected]}
              activeOpacity={0.8}
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

              <View style={styles.impactPill}>
                <Zap size={12} color={isSelected ? COLORS.primary : COLORS.textMuted} />
                <Text style={[styles.impactText, isSelected && styles.impactTextSelected]}>
                  {mode.batteryImpact}
                </Text>
              </View>
            </TouchableOpacity>
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
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    ...SHADOWS.md,
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
    backgroundColor: COLORS.successBg,
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
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: 12,
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
  },
  telemetryDivider: {
    width: 1,
    backgroundColor: '#CBD5E1',
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
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    ...SHADOWS.sm,
  },
  modeCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#F8FAFF',
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
    backgroundColor: COLORS.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
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
