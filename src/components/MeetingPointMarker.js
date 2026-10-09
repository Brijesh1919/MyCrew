import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { COLORS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

export const MeetingPointMarker = ({
  meetingPoint,
  onPress,
  isSelected = false,
}) => {
  const { triggerLight } = useHapticFeedback();

  const handlePress = () => {
    triggerLight();
    onPress && onPress(meetingPoint);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[styles.container, isSelected && styles.selectedContainer]}
    >
      <View style={[styles.pinBubble, isSelected && styles.pinBubbleSelected]}>
        <MapPin size={18} color={COLORS.white} />
      </View>
      <View style={styles.pointer} />

      <View style={[styles.namePill, isSelected && styles.namePillSelected]}>
        <Text style={styles.nameText} numberOfLines={1}>
          {meetingPoint.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 80,
  },
  selectedContainer: {
    transform: [{ scale: 1.15 }],
  },
  pinBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0284C7', // Sky-blue / accent
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    ...SHADOWS.md,
  },
  pinBubbleSelected: {
    backgroundColor: '#0369A1',
    borderColor: '#BAE6FD',
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0284C7',
    marginTop: -1,
  },
  namePill: {
    marginTop: 2,
    backgroundColor: 'rgba(2, 132, 199, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 76,
  },
  namePillSelected: {
    backgroundColor: '#0369A1',
  },
  nameText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
});
