import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { getInitials } from '../utils/helpers';

export const MemberAvatar = ({
  uri,
  name,
  size = 'md',
  status = null, // 'live' | 'delayed' | 'offline' | null
  showBorder = false,
  borderColor = COLORS.white,
  isUser = false,
}) => {
  const sizeMap = {
    xs: 26,
    sm: 36,
    md: 46,
    lg: 58,
    xl: 76,
  };

  const dimension = sizeMap[size] || sizeMap.md;
  const dotSize = Math.max(9, Math.round(dimension * 0.24));

  const getStatusColor = () => {
    if (status === 'live') return COLORS.success;
    if (status === 'delayed') return COLORS.warning;
    if (status === 'offline') return COLORS.danger;
    return COLORS.success;
  };

  return (
    <View style={[styles.container, { width: dimension, height: dimension }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.avatarImage,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
              borderWidth: showBorder ? 2 : 0,
              borderColor,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.initialsContainer,
            {
              width: dimension,
              height: dimension,
              borderRadius: dimension / 2,
              backgroundColor: isUser ? COLORS.primary : COLORS.secondary,
              borderWidth: showBorder ? 2 : 0,
              borderColor,
            },
          ]}
        >
          <Text
            style={[
              styles.initialsText,
              { fontSize: Math.round(dimension * 0.38) },
            ]}
          >
            {getInitials(name)}
          </Text>
        </View>
      )}

      {status && (
        <View
          style={[
            styles.statusDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: getStatusColor(),
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    backgroundColor: COLORS.surfaceSubtle,
  },
  initialsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});
