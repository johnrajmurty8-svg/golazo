CREATE TABLE public.chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id    UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id),
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- All trip members can read chat history
CREATE POLICY "chat_messages_select_member"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = chat_messages.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );

-- All trip members can send messages (role = 'user')
-- Assistant messages are inserted server-side via service role
CREATE POLICY "chat_messages_insert_member"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = chat_messages.trip_id
        AND trip_members.user_id = auth.uid()
    )
  );
