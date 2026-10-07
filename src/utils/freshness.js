import { COLORS } from '../constants/theme';

/**
 * Evaluates the freshness state of a member based on seconds elapsed since last update
 * @param {number} secondsAgo
 * @returns {{ state: 'live' | 'delayed' | 'offline', label: string, color: string, bgColor: string, dot: string }}
 */
export const getLocationFreshness = (input) => {
  if (input === null || input === undefined || input === '') {
    return {
      state: 'offline',
      label: 'Offline • Waiting for GPS',
      shortLabel: 'Offline',
      timeText: 'No location yet',
      color: COLORS.textMuted || '#94A3B8',
      bgColor: '#F1F5F9',
      dot: '⚪',
    };
  }

  let sec = 0;
  if (typeof input === 'string' || input instanceof Date) {
    const time = new Date(input).getTime();
    if (isNaN(time)) {
      sec = 999999;
    } else {
      sec = Math.max(0, Math.round((Date.now() - time) / 1000));
    }
  } else {
    sec = Math.max(0, Math.round(Number(input) || 0));
  }

  if (sec < 30) {
    return {
      state: 'live',
      label: `Live • ${sec <= 2 ? 'just now' : `${sec}s ago`}`,
      shortLabel: 'Live',
      timeText: sec <= 2 ? 'just now' : `${sec}s ago`,
      color: COLORS.success,
      bgColor: COLORS.successBg,
      dot: '🟢',
    };
  }

  if (sec < 120) {
    const mins = Math.max(1, Math.round(sec / 60));
    return {
      state: 'delayed',
      label: `Delayed • ${sec < 60 ? `${sec}s ago` : `${mins}m ago`}`,
      shortLabel: 'Delayed',
      timeText: `${sec < 60 ? `${sec}s ago` : `${mins}m ago`}`,
      color: COLORS.warning,
      bgColor: COLORS.warningBg,
      dot: '🟡',
    };
  }

  const mins = Math.round(sec / 60);
  const timeText = mins >= 60 ? `${Math.round(mins / 60)}h ago` : `${mins}m ago`;
  return {
    state: 'offline',
    label: `Offline • ${timeText}`,
    shortLabel: 'Offline',
    timeText: timeText,
    color: COLORS.danger,
    bgColor: COLORS.dangerBg,
    dot: '🔴',
  };
};

/**
 * Formats a duration in milliseconds into a readable countdown string (e.g. '4h 32m')
 */
export const formatRemainingTime = (endIsoString) => {
  if (!endIsoString) return 'Active';
  const remainingMs = new Date(endIsoString).getTime() - Date.now();
  if (remainingMs <= 0) return 'Trip Ended';

  const totalMin = Math.floor(remainingMs / (1000 * 60));
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export { formatTripTime } from './helpers';
