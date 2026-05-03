
-- ============= AUTO-REDIRECT ON SLUG CHANGE =============
CREATE OR REPLACE FUNCTION public.auto_create_slug_redirect()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_path text;
  new_path text;
  dest_slug text;
BEGIN
  IF NEW.slug IS NULL OR OLD.slug IS NULL OR NEW.slug = OLD.slug THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'products' THEN
    SELECT d.slug INTO dest_slug FROM destinations d WHERE d.id = NEW.destination_id;
    old_path := '/things-to-do/' || COALESCE(dest_slug,'explore') || '/' || OLD.slug;
    new_path := '/things-to-do/' || COALESCE(dest_slug,'explore') || '/' || NEW.slug;
  ELSIF TG_TABLE_NAME = 'public_itineraries' THEN
    old_path := '/itineraries/' || OLD.slug;
    new_path := '/itineraries/' || NEW.slug;
  ELSIF TG_TABLE_NAME = 'hosts' THEN
    old_path := '/hosts/' || OLD.slug;
    new_path := '/hosts/' || NEW.slug;
  ELSIF TG_TABLE_NAME = 'collections' THEN
    old_path := '/collections/' || OLD.slug;
    new_path := '/collections/' || NEW.slug;
  ELSIF TG_TABLE_NAME = 'destinations' THEN
    old_path := '/' || OLD.slug;
    new_path := '/' || NEW.slug;
  ELSIF TG_TABLE_NAME = 'areas' THEN
    SELECT d.slug INTO dest_slug FROM destinations d WHERE d.id = NEW.destination_id;
    old_path := '/' || COALESCE(dest_slug,'explore') || '/' || OLD.slug;
    new_path := '/' || COALESCE(dest_slug,'explore') || '/' || NEW.slug;
  ELSIF TG_TABLE_NAME = 'pois' THEN
    SELECT d.slug INTO dest_slug FROM destinations d WHERE d.id = NEW.destination_id;
    old_path := '/things-to-do/' || COALESCE(dest_slug,'explore') || '/' || OLD.slug;
    new_path := '/things-to-do/' || COALESCE(dest_slug,'explore') || '/' || NEW.slug;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.redirect_registry (source_path, target_path, status_code, is_active, notes)
  VALUES (old_path, new_path, 301, true, 'Auto-created on slug change for ' || TG_TABLE_NAME)
  ON CONFLICT (source_path) DO UPDATE
    SET target_path = EXCLUDED.target_path,
        is_active = true,
        updated_at = now(),
        notes = EXCLUDED.notes;

  RETURN NEW;
END;
$$;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['products','public_itineraries','hosts','collections','destinations','areas','pois']) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_auto_slug_redirect ON public.%I;', t);
    EXECUTE format('CREATE TRIGGER trg_auto_slug_redirect AFTER UPDATE OF slug ON public.%I FOR EACH ROW WHEN (OLD.slug IS DISTINCT FROM NEW.slug) EXECUTE FUNCTION public.auto_create_slug_redirect();', t);
  END LOOP;
END $$;

-- ============= FRIENDLY DUPLICATE-SLUG ERROR =============
-- Re-raise unique violations on slug with a clear message so UI can surface it cleanly.
CREATE OR REPLACE FUNCTION public.guard_unique_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    RAISE EXCEPTION 'Slug cannot be empty' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Slug "%" must be lowercase letters, numbers and hyphens only', NEW.slug USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['products','public_itineraries','hosts','collections','destinations','areas','pois','carousels']) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_guard_unique_slug ON public.%I;', t);
    EXECUTE format('CREATE TRIGGER trg_guard_unique_slug BEFORE INSERT OR UPDATE OF slug ON public.%I FOR EACH ROW EXECUTE FUNCTION public.guard_unique_slug();', t);
  END LOOP;
END $$;
