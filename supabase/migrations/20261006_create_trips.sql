-- ==========================================================
-- Migration: Create Trips and Trip Members Tables with RLS
-- Project: MyCrew (duwtfgpoodwmboehfioe)
-- ==========================================================

-- 1. Create trips table
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🎪',
  trip_code TEXT NOT NULL UNIQUE,
  trip_type TEXT DEFAULT 'event',
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  ends_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  location_name TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  visibility TEXT DEFAULT 'everyone',
  total_capacity INTEGER DEFAULT 25,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create trip_members table
CREATE TABLE IF NOT EXISTS public.trip_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'participant',
  user_name TEXT,
  avatar_url TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  left_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(trip_id, user_id)
);

-- 3. Create Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_trips_owner_id ON public.trips(owner_id);
CREATE INDEX IF NOT EXISTS idx_trips_trip_code ON public.trips(trip_code);
CREATE INDEX IF NOT EXISTS idx_trips_ends_at ON public.trips(ends_at);
CREATE INDEX IF NOT EXISTS idx_trip_members_user_id ON public.trip_members(user_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_trip_id ON public.trip_members(trip_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

-- 5. Helper function to check membership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_member_of_trip(p_trip_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
VOLATILE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE trip_id = p_trip_id AND user_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.trips
    WHERE id = p_trip_id AND owner_id = p_user_id
  );
$$;

-- 6. Helper function to find a trip by code (allows prospective members to preview)
CREATE OR REPLACE FUNCTION public.find_trip_by_code(p_code TEXT)
RETURNS SETOF public.trips
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT * FROM public.trips 
  WHERE UPPER(trip_code) = UPPER(TRIM(p_code)) 
  LIMIT 1;
$$;

-- 7. RLS Policies for public.trips
CREATE POLICY "Users can view trips they own or belong to"
  ON public.trips FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid() OR public.is_member_of_trip(id, auth.uid())
  );

CREATE POLICY "Users can insert trips they own"
  ON public.trips FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
  );

CREATE POLICY "Owners can update their trips"
  ON public.trips FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid()
  )
  WITH CHECK (
    owner_id = auth.uid()
  );

-- 8. RLS Policies for public.trip_members
CREATE POLICY "Users can view members of their trips"
  ON public.trip_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR public.is_member_of_trip(trip_id, auth.uid())
  );

CREATE POLICY "Users can insert membership for themselves"
  ON public.trip_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND (
      role = 'participant' OR 
      EXISTS (SELECT 1 FROM public.trips WHERE id = trip_id AND owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own membership"
  ON public.trip_members FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid() AND (
      role = 'participant' OR 
      EXISTS (SELECT 1 FROM public.trips WHERE id = trip_id AND owner_id = auth.uid())
    )
  );
