-- Add soft-delete column for product trash/recovery
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update RLS policy to hide soft-deleted products from public view
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true AND deleted_at IS NULL);