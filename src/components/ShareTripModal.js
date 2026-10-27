import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Share,
  Platform,
  Alert,
} from 'react-native';
import {
  UserPlus,
  QrCode,
  Copy,
  Share2,
  X,
  Check,
} from 'lucide-react-native';
import { QRCodeView } from './QRCodeView';
import { useThemeStore } from '../store/useThemeStore';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

export const ShareTripModal = ({
  visible,
  trip,
  onClose,
}) => {
  const { triggerLight, triggerSuccess } = useHapticFeedback();
  const colors = useThemeStore((state) => state.colors);
  const isDark = useThemeStore((state) => state.isDark);
  const [copied, setCopied] = useState(false);

  if (!trip) return null;

  const tripCode = trip.code || trip.trip_code || '------';
  const tripName = trip.name || 'Active Crew';

  const handleCopyCode = async () => {
    triggerSuccess();
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(tripCode);
        return;
      } catch (e) {
        // ignore
      }
    }

    if (Platform.OS !== 'web') {
      Alert.alert('Copied!', `Crew code "${tripCode}" copied to clipboard.`);
    }
  };

  const handleShare = async () => {
    triggerLight();
    try {
      await Share.share({
        message: `Join my crew "${tripName}" on MyCrew!\n\nInvite Code: ${tripCode}\nJoin Link: https://mycrew.app/join/${tripCode}`,
      });
    } catch (e) {
      console.warn('Share error:', e);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheet,
                {
                  backgroundColor: isDark ? '#111827' : '#FFFFFF',
                  borderColor: isDark ? '#1F2937' : '#E5E7EB',
                },
              ]}
            >
              {/* Drag Handle */}
              <View
                style={[
                  styles.dragHandle,
                  { backgroundColor: isDark ? '#374151' : '#D1D5DB' },
                ]}
              />

              {/* Header */}
              <View style={styles.headerRow}>
                <View style={styles.titleWrap}>
                  <View
                    style={[
                      styles.iconBubble,
                      {
                        backgroundColor: isDark
                          ? 'rgba(34, 197, 94, 0.16)'
                          : 'rgba(34, 197, 94, 0.12)',
                      },
                    ]}
                  >
                    <UserPlus size={20} color="#22C55E" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.badgeText}>ADD PEOPLE & SHARE</Text>
                    <Text
                      style={[
                        styles.tripTitle,
                        { color: isDark ? '#F9FAFB' : colors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {tripName}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.closeBtn,
                    { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' },
                  ]}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={18} color={isDark ? '#9CA3AF' : colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* QR Code Container */}
              <View style={styles.qrSection}>
                <View style={styles.qrCardWrap}>
                  <QRCodeView
                    value={`https://mycrew.app/join/${tripCode}`}
                    size={168}
                  />
                </View>
                <Text
                  style={[
                    styles.qrSubtitle,
                    { color: isDark ? '#9CA3AF' : colors.textSecondary },
                  ]}
                >
                  Scan with camera to instantly join this crew
                </Text>
              </View>

              {/* Crew Code Row with Copy & Share */}
              <View
                style={[
                  styles.codeCard,
                  {
                    backgroundColor: isDark ? '#1A2234' : '#F8FAFC',
                    borderColor: isDark ? '#1E293B' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.codeTextCol}>
                  <Text style={[styles.codeLabel, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    CREW INVITE CODE
                  </Text>
                  <Text style={[styles.codeVal, { color: '#22C55E' }]}>
                    {tripCode}
                  </Text>
                </View>

                <View style={styles.codeBtnsRow}>
                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: copied
                          ? '#22C55E'
                          : isDark
                          ? '#1F2937'
                          : '#FFFFFF',
                        borderColor: copied
                          ? '#22C55E'
                          : isDark
                          ? '#374151'
                          : '#CBD5E1',
                      },
                    ]}
                    onPress={handleCopyCode}
                    activeOpacity={0.75}
                  >
                    {copied ? (
                      <Check size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    ) : (
                      <Copy
                        size={14}
                        color={isDark ? '#F9FAFB' : colors.textPrimary}
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <Text
                      style={[
                        styles.actionBtnText,
                        {
                          color: copied
                            ? '#FFFFFF'
                            : isDark
                            ? '#F9FAFB'
                            : colors.textPrimary,
                        },
                      ]}
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionBtn,
                      styles.shareBtn,
                      { backgroundColor: '#2563EB', borderColor: '#2563EB' },
                    ]}
                    onPress={handleShare}
                    activeOpacity={0.8}
                  >
                    <Share2 size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                      Share
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  dragHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#22C55E',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  tripTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrSection: {
    alignItems: 'center',
    marginVertical: 10,
  },
  qrCardWrap: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  qrSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  codeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeTextCol: {
    flex: 1,
    marginRight: 12,
  },
  codeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  codeVal: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  codeBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  shareBtn: {
    paddingHorizontal: 14,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
