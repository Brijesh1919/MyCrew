import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import { SecondaryButton } from './SecondaryButton';

export const EmptyState = ({
  icon: IconComponent,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      {IconComponent && (
        <View style={styles.iconCircle}>
          <IconComponent size={28} color={COLORS.primary} />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && (
        <SecondaryButton
          title={actionLabel}
          onPress={onAction}
          size="sm"
          style={styles.actionBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontSize: 17,
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    ...TYPOGRAPHY.bodySecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  actionBtn: {
    marginTop: 6,
  },
});
