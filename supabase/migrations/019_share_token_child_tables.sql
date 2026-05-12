-- Extend share-token anon access to the child tables the public share page
-- reads from. Without these, RLS blocks anon reads on flights / accommodation /
-- itinerary / member-count and the share view renders the trip header with no
-- content beneath it.
--
-- Pattern: allow SELECT for `anon` if the row's trip has a non-null share_token
-- and isn't soft-deleted. The actual share_token = ? check stays in the share
-- page's `.eq("share_token", token)` filter on the trips query — without the
-- right URL, the trips lookup returns nothing and the page 404s before any of
-- these child queries run.

-- parsed_flights
CREATE POLICY "parsed_flights_select_share_token"
  ON public.parsed_flights FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = parsed_flights.trip_id
        AND trips.share_token IS NOT NULL
        AND trips.deleted_at IS NULL
    )
  );

-- parsed_accommodation
CREATE POLICY "parsed_accommodation_select_share_token"
  ON public.parsed_accommodation FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = parsed_accommodation.trip_id
        AND trips.share_token IS NOT NULL
        AND trips.deleted_at IS NULL
    )
  );

-- itinerary_days
CREATE POLICY "itinerary_days_select_share_token"
  ON public.itinerary_days FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = itinerary_days.trip_id
        AND trips.share_token IS NOT NULL
        AND trips.deleted_at IS NULL
    )
  );

-- itinerary_events
CREATE POLICY "itinerary_events_select_share_token"
  ON public.itinerary_events FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = itinerary_events.trip_id
        AND trips.share_token IS NOT NULL
        AND trips.deleted_at IS NULL
    )
  );

-- trip_members (only for member count display — anon never sees user IDs in UI)
CREATE POLICY "trip_members_select_share_token"
  ON public.trip_members FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_members.trip_id
        AND trips.share_token IS NOT NULL
        AND trips.deleted_at IS NULL
    )
  );
