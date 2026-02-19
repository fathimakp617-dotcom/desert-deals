
-- Create categories table
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  value text NOT NULL UNIQUE,
  label text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Anyone can read active categories
CREATE POLICY "Anyone can view active categories"
ON public.categories FOR SELECT
USING (is_active = true);

-- Service role manages categories
CREATE POLICY "Service role manages categories"
ON public.categories FOR ALL
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- Seed with existing categories
INSERT INTO public.categories (value, label, sort_order) VALUES
  ('nike', 'Nike', 1),
  ('jordan', 'Jordan', 2),
  ('adidas', 'Adidas', 3),
  ('new-balance', 'New Balance', 4),
  ('asics', 'Asics', 5),
  ('on-cloud', 'On Cloud', 6),
  ('hoka', 'Hoka', 7),
  ('puma', 'Puma', 8),
  ('onitsuka-tiger', 'Onitsuka Tiger', 9),
  ('loro-piana', 'Loro Piana', 10),
  ('louis-vuitton', 'Louis Vuitton', 11),
  ('brooks', 'Brooks', 12),
  ('hermes', 'Hermes', 13),
  ('running', 'Running Shoes', 14),
  ('combo', 'Combo', 15),
  ('accessories', 'Accessories', 16);
