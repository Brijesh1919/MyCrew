import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Locate, Plus, Minus, Maximize2, MapPin } from 'lucide-react-native';
import { RADIUS, SHADOWS } from '../constants/theme';
import { useThemeStore } from '../store/useThemeStore';
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
  const colors = useThemeStore((state) => state.colors);
  const isDark = useThemeStore((state) => state.isDark);

  const handleAction = (callback) => {
    triggerLight();
    callback && callback();
  };

  const btnStyle = compact ? styles.btnCompact : styles.btn;
  const singleBtnStyle = compact ? styles.singleBtnCompact : styles.singleBtn;
  const iconSize = compact ? 16 : 18;

  const bgStyle = {
    backgroundColor: isDark ? 'rgba(22, 27, 34, 0.88)' : 'rgba(255, 255, 255, 0.92)',
    borderColor: colors.border,
  };

  return (
    <View style={[styles.container, { bottom: bottomOffset }, style]}>
      {/* Zoom In & Out Group */}
      <View style={[styles.buttonGroup, bgStyle, compact && styles.buttonGroupCompact]}>
        <TouchableOpacity
          style={[btnStyle, styles.btnTop]}
          activeOpacity={0.75}
          onPress={() => handleAction(onZoomIn)}
        >
          <Plus size={iconSize} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <TouchableOpacity
          style={[btnStyle, styles.btnBottom]}
          activeOpacity={0.75}
          onPress={() => handleAction(onZoomOut)}
        >
          <Minus size={iconSize} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Non-compact only: Fit Group & Meeting Points */}
      {!compact && (
        <>
          <TouchableOpacity
            style={[singleBtnStyle, bgStyle]}
            activeOpacity={0.75}
            onPress={() => handleAction(onFitGroup)}
          >
            <Maximize2 size={iconSize} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              singleBtnStyle,
              bgStyle,
              isMeetingPointsActive && { borderColor: colors.primary, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' },
            ]}
            activeOpacity={0.75}
            onPress={() => handleAction(onToggleMeetingPoints)}
          >
            <MapPin
              size={iconSize}
              color={isMeetingPointsActive ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
        </>
      )}

      {/* Recenter on User Location */}
      <TouchableOpacity
        style={[singleBtnStyle, bgStyle, { borderColor: colors.primary }]}
        activeOpacity={0.75}
        onPress={() => handleAction(onRecenter)}
      >
        <Locate size={iconSize} color={colors.primary} />
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
    borderRadius: RADIUS.md,
    borderWidth: 1,
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
  },
  singleBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    ...SHADOWS.md,
  },
  activeBtn: {
    borderColor: '#3B82F6',
  },
  recenterBtn: {
    borderColor: '#3B82F6',
  },
  buttonGroupCompact: {
    marginBottom: 6,
  },
  btnCompact: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  singleBtnCompact: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    ...SHADOWS.md,
  },
});
