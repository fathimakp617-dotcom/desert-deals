
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  session_id text,
  product_id text,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics events" ON public.analytics_events
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Block user select on analytics_events" ON public.analytics_events
  FOR SELECT TO anon, authenticated USING (false);

CREATE POLICY "Service role manages analytics_events" ON public.analytics_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_analytics_events_created ON public.analytics_events (created_at DESC);
CREATE INDEX idx_analytics_events_type ON public.analytics_events (event_type, created_at DESC);
