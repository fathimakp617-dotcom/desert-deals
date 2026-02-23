
-- Add new product categories for the imported product types
INSERT INTO public.categories (value, label, sort_order, is_active) VALUES
  ('Watches', 'Watches', 20, true),
  ('Wallets', 'Wallets', 21, true),
  ('Sunglasses', 'Sunglasses', 22, true),
  ('Heels', 'Heels', 23, true),
  ('Tom Ford', 'Tom Ford', 24, true),
  ('Rolex', 'Rolex', 25, true),
  ('Cartier', 'Cartier', 26, true),
  ('Christian Louboutin', 'Christian Louboutin', 27, true),
  ('Chanel', 'Chanel', 28, true),
  ('Goyard', 'Goyard', 29, true)
ON CONFLICT DO NOTHING;
