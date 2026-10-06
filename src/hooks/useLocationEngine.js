// ==========================================================
// MyCrew - Real Device Location Engine Hook
// Connects Real Device GPS -> Local Location Store -> Supabase
// Synchronizes Realtime updates from other crew members
// Strictly enforces battery saving and trip expiration
// ==========================================================

import { useEffect, useRef } from 'react';
import { useCrewStore } from '../store/useCrewStore';
import { useTripStore } from '../store/useTripStore';
import { useLocationStore } from '../store/useLocationStore';
import { useUserStore } from '../store/useUserStore';
import { tripService } from '../services/tripService';
import { locationService } from '../services/locationService';
import { getTripStatus } from '../utils/tripStatus';

export const useLocationEngine = () => {
  const activeTrip = useTripStore((state) => state.activeTrip);
  const checkTripExpiration = useTripStore((state) => state.checkTripExpiration);
  const currentUser = useUserStore((state) => state.currentUser);

  const isLocationSharingActive = useLocationStore((state) => state.isLocationSharingActive);
  const setUserLocation = useLocationStore((state) => state.setUserLocation);
  const setIsLocating = useLocationStore((state) => state.setIsLocating);

  const updateMemberLocationFromRemote = useCrewStore((state) => state.updateMemberLocationFromRemote);
  const refreshFreshness = useCrewStore((state) => state.refreshFreshness);

  const timerRef = useRef(null);
  const isWatchingGpsRef = useRef(false);

  // 1. TRIP EXPIRATION & FRESHNESS CHECK TIMER (every 4 seconds)
  useEffect(() => {
    if (!activeTrip) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const isExpired = checkTripExpiration();
    if (isExpired) return;

    timerRef.current = setInterval(() => {
      const didExpire = checkTripExpiration();
      if (didExpire) {
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      // Re-evaluate freshness (Live -> Delayed -> Offline)
      refreshFreshness();
    }, 4000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [Boolean(activeTrip), activeTrip?.id, activeTrip?.ends_at, checkTripExpiration, refreshFreshness]);

  // 2. SUPABASE REALTIME SUBSCRIPTION FOR THE ACTIVE TRIP
  useEffect(() => {
    if (!activeTrip || getTripStatus(activeTrip) === 'expired') {
      tripService.unsubscribeFromTripLocations();
      return;
    }

    const tripId = activeTrip.id;
    console.log('[LocationEngine] Subscribing to Realtime location changes for trip:', tripId);

    tripService.subscribeToTripLocations(tripId, (payload) => {
      if (!payload) return;
      const { eventType, new: newRow, old: oldRow } = payload;

      if (eventType === 'UPDATE' || eventType === 'INSERT') {
        // Do not update our own location from remote echo (we have direct device GPS)
        if (newRow && newRow.user_id !== currentUser?.id) {
          updateMemberLocationFromRemote(newRow);
        }
      } else if (eventType === 'DELETE' && oldRow?.user_id) {
        // Member removed
        useCrewStore.getState().setMembers(
          useCrewStore.getState().members.filter((m) => m.id !== oldRow.user_id)
        );
      }
    });

    return () => {
      console.log('[LocationEngine] Unsubscribing from Realtime locations for trip:', tripId);
      tripService.unsubscribeFromTripLocations();
    };
  }, [activeTrip?.id, currentUser?.id, updateMemberLocationFromRemote]);

  // 3. REAL DEVICE GPS TRACKING
  useEffect(() => {
    const isTripActive = Boolean(activeTrip && getTripStatus(activeTrip) !== 'expired');
    const shouldTrack = isTripActive && isLocationSharingActive && Boolean(currentUser?.id);

    if (!shouldTrack) {
      if (isWatchingGpsRef.current) {
        console.log('[LocationEngine] Stopping GPS tracking (trip ended or sharing off)');
        locationService.stopLocationWatch();
        isWatchingGpsRef.current = false;
        setIsLocating(false);
      }
      return;
    }

    let isMounted = true;
    setIsLocating(true);

    const startTracking = async () => {
      // 1. Check if permission is already granted
      const perm = await locationService.checkPermission();
      if (perm.status !== 'granted') {
        console.log('[LocationEngine] Location permission not granted yet, status:', perm.status);
        if (isMounted) setIsLocating(false);
        return;
      }

      // 2. Get immediate initial fix
      try {
        const initialPos = await locationService.getCurrentPosition(true);
        if (initialPos && isMounted) {
          setUserLocation(initialPos);
          setIsLocating(false);

          // Push to Supabase immediately
          tripService.updateMemberLocation({
            tripId: activeTrip.id,
            userId: currentUser.id,
            latitude: initialPos.latitude,
            longitude: initialPos.longitude,
            accuracy: initialPos.accuracy,
            heading: initialPos.heading,
            speed: initialPos.speed,
          });
        }
      } catch (err) {
        console.warn('[LocationEngine] Initial GPS fix failed:', err);
      }

      // 3. Start continuous foreground watch (every ~4000ms or 8 meters)
      const watchStarted = await locationService.startLocationWatch(
        (loc) => {
          if (!isMounted) return;
          setUserLocation(loc);
          setIsLocating(false);

          // Stream real coordinates to Supabase (throttled inside tripService)
          tripService.updateMemberLocation({
            tripId: activeTrip.id,
            userId: currentUser.id,
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
            heading: loc.heading,
            speed: loc.speed,
          });
        },
        {
          timeInterval: 4000,
          distanceInterval: 8,
        }
      );

      if (watchStarted) {
        isWatchingGpsRef.current = true;
        console.log('[LocationEngine] GPS watch started successfully');
      } else {
        if (isMounted) setIsLocating(false);
      }
    };

    startTracking();

    return () => {
      isMounted = false;
      if (isWatchingGpsRef.current) {
        locationService.stopLocationWatch();
        isWatchingGpsRef.current = false;
      }
    };
  }, [
    activeTrip?.id,
    isLocationSharingActive,
    currentUser?.id,
    setUserLocation,
    setIsLocating,
  ]);
};
