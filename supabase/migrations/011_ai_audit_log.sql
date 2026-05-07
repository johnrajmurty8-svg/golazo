CREATE TABLE public.ai_audit_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id          UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  user_id          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  agent            TEXT NOT NULL CHECK (agent IN ('parser', 'chatbot')),
  input_tokens     INTEGER,
  output_tokens    INTEGER,
  prompt_hash      TEXT,
  response_summary TEXT,
  error            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log is write-only from the app's perspective (service role handles inserts)
-- Organisers can read their own trip's audit log for transparency
CREATE POLICY "ai_audit_log_select_organiser"
  ON public.ai_audit_log FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.trips
      WHERE trips.id = trip_id
        AND trips.organiser_id = auth.uid()
    )
  );
