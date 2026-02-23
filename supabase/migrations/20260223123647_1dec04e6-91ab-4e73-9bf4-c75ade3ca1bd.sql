
-- Create homepage_sections table for managing landing page sections
CREATE TABLE public.homepage_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  subtitle text DEFAULT '',
  is_visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  section_type text NOT NULL DEFAULT 'built_in',
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;

-- Anyone can read visible sections
CREATE POLICY "Anyone can view visible sections"
  ON public.homepage_sections
  FOR SELECT
  USING (is_visible = true);

-- Service role manages sections
CREATE POLICY "Service role manages sections"
  ON public.homepage_sections
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Seed default sections matching current homepage layout
INSERT INTO public.homepage_sections (section_key, title, subtitle, sort_order, section_type) VALUES
  ('hero', 'Hero Banner', 'Main hero carousel slider', 1, 'built_in'),
  ('brand_categories', 'Brand Categories', 'Browse by brand logos', 2, 'built_in'),
  ('promo_banner', 'Promo Banner', 'Promotional announcement bar', 3, 'built_in'),
  ('top_sellers', 'Our Collection', 'Top selling products', 4, 'built_in'),
  ('promo_grid', 'Promo Grid', 'Promotional image grid', 5, 'built_in'),
  ('on_cloud_ad', 'On Cloud Ad Banner', 'On Cloud brand advertisement', 6, 'built_in'),
  ('on_cloud_collection', 'On Cloud Collection', 'On Cloud product row', 7, 'built_in'),
  ('adidas_ad', 'Adidas Ad Banner', 'Adidas brand advertisement', 8, 'built_in'),
  ('adidas_collection', 'Adidas Collection', 'Adidas product row', 9, 'built_in'),
  ('nike_ad', 'Nike Ad Banner', 'Nike brand advertisement', 10, 'built_in'),
  ('nike_collection', 'Nike Collection', 'Nike product row', 11, 'built_in'),
  ('new_balance_promo', 'New Balance Promo Grid', 'New Balance promotional grid', 12, 'built_in'),
  ('new_balance_collection', 'New Balance Collection', 'New Balance product row', 13, 'built_in'),
  ('testimonials', 'Testimonials', 'Customer testimonials', 14, 'built_in'),
  ('features_bar', 'Features Bar', 'Feature highlights bar', 15, 'built_in');
