// Location Service Abstraction
// Handles current user location, mock jitter/movement, distance, and freshness

import { CURRENT_USER, INITIAL_MEMBERS } from '../data/mockData';
import { calculateDistanceMeters, calculateBearing, calculateGroupCenter, getRelativeDirection } from '../utils/distance';
import { getLocationFreshness } from '../utils/freshness';

class LocationService {
  constructor() {
    this.currentUser = { ...CURRENT_USER };
    this.isTracking = true;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  setCurrentUserLocation(coords) {
    this.currentUser.coordinates = {
      ...this.currentUser.coordinates,
      ...coords,
    };
    this.currentUser.lastUpdated = new Date().toISOString();
  }

  getMemberLocation(member) {
    return member?.coordinates || null;
  }

  getDistance(coord1, coord2) {
    return calculateDistanceMeters(coord1, coord2);
  }

  getDirectionToMember(userCoord, memberCoord, userHeading = 0) {
    const bearing = calculateBearing(userCoord, memberCoord);
    const relative = getRelativeDirection(userHeading, bearing);
    return {
      bearing,
      relative,
    };
  }

  /**
   * Sorts members by distance from user coordinate
   */
  getNearestMembers(userCoord, members = [], limit = null) {
    if (!userCoord || !members.length) return [];

    const withDist = members.map((m) => {
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

  getGroupCenter(members = []) {
    const coords = members
      .filter((m) => m.coordinates)
      .map((m) => m.coordinates);
    return calculateGroupCenter(coords);
  }

  /**
   * Simulates micro-jitter for live members (simulates GPS walking)
   */
  simulateMemberDrift(members = []) {
    return members.map((m) => {
      if (m.status !== 'live') {
        // Increment delayed/offline timestamps slightly
        return {
          ...m,
          lastSeenSecondsAgo: m.lastSeenSecondsAgo + 2,
        };
      }

      // 30% chance to slightly move
      const shouldMove = Math.random() > 0.6;
      if (!shouldMove) {
        return {
          ...m,
          lastSeenSecondsAgo: Math.max(2, (m.lastSeenSecondsAgo || 5) + 1),
        };
      }

      // Small delta ~ 2-5 meters
      const latOffset = (Math.random() - 0.5) * 0.00004;
      const lonOffset = (Math.random() - 0.5) * 0.00004;

      return {
        ...m,
        lastSeenSecondsAgo: Math.floor(Math.random() * 8) + 1,
        coordinates: {
          ...m.coordinates,
          latitude: m.coordinates.latitude + latOffset,
          longitude: m.coordinates.longitude + lonOffset,
          heading: (m.coordinates.heading + (Math.random() * 20 - 10) + 360) % 360,
        },
      };
    });
  }
}

export const locationService = new LocationService();
