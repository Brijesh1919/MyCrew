import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Locate, Plus, Minus, Maximize2, MapPin } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

export const MapControls = ({
  onRecenter,
  onZoomIn,
  onZoomOut,
  onFitGroup,
  onToggleMeetingPoints,
  isMeetingPointsActive = true,
  bottomOffset = 24,
  compact = false,
  style,
}) => {
  const { triggerLight } = useHapticFeedback();

  const handleAction = (callback) => {
    triggerLight();
    callback && callback();
  };

  const btnStyle = compact ? styles.btnCompact : styles.btn;
  const singleBtnStyle = compact ? styles.singleBtnCompact : styles.singleBtn;
  const iconSize = compact ? 15 : 18;

  return (
    <View style={[styles.container, { bottom: bottomOffset }, style]}>
      {/* Zoom In & Out Group */}
      <View style={[styles.buttonGroup, compact && styles.buttonGroupCompact]}>
        <TouchableOpacity
          style={[btnStyle, styles.btnTop]}
          activeOpacity={0.75}
          onPress={() => handleAction(onZoomIn)}
        >
          <Plus size={iconSize} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={[btnStyle, styles.btnBottom]}
          activeOpacity={0.75}
          onPress={() => handleAction(onZoomOut)}
        >
          <Minus size={iconSize} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Non-compact only: Fit Group & Meeting Points */}
      {!compact && (
        <>
          <TouchableOpacity
            style={singleBtnStyle}
            activeOpacity={0.75}
            onPress={() => handleAction(onFitGroup)}
          >
            <Maximize2 size={iconSize} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              singleBtnStyle,
              isMeetingPointsActive && styles.activeBtn,
            ]}
            activeOpacity={0.75}
            onPress={() => handleAction(onToggleMeetingPoints)}
          >
            <MapPin
              size={iconSize}
              color={isMeetingPointsActive ? COLORS.primary : COLORS.textMuted}
            />
          </TouchableOpacity>
        </>
      )}

      {/* Recenter on User Location */}
      <TouchableOpacity
        style={[singleBtnStyle, styles.recenterBtn]}
        activeOpacity={0.75}
        onPress={() => handleAction(onRecenter)}
      >
        <Locate size={iconSize} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 10,
  },
  buttonGroup: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    ...SHADOWS.md,
  },
  btn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnTop: {
    borderTopLeftRadius: RADIUS.md,
    borderTopRightRadius: RADIUS.md,
  },
  btnBottom: {
    borderBottomLeftRadius: RADIUS.md,
    borderBottomRightRadius: RADIUS.md,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  singleBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.md,
  },
  activeBtn: {
    borderColor: COLORS.primaryLight,
    backgroundColor: '#EFF6FF',
  },
  recenterBtn: {
    borderColor: COLORS.primaryLight,
  },
  buttonGroupCompact: {
    marginBottom: 6,
  },
  btnCompact: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  singleBtnCompact: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.md,
  },
});
