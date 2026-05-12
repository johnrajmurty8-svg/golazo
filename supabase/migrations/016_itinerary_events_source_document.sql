-- Direct event → source document link, so AI-generated events can show their
-- origin document regardless of event_type (the prior path only worked for
-- flight/accommodation events via an indirect parsed_flights/accommodation hop).
ALTER TABLE public.itinerary_events
  ADD COLUMN source_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL;

CREATE INDEX itinerary_events_source_document_id_idx
  ON public.itinerary_events(source_document_id);
