CREATE TABLE public.parsed_flights (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id             UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  source_document_id  UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  airline             TEXT,
  flight_number       TEXT,
  from_airport        TEXT,
  to_airport          TEXT,
  departure_date      DATE,
  departure_time      TIME,
  arrival_date        DATE,
  arrival_time        TIME,
  confirmation_number TEXT,
  travellers          TEXT[],
  confidence_score    FLOAT4 NOT NULL DEFAULT 0.8,
  is_locked           BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.parsed_flights ENABLE ROW LEVEL SECURITY;

-- All trip members can read flights
CREATE POLICY "parsed_flights_select_member"
  ON public.parsed_flights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = parsed_flights.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );

-- Only organisers can write flights
CREATE POLICY "parsed_flights_write_organiser"
  ON public.parsed_flights FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );

CREATE POLICY "parsed_flights_update_organiser"
  ON public.parsed_flights FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );

CREATE POLICY "parsed_flights_delete_organiser"
  ON public.parsed_flights FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );
