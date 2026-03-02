
DROP VIEW IF EXISTS public.product_reviews_public;
CREATE VIEW public.product_reviews_public
WITH (security_invoker = false) AS
SELECT id, product_id, customer_name, rating, title, comment, is_verified_purchase, is_approved, user_id, created_at, updated_at, photos
FROM public.product_reviews
WHERE is_approved = true;
