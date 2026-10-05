export const TRIP_TYPES = [
  {
    id: 'event',
    label: 'Event',
    icon: 'Music',
    emoji: '🎪',
    color: '#8B5CF6',
    description: 'Festivals, concerts, and live shows',
  },
  {
    id: 'trip',
    label: 'Trip',
    icon: 'Bus',
    emoji: '🚌',
    color: '#2563EB',
    description: 'Road trips, weekend getaways, and vacations',
  },
  {
    id: 'adventure',
    label: 'Adventure',
    icon: 'Compass',
    emoji: '🥾',
    color: '#059669',
    description: 'Treks, hikes, and outdoor expeditions',
  },
  {
    id: 'wedding',
    label: 'Wedding',
    icon: 'Sparkles',
    emoji: '💍',
    color: '#EC4899',
    description: 'Weddings, receptions, and celebrations',
  },
  {
    id: 'college',
    label: 'College',
    icon: 'GraduationCap',
    emoji: '🎓',
    color: '#F59E0B',
    description: 'College fests, reunions, and campus events',
  },
  {
    id: 'family',
    label: 'Family',
    icon: 'Users',
    emoji: '👨‍👩‍👧',
    color: '#0EA5E9',
    description: 'Family trips, pilgrimages, and outings',
  },
  {
    id: 'school',
    label: 'School',
    icon: 'BookOpen',
    emoji: '🏫',
    color: '#6366F1',
    description: 'School picnics and educational tours',
  },
];

export const getTripTypeConfig = (typeId) => {
  return TRIP_TYPES.find((t) => t.id === typeId) || TRIP_TYPES[0];
};
