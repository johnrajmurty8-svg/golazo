CREATE TABLE public.itinerary_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id           UUID NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
  trip_id          UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  time             TIME,
  title            TEXT NOT NULL,
  description      TEXT,
  location         TEXT,
  event_type       TEXT NOT NULL DEFAULT 'general'
                     CHECK (event_type IN ('flight', 'accommodation', 'activity', 'transfer', 'general')),
  source_entity_id UUID,
  confidence_score FLOAT4 NOT NULL DEFAULT 1.0,
  is_locked        BOOLEAN NOT NULL DEFAULT false,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.itinerary_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "itinerary_events_select_member"
  ON public.itinerary_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = itinerary_events.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "itinerary_events_write_organiser"
  ON public.itinerary_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );

CREATE POLICY "itinerary_events_update_organiser"
  ON public.itinerary_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );

CREATE POLICY "itinerary_events_delete_organiser"
  ON public.itinerary_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );
