import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { Phone, X, ShieldAlert, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, RADIUS, TYPOGRAPHY, SHADOWS } from '../constants/theme';
import { PrimaryButton } from './PrimaryButton';
import { useUserStore } from '../store/useUserStore';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

export const PHONE_PROMPT_STORAGE_KEY = '@mycrew_phone_prompt_dismissed_at';

export const ContactNumberModal = ({
  visible,
  onClose,
  onSaved,
}) => {
  const { triggerSuccess, triggerWarning, triggerLight } = useHapticFeedback();
  const currentUser = useUserStore((state) => state.currentUser);
  const updateProfile = useUserStore((state) => state.updateProfile);

  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setPhone(currentUser?.phone || '');
      setError('');
    }
  }, [visible, currentUser?.phone]);

  const validatePhone = (num) => {
    const cleaned = num.replace(/[^\d+]/g, '');
    const digitsOnly = num.replace(/\D/g, '');
    if (!num.trim()) {
      return 'Please enter a mobile phone number.';
    }
    if (digitsOnly.length < 8) {
      return 'Please enter a valid phone number with at least 8 digits.';
    }
    if (digitsOnly.length > 15) {
      return 'Phone number cannot exceed 15 digits.';
    }
    return '';
  };

  const handleSave = async () => {
    const validationError = validatePhone(phone);
    if (validationError) {
      setError(validationError);
      triggerWarning();
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      const cleanPhone = phone.trim();
      await updateProfile({ phone: cleanPhone });
      await AsyncStorage.setItem(PHONE_PROMPT_STORAGE_KEY, String(Date.now()));
      triggerSuccess();
      onSaved && onSaved(cleanPhone);
      onClose && onClose();
    } catch (err) {
      console.warn('Failed to save phone number:', err);
      setError('Could not save phone number. Please try again.');
      triggerWarning();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDismiss = async () => {
    triggerLight();
    try {
      await AsyncStorage.setItem(PHONE_PROMPT_STORAGE_KEY, String(Date.now()));
    } catch (e) {
      // storage fallback
    }
    onClose && onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.sheetWrap}
            >
              <View style={styles.modalCard}>
                {/* Close X */}
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={handleDismiss}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <X size={20} color={COLORS.textMuted} />
                </TouchableOpacity>

                {/* Hero Icon */}
                <View style={styles.iconCircle}>
                  <Phone size={28} color={COLORS.primary} />
                </View>

                {/* Title & Description */}
                <Text style={styles.title}>Add Your Contact Number</Text>
                <Text style={styles.subtitle}>
                  Make sure your crew can call you directly if you get separated, lost, or need quick help.
                </Text>

                {/* Phone Input Box */}
                <View style={[styles.inputBox, Boolean(error) && styles.inputBoxError]}>
                  <Phone size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="+91 98765 43210"
                    placeholderTextColor={COLORS.textMuted}
                    value={phone}
                    onChangeText={(val) => {
                      setPhone(val);
                      if (error) setError('');
                    }}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={20}
                  />
                  {phone.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setPhone('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}

                {/* Actions */}
                <PrimaryButton
                  title={isSaving ? 'Saving Number...' : 'Save Contact Number'}
                  onPress={handleSave}
                  disabled={isSaving}
                  size="lg"
                  style={{ marginTop: 14, width: '100%' }}
                />

                <TouchableOpacity
                  style={styles.skipBtn}
                  onPress={handleDismiss}
                  activeOpacity={0.7}
                >
                  <Text style={styles.skipBtnText}>Remind Me Later</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheetWrap: {
    width: '100%',
    maxWidth: 420,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xxl,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    ...SHADOWS.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    width: '100%',
  },
  inputBoxError: {
    borderColor: COLORS.danger,
    backgroundColor: '#FEF2F2',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.danger,
    marginTop: 6,
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
  skipBtn: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipBtnText: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
});
