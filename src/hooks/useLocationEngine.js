import { useEffect, useRef } from 'react';
import { useCrewStore } from '../store/useCrewStore';
import { useTripStore } from '../store/useTripStore';

export const useLocationEngine = (intervalMs = 3000) => {
  const tickLocations = useCrewStore((state) => state.tickLocations);
  const activeTrip = useTripStore((state) => state.activeTrip);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Only run if trip is active and not expired
    if (!activeTrip || activeTrip.isExpired) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      tickLocations();
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [Boolean(activeTrip), activeTrip?.id, activeTrip?.isExpired, intervalMs, tickLocations]);
};
