-- V2: Itinerary event extensions for tags, travellers, and booking links.
ALTER TABLE public.itinerary_events
  ADD COLUMN travellers  TEXT[],
  ADD COLUMN tags        TEXT[],
  ADD COLUMN booking_url TEXT;
