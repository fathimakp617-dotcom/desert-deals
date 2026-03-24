
CREATE OR REPLACE FUNCTION public.get_analytics_aggregates(p_from timestamptz, p_to timestamptz)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_views', (SELECT count(*) FROM page_views WHERE created_at >= p_from AND created_at <= p_to),
    'unique_sessions', (SELECT count(DISTINCT session_id) FROM page_views WHERE created_at >= p_from AND created_at <= p_to),
    'live_visitors', (SELECT count(DISTINCT session_id) FROM page_views WHERE created_at >= now() - interval '5 minutes'),
    'live_carts', (SELECT count(DISTINCT session_id) FROM analytics_events WHERE event_type = 'cart_active' AND created_at >= now() - interval '5 minutes'),
    'atc_sessions', (SELECT count(DISTINCT session_id) FROM analytics_events WHERE event_type = 'add_to_cart' AND created_at >= p_from AND created_at <= p_to),
    'checkout_sessions', (SELECT count(DISTINCT session_id) FROM analytics_events WHERE event_type = 'checkout_started' AND created_at >= p_from AND created_at <= p_to),
    'daily_views', (SELECT coalesce(json_agg(row_to_json(dv) ORDER BY dv.day), '[]'::json) FROM (SELECT created_at::date as day, count(*) as view_count FROM page_views WHERE created_at >= p_from AND created_at <= p_to GROUP BY 1) dv),
    'top_pages', (SELECT coalesce(json_agg(row_to_json(tp) ORDER BY tp.view_count DESC), '[]'::json) FROM (SELECT page_path as page, count(*) as view_count FROM page_views WHERE created_at >= p_from AND created_at <= p_to GROUP BY 1 ORDER BY 2 DESC LIMIT 15) tp),
    'sources', (SELECT coalesce(json_agg(row_to_json(ts) ORDER BY ts.view_count DESC), '[]'::json) FROM (SELECT CASE WHEN utm_source IS NOT NULL AND utm_source != '' THEN utm_source WHEN referrer IS NOT NULL AND referrer != '' THEN CASE WHEN referrer ~ '^https?://' THEN regexp_replace(regexp_replace(referrer, '^https?://(www\.)?', ''), '/.*$', '') ELSE left(referrer, 50) END ELSE 'Direct' END as source, count(*) as view_count FROM page_views WHERE created_at >= p_from AND created_at <= p_to GROUP BY 1 ORDER BY 2 DESC LIMIT 15) ts),
    'countries', (SELECT coalesce(json_agg(row_to_json(cb) ORDER BY cb.view_count DESC), '[]'::json) FROM (SELECT COALESCE(country_code, 'Unknown') as country, count(*) as view_count FROM page_views WHERE created_at >= p_from AND created_at <= p_to GROUP BY 1 ORDER BY 2 DESC LIMIT 20) cb),
    'top_product_views', (SELECT coalesce(json_agg(row_to_json(pv) ORDER BY pv.view_count DESC), '[]'::json) FROM (SELECT product_id as pid, count(*) as view_count FROM page_views WHERE created_at >= p_from AND created_at <= p_to AND product_id IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 20) pv)
  ) INTO result;
  RETURN result;
END;
$$
