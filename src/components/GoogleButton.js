import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS, RADIUS, SHADOWS, TYPOGRAPHY } from '../constants/theme';
import { authService } from '../services/authService';
import { useUserStore } from '../store/useUserStore';
import { useHapticFeedback } from '../hooks/useHapticFeedback';

export const GoogleButton = ({
  onSuccess,
  onError,
  style,
  text = 'Continue with Google',
}) => {
  const [loading, setLoading] = useState(false);
  const { triggerLight, triggerWarning } = useHapticFeedback();
  const setSession = useUserStore((state) => state.setSession);

  const handleGooglePress = async () => {
    triggerLight();
    setLoading(true);

    try {
      const result = await authService.signInWithGoogle();

      if (!result.success) {
        if (!result.cancelled) {
          triggerWarning();
          const errMessage = result.error || 'Google sign-in could not be completed.';
          if (onError) {
            onError(errMessage);
          } else {
            Alert.alert('Google Sign-In', errMessage);
          }
        }
        setLoading(false);
        return;
      }

      if (result.session) {
        const profile = await authService.getProfile(result.session.user.id);
        setSession(result.session, result.session.user, profile);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      triggerWarning();
      const message = err?.message || 'Google sign-in failed. Please try again.';
      if (onError) onError(message);
      else Alert.alert('Google Sign-In Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handleGooglePress}
      disabled={loading}
      style={[styles.button, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <View style={styles.content}>
          {/* Authentic Google 'G' Vector Icon */}
          <View style={styles.iconContainer}>
            <Svg width={18} height={18} viewBox="0 0 24 24">
              <Path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <Path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <Path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <Path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </Svg>
          </View>
          <Text style={styles.text}>{text}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  text: {
    ...TYPOGRAPHY.button,
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
});
