CREATE TABLE public.trips (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organiser_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  start_date       DATE NOT NULL,
  end_date         DATE NOT NULL,
  cover_image_url  TEXT,
  share_token      UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  deleted_at       TIMESTAMPTZ DEFAULT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Members (and organiser) can read trips they belong to (and that aren't deleted)
CREATE POLICY "trips_select_member"
  ON public.trips FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = trips.id
        AND trip_members.user_id = auth.uid()
    )
  );

-- Organiser can insert trips
CREATE POLICY "trips_insert_organiser"
  ON public.trips FOR INSERT
  WITH CHECK (organiser_id = auth.uid());

-- Organiser can update their own trips
CREATE POLICY "trips_update_organiser"
  ON public.trips FOR UPDATE
  USING (organiser_id = auth.uid());

-- Soft-delete: organiser sets deleted_at (same UPDATE policy covers this)
-- No hard DELETE policy — all deletes are soft via UPDATE
