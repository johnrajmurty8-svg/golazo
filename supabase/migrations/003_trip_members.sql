CREATE TABLE public.trip_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id   UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role      TEXT NOT NULL CHECK (role IN ('organiser', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (trip_id, user_id)
);

ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;

-- Users can see memberships for trips they belong to
CREATE POLICY "trip_members_select"
  ON public.trip_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.trip_members tm2
      WHERE tm2.trip_id = trip_members.trip_id
        AND tm2.user_id = auth.uid()
    )
  );

-- Only organisers can add members
CREATE POLICY "trip_members_insert_organiser"
  ON public.trip_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );

-- Organisers can remove members
CREATE POLICY "trip_members_delete_organiser"
  ON public.trip_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );
