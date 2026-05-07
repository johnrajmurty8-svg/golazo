CREATE TABLE public.parsed_accommodation (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id             UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  source_document_id  UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  property_name       TEXT,
  location            TEXT,
  check_in_date       DATE,
  check_out_date      DATE,
  confirmation_number TEXT,
  travellers          TEXT[],
  confidence_score    FLOAT4 NOT NULL DEFAULT 0.8,
  is_locked           BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.parsed_accommodation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "parsed_accommodation_select_member"
  ON public.parsed_accommodation FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = parsed_accommodation.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "parsed_accommodation_write_organiser"
  ON public.parsed_accommodation FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );

CREATE POLICY "parsed_accommodation_update_organiser"
  ON public.parsed_accommodation FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );

CREATE POLICY "parsed_accommodation_delete_organiser"
  ON public.parsed_accommodation FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );
