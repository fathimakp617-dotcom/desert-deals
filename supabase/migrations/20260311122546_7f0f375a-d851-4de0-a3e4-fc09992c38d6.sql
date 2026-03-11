CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  order_number TEXT,
  status TEXT NOT NULL DEFAULT 'sent',
  resend_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Block all user access to email_logs" ON public.email_logs
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Service role manages email_logs" ON public.email_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_email_logs_order ON public.email_logs(order_number);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at DESC);