-- ============================================================
-- CAROUSELS + COLLECTIONS architecture
-- - Collections = reusable content groupings
-- - Carousels   = page-display modules
-- Both support: multi-market, multi-category, all-markets, all-categories
-- ============================================================

-- ---------- 1. CAROUSELS ----------
CREATE TABLE IF NOT EXISTS public.carousels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  -- What kind of cards this carousel renders
  content_type TEXT NOT NULL DEFAULT 'product'
    CHECK (content_type IN ('product','itinerary','poi','area','collection','mixed')),
  -- Page placement: home / destination / category / things-to-do / search
  page_location TEXT NOT NULL DEFAULT 'home',
  display_order INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- Empty market/category links = global (all markets/categories)
  -- Resolution mode: how items resolve
  -- 'manual'      → only items explicitly listed in carousel_items
  -- 'collection'  → items come from referenced collection(s)
  -- 'auto'        → items auto-pulled by market+category match on products
  resolution_mode TEXT NOT NULL DEFAULT 'manual'
    CHECK (resolution_mode IN ('manual','collection','auto')),
  max_items INTEGER NOT NULL DEFAULT 10,
  cover_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_carousels_active_page ON public.carousels(is_active, page_location, display_order);

-- Multi-market assignment (no row = global / all markets)
CREATE TABLE IF NOT EXISTS public.carousel_destinations (
  carousel_id UUID NOT NULL REFERENCES public.carousels(id) ON DELETE CASCADE,
  destination_id UUID NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  PRIMARY KEY (carousel_id, destination_id)
);

-- Multi-category assignment (no row = global / all categories)
CREATE TABLE IF NOT EXISTS public.carousel_categories (
  carousel_id UUID NOT NULL REFERENCES public.carousels(id) ON DELETE CASCADE,
  activity_type_id UUID NOT NULL REFERENCES public.activity_types(id) ON DELETE CASCADE,
  PRIMARY KEY (carousel_id, activity_type_id)
);

-- Items inside a carousel (manual mode) — products, itineraries, pois, areas, OR a referenced collection
CREATE TABLE IF NOT EXISTS public.carousel_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carousel_id UUID NOT NULL REFERENCES public.carousels(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('product','itinerary','poi','area','collection')),
  item_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (carousel_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_carousel_items_carousel ON public.carousel_items(carousel_id, position);

-- ---------- 2. COLLECTION → CATEGORIES (multi-category for collections) ----------
CREATE TABLE IF NOT EXISTS public.collection_categories (
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  activity_type_id UUID NOT NULL REFERENCES public.activity_types(id) ON DELETE CASCADE,
  PRIMARY KEY (collection_id, activity_type_id)
);

-- ---------- 3. ACTIVITY_TYPES homepage flag ----------
ALTER TABLE public.activity_types
  ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS home_display_order INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- ---------- 4. RLS ----------
ALTER TABLE public.carousels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousel_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousel_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousel_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_categories ENABLE ROW LEVEL SECURITY;

-- Public read for active carousels & their links (frontend reads these)
CREATE POLICY "carousels_public_read" ON public.carousels FOR SELECT USING (true);
CREATE POLICY "carousel_destinations_public_read" ON public.carousel_destinations FOR SELECT USING (true);
CREATE POLICY "carousel_categories_public_read" ON public.carousel_categories FOR SELECT USING (true);
CREATE POLICY "carousel_items_public_read" ON public.carousel_items FOR SELECT USING (true);
CREATE POLICY "collection_categories_public_read" ON public.collection_categories FOR SELECT USING (true);

-- Admin writes
CREATE POLICY "carousels_admin_write"          ON public.carousels          FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "carousel_destinations_admin"    ON public.carousel_destinations FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "carousel_categories_admin"      ON public.carousel_categories   FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "carousel_items_admin"           ON public.carousel_items        FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "collection_categories_admin"    ON public.collection_categories FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ---------- 5. Updated-at trigger ----------
CREATE TRIGGER trg_carousels_updated_at
  BEFORE UPDATE ON public.carousels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- 6. BACKFILL: convert today's "show_on_home" collections into carousels ----------
-- Each home-active collection becomes a carousel of the same name & content_type,
-- in 'collection' resolution mode pointing back at itself, so existing data survives.
INSERT INTO public.carousels (id, name, slug, content_type, page_location, display_order, is_active, resolution_mode, max_items, cover_image)
SELECT
  c.id,                                    -- reuse the collection's UUID for the carousel
  c.name,
  c.slug,
  CASE c.content_type WHEN 'experience' THEN 'product' ELSE COALESCE(c.content_type,'product') END,
  'home',
  COALESCE(c.home_display_order, 100),
  c.is_active,
  'collection',
  10,
  c.cover_image
FROM public.collections c
WHERE c.show_on_home = true
ON CONFLICT (slug) DO NOTHING;

-- Link each backfilled carousel to its source collection
INSERT INTO public.carousel_items (carousel_id, item_type, item_id, position)
SELECT c.id, 'collection', c.id, 0
FROM public.collections c
WHERE c.show_on_home = true
  AND EXISTS (SELECT 1 FROM public.carousels cr WHERE cr.id = c.id)
ON CONFLICT DO NOTHING;

-- Mirror collection_destinations to carousel_destinations
INSERT INTO public.carousel_destinations (carousel_id, destination_id)
SELECT cd.collection_id, cd.destination_id
FROM public.collection_destinations cd
WHERE EXISTS (SELECT 1 FROM public.carousels cr WHERE cr.id = cd.collection_id)
ON CONFLICT DO NOTHING;

-- For collections with single destination_id (legacy column) and no link rows,
-- copy that into carousel_destinations too.
INSERT INTO public.carousel_destinations (carousel_id, destination_id)
SELECT c.id, c.destination_id
FROM public.collections c
WHERE c.show_on_home = true
  AND c.destination_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.collection_destinations cd WHERE cd.collection_id = c.id)
ON CONFLICT DO NOTHING;

-- ---------- 7. Mark the 5 current pill categories as homepage categories ----------
UPDATE public.activity_types
SET show_on_home = true,
    home_display_order = CASE name
      WHEN 'Nightlife' THEN 1
      WHEN 'Nature'    THEN 2
      WHEN 'Adventure' THEN 3
      WHEN 'Food'      THEN 4
      WHEN 'Safari'    THEN 5
      ELSE home_display_order
    END
WHERE name IN ('Nightlife','Nature','Adventure','Food','Safari');