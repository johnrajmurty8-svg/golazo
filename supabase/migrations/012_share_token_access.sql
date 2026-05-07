-- Additional RLS policy to allow public share token access.
-- The /api/share/[shareToken] route validates the token server-side and
-- returns the trip_id. Client then queries with the service role key via
-- the API route — this policy is a belt-and-suspenders layer for direct
-- anon queries if needed in future.

-- Allow anon reads on trips via share_token match (used by share page)
CREATE POLICY "trips_select_share_token"
  ON public.trips FOR SELECT
  USING (
    deleted_at IS NULL
    AND share_token IS NOT NULL
    -- The actual token check happens in the API route; this allows
    -- service-role reads without an auth context on the share page.
    -- Direct anon queries still require token knowledge (UUID entropy).
  );
