-- V2: Per-event file attachments.

CREATE TABLE public.event_attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      UUID NOT NULL REFERENCES public.itinerary_events(id) ON DELETE CASCADE,
  trip_id       UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,
  storage_path  TEXT NOT NULL UNIQUE,
  file_size     INTEGER NOT NULL,
  mime_type     TEXT NOT NULL,
  uploaded_by   UUID NOT NULL REFERENCES public.profiles(id),
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX event_attachments_event_id_idx ON public.event_attachments(event_id);
CREATE INDEX event_attachments_trip_id_idx  ON public.event_attachments(trip_id);

ALTER TABLE public.event_attachments ENABLE ROW LEVEL SECURITY;

-- SELECT: any trip member (organiser or member)
CREATE POLICY "event_attachments_select_member"
  ON public.event_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = event_attachments.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );

-- INSERT: organiser only
CREATE POLICY "event_attachments_insert_organiser"
  ON public.event_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );

-- DELETE: organiser only
CREATE POLICY "event_attachments_delete_organiser"
  ON public.event_attachments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );

-- Storage bucket (private; access via signed URLs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-attachments', 'event-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies. Path layout: {tripId}/{eventId}/{attachmentId}-{filename}
-- (storage.foldername(name))[1] = tripId

CREATE POLICY "event_attachments_storage_select_member"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'event-attachments'
    AND EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id::text = (storage.foldername(name))[1]
        AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "event_attachments_storage_insert_organiser"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-attachments'
    AND EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id::text = (storage.foldername(name))[1]
        AND trips.organiser_id = auth.uid()
    )
  );

CREATE POLICY "event_attachments_storage_delete_organiser"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event-attachments'
    AND EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id::text = (storage.foldername(name))[1]
        AND trips.organiser_id = auth.uid()
    )
  );
