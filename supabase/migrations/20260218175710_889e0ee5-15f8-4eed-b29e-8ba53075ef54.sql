
-- Update the order number generation function to use DD-XXXXX format
CREATE OR REPLACE FUNCTION public.generate_order_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  next_num integer;
BEGIN
  -- Get the current max order number and increment
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS integer)), 6324) + 1
  INTO next_num
  FROM public.orders
  WHERE order_number LIKE 'DD-%' AND SUBSTRING(order_number FROM 4) ~ '^\d+$';
  
  NEW.order_number := 'DD-' || LPAD(next_num::text, 5, '0');
  RETURN NEW;
END;
$function$;
