
CREATE OR REPLACE FUNCTION public.get_page_view_stats(p_from timestamptz, p_to timestamptz)
RETURNS TABLE(total_views bigint, unique_sessions bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(*)::bigint, count(DISTINCT session_id)::bigint
  FROM public.page_views WHERE created_at >= p_from AND created_at <= p_to;
$$;

CREATE OR REPLACE FUNCTION public.get_live_visitors()
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(DISTINCT session_id)::bigint FROM public.page_views WHERE created_at >= now() - interval '5 minutes';
$$;

CREATE OR REPLACE FUNCTION public.get_live_carts()
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(DISTINCT session_id)::bigint FROM public.analytics_events WHERE event_type = 'cart_active' AND created_at >= now() - interval '5 minutes';
$$;

CREATE OR REPLACE FUNCTION public.get_daily_views(p_from timestamptz, p_to timestamptz)
RETURNS TABLE(day date, view_count bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT created_at::date, count(*)::bigint FROM public.page_views WHERE created_at >= p_from AND created_at <= p_to GROUP BY created_at::date ORDER BY 1;
$$;

CREATE OR REPLACE FUNCTION public.get_top_pages(p_from timestamptz, p_to timestamptz, p_limit int DEFAULT 15)
RETURNS TABLE(page text, view_count bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT page_path, count(*)::bigint FROM public.page_views WHERE created_at >= p_from AND created_at <= p_to GROUP BY page_path ORDER BY 2 DESC LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.get_traffic_sources(p_from timestamptz, p_to timestamptz, p_limit int DEFAULT 15)
RETURNS TABLE(source text, view_count bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE WHEN utm_source IS NOT NULL AND utm_source != '' THEN utm_source WHEN referrer IS NOT NULL AND referrer != '' THEN CASE WHEN referrer ~ '^https?://' THEN regexp_replace(regexp_replace(referrer, '^https?://(www\.)?', ''), '/.*$', '') ELSE left(referrer, 50) END ELSE 'Direct' END, count(*)::bigint FROM public.page_views WHERE created_at >= p_from AND created_at <= p_to GROUP BY 1 ORDER BY 2 DESC LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.get_country_breakdown(p_from timestamptz, p_to timestamptz, p_limit int DEFAULT 20)
RETURNS TABLE(country text, view_count bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(country_code, 'Unknown'), count(*)::bigint FROM public.page_views WHERE created_at >= p_from AND created_at <= p_to GROUP BY 1 ORDER BY 2 DESC LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.get_top_products_by_views(p_from timestamptz, p_to timestamptz, p_limit int DEFAULT 20)
RETURNS TABLE(pid text, view_count bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT product_id, count(*)::bigint FROM public.page_views WHERE created_at >= p_from AND created_at <= p_to AND product_id IS NOT NULL GROUP BY product_id ORDER BY 2 DESC LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION public.get_atc_sessions(p_from timestamptz, p_to timestamptz)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(DISTINCT session_id)::bigint FROM public.analytics_events WHERE event_type = 'add_to_cart' AND created_at >= p_from AND created_at <= p_to;
$$;

CREATE OR REPLACE FUNCTION public.get_checkout_sessions(p_from timestamptz, p_to timestamptz)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT count(DISTINCT session_id)::bigint FROM public.analytics_events WHERE event_type = 'checkout_started' AND created_at >= p_from AND created_at <= p_to;
$$
