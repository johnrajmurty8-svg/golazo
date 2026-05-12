-- Fix: trips soft-delete (UPDATE setting deleted_at) was failing with
-- "new row violates row-level security policy for table trips" (42501).
--
-- The original policy only specified USING. Although Postgres docs say the
-- USING expression is used implicitly as WITH CHECK when none is provided,
-- the resulting behaviour proved inconsistent under Supabase's SSR auth
-- context — the post-update row was failing validation despite organiser_id
-- being unchanged.
--
-- Making WITH CHECK explicit removes the ambiguity and unblocks the soft
-- delete from both the sidebar and the trip settings page.

DROP POLICY IF EXISTS "trips_update_organiser" ON public.trips;

CREATE POLICY "trips_update_organiser"
  ON public.trips FOR UPDATE
  USING (organiser_id = auth.uid())
  WITH CHECK (organiser_id = auth.uid());
