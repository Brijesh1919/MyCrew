import { COLORS } from '../constants/theme';

/**
 * Evaluates the freshness state of a member based on seconds elapsed since last update
 * @param {number} secondsAgo
 * @returns {{ state: 'live' | 'delayed' | 'offline', label: string, color: string, bgColor: string, dot: string }}
 */
export const getLocationFreshness = (secondsAgo = 0) => {
  const sec = Math.max(0, Math.round(secondsAgo));

  if (sec < 30) {
    return {
      state: 'live',
      label: `Live • ${sec === 0 ? 'just now' : `${sec} sec ago`}`,
      shortLabel: 'Live',
      timeText: `${sec} sec ago`,
      color: COLORS.success,
      bgColor: COLORS.successBg,
      dot: '🟢',
    };
  }

  if (sec < 300) {
    const mins = Math.max(1, Math.round(sec / 60));
    return {
      state: 'delayed',
      label: `Delayed • ${mins}m ago`,
      shortLabel: 'Delayed',
      timeText: `${mins} min ago`,
      color: COLORS.warning,
      bgColor: COLORS.warningBg,
      dot: '🟡',
    };
  }

  const mins = Math.round(sec / 60);
  const timeText = mins >= 60 ? `${Math.round(mins / 60)}h ago` : `${mins} min ago`;
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
