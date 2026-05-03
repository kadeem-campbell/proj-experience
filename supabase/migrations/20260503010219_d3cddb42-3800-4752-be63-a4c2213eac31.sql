
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.notify_search_engines_on_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url text := 'https://cyhdcavibrypqlybkact.supabase.co/functions/v1/indexnow-ping';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5aGRjYXZpYnJ5cHFseWJrYWN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDAyMTksImV4cCI6MjA4NTcxNjIxOX0.g-_9gPzOjnLbHEuK5Kt85YQrr1ONFbaMLBt7eNZ7enc';
  entity_type text;
  should_ping boolean := false;
BEGIN
  -- Map table -> entity_type understood by indexnow-ping function
  IF TG_TABLE_NAME = 'products' THEN entity_type := 'product';
  ELSIF TG_TABLE_NAME = 'destinations' THEN entity_type := 'destination';
  ELSIF TG_TABLE_NAME = 'areas' THEN entity_type := 'area';
  ELSIF TG_TABLE_NAME = 'countries' THEN entity_type := 'country';
  ELSIF TG_TABLE_NAME = 'collections' THEN entity_type := 'collection';
  ELSIF TG_TABLE_NAME = 'public_itineraries' THEN entity_type := 'itinerary';
  ELSIF TG_TABLE_NAME = 'hosts' THEN entity_type := 'host';
  ELSIF TG_TABLE_NAME = 'pois' THEN entity_type := 'poi';
  ELSE RETURN NEW;
  END IF;

  -- Only ping when the row is currently indexable
  IF NEW.indexability_state IS DISTINCT FROM 'public_indexed' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    should_ping := true;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Ping when becoming indexed, when slug changes, or when key SEO content changes
    IF OLD.indexability_state IS DISTINCT FROM NEW.indexability_state THEN should_ping := true; END IF;
    IF OLD.slug IS DISTINCT FROM NEW.slug THEN should_ping := true; END IF;
    IF (OLD.seo_title IS DISTINCT FROM NEW.seo_title) OR (OLD.seo_description IS DISTINCT FROM NEW.seo_description) THEN should_ping := true; END IF;
  END IF;

  IF NOT should_ping THEN RETURN NEW; END IF;

  PERFORM extensions.http_post(
    url := fn_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'apikey', anon_key, 'Authorization', 'Bearer ' || anon_key),
    body := jsonb_build_object('entityType', entity_type, 'entityId', NEW.id)
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block the user write because of a ping failure
  RETURN NEW;
END;
$$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['products','destinations','areas','countries','collections','public_itineraries','hosts','pois']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_notify_search_engines ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_notify_search_engines AFTER INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.notify_search_engines_on_change()', t);
  END LOOP;
END $$;
