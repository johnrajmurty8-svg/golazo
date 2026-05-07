CREATE TABLE public.documents (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id               UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  uploaded_by           UUID NOT NULL REFERENCES public.profiles(id),
  file_name             TEXT NOT NULL,
  file_size_bytes       INTEGER NOT NULL,
  storage_path          TEXT NOT NULL UNIQUE,
  mime_type             TEXT NOT NULL,
  parse_status          TEXT NOT NULL DEFAULT 'unparsed'
                          CHECK (parse_status IN ('unparsed', 'parsing', 'parsed', 'failed')),
  parse_failure_reason  TEXT,
  parsed_at             TIMESTAMPTZ,
  uploaded_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Only organisers can see, upload, and delete documents
CREATE POLICY "documents_select_organiser"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );

CREATE POLICY "documents_insert_organiser"
  ON public.documents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );

CREATE POLICY "documents_update_organiser"
  ON public.documents FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );

CREATE POLICY "documents_delete_organiser"
  ON public.documents FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );
