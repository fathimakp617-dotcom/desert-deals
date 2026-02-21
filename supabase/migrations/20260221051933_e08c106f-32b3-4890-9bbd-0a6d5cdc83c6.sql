
-- Make the public reviews view bypass RLS so anonymous users can read approved reviews
ALTER VIEW public.product_reviews_public SET (security_invoker = false);
