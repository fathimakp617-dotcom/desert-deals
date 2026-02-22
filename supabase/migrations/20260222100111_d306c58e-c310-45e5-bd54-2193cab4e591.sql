
-- Create allowed countries table (whitelist approach)
CREATE TABLE public.allowed_countries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code text NOT NULL UNIQUE,
  country_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.allowed_countries ENABLE ROW LEVEL SECURITY;

-- Anyone can read allowed countries
CREATE POLICY "Anyone can read allowed countries"
  ON public.allowed_countries
  FOR SELECT
  USING (true);

-- Insert UAE + India + GCC countries
INSERT INTO public.allowed_countries (country_code, country_name) VALUES
  ('AE', 'United Arab Emirates'),
  ('IN', 'India'),
  ('SA', 'Saudi Arabia'),
  ('OM', 'Oman'),
  ('BH', 'Bahrain'),
  ('KW', 'Kuwait'),
  ('QA', 'Qatar');
