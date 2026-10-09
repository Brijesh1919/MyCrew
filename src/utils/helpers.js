/**
 * Generates a clean 6-character alphanumeric trip code (e.g., 'K7N9XP')
 * Always strictly 6 characters, uppercase, no spaces, no confusing characters (0/O, 1/I).
 */
export const generateTripCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Returns initials from full name (e.g. 'Rahul Sharma' -> 'RS')
 */
export const getInitials = (name = '') => {
  if (!name) return 'MC';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Formats time string e.g. 'Today • 4:00 PM'
 */
export const formatTripTime = (dateInput) => {
  if (!dateInput) return '--';
  const d = new Date(dateInput);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return isToday ? `Today • ${timeStr}` : `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${timeStr}`;
};

/**
 * Delay promise for simulating network/backend latency
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
