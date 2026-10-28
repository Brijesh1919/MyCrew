// ==========================================================
// MyCrew - ActiveTripPickerModal Component
// Allows user to choose active crew when multiple trips are active
// ==========================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { X, Check, Clock, Users } from 'lucide-react-native';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { formatRemainingTime } from '../utils/freshness';
import { useThemeStore } from '../store/useThemeStore';

export const ActiveTripPickerModal = ({
  visible,
  trips = [],
  currentTripId,
  onSelectTrip,
  onClose,
}) => {
  const colors = useThemeStore((state) => state.colors);
  const isDark = useThemeStore((state) => state.isDark);

  if (!visible || trips.length <= 1) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: isDark ? '#1F2937' : colors.border, borderWidth: isDark ? 1 : 0 }]}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Choose Your Active Crew</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Which crew are you joining?</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
            {trips.map((t) => {
              const isSelected = t.id === currentTripId;
              const timeLeft = formatRemainingTime(t.endTime || t.ends_at);

              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.tripItem,
                    {
                      backgroundColor: isSelected
                        ? isDark ? 'rgba(59, 130, 246, 0.16)' : '#EFF6FF'
                        : colors.surfaceSubtle,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    onSelectTrip(t);
                    onClose();
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.emojiCircle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={styles.emojiText}>{t.emoji || '🎪'}</Text>
                  </View>

                  <View style={styles.tripInfo}>
                    <Text style={[styles.tripName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {t.name}
                    </Text>
                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Users size={12} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>{t.memberCount || 1} people</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Clock size={12} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>Ends in {timeLeft}</Text>
                      </View>
                    </View>
                  </View>

                  {isSelected && (
                    <View style={[styles.checkBubble, { backgroundColor: colors.primary }]}>
                      <Check size={16} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 20,
    maxHeight: '80%',
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  listScroll: {
    marginTop: 4,
  },
  tripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  tripItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#EFF6FF',
  },
  emojiCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emojiText: {
    fontSize: 20,
  },
  tripInfo: {
    flex: 1,
  },
  tripName: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  checkBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
