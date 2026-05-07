CREATE TABLE public.action_alerts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id             UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  alert_type          TEXT NOT NULL
                        CHECK (alert_type IN ('missing_booking', 'date_conflict', 'traveller_gap', 'confidence_flag', 'general')),
  severity            TEXT NOT NULL DEFAULT 'warning'
                        CHECK (severity IN ('info', 'warning', 'critical')),
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  is_resolved         BOOLEAN NOT NULL DEFAULT false,
  related_entity_type TEXT,
  related_entity_id   UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.action_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "action_alerts_select_member"
  ON public.action_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = action_alerts.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "action_alerts_insert_organiser"
  ON public.action_alerts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );

-- Organiser can mark alerts resolved
CREATE POLICY "action_alerts_update_organiser"
  ON public.action_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );
