CREATE OR REPLACE FUNCTION public.prune_carousel_scope(_carousel_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  mode text;
  has_items boolean;
BEGIN
  SELECT resolution_mode INTO mode FROM public.carousels WHERE id = _carousel_id;
  IF mode IS NULL OR mode = 'auto' THEN
    RETURN;
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.carousel_items WHERE carousel_id = _carousel_id) INTO has_items;
  IF NOT has_items THEN
    RETURN; -- empty carousels handled by activation/auto-deactivate triggers
  END IF;

  -- Resolved items = manual carousel items + items inside any linked collection
  WITH resolved AS (
    SELECT ci.item_type, ci.item_id
    FROM public.carousel_items ci
    WHERE ci.carousel_id = _carousel_id AND ci.item_type <> 'collection'
    UNION
    SELECT coli.item_type, coli.item_id
    FROM public.carousel_items ci
    JOIN public.collection_items coli ON coli.collection_id = ci.item_id
    WHERE ci.carousel_id = _carousel_id AND ci.item_type = 'collection'
  ),
  resolved_dests AS (
    SELECT DISTINCT p.destination_id AS dest_id
    FROM resolved r JOIN public.products p ON p.id = r.item_id
    WHERE r.item_type = 'product' AND p.destination_id IS NOT NULL
    UNION
    SELECT DISTINCT pi.destination_id
    FROM resolved r JOIN public.public_itineraries pi ON pi.id = r.item_id
    WHERE r.item_type = 'itinerary' AND pi.destination_id IS NOT NULL
    UNION
    SELECT DISTINCT po.destination_id
    FROM resolved r JOIN public.pois po ON po.id = r.item_id
    WHERE r.item_type = 'poi' AND po.destination_id IS NOT NULL
  )
  DELETE FROM public.carousel_destinations cd
  WHERE cd.carousel_id = _carousel_id
    AND NOT EXISTS (SELECT 1 FROM resolved_dests rd WHERE rd.dest_id = cd.destination_id);

  WITH resolved AS (
    SELECT ci.item_type, ci.item_id
    FROM public.carousel_items ci
    WHERE ci.carousel_id = _carousel_id AND ci.item_type <> 'collection'
    UNION
    SELECT coli.item_type, coli.item_id
    FROM public.carousel_items ci
    JOIN public.collection_items coli ON coli.collection_id = ci.item_id
    WHERE ci.carousel_id = _carousel_id AND ci.item_type = 'collection'
  ),
  resolved_cats AS (
    SELECT DISTINCT p.activity_type_id AS cat_id
    FROM resolved r JOIN public.products p ON p.id = r.item_id
    WHERE r.item_type = 'product' AND p.activity_type_id IS NOT NULL
  )
  DELETE FROM public.carousel_categories cc
  WHERE cc.carousel_id = _carousel_id
    AND NOT EXISTS (SELECT 1 FROM resolved_cats rc WHERE rc.cat_id = cc.activity_type_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_prune_carousel_scope_on_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.prune_carousel_scope(COALESCE(NEW.carousel_id, OLD.carousel_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_prune_scope_on_carousel_items ON public.carousel_items;
CREATE TRIGGER trg_prune_scope_on_carousel_items
AFTER INSERT OR UPDATE OR DELETE ON public.carousel_items
FOR EACH ROW EXECUTE FUNCTION public.trg_prune_carousel_scope_on_items();

CREATE OR REPLACE FUNCTION public.trg_prune_carousel_scope_on_collection_items()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cid uuid;
BEGIN
  FOR cid IN
    SELECT DISTINCT ci.carousel_id
    FROM public.carousel_items ci
    WHERE ci.item_type = 'collection'
      AND ci.item_id = COALESCE(NEW.collection_id, OLD.collection_id)
  LOOP
    PERFORM public.prune_carousel_scope(cid);
  END LOOP;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_prune_scope_on_collection_items ON public.collection_items;
CREATE TRIGGER trg_prune_scope_on_collection_items
AFTER INSERT OR UPDATE OR DELETE ON public.collection_items
FOR EACH ROW EXECUTE FUNCTION public.trg_prune_carousel_scope_on_collection_items();

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.carousels WHERE resolution_mode <> 'auto' LOOP
    PERFORM public.prune_carousel_scope(r.id);
  END LOOP;
END $$;

UPDATE public.carousels c
SET is_active = false
WHERE c.is_active = true
  AND c.resolution_mode <> 'auto'
  AND NOT EXISTS (SELECT 1 FROM public.carousel_items ci WHERE ci.carousel_id = c.id);