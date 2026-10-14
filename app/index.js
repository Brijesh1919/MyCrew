import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Image,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Radio, Compass, Users, Sparkles, Navigation } from 'lucide-react-native';
import { useTripStore } from '../src/store/useTripStore';
import { useUserStore } from '../src/store/useUserStore';
import { COLORS } from '../src/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const STATUS_STEPS = [
  { text: 'Calibrating Crew Radar...', icon: Radio },
  { text: 'Locating Active Satellites...', icon: Navigation },
  { text: 'Syncing Live Crew Session...', icon: Users },
  { text: 'Ready! Launching MyCrew...', icon: Sparkles },
];

export default function IndexScreen() {
  const router = useRouter();

  // Stores
  const isTripInitialized = useTripStore((state) => state.isInitialized);
  const isOnboardingCompleted = useTripStore((state) => state.isOnboardingCompleted);
  const initializeTripStore = useTripStore((state) => state.initializeStore);

  const isAuthInitialized = useUserStore((state) => state.isAuthInitialized);
  const authStatus = useUserStore((state) => state.authStatus);
  const initializeAuth = useUserStore((state) => state.initializeAuth);

  const [statusStep, setStatusStep] = useState(0);
  const [animationCompleted, setAnimationCompleted] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const sweepRotation = useRef(new Animated.Value(0)).current;

  // Radar Pulse Rings (3 staggered rings)
  const ring1Scale = useRef(new Animated.Value(0.7)).current;
  const ring1Opacity = useRef(new Animated.Value(0.8)).current;

  const ring2Scale = useRef(new Animated.Value(0.7)).current;
  const ring2Opacity = useRef(new Animated.Value(0.8)).current;

  const ring3Scale = useRef(new Animated.Value(0.7)).current;
  const ring3Opacity = useRef(new Animated.Value(0.8)).current;

  // Satellite Crew Nodes
  const node1Opacity = useRef(new Animated.Value(0)).current;
  const node2Opacity = useRef(new Animated.Value(0)).current;
  const node3Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeAuth();
    initializeTripStore();
  }, []);

  // Run animations on mount
  useEffect(() => {
    // 1. Entrance Fade & Logo Spring
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Subtle Logo Floating Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: -8,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Radar Sweep Continuous Rotation
    Animated.loop(
      Animated.timing(sweepRotation, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 4. Staggered Radar Pulse Rings Loops
    const createRingLoop = (scaleAnim, opacityAnim, delayMs) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delayMs),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 2.3,
              duration: 2400,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 2400,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 0.7,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.75,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
    };

    createRingLoop(ring1Scale, ring1Opacity, 0).start();
    createRingLoop(ring2Scale, ring2Opacity, 800).start();
    createRingLoop(ring3Scale, ring3Opacity, 1600).start();

    // 5. Staggered Satellite Nodes Appearing
    Animated.sequence([
      Animated.delay(400),
      Animated.timing(node1Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(350),
      Animated.timing(node2Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.delay(350),
      Animated.timing(node3Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // 6. Progress Fill (2.2 seconds total intro experience)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setAnimationCompleted(true);
    });

    // 7. Status steps ticker
    const step1 = setTimeout(() => setStatusStep(1), 600);
    const step2 = setTimeout(() => setStatusStep(2), 1200);
    const step3 = setTimeout(() => setStatusStep(3), 1800);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
    };
  }, []);

  // Trigger navigation once stores and intro animation are both ready
  useEffect(() => {
    if (!animationCompleted || !isAuthInitialized || !isTripInitialized || authStatus === 'loading') {
      return;
    }

    // Smooth exit fade
    Animated.timing(exitAnim, {
      toValue: 0,
      duration: 280,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      if (authStatus === 'authenticated') {
        router.replace('/(tabs)/home');
      } else {
        if (isOnboardingCompleted) {
          router.replace('/(auth)');
        } else {
          router.replace('/(onboarding)/welcome');
        }
      }
    });
  }, [
    animationCompleted,
    isAuthInitialized,
    isTripInitialized,
    authStatus,
    isOnboardingCompleted,
    router,
  ]);

  const spin = sweepRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const CurrentStatusIcon = STATUS_STEPS[statusStep].icon;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Cinematic Deep Space / Radar Gradient Canvas */}
      <LinearGradient
        colors={['#050814', '#0B132B', '#0F172A']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFillObject}
      />

      <Animated.View style={[styles.mainWrapper, { opacity: exitAnim }]}>
        {/* CENTER RADAR HERO CONTAINER */}
        <View style={styles.radarContainer}>
          {/* Faint Background Radar Target Grid Rings */}
          <View style={[styles.staticRing, { width: 140, height: 140, borderRadius: 70 }]} />
          <View style={[styles.staticRing, { width: 220, height: 220, borderRadius: 110 }]} />
          <View style={[styles.staticRing, { width: 300, height: 300, borderRadius: 150 }]} />

          {/* Crosshair Axes */}
          <View style={styles.crosshairH} />
          <View style={styles.crosshairV} />

          {/* 3 Staggered Expanding Radar Waves */}
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: ring1Scale }],
                opacity: ring1Opacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: ring2Scale }],
                opacity: ring2Opacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseRing,
              {
                transform: [{ scale: ring3Scale }],
                opacity: ring3Opacity,
              },
            ]}
          />

          {/* Rotating Radar Sweep Line */}
          <Animated.View
            style={[
              styles.sweepContainer,
              {
                transform: [{ rotate: spin }],
              },
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={['rgba(56, 189, 248, 0.45)', 'rgba(37, 99, 235, 0.0)']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.sweepBeam}
            />
          </Animated.View>

          {/* Satellite Crew Nodes in Radar Proximity */}
          <Animated.View style={[styles.crewNode, styles.crewNode1, { opacity: node1Opacity }]}>
            <View style={styles.crewNodeDot} />
            <View style={styles.crewNodeHalo} />
          </Animated.View>

          <Animated.View style={[styles.crewNode, styles.crewNode2, { opacity: node2Opacity }]}>
            <View style={[styles.crewNodeDot, { backgroundColor: '#10B981' }]} />
            <View style={[styles.crewNodeHalo, { borderColor: '#10B981' }]} />
          </Animated.View>

          <Animated.View style={[styles.crewNode, styles.crewNode3, { opacity: node3Opacity }]}>
            <View style={[styles.crewNodeDot, { backgroundColor: '#F59E0B' }]} />
            <View style={[styles.crewNodeHalo, { borderColor: '#F59E0B' }]} />
          </Animated.View>

          {/* Central Hero Logo with Breathing / Floating Micro-Animation */}
          <Animated.View
            style={[
              styles.heroLogoWrap,
              {
                transform: [
                  { scale: logoScale },
                  { translateY: logoFloat },
                ],
              },
            ]}
          >
            <View style={styles.heroLogoGlow} />
            <Image
              source={require('../assets/icon.png')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </Animated.View>
        </View>

        {/* BRAND & INTRO TYPOGRAPHY */}
        <Animated.View style={[styles.brandSection, { opacity: fadeAnim }]}>
          <Text style={styles.brandTitle}>MYCREW</Text>
          <Text style={styles.brandTagline}>REAL-TIME LIVE CREW RADAR</Text>
        </Animated.View>

        {/* DYNAMIC PROGRESS & STEP STATUS */}
        <View style={styles.bottomSection}>
          {/* Status Step Ticker */}
          <View style={styles.statusRow}>
            <CurrentStatusIcon size={14} color="#38BDF8" style={{ marginRight: 6 }} />
            <Text style={styles.statusText}>{STATUS_STEPS[statusStep].text}</Text>
          </View>

          {/* Glowing Animated Progress Bar */}
          <View style={styles.progressBarTrack}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
              <LinearGradient
                colors={['#38BDF8', '#2563EB', '#60A5FA']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
          </View>

          <Text style={styles.versionNote}>Keeping your people connected & safe</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050814',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainWrapper: {
    width: '100%',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Math.min(SCREEN_HEIGHT * 0.14, 110),
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  radarContainer: {
    width: 320,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  staticRing: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.12)',
  },
  crosshairH: {
    position: 'absolute',
    width: 290,
    height: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  crosshairV: {
    position: 'absolute',
    height: 290,
    width: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },
  sweepContainer: {
    position: 'absolute',
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sweepBeam: {
    position: 'absolute',
    top: 0,
    width: 150,
    height: 150,
    borderTopRightRadius: 150,
    transform: [{ rotate: '-45deg' }],
  },
  crewNode: {
    position: 'absolute',
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crewNodeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
  crewNodeHalo: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38BDF8',
    opacity: 0.6,
  },
  crewNode1: {
    top: 50,
    right: 68,
  },
  crewNode2: {
    bottom: 60,
    left: 56,
  },
  crewNode3: {
    bottom: 74,
    right: 48,
  },
  heroLogoWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0 12px 32px rgba(37, 99, 235, 0.45)',
      },
      default: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 24,
        elevation: 16,
      },
    }),
  },
  heroLogoGlow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 36,
    backgroundColor: 'rgba(37, 99, 235, 0.35)',
  },
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  brandSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 4,
    fontFamily: Platform.select({ ios: 'System', default: 'sans-serif-black' }),
    textShadowColor: 'rgba(56, 189, 248, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  brandTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 2,
    marginTop: 6,
  },
  bottomSection: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
    letterSpacing: 0.3,
  },
  progressBarTrack: {
    width: '100%',
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  versionNote: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
