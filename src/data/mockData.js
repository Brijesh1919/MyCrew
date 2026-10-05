// Realistic mock data for MyCrew MVP
// Current user: Brijesh (Organizer or Participant)
// Trip: Goa Music Festival

export const CURRENT_USER = {
  id: 'user_brijesh_01',
  name: 'Brijesh',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  phone: '+91 98765 43210',
  isOrganizer: false,
  batteryLevel: 64,
  trackingMode: 'crowded',
  isSafe: true,
  coordinates: {
    latitude: 15.58980,
    longitude: 73.74380,
    heading: 42,
    accuracy: 4,
  },
  lastUpdated: new Date(Date.now() - 4 * 1000).toISOString(),
};

export const INITIAL_TRIP = {
  id: 'trip_goa_fest_2026',
  name: 'Goa Music Festival',
  emoji: '🎪',
  type: 'event',
  code: 'GOA7K2',
  qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=mycrew://join?code=GOA7K2',
  organizer: {
    id: 'user_rahul_02',
    name: 'Rahul',
    phone: '+91 98200 12345',
  },
  locationName: 'Vagator Hill Grounds, Goa',
  centerCoordinate: {
    latitude: 15.58980,
    longitude: 73.74380,
  },
  startTime: new Date(Date.now() - 3.5 * 60 * 60 * 1000).toISOString(), // Started 3.5 hrs ago (4:00 PM)
  endTime: new Date(Date.now() + 4.53 * 60 * 60 * 1000).toISOString(),  // Ends in ~4h 32m
  visibility: 'everyone',
  isExpired: false,
  totalCapacity: 20,
};

export const INITIAL_MEMBERS = [
  // 1. Priya - closest, Live (82m)
  {
    id: 'm_priya',
    name: 'Priya',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98201 11222',
    status: 'live', // live | delayed | offline
    lastSeenSecondsAgo: 8,
    battery: 82,
    isSafe: true,
    cluster: 'Main Stage',
    coordinates: {
      latitude: 15.59045,
      longitude: 73.74415,
      heading: 120,
    },
  },
  // 2. Rahul - Organizer, Live (146m)
  {
    id: 'm_rahul',
    name: 'Rahul',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98200 12345',
    status: 'live',
    lastSeenSecondsAgo: 12,
    battery: 76,
    isSafe: true,
    isOrganizer: true,
    cluster: 'Main Stage',
    coordinates: {
      latitude: 15.59080,
      longitude: 73.74450,
      heading: 85,
    },
  },
  // 3. Amit - Live (230m)
  {
    id: 'm_amit',
    name: 'Amit',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98111 22334',
    status: 'live',
    lastSeenSecondsAgo: 20,
    battery: 58,
    isSafe: false, // Not checked in yet
    cluster: 'Main Stage',
    coordinates: {
      latitude: 15.59120,
      longitude: 73.74490,
      heading: 210,
    },
  },
  // 4. Neha - Live (310m)
  {
    id: 'm_neha',
    name: 'Neha',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98333 44556',
    status: 'live',
    lastSeenSecondsAgo: 25,
    battery: 91,
    isSafe: true,
    cluster: 'Main Stage',
    coordinates: {
      latitude: 15.59160,
      longitude: 73.74530,
      heading: 45,
    },
  },
  // 5. Karan - Live (450m)
  {
    id: 'm_karan',
    name: 'Karan',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98777 88990',
    status: 'live',
    lastSeenSecondsAgo: 18,
    battery: 41,
    isSafe: true,
    cluster: 'Main Stage',
    coordinates: {
      latitude: 15.59240,
      longitude: 73.74590,
      heading: 160,
    },
  },
  // 6. Riya - Live (110m)
  {
    id: 'm_riya',
    name: 'Riya',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98444 55667',
    status: 'live',
    lastSeenSecondsAgo: 15,
    battery: 69,
    isSafe: true,
    cluster: 'Main Stage',
    coordinates: {
      latitude: 15.58930,
      longitude: 73.74450,
      heading: 300,
    },
  },
  // 7. Arjun - Live (180m)
  {
    id: 'm_arjun',
    name: 'Arjun',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98555 66778',
    status: 'live',
    lastSeenSecondsAgo: 10,
    battery: 88,
    isSafe: true,
    cluster: 'Main Stage',
    coordinates: {
      latitude: 15.58900,
      longitude: 73.74490,
      heading: 70,
    },
  },
  // 8. Meera - Live (95m)
  {
    id: 'm_meera',
    name: 'Meera',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98666 77889',
    status: 'live',
    lastSeenSecondsAgo: 14,
    battery: 62,
    isSafe: true,
    cluster: 'Main Stage',
    coordinates: {
      latitude: 15.59010,
      longitude: 73.74460,
      heading: 15,
    },
  },
  // 9. Dev - Live (130m)
  {
    id: 'm_dev',
    name: 'Dev',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98888 11223',
    status: 'live',
    lastSeenSecondsAgo: 18,
    battery: 73,
    isSafe: true,
    cluster: 'Main Stage',
    coordinates: {
      latitude: 15.58910,
      longitude: 73.74420,
      heading: 95,
    },
  },
  // 10. Anjali - Live (160m)
  {
    id: 'm_anjali',
    name: 'Anjali',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98999 22334',
    status: 'live',
    lastSeenSecondsAgo: 22,
    battery: 55,
    isSafe: true,
    cluster: 'Main Stage',
    coordinates: {
      latitude: 15.59070,
      longitude: 73.74320,
      heading: 190,
    },
  },
  // 11. Vivek - Live (200m)
  {
    id: 'm_vivek',
    name: 'Vivek',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98123 45678',
    status: 'live',
    lastSeenSecondsAgo: 28,
    battery: 84,
    isSafe: true,
    cluster: 'Main Stage',
    coordinates: {
      latitude: 15.59100,
      longitude: 73.74310,
      heading: 320,
    },
  },
  // 12. Pooja - Live (240m)
  {
    id: 'm_pooja',
    name: 'Pooja',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98234 56789',
    status: 'live',
    lastSeenSecondsAgo: 16,
    battery: 67,
    isSafe: true,
    cluster: 'Main Stage',
    coordinates: {
      latitude: 15.59130,
      longitude: 73.74280,
      heading: 260,
    },
  },
  // FOOD AREA CLUSTER (5 people)
  // 13. Nikhil - Live (420m)
  {
    id: 'm_nikhil',
    name: 'Nikhil',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98345 67890',
    status: 'live',
    lastSeenSecondsAgo: 7,
    battery: 79,
    isSafe: true,
    cluster: 'Food Area',
    coordinates: {
      latitude: 15.58850,
      longitude: 73.74720,
      heading: 10,
    },
  },
  // 14. Isha - Live (460m)
  {
    id: 'm_isha',
    name: 'Isha',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98456 78901',
    status: 'live',
    lastSeenSecondsAgo: 24,
    battery: 51,
    isSafe: true,
    cluster: 'Food Area',
    coordinates: {
      latitude: 15.58830,
      longitude: 73.74750,
      heading: 135,
    },
  },
  // 15. Aditya - Delayed (490m, 1 min ago)
  {
    id: 'm_aditya',
    name: 'Aditya',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98567 89012',
    status: 'delayed',
    lastSeenSecondsAgo: 68,
    battery: 35,
    isSafe: true,
    cluster: 'Food Area',
    coordinates: {
      latitude: 15.58810,
      longitude: 73.74770,
      heading: 270,
    },
  },
  // 16. Sneha - Delayed (520m, 3 min ago)
  {
    id: 'm_sneha',
    name: 'Sneha',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98678 90123',
    status: 'delayed',
    lastSeenSecondsAgo: 184,
    battery: 29,
    isSafe: true,
    cluster: 'Food Area',
    coordinates: {
      latitude: 15.58790,
      longitude: 73.74790,
      heading: 80,
    },
  },
  // 17. Varun - Live (550m)
  {
    id: 'm_varun',
    name: 'Varun',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98789 01234',
    status: 'live',
    lastSeenSecondsAgo: 11,
    battery: 63,
    isSafe: true,
    cluster: 'Food Area',
    coordinates: {
      latitude: 15.58770,
      longitude: 73.74810,
      heading: 200,
    },
  },
  // PARKING CLUSTER (2 people)
  // 18. Kavya - Delayed (920m, 4 min ago)
  {
    id: 'm_kavya',
    name: 'Kavya',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98890 12345',
    status: 'delayed',
    lastSeenSecondsAgo: 240,
    battery: 48,
    isSafe: true,
    cluster: 'Parking Lot B',
    coordinates: {
      latitude: 15.59600,
      longitude: 73.73850,
      heading: 310,
    },
  },
  // 19. Rohan - Offline (950m, 14 min ago)
  {
    id: 'm_rohan',
    name: 'Rohan',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98901 23456',
    status: 'offline',
    lastSeenSecondsAgo: 840,
    battery: 12,
    isSafe: false,
    cluster: 'Parking Lot B',
    coordinates: {
      latitude: 15.59620,
      longitude: 73.73810,
      heading: 180,
    },
  },
  // ENTRANCE (1 person)
  // 20. Mohit - Live (640m)
  {
    id: 'm_mohit',
    name: 'Mohit',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80',
    phone: '+91 98012 34567',
    status: 'live',
    lastSeenSecondsAgo: 9,
    battery: 70,
    isSafe: true,
    cluster: 'Main Entrance Gate',
    coordinates: {
      latitude: 15.58500,
      longitude: 73.74050,
      heading: 50,
    },
  },
];

export const INITIAL_MEETING_POINTS = [
  {
    id: 'mp_gate_3',
    name: 'Gate 3 Regroup Point',
    description: 'Near the big neon sign and medical booth',
    createdBy: 'Rahul',
    createdById: 'm_rahul',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    coordinates: {
      latitude: 15.59100,
      longitude: 73.74350,
    },
    nearbyCount: 11,
    radiusMeters: 600,
  },
  {
    id: 'mp_food_zone',
    name: 'Food Court - Red Tent',
    description: 'Beside Goa Sausage stall and charging desk',
    createdBy: 'Priya',
    createdById: 'm_priya',
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    coordinates: {
      latitude: 15.58820,
      longitude: 73.74740,
    },
    nearbyCount: 5,
    radiusMeters: 300,
  },
];

export const CLUSTERS_DEFINITIONS = [
  {
    id: 'cluster_main_stage',
    name: 'Main Stage Area',
    description: 'Electric Arena • Headliner set',
    memberIds: ['m_priya', 'm_rahul', 'm_amit', 'm_neha', 'm_karan', 'm_riya', 'm_arjun', 'm_meera', 'm_dev', 'm_anjali', 'm_vivek', 'm_pooja'],
    center: {
      latitude: 15.59050,
      longitude: 73.74440,
    },
  },
  {
    id: 'cluster_food_area',
    name: 'Food & Bar Stalls',
    description: 'Chillout zone • Food trucks',
    memberIds: ['m_nikhil', 'm_isha', 'm_aditya', 'm_sneha', 'm_varun'],
    center: {
      latitude: 15.58810,
      longitude: 73.74760,
    },
  },
  {
    id: 'cluster_parking',
    name: 'Parking Lot B',
    description: 'West exit • Cab pick-up point',
    memberIds: ['m_kavya', 'm_rohan'],
    center: {
      latitude: 15.59610,
      longitude: 73.73830,
    },
  },
  {
    id: 'cluster_entrance',
    name: 'Main Entrance Gate',
    description: 'Wristband exchange & security',
    memberIds: ['m_mohit'],
    center: {
      latitude: 15.58500,
      longitude: 73.74050,
    },
  },
];
