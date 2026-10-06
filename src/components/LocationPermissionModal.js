import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { MapPin, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

export const LocationPermissionModal = ({
  visible,
  isPermanentlyDenied = false,
  onAllow,
  onDismiss,
}) => {
  const handleOpenSettings = async () => {
    try {
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    } catch (e) {
      // ignore
    }
    if (onDismiss) onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View
            style={[
              styles.iconCircle,
              isPermanentlyDenied && { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
            ]}
          >
            {isPermanentlyDenied ? (
              <AlertCircle size={32} color={COLORS.danger} />
            ) : (
              <MapPin size={32} color={COLORS.primary} />
            )}
          </View>

          <Text style={styles.title}>
            {isPermanentlyDenied
              ? 'Enable Location in Settings'
              : 'Share your location with your crew'}
          </Text>

          <Text style={styles.subtitle}>
            {isPermanentlyDenied
              ? 'Location access was previously denied. Allow location access in your device settings so your crew can see where you are.'
              : "MyCrew uses your location only while you're part of an active crew so your friends can find you. Location sharing stops automatically when the trip ends."}
          </Text>

          <View style={styles.privacyGuarantee}>
            <ShieldCheck size={16} color={COLORS.success} />
            <Text style={styles.privacyText}>
              Private by design • Only shared during active trips
            </Text>
          </View>

          <View style={styles.buttonCol}>
            {isPermanentlyDenied ? (
              <>
                <PrimaryButton
                  title="Open Settings"
                  onPress={handleOpenSettings}
                  icon={ArrowRight}
                  size="lg"
                  style={{ marginBottom: 10 }}
                />
                <SecondaryButton
                  title="Not Now"
                  onPress={onDismiss}
                  size="md"
                  variant="ghost"
                />
              </>
            ) : (
              <>
                <PrimaryButton
                  title="Allow Location"
                  onPress={onAllow}
                  size="lg"
                  style={{ marginBottom: 10 }}
                />
                <SecondaryButton
                  title="Not Now"
                  onPress={onDismiss}
                  size="md"
                  variant="ghost"
                />
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...TYPOGRAPHY.bodySecondary,
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  privacyGuarantee: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    marginBottom: 20,
  },
  privacyText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontWeight: '600',
    fontSize: 11,
    marginLeft: 6,
  },
  buttonCol: {
    width: '100%',
  },
});
