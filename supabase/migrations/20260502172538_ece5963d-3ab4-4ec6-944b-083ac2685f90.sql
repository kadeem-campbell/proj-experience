
-- ============================================================
-- STAGE 1: Entity-agnostic itinerary model + tightened RLS
-- ============================================================

-- 1. itinerary_items: add entity-agnostic columns
ALTER TABLE public.itinerary_items
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id uuid,
  ADD COLUMN IF NOT EXISTS custom_title text,
  ADD COLUMN IF NOT EXISTS custom_description text;

-- Backfill entity_type/entity_id from existing product_id/poi_id
UPDATE public.itinerary_items
SET entity_type = 'product', entity_id = product_id
WHERE entity_type IS NULL AND product_id IS NOT NULL;

UPDATE public.itinerary_items
SET entity_type = 'poi', entity_id = poi_id
WHERE entity_type IS NULL AND poi_id IS NOT NULL;

-- Constraint: entity_type must be one of the live values
ALTER TABLE public.itinerary_items
  DROP CONSTRAINT IF EXISTS itinerary_items_entity_type_check;
ALTER TABLE public.itinerary_items
  ADD CONSTRAINT itinerary_items_entity_type_check
  CHECK (entity_type IN ('product', 'poi', 'custom'));

-- Constraint: non-custom items must have entity_id; custom items must have a title
ALTER TABLE public.itinerary_items
  DROP CONSTRAINT IF EXISTS itinerary_items_entity_payload_check;
ALTER TABLE public.itinerary_items
  ADD CONSTRAINT itinerary_items_entity_payload_check
  CHECK (
    (entity_type IN ('product','poi') AND entity_id IS NOT NULL)
    OR (entity_type = 'custom' AND custom_title IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_itinerary_items_entity ON public.itinerary_items(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_items_day ON public.itinerary_items(day_id);

-- 2. itineraries: publish-state tracking
ALTER TABLE public.itineraries
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_published_snapshot_at timestamptz;

-- 3. public_itinerary_items: snapshot table for published itineraries
CREATE TABLE IF NOT EXISTS public.public_itinerary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_itinerary_id uuid NOT NULL REFERENCES public.public_itineraries(id) ON DELETE CASCADE,
  day_number integer NOT NULL DEFAULT 1,
  display_order integer NOT NULL DEFAULT 0,
  entity_type text NOT NULL,
  entity_id uuid,
  custom_title text,
  custom_description text,
  -- denormalized snapshot fields so public pages don't need joins
  title text,
  description text,
  image_url text,
  location text,
  category text,
  price text,
  notes text,
  time_slot text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT public_itinerary_items_entity_type_check
    CHECK (entity_type IN ('product', 'poi', 'custom')),
  CONSTRAINT public_itinerary_items_entity_payload_check
    CHECK (
      (entity_type IN ('product','poi') AND entity_id IS NOT NULL)
      OR (entity_type = 'custom' AND custom_title IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_pub_itin_items_itinerary ON public.public_itinerary_items(public_itinerary_id, day_number, display_order);
CREATE INDEX IF NOT EXISTS idx_pub_itin_items_entity ON public.public_itinerary_items(entity_type, entity_id);

ALTER TABLE public.public_itinerary_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS: itinerary_items — owner/collaborator-scoped
-- ============================================================

-- Helper: check if a user owns or collaborates on the itinerary that contains a day
CREATE OR REPLACE FUNCTION public.can_edit_itinerary_day(_day_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.itinerary_days d
    JOIN public.itineraries i ON i.id = d.itinerary_id
    WHERE d.id = _day_id
      AND (i.user_id = _user_id OR public.is_itinerary_collaborator(i.id, _user_id))
  );
$$;

-- Drop prior open policies on itinerary_items
DROP POLICY IF EXISTS "Auth users manage itinerary_items" ON public.itinerary_items;
DROP POLICY IF EXISTS "Anyone can view itinerary_items" ON public.itinerary_items;

CREATE POLICY "Owners view itinerary_items"
  ON public.itinerary_items FOR SELECT
  USING (public.can_edit_itinerary_day(day_id, auth.uid()));

CREATE POLICY "Owners insert itinerary_items"
  ON public.itinerary_items FOR INSERT
  WITH CHECK (public.can_edit_itinerary_day(day_id, auth.uid()));

CREATE POLICY "Owners update itinerary_items"
  ON public.itinerary_items FOR UPDATE
  USING (public.can_edit_itinerary_day(day_id, auth.uid()))
  WITH CHECK (public.can_edit_itinerary_day(day_id, auth.uid()));

CREATE POLICY "Owners delete itinerary_items"
  ON public.itinerary_items FOR DELETE
  USING (public.can_edit_itinerary_day(day_id, auth.uid()));

CREATE POLICY "Admins manage itinerary_items"
  ON public.itinerary_items FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- RLS: itinerary_days — owner/collaborator-scoped
-- ============================================================
DROP POLICY IF EXISTS "Auth users manage itinerary_days" ON public.itinerary_days;
DROP POLICY IF EXISTS "Anyone can view itinerary_days" ON public.itinerary_days;

CREATE POLICY "Owners view itinerary_days"
  ON public.itinerary_days FOR SELECT
  USING (
    auth.uid() IS NULL  -- allow anon read of public itinerary days handled elsewhere
    OR EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id
        AND (i.user_id = auth.uid() OR public.is_itinerary_collaborator(i.id, auth.uid()) OR i.is_public = true)
    )
  );

CREATE POLICY "Owners insert itinerary_days"
  ON public.itinerary_days FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = itinerary_id
        AND (i.user_id = auth.uid() OR public.is_itinerary_collaborator(i.id, auth.uid()))
    )
  );

CREATE POLICY "Owners update itinerary_days"
  ON public.itinerary_days FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.itineraries i
            WHERE i.id = itinerary_id
              AND (i.user_id = auth.uid() OR public.is_itinerary_collaborator(i.id, auth.uid())))
  );

CREATE POLICY "Owners delete itinerary_days"
  ON public.itinerary_days FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.itineraries i
            WHERE i.id = itinerary_id
              AND (i.user_id = auth.uid() OR public.is_itinerary_collaborator(i.id, auth.uid())))
  );

CREATE POLICY "Admins manage itinerary_days"
  ON public.itinerary_days FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- RLS: public_itineraries — owner/admin scoped writes
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can delete public_itineraries" ON public.public_itineraries;
DROP POLICY IF EXISTS "Authenticated users can insert public_itineraries" ON public.public_itineraries;
DROP POLICY IF EXISTS "Authenticated users can update public_itineraries" ON public.public_itineraries;

CREATE POLICY "Creators insert their public_itineraries"
  ON public.public_itineraries FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators update their public_itineraries"
  ON public.public_itineraries FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators delete their public_itineraries"
  ON public.public_itineraries FOR DELETE
  USING (auth.uid() = creator_id);

-- ============================================================
-- RLS: public_itinerary_items
-- ============================================================
CREATE POLICY "Anyone view public_itinerary_items"
  ON public.public_itinerary_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.public_itineraries pi
      WHERE pi.id = public_itinerary_id AND pi.is_active = true
    )
  );

CREATE POLICY "Creators insert public_itinerary_items"
  ON public.public_itinerary_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.public_itineraries pi
      WHERE pi.id = public_itinerary_id AND pi.creator_id = auth.uid()
    )
  );

CREATE POLICY "Creators update public_itinerary_items"
  ON public.public_itinerary_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.public_itineraries pi
      WHERE pi.id = public_itinerary_id AND pi.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.public_itineraries pi
      WHERE pi.id = public_itinerary_id AND pi.creator_id = auth.uid()
    )
  );

CREATE POLICY "Creators delete public_itinerary_items"
  ON public.public_itinerary_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.public_itineraries pi
      WHERE pi.id = public_itinerary_id AND pi.creator_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage public_itinerary_items"
  ON public.public_itinerary_items FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- RLS: itinerary_experiences — lock down (legacy, read-only archive)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can delete itinerary_experiences" ON public.itinerary_experiences;
DROP POLICY IF EXISTS "Authenticated users can insert itinerary_experiences" ON public.itinerary_experiences;
DROP POLICY IF EXISTS "Authenticated users can update itinerary_experiences" ON public.itinerary_experiences;

-- Only admins may write to legacy table now
CREATE POLICY "Admins write itinerary_experiences"
  ON public.itinerary_experiences FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
