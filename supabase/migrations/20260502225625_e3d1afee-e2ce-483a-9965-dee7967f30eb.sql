-- Validation function for carousel activation
CREATE OR REPLACE FUNCTION public.validate_carousel_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_count int;
  coll_with_items int;
BEGIN
  -- Only validate when activating
  IF NEW.is_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  -- Auto mode resolves at runtime; nothing to validate here
  IF NEW.resolution_mode = 'auto' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO item_count
  FROM public.carousel_items
  WHERE carousel_id = NEW.id;

  IF item_count = 0 THEN
    RAISE EXCEPTION 'Cannot activate carousel "%": it has no linked items. Add items first or set resolution mode to auto.', NEW.name
      USING ERRCODE = 'check_violation';
  END IF;

  -- For collection mode, ensure at least one linked collection actually contains items
  IF NEW.resolution_mode = 'collection' THEN
    SELECT COUNT(DISTINCT ci.item_id) INTO coll_with_items
    FROM public.carousel_items ci
    WHERE ci.carousel_id = NEW.id
      AND ci.item_type = 'collection'
      AND EXISTS (
        SELECT 1 FROM public.collection_items coli
        WHERE coli.collection_id::text = ci.item_id
      );

    IF coll_with_items = 0 THEN
      RAISE EXCEPTION 'Cannot activate carousel "%": none of its linked collections contain any items.', NEW.name
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_carousel_activation ON public.carousels;
CREATE TRIGGER trg_validate_carousel_activation
BEFORE INSERT OR UPDATE OF is_active, resolution_mode ON public.carousels
FOR EACH ROW
EXECUTE FUNCTION public.validate_carousel_activation();

-- Auto-deactivate when last item removed
CREATE OR REPLACE FUNCTION public.auto_deactivate_empty_carousel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining int;
  mode text;
BEGIN
  SELECT resolution_mode INTO mode FROM public.carousels WHERE id = OLD.carousel_id;
  IF mode = 'auto' THEN
    RETURN OLD;
  END IF;

  SELECT COUNT(*) INTO remaining
  FROM public.carousel_items
  WHERE carousel_id = OLD.carousel_id;

  IF remaining = 0 THEN
    UPDATE public.carousels
    SET is_active = false
    WHERE id = OLD.carousel_id AND is_active = true;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_deactivate_empty_carousel ON public.carousel_items;
CREATE TRIGGER trg_auto_deactivate_empty_carousel
AFTER DELETE ON public.carousel_items
FOR EACH ROW
EXECUTE FUNCTION public.auto_deactivate_empty_carousel();