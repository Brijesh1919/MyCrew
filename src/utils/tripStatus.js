// ==========================================================
// MyCrew - Dynamic Trip Status Helper
// Determines trip lifecycle dynamically based on timestamps
// ==========================================================

/**
 * Calculates current trip status based on starts_at, ends_at, and ended_at
 * @param {Object} trip
 * @returns {'upcoming' | 'active' | 'expired'}
 */
export const getTripStatus = (trip) => {
  if (!trip) return 'expired';
  if (trip.ended_at) return 'expired';
  if (trip.isExpired === true) return 'expired';

  const now = new Date();
  const startsAt = new Date(trip.starts_at || trip.startTime || 0);
  const endsAt = new Date(trip.ends_at || trip.endTime || 0);

  if (isNaN(endsAt.getTime())) {
    return 'expired';
  }

  if (now < startsAt) {
    return 'upcoming';
  }

  if (now >= startsAt && now < endsAt) {
    return 'active';
  }

  return 'expired';
};

export const isTripActive = (trip) => getTripStatus(trip) === 'active';
export const isTripUpcoming = (trip) => getTripStatus(trip) === 'upcoming';
export const isTripExpired = (trip) => getTripStatus(trip) === 'expired';

/**
 * Human-readable status label and color badge
 */
export const getTripStatusBadge = (trip) => {
  const status = getTripStatus(trip);
  switch (status) {
    case 'active':
      return { label: 'Active now', status: 'active', color: '#22C55E' };
    case 'upcoming':
      return { label: 'Upcoming', status: 'upcoming', color: '#3B82F6' };
    case 'expired':
    default:
      return { label: 'Ended', status: 'expired', color: '#94A3B8' };
  }
};
