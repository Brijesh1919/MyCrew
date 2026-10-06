// ==========================================================
// MyCrew - Real Device Location Service
// Integrates with expo-location (native) and navigator.geolocation (web)
// ==========================================================

import { Platform } from 'react-native';
import * as Location from 'expo-location';
import {
  calculateDistanceMeters,
  calculateBearing,
  calculateGroupCenter,
  getRelativeDirection,
} from '../utils/distance';
import { getLocationFreshness } from '../utils/freshness';

class LocationService {
  constructor() {
    this.watcherSubscription = null;
    this.webWatchId = null;
    this.isWatching = false;
    this.lastLocation = null;
  }

  /**
   * Check current foreground location permissions
   */
  async checkPermission() {
    try {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          return { status: 'denied', canAskAgain: false };
        }
        if (navigator.permissions && navigator.permissions.query) {
          const res = await navigator.permissions.query({ name: 'geolocation' });
          if (res.state === 'granted') return { status: 'granted', canAskAgain: true };
          if (res.state === 'denied') return { status: 'blocked', canAskAgain: false };
          return { status: 'undetermined', canAskAgain: true };
        }
        return { status: 'undetermined', canAskAgain: true };
      }

      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      return {
        status,
        canAskAgain,
      };
    } catch (e) {
      console.warn('checkPermission error:', e);
      return { status: 'undetermined', canAskAgain: true };
    }
  }

  /**
   * Request foreground location permission
   */
  async requestPermission() {
    try {
      if (Platform.OS === 'web') {
        return new Promise((resolve) => {
          if (!navigator.geolocation) {
            resolve({ status: 'denied', granted: false });
            return;
          }
          navigator.geolocation.getCurrentPosition(
            () => resolve({ status: 'granted', granted: true }),
            (err) => {
              if (err.code === 1) {
                resolve({ status: 'blocked', granted: false });
              } else {
                resolve({ status: 'denied', granted: false });
              }
            },
            { enableHighAccuracy: true, timeout: 8000 }
          );
        });
      }

      const { status, granted } = await Location.requestForegroundPermissionsAsync();
      return { status, granted };
    } catch (e) {
      console.warn('requestPermission error:', e);
      return { status: 'denied', granted: false };
    }
  }

  /**
   * Retrieves high accuracy GPS fix immediately
   */
  async getCurrentPosition(highAccuracy = true) {
    try {
      if (Platform.OS === 'web') {
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported on web'));
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const normalized = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy || null,
                heading: pos.coords.heading || null,
                speed: pos.coords.speed || null,
                timestamp: new Date(pos.timestamp || Date.now()).toISOString(),
              };
              this.lastLocation = normalized;
              resolve(normalized);
            },
            (err) => reject(err),
            {
              enableHighAccuracy: highAccuracy,
              timeout: 12000,
              maximumAge: 5000,
            }
          );
        });
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced,
      });

      const normalized = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy || null,
        heading: pos.coords.heading || null,
        speed: pos.coords.speed || null,
        timestamp: new Date(pos.timestamp || Date.now()).toISOString(),
      };
      this.lastLocation = normalized;
      return normalized;
    } catch (e) {
      console.warn('getCurrentPosition error:', e);
      return null;
    }
  }

  /**
   * Starts continuous foreground location watch with sensible battery intervals
   */
  async startLocationWatch(onLocationUpdate, options = {}) {
    this.stopLocationWatch();

    const {
      timeInterval = 4000, // 4 seconds
      distanceInterval = 8,  // 8 meters
    } = options;

    try {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) return false;

        this.webWatchId = navigator.geolocation.watchPosition(
          (pos) => {
            const normalized = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy || null,
              heading: pos.coords.heading || null,
              speed: pos.coords.speed || null,
              timestamp: new Date(pos.timestamp || Date.now()).toISOString(),
            };
            this.lastLocation = normalized;
            onLocationUpdate(normalized);
          },
          (err) => console.warn('Web watchPosition error:', err),
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 3000,
          }
        );
        this.isWatching = true;
        return true;
      }

      this.watcherSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval,
          distanceInterval,
        },
        (loc) => {
          const normalized = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy || null,
            heading: loc.coords.heading || null,
            speed: loc.coords.speed || null,
            timestamp: new Date(loc.timestamp || Date.now()).toISOString(),
          };
          this.lastLocation = normalized;
          onLocationUpdate(normalized);
        }
      );

      this.isWatching = true;
      return true;
    } catch (e) {
      console.warn('startLocationWatch error:', e);
      return false;
    }
  }

  /**
   * Stops continuous location updates to preserve battery
   */
  stopLocationWatch() {
    if (this.watcherSubscription) {
      try {
        this.watcherSubscription.remove();
      } catch (e) {
        // ignore
      }
      this.watcherSubscription = null;
    }

    if (this.webWatchId !== null && Platform.OS === 'web') {
      try {
        navigator.geolocation.clearWatch(this.webWatchId);
      } catch (e) {
        // ignore
      }
      this.webWatchId = null;
    }

    this.isWatching = false;
  }

  /**
   * Determines confidence level from accuracy radius in meters
   */
  getAccuracyLevel(accuracy) {
    if (!accuracy || isNaN(accuracy)) return null;
    if (accuracy <= 20) return 'high';
    if (accuracy <= 50) return 'medium';
    return 'low';
  }

  /**
   * Sorts members by distance from user coordinates
   */
  getNearestMembers(userCoord, members = [], limit = null) {
    if (!userCoord || !members.length) return [];

    const validMembers = members.filter(
      (m) =>
        m.coordinates &&
        !isNaN(m.coordinates.latitude) &&
        !isNaN(m.coordinates.longitude) &&
        m.coordinates.latitude !== 0
    );

    const withDist = validMembers.map((m) => {
      const dist = calculateDistanceMeters(userCoord, m.coordinates);
      const freshness = getLocationFreshness(m.lastSeenSecondsAgo);
      const direction = calculateBearing(userCoord, m.coordinates);
      return {
        ...m,
        distanceMeters: dist,
        freshness,
        bearing: direction,
      };
    });

    withDist.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return limit ? withDist.slice(0, limit) : withDist;
  }

  /**
   * Distance calculation between two coordinates
   */
  getDistance(coord1, coord2) {
    return calculateDistanceMeters(coord1, coord2);
  }

  /**
   * Relative direction and compass bearing from user to target coordinate
   */
  getDirectionToMember(userCoord, targetCoord, userHeading = 0) {
    if (!userCoord || !targetCoord) {
      return { bearing: 0, relative: { direction: 'ahead', arrow: '↑', label: 'Straight ahead' } };
    }
    const bearing = calculateBearing(userCoord, targetCoord);
    const relative = getRelativeDirection(userHeading, bearing);
    return {
      bearing,
      relative,
    };
  }

  getGroupCenter(members = []) {
    const coords = members
      .filter((m) => m.coordinates && !isNaN(m.coordinates.latitude))
      .map((m) => m.coordinates);
    return calculateGroupCenter(coords);
  }

  /**
   * Real dynamic geographic distance clustering.
   * Clusters members located within clusterRadiusMeters of each other.
   * If a group has >= 2 members, forms a cluster with centroid coordinates.
   */
  getClusters(members = [], clusterRadiusMeters = 80) {
    const validMembers = members.filter(
      (m) =>
        m.coordinates &&
        !isNaN(m.coordinates.latitude) &&
        !isNaN(m.coordinates.longitude) &&
        m.coordinates.latitude !== 0
    );

    if (validMembers.length === 0) return [];

    const clusters = [];
    const visited = new Set();

    for (let i = 0; i < validMembers.length; i++) {
      const memberA = validMembers[i];
      if (visited.has(memberA.id)) continue;

      const clusterGroup = [memberA];
      visited.add(memberA.id);

      for (let j = i + 1; j < validMembers.length; j++) {
        const memberB = validMembers[j];
        if (visited.has(memberB.id)) continue;

        const dist = calculateDistanceMeters(memberA.coordinates, memberB.coordinates);
        if (dist <= clusterRadiusMeters) {
          clusterGroup.push(memberB);
          visited.add(memberB.id);
        }
      }

      if (clusterGroup.length > 1) {
        const centroid = calculateGroupCenter(clusterGroup.map((m) => m.coordinates));
        clusters.push({
          id: `cluster_${clusters.length + 1}`,
          name: `Group (${clusterGroup.length})`,
          count: clusterGroup.length,
          coordinates: centroid,
          center: centroid,
          members: clusterGroup,
        });
      }
    }

    return clusters;
  }
}

export const locationService = new LocationService();
