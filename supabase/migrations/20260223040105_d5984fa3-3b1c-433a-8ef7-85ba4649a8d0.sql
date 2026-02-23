
-- Create banners table for admin-managed banners
CREATE TABLE public.banners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  link_url text NOT NULL DEFAULT '/shop',
  position text NOT NULL DEFAULT 'hero',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Anyone can view active banners (public storefront)
CREATE POLICY "Anyone can view active banners"
  ON public.banners FOR SELECT
  USING (is_active = true);

-- Service role manages banners
CREATE POLICY "Service role manages banners"
  ON public.banners FOR ALL
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Trigger for updated_at
CREATE TRIGGER update_banners_updated_at
  BEFORE UPDATE ON public.banners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with current hardcoded banners
INSERT INTO public.banners (title, image_url, link_url, position, sort_order) VALUES
  ('Shopping Sale', '/banners/slide-9.webp', '/shop', 'hero', 0),
  ('Ramadan Season', '/banners/slide-10.png', '/shop', 'hero', 1),
  ('Ramadan Delivery Promo', '/banners/promo-ramadan-delivery.webp', '/shop', 'promo', 0),
  ('Ramadan Season Promo', '/banners/ramadan-promo.webp', '/shop', 'promo-grid', 0),
  ('On Cloud Shoes', '/banners/on-cloud-ad.webp', '/shop?brand=on-cloud', 'brand-ad-on', 0),
  ('Adidas Collection', '/banners/adidas-ad.jpeg', '/shop?brand=adidas', 'brand-ad-adidas', 0),
  ('Nike Dunk Low', '/banners/nike-dunk-low-ad.webp', '/shop?brand=nike', 'brand-ad-nike', 0);
