
-- ============ Add publish/visibility columns where missing ============
ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS publish_state text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS visibility_output_state text NOT NULL DEFAULT 'internal_only',
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text;

ALTER TABLE public.areas
  ADD COLUMN IF NOT EXISTS publish_state text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS visibility_output_state text NOT NULL DEFAULT 'internal_only',
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text;

ALTER TABLE public.pois
  ADD COLUMN IF NOT EXISTS publish_state text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS visibility_output_state text NOT NULL DEFAULT 'internal_only',
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text;

ALTER TABLE public.public_itineraries
  ADD COLUMN IF NOT EXISTS publish_state text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS visibility_output_state text NOT NULL DEFAULT 'internal_only',
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text;

ALTER TABLE public.hosts
  ADD COLUMN IF NOT EXISTS publish_state text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS visibility_output_state text NOT NULL DEFAULT 'internal_only',
  ADD COLUMN IF NOT EXISTS indexability_state text NOT NULL DEFAULT 'public_noindex',
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text;

ALTER TABLE public.collections
  ADD COLUMN IF NOT EXISTS publish_state text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS visibility_output_state text NOT NULL DEFAULT 'internal_only',
  ADD COLUMN IF NOT EXISTS indexability_state text NOT NULL DEFAULT 'public_noindex',
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text;

ALTER TABLE public.countries
  ADD COLUMN IF NOT EXISTS publish_state text NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS visibility_output_state text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS indexability_state text NOT NULL DEFAULT 'public_indexed',
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS cover_image text,
  ADD COLUMN IF NOT EXISTS publish_state text NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS visibility_output_state text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS visibility_state text NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS indexability_state text NOT NULL DEFAULT 'public_indexed',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill category slugs from name
UPDATE public.categories
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL OR length(trim(slug)) = 0;

-- Unique constraint on category slug
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_uniq ON public.categories(slug);

-- updated_at trigger for categories
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Slug guard + redirect triggers on countries & categories ============
DROP TRIGGER IF EXISTS trg_guard_unique_slug ON public.countries;
CREATE TRIGGER trg_guard_unique_slug
BEFORE INSERT OR UPDATE OF slug ON public.countries
FOR EACH ROW EXECUTE FUNCTION public.guard_unique_slug();

DROP TRIGGER IF EXISTS trg_auto_slug_redirect ON public.countries;
CREATE TRIGGER trg_auto_slug_redirect
AFTER UPDATE OF slug ON public.countries
FOR EACH ROW WHEN (OLD.slug IS DISTINCT FROM NEW.slug)
EXECUTE FUNCTION public.auto_create_slug_redirect();

DROP TRIGGER IF EXISTS trg_guard_unique_slug ON public.categories;
CREATE TRIGGER trg_guard_unique_slug
BEFORE INSERT OR UPDATE OF slug ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.guard_unique_slug();

DROP TRIGGER IF EXISTS trg_auto_slug_redirect ON public.categories;
CREATE TRIGGER trg_auto_slug_redirect
AFTER UPDATE OF slug ON public.categories
FOR EACH ROW WHEN (OLD.slug IS DISTINCT FROM NEW.slug)
EXECUTE FUNCTION public.auto_create_slug_redirect();

-- ============ Extend auto_create_slug_redirect to cover countries & categories ============
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
  ELSIF TG_TABLE_NAME = 'countries' THEN
    old_path := '/countries/' || OLD.slug;
    new_path := '/countries/' || NEW.slug;
  ELSIF TG_TABLE_NAME = 'categories' THEN
    old_path := '/category/' || OLD.slug;
    new_path := '/category/' || NEW.slug;
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
