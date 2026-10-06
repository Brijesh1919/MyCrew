-- Migration: Add Real Location Fields to trip_members and enable Supabase Realtime
-- Author: MyCrew Live Location System

-- 1. Add real location fields to public.trip_members
ALTER TABLE public.trip_members
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION NULL,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION NULL,
  ADD COLUMN IF NOT EXISTS location_accuracy DOUBLE PRECISION NULL,
  ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS location_heading DOUBLE PRECISION NULL,
  ADD COLUMN IF NOT EXISTS location_speed DOUBLE PRECISION NULL;

-- 2. Create indexes for location queries
CREATE INDEX IF NOT EXISTS idx_trip_members_location_updated_at 
  ON public.trip_members(location_updated_at);

CREATE INDEX IF NOT EXISTS idx_trip_members_trip_location 
  ON public.trip_members(trip_id, location_updated_at);

-- 3. Configure Realtime publication
ALTER TABLE public.trip_members REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'trip_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_members;
  END IF;
END $$;
