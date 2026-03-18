
-- Remaining tables that weren't created yet (trip_collaborations already exists)

-- Planner sessions
CREATE TABLE IF NOT EXISTS public.planner_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid,
  current_destination_id uuid REFERENCES public.destinations(id),
  current_area_id uuid REFERENCES public.areas(id),
  context_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.planner_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "planner_sessions_pub_ins" ON public.planner_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "planner_sessions_pub_sel" ON public.planner_sessions FOR SELECT USING (true);

-- Itinerary lineage
CREATE TABLE IF NOT EXISTS public.itinerary_lineage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_itinerary_id uuid NOT NULL,
  parent_itinerary_id uuid NOT NULL,
  relationship_type text NOT NULL DEFAULT 'copy',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.itinerary_lineage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lineage_pub_read" ON public.itinerary_lineage FOR SELECT USING (true);
CREATE POLICY "lineage_auth_ins" ON public.itinerary_lineage FOR INSERT TO authenticated WITH CHECK (true);

-- Compare sets
CREATE TABLE IF NOT EXISTS public.compare_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  entity_type text NOT NULL DEFAULT 'product',
  entity_ids uuid[] NOT NULL DEFAULT '{}',
  context text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.compare_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compare_pub_ins" ON public.compare_sets FOR INSERT WITH CHECK (true);
CREATE POLICY "compare_pub_sel" ON public.compare_sets FOR SELECT USING (true);

-- Recommendation candidate sets
CREATE TABLE IF NOT EXISTS public.recommendation_candidate_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context_json jsonb DEFAULT '{}'::jsonb,
  generated_at timestamptz DEFAULT now()
);
ALTER TABLE public.recommendation_candidate_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recsets_pub_read" ON public.recommendation_candidate_sets FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.recommendation_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id uuid REFERENCES public.recommendation_candidate_sets(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  rank integer NOT NULL DEFAULT 0,
  score numeric NOT NULL DEFAULT 0,
  reason_json jsonb,
  recommendation_type text DEFAULT 'similar',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.recommendation_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reccands_pub_read" ON public.recommendation_candidates FOR SELECT USING (true);

-- Preference dimensions
CREATE TABLE IF NOT EXISTS public.preference_dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value_type text NOT NULL DEFAULT 'text',
  allowed_values_json jsonb,
  default_weight numeric DEFAULT 1.0,
  description text
);
ALTER TABLE public.preference_dimensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prefdim_pub_read" ON public.preference_dimensions FOR SELECT USING (true);

-- User preference values
CREATE TABLE IF NOT EXISTS public.user_preference_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dimension_id uuid REFERENCES public.preference_dimensions(id),
  value_bool boolean,
  value_number numeric,
  value_text text,
  value_enum text,
  value_json jsonb,
  confidence_score numeric DEFAULT 0.5,
  source_type text DEFAULT 'explicit',
  evidence_json jsonb,
  valid_from timestamptz DEFAULT now(),
  valid_to timestamptz,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_preference_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "uprefs_own_read" ON public.user_preference_values FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "uprefs_own_write" ON public.user_preference_values FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- User type definitions
CREATE TABLE IF NOT EXISTS public.user_type_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_key text UNIQUE NOT NULL,
  label text NOT NULL,
  description text,
  icon text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_type_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "utd_pub_read" ON public.user_type_definitions FOR SELECT USING (true);

-- User states
CREATE TABLE IF NOT EXISTS public.user_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'signed_in',
  state_confidence numeric DEFAULT 0.5,
  computed_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ustates_own" ON public.user_states FOR SELECT TO authenticated USING (user_id = auth.uid());

-- User type tags
CREATE TABLE IF NOT EXISTS public.user_type_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type_key text NOT NULL,
  confidence_score numeric DEFAULT 0.5,
  source_type text DEFAULT 'explicit',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_type_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "utags_own" ON public.user_type_tags FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Search documents
CREATE TABLE IF NOT EXISTS public.search_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  title text,
  aliases_text text,
  destination_id uuid,
  area_id uuid,
  search_vector tsvector,
  popularity_score numeric DEFAULT 0,
  readiness_score numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_search_docs_vector ON public.search_documents USING GIN(search_vector);
ALTER TABLE public.search_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "searchdocs_pub" ON public.search_documents FOR SELECT USING (true);

-- System constants
CREATE TABLE IF NOT EXISTS public.system_constants (
  key text PRIMARY KEY,
  value_json jsonb NOT NULL,
  updated_by uuid,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.system_constants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sysconst_pub" ON public.system_constants FOR SELECT USING (true);

-- Public surfaces
CREATE TABLE IF NOT EXISTS public.public_surfaces (
  surface_key text PRIMARY KEY,
  route_family text,
  entity_type text,
  is_indexable_candidate boolean DEFAULT true,
  requires_ssr boolean DEFAULT false,
  requires_schema_jsonld boolean DEFAULT true,
  min_readiness_score_to_index integer DEFAULT 65,
  min_readiness_score_to_publish integer DEFAULT 35,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.public_surfaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pubsurf_pub" ON public.public_surfaces FOR SELECT USING (true);

-- Principles
CREATE TABLE IF NOT EXISTS public.principles (
  principle_key text PRIMARY KEY,
  description text,
  enforcement_type text DEFAULT 'validator',
  enforcement_payload_json jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.principles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "princ_pub" ON public.principles FOR SELECT USING (true);

-- Route families
CREATE TABLE IF NOT EXISTS public.route_families (
  family_key text PRIMARY KEY,
  pattern_template text NOT NULL,
  entity_type text,
  is_public boolean DEFAULT true,
  is_indexable_candidate boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.route_families ENABLE ROW LEVEL SECURITY;
CREATE POLICY "routefam_pub" ON public.route_families FOR SELECT USING (true);

-- Stays (future stub)
CREATE TABLE IF NOT EXISTS public.stays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  destination_id uuid REFERENCES public.destinations(id),
  area_id uuid REFERENCES public.areas(id),
  stay_type text DEFAULT 'hotel',
  latitude numeric, longitude numeric,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.stays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stays_pub" ON public.stays FOR SELECT USING (is_active = true);

-- Restaurants (future stub)
CREATE TABLE IF NOT EXISTS public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  destination_id uuid REFERENCES public.destinations(id),
  area_id uuid REFERENCES public.areas(id),
  cuisine_type text,
  latitude numeric, longitude numeric,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rest_pub" ON public.restaurants FOR SELECT USING (is_active = true);

-- Transport legs (future stub)
CREATE TABLE IF NOT EXISTS public.transport_legs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_name text, destination_name text,
  mode text DEFAULT 'taxi',
  duration_minutes integer,
  cost_estimate numeric,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.transport_legs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transport_pub" ON public.transport_legs FOR SELECT USING (is_active = true);

-- Session profiles
CREATE TABLE IF NOT EXISTS public.session_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid,
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  inferred_destination_id uuid,
  inferred_prefs_snapshot jsonb,
  page_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.session_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessprof_pub_ins" ON public.session_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "sessprof_pub_sel" ON public.session_profiles FOR SELECT USING (true);

-- Partner exports
CREATE TABLE IF NOT EXISTS public.partner_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_key text NOT NULL,
  export_type text DEFAULT 'full_feed',
  status text DEFAULT 'pending',
  started_at timestamptz,
  finished_at timestamptz,
  record_count integer DEFAULT 0,
  error_json jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.partner_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pexp_pub" ON public.partner_exports FOR SELECT USING (true);

-- Geo shapes
CREATE TABLE IF NOT EXISTS public.geo_shapes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  shape_json jsonb,
  source_type text DEFAULT 'manual',
  confidence_score numeric DEFAULT 0.5,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.geo_shapes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "geoshp_pub" ON public.geo_shapes FOR SELECT USING (true);
