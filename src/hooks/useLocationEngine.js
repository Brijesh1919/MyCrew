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
import { meetingPointService } from '../services/meetingPointService';
import { locationService } from '../services/locationService';
import { batteryService } from '../services/batteryService';
import { useMeetingPointStore } from '../store/useMeetingPointStore';
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

  const permissionStatus = useLocationStore((state) => state.permissionStatus);
  const setPermissionStatus = useLocationStore((state) => state.setPermissionStatus);

  const timerRef = useRef(null);
  const heartbeatRef = useRef(null);
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

  // 2. SUPABASE REALTIME SUBSCRIPTION FOR THE ACTIVE TRIP (LOCATIONS & MEETING POINTS)
  useEffect(() => {
    if (!activeTrip || getTripStatus(activeTrip) === 'expired') {
      tripService.unsubscribeFromTripLocations();
      meetingPointService.unsubscribeFromMeetingPoints();
      return;
    }

    const tripId = activeTrip.id;
    console.log('[LocationEngine] Subscribing to Realtime location & meeting point changes for trip:', tripId);

    // 2a. Realtime location updates
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

    // 2b. Realtime meeting points updates (ensures all users see newly set pins immediately)
    meetingPointService.subscribeToTripMeetingPoints(tripId, () => {
      const currentMembers = useCrewStore.getState().members;
      useMeetingPointStore.getState().fetchTripMeetingPoints(tripId, currentMembers);
    });

    return () => {
      console.log('[LocationEngine] Unsubscribing from Realtime locations & meeting points for trip:', tripId);
      tripService.unsubscribeFromTripLocations();
      meetingPointService.unsubscribeFromMeetingPoints();
    };
  }, [activeTrip?.id, currentUser?.id, updateMemberLocationFromRemote]);

  // 3. REAL DEVICE GPS TRACKING & HEARTBEAT
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
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      if (currentUser?.id) {
        useCrewStore.getState().setUserLocationSharingState(currentUser.id, false);
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

      if (permissionStatus !== 'granted') {
        setPermissionStatus('granted');
      }

      // 2. Get immediate initial fix
      try {
        const initialPos = await locationService.getCurrentPosition(true);
        if (initialPos && isMounted) {
          setUserLocation(initialPos);
          setIsLocating(false);

          // Update local crew store entry immediately
          const batteryPct = await batteryService.getBatteryLevel();
          useCrewStore.getState().updateCurrentUserLocation(currentUser.id, initialPos);

          // Push to Supabase immediately
          tripService.updateMemberLocation({
            tripId: activeTrip.id,
            userId: currentUser.id,
            latitude: initialPos.latitude,
            longitude: initialPos.longitude,
            accuracy: initialPos.accuracy,
            heading: initialPos.heading,
            speed: initialPos.speed,
            batteryLevel: batteryPct,
            force: true,
          });
        }
      } catch (err) {
        console.warn('[LocationEngine] Initial GPS fix failed:', err);
      }

      // 3. Start continuous foreground watch
      const watchStarted = await locationService.startLocationWatch(
        (loc) => {
          if (!isMounted) return;
          setUserLocation(loc);
          setIsLocating(false);

          // Update local crew store entry immediately
          useCrewStore.getState().updateCurrentUserLocation(currentUser.id, loc);

          // Stream real coordinates to Supabase with real hardware battery
          batteryService.getBatteryLevel().then((bLevel) => {
            tripService.updateMemberLocation({
              tripId: activeTrip.id,
              userId: currentUser.id,
              latitude: loc.latitude,
              longitude: loc.longitude,
              accuracy: loc.accuracy,
              heading: loc.heading,
              speed: loc.speed,
              batteryLevel: bLevel,
            });
          });
        },
        {
          timeInterval: 4000,
          distanceInterval: 1, // 1 meter so regular updates emit on Android
        }
      );

      if (watchStarted) {
        isWatchingGpsRef.current = true;
        console.log('[LocationEngine] GPS watch started successfully');
      } else {
        if (isMounted) setIsLocating(false);
      }

      // 4. HEARTBEAT TIMER (every 10 seconds):
      // Ensures user's location timestamp stays fresh even when stationary
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      heartbeatRef.current = setInterval(() => {
        if (!isMounted) return;
        const currentLoc = useLocationStore.getState().userLocation || useLocationStore.getState().lastKnownLocation;
        if (currentLoc && activeTrip?.id && currentUser?.id) {
          // Keep local user entry fresh
          useCrewStore.getState().updateCurrentUserLocation(currentUser.id, currentLoc);

          batteryService.getBatteryLevel().then((bLevel) => {
            tripService.updateMemberLocation({
              tripId: activeTrip.id,
              userId: currentUser.id,
              latitude: currentLoc.latitude,
              longitude: currentLoc.longitude,
              accuracy: currentLoc.accuracy,
              heading: currentLoc.heading,
              speed: currentLoc.speed,
              batteryLevel: bLevel,
              force: true,
            });
          });
        }
      }, 10000);
    };

    startTracking();

    // Check permission again in 3s in case user was prompted by OS dialog
    const retryTimeout = setTimeout(() => {
      if (isMounted && !isWatchingGpsRef.current) {
        startTracking();
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(retryTimeout);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      if (isWatchingGpsRef.current) {
        locationService.stopLocationWatch();
        isWatchingGpsRef.current = false;
      }
    };
  }, [
    activeTrip?.id,
    isLocationSharingActive,
    currentUser?.id,
    permissionStatus,
    setUserLocation,
    setIsLocating,
    setPermissionStatus,
  ]);
};
