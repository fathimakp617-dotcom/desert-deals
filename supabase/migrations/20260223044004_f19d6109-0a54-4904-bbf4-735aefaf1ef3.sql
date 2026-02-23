
-- Drop the broken restrictive policies
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banners;
DROP POLICY IF EXISTS "Service role manages banners" ON public.banners;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Anyone can view active banners"
ON public.banners
FOR SELECT
USING (is_active = true);

CREATE POLICY "Service role manages banners"
ON public.banners
FOR ALL
USING (true)
WITH CHECK (true);
