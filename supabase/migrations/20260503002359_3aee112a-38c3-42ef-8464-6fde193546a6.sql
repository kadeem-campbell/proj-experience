-- Extend auto_create_slug_redirect to also handle destination_id and area_id changes
CREATE OR REPLACE FUNCTION public.auto_create_slug_redirect()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  old_path text;
  new_path text;
  old_dest_slug text;
  new_dest_slug text;
  old_area_slug text;
  new_area_slug text;
  slug_changed boolean := false;
  dest_changed boolean := false;
  area_changed boolean := false;
BEGIN
  IF NEW.slug IS NULL OR OLD.slug IS NULL THEN
    RETURN NEW;
  END IF;

  slug_changed := (NEW.slug <> OLD.slug);

  IF TG_TABLE_NAME IN ('products','pois') THEN
    dest_changed := COALESCE(NEW.destination_id::text,'') <> COALESCE(OLD.destination_id::text,'');
    SELECT d.slug INTO old_dest_slug FROM destinations d WHERE d.id = OLD.destination_id;
    SELECT d.slug INTO new_dest_slug FROM destinations d WHERE d.id = NEW.destination_id;
  END IF;

  IF TG_TABLE_NAME = 'products' THEN
    -- products may have area_id
    BEGIN
      area_changed := COALESCE(NEW.area_id::text,'') <> COALESCE(OLD.area_id::text,'');
      SELECT a.slug INTO old_area_slug FROM areas a WHERE a.id = OLD.area_id;
      SELECT a.slug INTO new_area_slug FROM areas a WHERE a.id = NEW.area_id;
    EXCEPTION WHEN undefined_column THEN
      area_changed := false;
    END;
  END IF;

  IF NOT (slug_changed OR dest_changed OR area_changed) THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'products' THEN
    old_path := '/things-to-do/' || COALESCE(old_dest_slug,'explore')
                || CASE WHEN old_area_slug IS NOT NULL THEN '/' || old_area_slug ELSE '' END
                || '/' || OLD.slug;
    new_path := '/things-to-do/' || COALESCE(new_dest_slug,'explore')
                || CASE WHEN new_area_slug IS NOT NULL THEN '/' || new_area_slug ELSE '' END
                || '/' || NEW.slug;
  ELSIF TG_TABLE_NAME = 'pois' THEN
    old_path := '/things-to-do/' || COALESCE(old_dest_slug,'explore') || '/' || OLD.slug;
    new_path := '/things-to-do/' || COALESCE(new_dest_slug,'explore') || '/' || NEW.slug;
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
    SELECT d.slug INTO old_dest_slug FROM destinations d WHERE d.id = OLD.destination_id;
    SELECT d.slug INTO new_dest_slug FROM destinations d WHERE d.id = NEW.destination_id;
    old_path := '/' || COALESCE(old_dest_slug,'explore') || '/' || OLD.slug;
    new_path := '/' || COALESCE(new_dest_slug,'explore') || '/' || NEW.slug;
  ELSE
    RETURN NEW;
  END IF;

  IF old_path = new_path THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.redirect_registry (source_path, target_path, status_code, is_active, notes)
  VALUES (old_path, new_path, 301, true, 'Auto-created on change for ' || TG_TABLE_NAME)
  ON CONFLICT (source_path) DO UPDATE
    SET target_path = EXCLUDED.target_path,
        is_active = true,
        updated_at = now(),
        notes = EXCLUDED.notes;

  RETURN NEW;
END;
$function$;