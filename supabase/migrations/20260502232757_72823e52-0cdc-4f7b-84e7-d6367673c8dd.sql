CREATE OR REPLACE FUNCTION public.validate_carousel_activation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_count int;
  coll_with_items int;
BEGIN
  IF NEW.is_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  IF NEW.resolution_mode = 'auto' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO item_count
  FROM public.carousel_items
  WHERE carousel_id = NEW.id;

  IF item_count = 0 THEN
    -- On INSERT (brand-new carousel), silently downgrade to inactive instead of erroring,
    -- so admins can create the row first and link items after.
    IF TG_OP = 'INSERT' THEN
      NEW.is_active := false;
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Cannot activate carousel "%": it has no linked items. Add items first or set resolution mode to auto.', NEW.name
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.resolution_mode = 'collection' THEN
    SELECT COUNT(DISTINCT ci.item_id) INTO coll_with_items
    FROM public.carousel_items ci
    WHERE ci.carousel_id = NEW.id
      AND ci.item_type = 'collection'
      AND EXISTS (
        SELECT 1 FROM public.collection_items coli
        WHERE coli.collection_id = ci.item_id
      );

    IF coll_with_items = 0 THEN
      IF TG_OP = 'INSERT' THEN
        NEW.is_active := false;
        RETURN NEW;
      END IF;
      RAISE EXCEPTION 'Cannot activate carousel "%": none of its linked collections contain any items.', NEW.name
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;