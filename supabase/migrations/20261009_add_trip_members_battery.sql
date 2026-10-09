-- Migration: Add battery_level column to trip_members for real hardware battery reporting
-- Author: MyCrew Battery Engine

ALTER TABLE public.trip_members
  ADD COLUMN IF NOT EXISTS battery_level INTEGER NULL;
