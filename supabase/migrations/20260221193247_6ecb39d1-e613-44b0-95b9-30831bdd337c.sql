
-- Create page_views table for analytics tracking
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT,
  page_path TEXT NOT NULL,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  country_code TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for tracking)
CREATE POLICY "Anyone can insert page views"
  ON public.page_views FOR INSERT
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read page views"
  ON public.page_views FOR SELECT
  USING (public.is_admin());

-- Create indexes for analytics queries
CREATE INDEX idx_page_views_product_id ON public.page_views (product_id);
CREATE INDEX idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX idx_page_views_page_path ON public.page_views (page_path);

-- Create blocked_countries table for geo-blocking config
CREATE TABLE public.blocked_countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL UNIQUE,
  country_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_countries ENABLE ROW LEVEL SECURITY;

-- Anyone can read (needed by frontend to check blocking)
CREATE POLICY "Anyone can read blocked countries"
  ON public.blocked_countries FOR SELECT
  USING (true);

-- Insert EU countries as blocked by default
INSERT INTO public.blocked_countries (country_code, country_name) VALUES
  ('AT', 'Austria'), ('BE', 'Belgium'), ('BG', 'Bulgaria'), ('HR', 'Croatia'),
  ('CY', 'Cyprus'), ('CZ', 'Czech Republic'), ('DK', 'Denmark'), ('EE', 'Estonia'),
  ('FI', 'Finland'), ('FR', 'France'), ('DE', 'Germany'), ('GR', 'Greece'),
  ('HU', 'Hungary'), ('IE', 'Ireland'), ('IT', 'Italy'), ('LV', 'Latvia'),
  ('LT', 'Lithuania'), ('LU', 'Luxembourg'), ('MT', 'Malta'), ('NL', 'Netherlands'),
  ('PL', 'Poland'), ('PT', 'Portugal'), ('RO', 'Romania'), ('SK', 'Slovakia'),
  ('SI', 'Slovenia'), ('ES', 'Spain'), ('SE', 'Sweden');
