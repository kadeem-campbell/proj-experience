
-- 1. Create page_route_registry table
CREATE TABLE IF NOT EXISTS public.page_route_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type text NOT NULL,
  entity_id uuid NOT NULL,
  entity_type text NOT NULL,
  resolved_path text NOT NULL,
  canonical_url text NOT NULL,
  route_priority integer NOT NULL DEFAULT 50,
  indexability_state text NOT NULL DEFAULT 'draft_unpublished',
  status text NOT NULL DEFAULT 'active',
  generated_from_rule text,
  conflict_group_key text,
  supersedes_route_id uuid,
  redirect_target_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

-- 2. Add indexability_state to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS indexability_state text DEFAULT 'draft_unpublished';

-- 3. Add indexability_state to destinations
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS indexability_state text DEFAULT 'public_indexed';

-- 4. Add indexability_state to hosts
ALTER TABLE public.hosts ADD COLUMN IF NOT EXISTS indexability_state text DEFAULT 'public_indexed';

-- 5. Add indexability_state to public_itineraries
ALTER TABLE public.public_itineraries ADD COLUMN IF NOT EXISTS indexability_state text DEFAULT 'public_indexed';

-- 6. Add indexability_state to collections
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS indexability_state text DEFAULT 'public_noindex';

-- 7. Add indexability_state to areas
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS indexability_state text DEFAULT 'public_indexed';

-- 8. Add indexability_state to pois
ALTER TABLE public.pois ADD COLUMN IF NOT EXISTS indexability_state text DEFAULT 'public_noindex';

-- 9. Expand entity_aliases with extra columns
ALTER TABLE public.entity_aliases ADD COLUMN IF NOT EXISTS alias_normalized text;
ALTER TABLE public.entity_aliases ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
ALTER TABLE public.entity_aliases ADD COLUMN IF NOT EXISTS confidence numeric DEFAULT 1.0;
ALTER TABLE public.entity_aliases ADD COLUMN IF NOT EXISTS is_searchable boolean DEFAULT true;

-- 10. Expand entity_slug_history with is_current and redirect_to_slug
ALTER TABLE public.entity_slug_history ADD COLUMN IF NOT EXISTS is_current boolean DEFAULT false;
ALTER TABLE public.entity_slug_history ADD COLUMN IF NOT EXISTS redirect_to_slug text;
ALTER TABLE public.entity_slug_history ADD COLUMN IF NOT EXISTS reason text DEFAULT 'rename';

-- 11. RLS for page_route_registry
ALTER TABLE public.page_route_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view page_route_registry" ON public.page_route_registry
  FOR SELECT TO public USING (true);

CREATE POLICY "Auth users manage page_route_registry" ON public.page_route_registry
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 12. Index for fast route lookups
CREATE INDEX IF NOT EXISTS idx_page_route_registry_path ON public.page_route_registry(resolved_path);
CREATE INDEX IF NOT EXISTS idx_page_route_registry_entity ON public.page_route_registry(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_page_route_registry_conflict ON public.page_route_registry(conflict_group_key);
