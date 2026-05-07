CREATE TABLE public.itinerary_days (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id    UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  title      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (trip_id, date)
);

ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "itinerary_days_select_member"
  ON public.itinerary_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = itinerary_days.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "itinerary_days_write_organiser"
  ON public.itinerary_days FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );

CREATE POLICY "itinerary_days_update_organiser"
  ON public.itinerary_days FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );

CREATE POLICY "itinerary_days_delete_organiser"
  ON public.itinerary_days FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );
