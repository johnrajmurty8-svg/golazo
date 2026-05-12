-- Fix: trips_select_share_token was unscoped, so the share-link policy
-- applied to every role including 'authenticated'. RLS policies are
-- OR-combined for SELECT, which meant any logged-in user could read any
-- active trip with a share_token — bypassing the trips_select_member
-- membership check.
--
-- The policy is only intended for the public share view (anon role).

DROP POLICY IF EXISTS "trips_select_share_token" ON public.trips;

CREATE POLICY "trips_select_share_token"
  ON public.trips FOR SELECT
  TO anon
  USING (
    deleted_at IS NULL
    AND share_token IS NOT NULL
  );
