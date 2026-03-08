INSERT INTO public.categories (value, label, is_active, sort_order)
VALUES ('jersey', 'Jersey', true, 100)
ON CONFLICT DO NOTHING;