CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.admin_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  push_token text NOT NULL UNIQUE,
  platform text,
  device_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_devices TO service_role;
ALTER TABLE public.admin_devices ENABLE ROW LEVEL SECURITY;
-- No client policies: only edge functions (service role) access this table.

CREATE OR REPLACE FUNCTION public.notify_new_order_push()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://ttgsrrlhqvtnmtlkvlyi.supabase.co/functions/v1/notify-new-order',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('order_id', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW; -- never block an order
END;
$$;

DROP TRIGGER IF EXISTS orders_notify_new_order ON public.orders;
CREATE TRIGGER orders_notify_new_order
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.notify_new_order_push();