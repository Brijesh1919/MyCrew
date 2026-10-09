import React from 'react';
import { View, StyleSheet, Platform, Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

/**
 * Renders a high-contrast, scannable QR Code for Crew invites.
 * Compatible with Android, iOS, and Web.
 * Encodes either a custom deep link (mycrew://join?code=...) or raw trip code.
 */
export function QRCodeView({
  value,
  size = 180,
  color = '#0F172A',
  backgroundColor = '#FFFFFF',
  style,
}) {
  const cleanValue = value ? String(value).trim() : '';

  if (!cleanValue) {
    return (
      <View style={[styles.card, { width: size + 32, height: size + 32 }, style]}>
        <View style={styles.placeholder} />
      </View>
    );
  }

  // On Web, use standard responsive SVG or fallback to QR API image if SVG renderer is absent
  if (Platform.OS === 'web') {
    const webQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
      cleanValue
    )}&margin=0`;
    return (
      <View style={[styles.card, { padding: 16 }, style]}>
        <Image
          source={{ uri: webQrUrl }}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={[styles.card, { padding: 16 }, style]}>
      <QRCode
        value={cleanValue}
        size={size}
        color={color}
        backgroundColor={backgroundColor}
        quietZone={4}
        enableLinearGradient={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.md,
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.lg,
  },
});

export default QRCodeView;
