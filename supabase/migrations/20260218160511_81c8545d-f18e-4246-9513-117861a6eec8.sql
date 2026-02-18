-- Fix the default size from perfume '100ml' to NULL (shoe sizes are handled in UI)
ALTER TABLE public.products ALTER COLUMN size SET DEFAULT NULL;

-- Update existing '100ml' sizes to NULL
UPDATE public.products SET size = NULL WHERE size = '100ml';

-- Update category based on product name for 'All Shoes', 'All Products', 'combo' etc.
UPDATE public.products SET category = 'Nike' WHERE (category IN ('All Shoes', 'All Products', 'combo') OR category IS NULL) AND (name ILIKE '%Nike%' OR name ILIKE '%Air Max%' OR name ILIKE '%Air Force%' OR name ILIKE '%Dunk%' OR name ILIKE '%Cortez%' OR name ILIKE '%Vomero%');

UPDATE public.products SET category = 'Jordan' WHERE (category IN ('All Shoes', 'All Products', 'combo') OR category IS NULL) AND (name ILIKE '%Jordan%' OR name ILIKE '%Air Jordan%');

UPDATE public.products SET category = 'Adidas' WHERE (category IN ('All Shoes', 'All Products', 'combo') OR category IS NULL) AND (name ILIKE '%Adidas%' OR name ILIKE '%Yeezy%' OR name ILIKE '%Samba%' OR name ILIKE '%Gazelle%' OR name ILIKE '%Campus%');

UPDATE public.products SET category = 'New Balance' WHERE (category IN ('All Shoes', 'All Products', 'combo') OR category IS NULL) AND (name ILIKE '%New Balance%' OR name ILIKE '%NB %');

UPDATE public.products SET category = 'On Cloud' WHERE (category IN ('All Shoes', 'All Products', 'combo') OR category IS NULL) AND (name ILIKE '%On %Cloud%' OR name ILIKE '%On Running%' OR name ILIKE '%Cloudswift%' OR name ILIKE '%Cloudsurfer%' OR name ILIKE '%Cloudtilt%' OR name ILIKE '%Cloudmonster%' OR name ILIKE '%Cloudnova%' OR name ILIKE '%Cloudrunner%' OR name ILIKE '%Cloudflow%' OR name ILIKE '%Loewe x Cloud%');

UPDATE public.products SET category = 'Asics' WHERE (category IN ('All Shoes', 'All Products', 'combo') OR category IS NULL) AND (name ILIKE '%Asics%' OR name ILIKE '%Gel-%');

UPDATE public.products SET category = 'Hoka' WHERE (category IN ('All Shoes', 'All Products', 'combo') OR category IS NULL) AND (name ILIKE '%Hoka%' OR name ILIKE '%Bondi%' OR name ILIKE '%Clifton%');

UPDATE public.products SET category = 'Puma' WHERE (category IN ('All Shoes', 'All Products', 'combo') OR category IS NULL) AND name ILIKE '%Puma%';

UPDATE public.products SET category = 'Louis Vuitton' WHERE (category IN ('All Shoes', 'All Products', 'combo') OR category IS NULL) AND (name ILIKE '%Louis Vuitton%' OR name ILIKE '%LV %');

UPDATE public.products SET category = 'Gucci' WHERE (category IN ('All Shoes', 'All Products', 'combo') OR category IS NULL) AND name ILIKE '%Gucci%';

UPDATE public.products SET category = 'Onitsuka Tiger' WHERE (category IN ('All Shoes', 'All Products', 'combo') OR category IS NULL) AND (name ILIKE '%Onitsuka%' OR name ILIKE '%Tiger%Mexico%');

UPDATE public.products SET category = 'Loro Piana' WHERE (category IN ('All Shoes', 'All Products', 'combo') OR category IS NULL) AND name ILIKE '%Loro Piana%';

UPDATE public.products SET category = 'Brooks' WHERE (category IN ('All Shoes', 'All Products', 'combo') OR category IS NULL) AND name ILIKE '%Brooks%';

UPDATE public.products SET category = 'Dior' WHERE (category IN ('All Shoes', 'All Products', 'combo') OR category IS NULL) AND name ILIKE '%Dior%';

UPDATE public.products SET category = 'Hermes' WHERE (category IN ('All Shoes', 'All Products', 'combo') OR category IS NULL) AND (name ILIKE '%Hermes%' OR name ILIKE '%Hermès%');

UPDATE public.products SET category = 'Reebok' WHERE (category IN ('All Shoes', 'All Products', 'combo') OR category IS NULL) AND name ILIKE '%Reebok%';

UPDATE public.products SET category = 'Converse' WHERE (category IN ('All Shoes', 'All Products', 'combo') OR category IS NULL) AND (name ILIKE '%Converse%' OR name ILIKE '%Chuck Taylor%');

UPDATE public.products SET category = 'Vans' WHERE (category IN ('All Shoes', 'All Products', 'combo') OR category IS NULL) AND name ILIKE '%Vans%';

UPDATE public.products SET category = 'Salomon' WHERE (category IN ('All Shoes', 'All Products', 'combo') OR category IS NULL) AND name ILIKE '%Salomon%';

-- Any remaining 'All Shoes'/'All Products'/'combo' stay as 'Shoes' (generic)
UPDATE public.products SET category = 'Shoes' WHERE category IN ('All Shoes', 'All Products', 'combo');