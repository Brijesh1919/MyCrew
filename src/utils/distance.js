// Geographic distance & navigation calculation utilities for MyCrew

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates Haversine distance in meters between two lat/lng coordinates
 */
export const calculateDistanceMeters = (coord1, coord2) => {
  if (!coord1 || !coord2) return 0;
  const lat1 = Number(coord1.latitude);
  const lon1 = Number(coord1.longitude);
  const lat2 = Number(coord2.latitude);
  const lon2 = Number(coord2.longitude);

  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return 0;

  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
};

/**
 * Format distance in user-friendly format (e.g., '82 m', '146 m', '1.2 km', '1.8 km')
 */
export const formatDistance = (meters) => {
  if (meters === undefined || meters === null || isNaN(meters)) return '--';
  const m = Math.round(meters);
  if (m < 1000) {
    return `${m} m`;
  }
  const km = (m / 1000).toFixed(1);
  return `${km} km`;
};

/**
 * Calculates compass initial bearing (0-360 degrees) from coord1 to coord2
 */
export const calculateBearing = (fromCoord, toCoord) => {
  if (!fromCoord || !toCoord) return 0;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const lat1 = toRad(fromCoord.latitude);
  const lat2 = toRad(toCoord.latitude);
  const dLon = toRad(toCoord.longitude - fromCoord.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
};

/**
 * Returns human-readable relative direction based on user heading and destination bearing
 * e.g., 'Ahead', 'Slightly Right', 'Right', 'Behind', 'Left', 'Slightly Left'
 */
export const getRelativeDirection = (userHeading = 0, targetBearing = 0) => {
  let diff = (targetBearing - userHeading + 360) % 360;
  if (diff > 180) diff -= 360;

  if (diff >= -22.5 && diff <= 22.5) return { direction: 'ahead', arrow: '↑', label: 'Straight ahead' };
  if (diff > 22.5 && diff <= 67.5) return { direction: 'slight_right', arrow: '↗', label: 'Slightly right' };
  if (diff > 67.5 && diff <= 112.5) return { direction: 'right', arrow: '→', label: 'Turn right' };
  if (diff > 112.5 && diff <= 157.5) return { direction: 'sharp_right', arrow: '↘', label: 'Back right' };
  if (diff < -22.5 && diff >= -67.5) return { direction: 'slight_left', arrow: '↖', label: 'Slightly left' };
  if (diff < -67.5 && diff >= -112.5) return { direction: 'left', arrow: '←', label: 'Turn left' };
  if (diff < -112.5 && diff >= -157.5) return { direction: 'sharp_left', arrow: '↙', label: 'Back left' };
  return { direction: 'behind', arrow: '↓', label: 'Behind you' };
};

/**
 * Calculates geographic center (centroid) of a list of coordinates
 */
export const calculateGroupCenter = (coords) => {
  if (!coords || coords.length === 0) {
    return { latitude: 15.5898, longitude: 73.7438 };
  }

  let totalLat = 0;
  let totalLon = 0;
  let validCount = 0;

  coords.forEach((c) => {
    if (c && !isNaN(c.latitude) && !isNaN(c.longitude)) {
      totalLat += Number(c.latitude);
      totalLon += Number(c.longitude);
      validCount++;
    }
  });

  if (validCount === 0) return { latitude: 15.5898, longitude: 73.7438 };

  return {
    latitude: totalLat / validCount,
    longitude: totalLon / validCount,
  };
};

/**
 * Calculates bounding box and delta for fitting all coordinates on screen
 */
export const calculateBoundingDelta = (coords, paddingRatio = 1.3) => {
  if (!coords || coords.length === 0) {
    return { latitudeDelta: 0.01, longitudeDelta: 0.01 };
  }

  let minLat = 90,
    maxLat = -90,
    minLon = 180,
    maxLon = -180;

  coords.forEach((c) => {
    if (c && c.latitude && c.longitude) {
      if (c.latitude < minLat) minLat = c.latitude;
      if (c.latitude > maxLat) maxLat = c.latitude;
      if (c.longitude < minLon) minLon = c.longitude;
      if (c.longitude > maxLon) maxLon = c.longitude;
    }
  });

  const latitudeDelta = Math.max((maxLat - minLat) * paddingRatio, 0.005);
  const longitudeDelta = Math.max((maxLon - minLon) * paddingRatio, 0.005);

  return {
    center: {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLon + maxLon) / 2,
    },
    latitudeDelta,
    longitudeDelta,
  };
};
