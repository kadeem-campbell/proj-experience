
-- =============================================
-- SWAM Production Build: Full Schema Extension
-- =============================================

-- 1. system_constants
CREATE TABLE IF NOT EXISTS public.system_constants (
  key text PRIMARY KEY,
  value_json jsonb NOT NULL DEFAULT '{}',
  updated_by uuid,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.system_constants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view system_constants" ON public.system_constants FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage system_constants" ON public.system_constants FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.system_constants (key, value_json) VALUES
  ('public_term_product', '"things to do"'),
  ('internal_term_product', '"product"'),
  ('primary_vertical', '"itinerary"'),
  ('platform_name', '"SWAM"'),
  ('base_url', '"https://swam.app"')
ON CONFLICT (key) DO NOTHING;

-- 2. public_surfaces
CREATE TABLE IF NOT EXISTS public.public_surfaces (
  surface_key text PRIMARY KEY,
  route_pattern text NOT NULL,
  entity_type text NOT NULL,
  is_indexable_candidate boolean DEFAULT true,
  requires_ssr boolean DEFAULT false,
  requires_schema_jsonld boolean DEFAULT true,
  min_readiness_score_to_index integer DEFAULT 70,
  min_readiness_score_to_publish integer DEFAULT 40,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.public_surfaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public_surfaces" ON public.public_surfaces FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage public_surfaces" ON public.public_surfaces FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.public_surfaces (surface_key, route_pattern, entity_type, is_indexable_candidate, requires_ssr, requires_schema_jsonld) VALUES
  ('homepage', '/', 'page', true, true, true),
  ('destination', '/:destination', 'destination', true, true, true),
  ('area', '/:destination/:area', 'area', true, true, true),
  ('things_to_do_hub', '/things-to-do/:destination', 'destination', true, true, true),
  ('product_page', '/things-to-do/:destination/:slug', 'product', true, true, true),
  ('collection', '/collections/:slug', 'collection', true, true, true),
  ('itinerary', '/itineraries/:slug', 'itinerary', true, true, true),
  ('host', '/hosts/:slug', 'host', true, true, true),
  ('traveller', '/travellers/:slug', 'traveller', false, false, false),
  ('map', '/:destination/map', 'map', false, false, false)
ON CONFLICT (surface_key) DO NOTHING;

-- 3. principles
CREATE TABLE IF NOT EXISTS public.principles (
  principle_key text PRIMARY KEY,
  description text NOT NULL,
  enforcement_type text NOT NULL DEFAULT 'validator',
  enforcement_payload_json jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.principles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view principles" ON public.principles FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage principles" ON public.principles FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.principles (principle_key, description, enforcement_type) VALUES
  ('itinerary_primary', 'Itinerary is the primary product object', 'route_gate'),
  ('products_internal', 'Products exist internally; public page is separate state', 'validator'),
  ('canonical_depends_readiness', 'Canonical and sitemap eligibility depend on readiness + validation', 'scoring_gate'),
  ('no_robots_canonical', 'Do not use robots.txt for canonicalisation', 'validator'),
  ('noindex_requires_crawlable', 'noindex must not be paired with robots-disallow', 'validator'),
  ('host_not_text', 'Host is a real reusable object, never plain text', 'db_constraint'),
  ('slug_generated_once', 'Slug is generated once, validated once, and stored', 'db_constraint'),
  ('no_json_taxonomy', 'No JSON arrays for many-to-many taxonomy links', 'validator')
ON CONFLICT (principle_key) DO NOTHING;

-- 4. geo_launch_profiles
CREATE TABLE IF NOT EXISTS public.geo_launch_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_key text UNIQUE NOT NULL,
  min_product_readiness_to_publish integer DEFAULT 40,
  min_product_readiness_to_index integer DEFAULT 70,
  min_itinerary_readiness_to_publish integer DEFAULT 30,
  min_host_readiness_to_publish integer DEFAULT 30,
  default_output_policy_json jsonb DEFAULT '{"products_default":"recommendation_only"}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.geo_launch_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view geo_launch_profiles" ON public.geo_launch_profiles FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage geo_launch_profiles" ON public.geo_launch_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.geo_launch_profiles (profile_key, min_product_readiness_to_publish, min_product_readiness_to_index) VALUES
  ('tier_a', 40, 60),
  ('tier_b', 50, 70),
  ('tier_c', 60, 80)
ON CONFLICT (profile_key) DO NOTHING;

-- Add launch columns to destinations and areas
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS launch_profile_id uuid REFERENCES public.geo_launch_profiles(id);
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS launch_status text DEFAULT 'planned';
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS is_marketplace_enabled boolean DEFAULT false;
ALTER TABLE public.destinations ADD COLUMN IF NOT EXISTS is_partner_feed_enabled boolean DEFAULT false;

ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS launch_profile_id uuid REFERENCES public.geo_launch_profiles(id);
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS launch_status text DEFAULT 'planned';

-- 5. route_families
CREATE TABLE IF NOT EXISTS public.route_families (
  family_key text PRIMARY KEY,
  pattern_template text NOT NULL,
  entity_type text NOT NULL,
  is_public boolean DEFAULT true,
  is_indexable_candidate boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.route_families ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view route_families" ON public.route_families FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage route_families" ON public.route_families FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.route_families (family_key, pattern_template, entity_type) VALUES
  ('destination', '/:slug', 'destination'),
  ('area', '/:destination/:slug', 'area'),
  ('product', '/things-to-do/:destination/:slug', 'product'),
  ('itinerary', '/itineraries/:slug', 'itinerary'),
  ('collection', '/collections/:slug', 'collection'),
  ('host', '/hosts/:slug', 'host'),
  ('things_to_do_hub', '/things-to-do/:destination', 'destination'),
  ('map_hub', '/:destination/map', 'destination'),
  ('traveller', '/travellers/:slug', 'traveller')
ON CONFLICT (family_key) DO NOTHING;

-- 6. visibility_output_state on products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS visibility_output_state text DEFAULT 'internal_only';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS publish_state text DEFAULT 'draft';

-- 7. readiness_scores (comprehensive)
CREATE TABLE IF NOT EXISTS public.readiness_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  content_score integer DEFAULT 0,
  media_score integer DEFAULT 0,
  taxonomy_score integer DEFAULT 0,
  route_score integer DEFAULT 0,
  canonical_score integer DEFAULT 0,
  commerce_score integer DEFAULT 0,
  feed_score integer DEFAULT 0,
  graph_score integer DEFAULT 0,
  geo_score integer DEFAULT 0,
  qa_score integer DEFAULT 0,
  analytics_score integer DEFAULT 0,
  overall_score integer DEFAULT 0,
  is_publishable boolean DEFAULT false,
  recommended_state text DEFAULT 'draft_unpublished',
  blockers_json jsonb DEFAULT '[]',
  computed_at timestamptz DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);
ALTER TABLE public.readiness_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view readiness_scores" ON public.readiness_scores FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage readiness_scores" ON public.readiness_scores FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. validation_results (comprehensive)
CREATE TABLE IF NOT EXISTS public.validation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  validator_type text NOT NULL,
  severity text NOT NULL DEFAULT 'warning',
  blocking_flag boolean DEFAULT false,
  message text NOT NULL,
  suggested_fix text,
  dimension text,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.validation_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view validation_results" ON public.validation_results FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage validation_results" ON public.validation_results FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. entity_scores (generic scoring)
CREATE TABLE IF NOT EXISTS public.entity_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  score_type text NOT NULL,
  score_value numeric NOT NULL DEFAULT 0,
  scoring_version integer DEFAULT 1,
  explanation_json jsonb DEFAULT '{}',
  computed_at timestamptz DEFAULT now(),
  UNIQUE(entity_type, entity_id, score_type)
);
ALTER TABLE public.entity_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view entity_scores" ON public.entity_scores FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage entity_scores" ON public.entity_scores FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 10. product_formats link table
CREATE TABLE IF NOT EXISTS public.product_formats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  format_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, format_type)
);
ALTER TABLE public.product_formats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view product_formats" ON public.product_formats FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage product_formats" ON public.product_formats FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 11. product_vibe_scores
CREATE TABLE IF NOT EXISTS public.product_vibe_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  vibe_dimension text NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  confidence numeric DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, vibe_dimension)
);
ALTER TABLE public.product_vibe_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view product_vibe_scores" ON public.product_vibe_scores FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage product_vibe_scores" ON public.product_vibe_scores FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 12. custom_itinerary_items
CREATE TABLE IF NOT EXISTS public.custom_itinerary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid NOT NULL,
  title text NOT NULL,
  notes text,
  latitude numeric,
  longitude numeric,
  external_link text,
  created_by_user_id uuid,
  day_number integer DEFAULT 1,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.custom_itinerary_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view custom_itinerary_items" ON public.custom_itinerary_items FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage custom_itinerary_items" ON public.custom_itinerary_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 13. entity_suggestions
CREATE TABLE IF NOT EXISTS public.entity_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  title text NOT NULL,
  notes text,
  detected_destination_id uuid,
  detected_area_id uuid,
  latitude numeric,
  longitude numeric,
  evidence_links jsonb DEFAULT '[]',
  review_status text DEFAULT 'pending',
  converted_entity_type text,
  converted_entity_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.entity_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view entity_suggestions" ON public.entity_suggestions FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage entity_suggestions" ON public.entity_suggestions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 14. itinerary_lineage
CREATE TABLE IF NOT EXISTS public.itinerary_lineage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_itinerary_id uuid NOT NULL,
  parent_itinerary_id uuid NOT NULL,
  relationship_type text NOT NULL DEFAULT 'copy',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.itinerary_lineage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view itinerary_lineage" ON public.itinerary_lineage FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage itinerary_lineage" ON public.itinerary_lineage FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 15. recommendation_candidate_sets
CREATE TABLE IF NOT EXISTS public.recommendation_candidate_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  context_json jsonb NOT NULL DEFAULT '{}',
  set_type text NOT NULL DEFAULT 'pairing',
  generated_at timestamptz DEFAULT now()
);
ALTER TABLE public.recommendation_candidate_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view recommendation_sets" ON public.recommendation_candidate_sets FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage recommendation_sets" ON public.recommendation_candidate_sets FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 16. recommendation_candidates
CREATE TABLE IF NOT EXISTS public.recommendation_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id uuid NOT NULL REFERENCES public.recommendation_candidate_sets(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  rank integer DEFAULT 0,
  score numeric DEFAULT 0,
  reason_json jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.recommendation_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view recommendation_candidates" ON public.recommendation_candidates FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage recommendation_candidates" ON public.recommendation_candidates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 17. demand_keywords
CREATE TABLE IF NOT EXISTS public.demand_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  destination_id uuid,
  area_id uuid,
  activity_type_id uuid,
  monthly_volume integer DEFAULT 0,
  seasonality_json jsonb DEFAULT '[]',
  source_type text DEFAULT 'imported',
  imported_at timestamptz DEFAULT now()
);
ALTER TABLE public.demand_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage demand_keywords" ON public.demand_keywords FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 18. partner_exports
CREATE TABLE IF NOT EXISTS public.partner_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_key text NOT NULL,
  export_type text NOT NULL DEFAULT 'full_feed',
  status text DEFAULT 'pending',
  record_count integer DEFAULT 0,
  error_json jsonb DEFAULT '[]',
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.partner_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage partner_exports" ON public.partner_exports FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 19. partner_export_rows
CREATE TABLE IF NOT EXISTS public.partner_export_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  export_id uuid NOT NULL REFERENCES public.partner_exports(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  payload_json jsonb NOT NULL DEFAULT '{}',
  validation_errors_json jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.partner_export_rows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage partner_export_rows" ON public.partner_export_rows FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 20. bulk_action_jobs
CREATE TABLE IF NOT EXISTS public.bulk_action_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  target_entity_type text NOT NULL,
  filter_json jsonb DEFAULT '{}',
  action_type text NOT NULL,
  proposed_changes_json jsonb DEFAULT '{}',
  dry_run_flag boolean DEFAULT true,
  status text DEFAULT 'pending',
  result_json jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.bulk_action_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage bulk_action_jobs" ON public.bulk_action_jobs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 21. ingestion_jobs
CREATE TABLE IF NOT EXISTS public.ingestion_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL DEFAULT 'csv',
  source_name text,
  target_entity_type text NOT NULL,
  status text DEFAULT 'staged',
  total_rows integer DEFAULT 0,
  processed_rows integer DEFAULT 0,
  error_rows integer DEFAULT 0,
  error_log jsonb DEFAULT '[]',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  committed_at timestamptz
);
ALTER TABLE public.ingestion_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage ingestion_jobs" ON public.ingestion_jobs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 22. ingestion_rows
CREATE TABLE IF NOT EXISTS public.ingestion_rows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.ingestion_jobs(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  raw_data_json jsonb NOT NULL,
  normalised_row_json jsonb,
  validation_errors jsonb DEFAULT '[]',
  status text DEFAULT 'pending',
  target_entity_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ingestion_rows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage ingestion_rows" ON public.ingestion_rows FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 23. search_documents
CREATE TABLE IF NOT EXISTS public.search_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  title text NOT NULL,
  aliases_text text,
  destination_id uuid,
  area_id uuid,
  search_vector tsvector,
  popularity_score numeric DEFAULT 0,
  readiness_score numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_search_documents_vector ON public.search_documents USING GIN (search_vector);
ALTER TABLE public.search_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view search_documents" ON public.search_documents FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage search_documents" ON public.search_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 24. search_queries
CREATE TABLE IF NOT EXISTS public.search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  user_id uuid,
  raw_query text NOT NULL,
  normalised_query text,
  detected_location_json jsonb,
  detected_dimensions_json jsonb,
  result_count integer DEFAULT 0,
  clicked_entity_type text,
  clicked_entity_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage search_queries" ON public.search_queries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 25. search_term_metrics
CREATE TABLE IF NOT EXISTS public.search_term_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  day date NOT NULL,
  query_count integer DEFAULT 0,
  zero_result_count integer DEFAULT 0,
  save_rate numeric DEFAULT 0,
  itinerary_add_rate numeric DEFAULT 0,
  trend_score numeric DEFAULT 0,
  UNIQUE(term, day)
);
ALTER TABLE public.search_term_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage search_term_metrics" ON public.search_term_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 26. planner_sessions
CREATE TABLE IF NOT EXISTS public.planner_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid,
  current_destination_id uuid,
  current_area_id uuid,
  context_json jsonb DEFAULT '{}',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.planner_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view planner_sessions" ON public.planner_sessions FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage planner_sessions" ON public.planner_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 27. session_profiles
CREATE TABLE IF NOT EXISTS public.session_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  user_id uuid,
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  inferred_destination_interest uuid,
  inferred_prefs_snapshot jsonb DEFAULT '{}',
  page_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.session_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage session_profiles" ON public.session_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 28. agent_sessions
CREATE TABLE IF NOT EXISTS public.agent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  planner_session_id uuid REFERENCES public.planner_sessions(id),
  context_window_json jsonb DEFAULT '{}',
  long_term_memory_refs_json jsonb DEFAULT '[]',
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage agent_sessions" ON public.agent_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 29. agent_messages
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_session_id uuid NOT NULL REFERENCES public.agent_sessions(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  content_text text,
  content_json jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage agent_messages" ON public.agent_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 30. agent_tool_calls
CREATE TABLE IF NOT EXISTS public.agent_tool_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_session_id uuid NOT NULL REFERENCES public.agent_sessions(id) ON DELETE CASCADE,
  tool_name text NOT NULL,
  tool_args_json jsonb DEFAULT '{}',
  tool_result_json jsonb,
  latency_ms integer,
  token_cost_estimate numeric,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.agent_tool_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage agent_tool_calls" ON public.agent_tool_calls FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 31. agent_grounding_checks
CREATE TABLE IF NOT EXISTS public.agent_grounding_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.agent_messages(id),
  grounding_score numeric DEFAULT 0,
  facts_used_json jsonb DEFAULT '[]',
  conflicts_json jsonb DEFAULT '[]',
  passed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.agent_grounding_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage agent_grounding_checks" ON public.agent_grounding_checks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 32. user_type_definitions
CREATE TABLE IF NOT EXISTS public.user_type_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_key text UNIQUE NOT NULL,
  label text NOT NULL,
  description text,
  emoji text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_type_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view user_type_definitions" ON public.user_type_definitions FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage user_type_definitions" ON public.user_type_definitions FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.user_type_definitions (type_key, label, emoji) VALUES
  ('solo_traveller', 'Solo Traveller', '🎒'),
  ('couple', 'Couple / Romantic', '💑'),
  ('family', 'Family', '👨‍👩‍👧‍👦'),
  ('group_friends', 'Group of Friends', '👯'),
  ('business', 'Business / Bleisure', '💼'),
  ('digital_nomad', 'Digital Nomad', '💻'),
  ('luxury', 'Luxury Traveller', '✨'),
  ('budget', 'Budget Traveller', '🎯'),
  ('adventure', 'Adventure Seeker', '🏔️'),
  ('culture', 'Culture Explorer', '🏛️'),
  ('foodie', 'Foodie', '🍽️'),
  ('wellness', 'Wellness / Retreat', '🧘'),
  ('local', 'Local Explorer', '📍'),
  ('first_timer', 'First-time Visitor', '🌟')
ON CONFLICT (type_key) DO NOTHING;

-- 33. user_states
CREATE TABLE IF NOT EXISTS public.user_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  state text NOT NULL DEFAULT 'signed_in',
  state_confidence numeric DEFAULT 1.0,
  computed_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.user_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own state" ON public.user_states FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 34. user_type_tags
CREATE TABLE IF NOT EXISTS public.user_type_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type_key text NOT NULL REFERENCES public.user_type_definitions(type_key),
  confidence_score numeric DEFAULT 1.0,
  source_type text DEFAULT 'explicit',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, type_key)
);
ALTER TABLE public.user_type_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tags" ON public.user_type_tags FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 35. preference_dimensions
CREATE TABLE IF NOT EXISTS public.preference_dimensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value_type text NOT NULL DEFAULT 'enum',
  allowed_values_json jsonb,
  default_weight numeric DEFAULT 1.0,
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.preference_dimensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view preference_dimensions" ON public.preference_dimensions FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage preference_dimensions" ON public.preference_dimensions FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.preference_dimensions (key, value_type, description) VALUES
  ('budget_type', 'enum', 'Budget preference'),
  ('price_sensitivity', 'number', 'Price sensitivity 0-1'),
  ('romantic_preference', 'boolean', 'Prefers romantic experiences'),
  ('authenticity_preference', 'number', 'Localness/authenticity 0-1'),
  ('dietary_restrictions', 'json', 'Dietary restrictions'),
  ('accessibility_needs', 'json', 'Accessibility requirements'),
  ('accommodation_preference', 'enum', 'Accommodation type'),
  ('spontaneity_index', 'number', 'Spontaneity preference 0-1'),
  ('booking_lead_time', 'enum', 'Typical booking lead time'),
  ('sustainability_preference', 'number', 'Sustainability importance 0-1'),
  ('nightlife_preference', 'number', 'Nightlife interest 0-1'),
  ('nature_preference', 'number', 'Nature interest 0-1'),
  ('culture_preference', 'number', 'Cultural interest 0-1'),
  ('adventure_preference', 'number', 'Adventure interest 0-1'),
  ('relaxation_preference', 'number', 'Relaxation interest 0-1')
ON CONFLICT (key) DO NOTHING;

-- 36. user_preference_values
CREATE TABLE IF NOT EXISTS public.user_preference_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  dimension_id uuid NOT NULL REFERENCES public.preference_dimensions(id),
  value_bool boolean,
  value_number numeric,
  value_text text,
  value_enum text,
  value_json jsonb,
  confidence_score numeric DEFAULT 1.0,
  source_type text DEFAULT 'explicit',
  evidence_json jsonb,
  valid_from timestamptz DEFAULT now(),
  valid_to timestamptz,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, dimension_id)
);
ALTER TABLE public.user_preference_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own preferences" ON public.user_preference_values FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 37. place_relationships (world graph edges)
CREATE TABLE IF NOT EXISTS public.place_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  relationship_type text NOT NULL DEFAULT 'near',
  strength numeric DEFAULT 1.0,
  source_origin text DEFAULT 'manual',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.place_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view place_relationships" ON public.place_relationships FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage place_relationships" ON public.place_relationships FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 38. travel_time_edges
CREATE TABLE IF NOT EXISTS public.travel_time_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_type text NOT NULL,
  origin_id uuid NOT NULL,
  dest_type text NOT NULL,
  dest_id uuid NOT NULL,
  mode text NOT NULL DEFAULT 'drive',
  duration_minutes_typical integer,
  duration_minutes_peak integer,
  friction_score numeric DEFAULT 0.5,
  source_type text DEFAULT 'manual',
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.travel_time_edges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view travel_time_edges" ON public.travel_time_edges FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage travel_time_edges" ON public.travel_time_edges FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 39. semantic_place_profiles
CREATE TABLE IF NOT EXISTS public.semantic_place_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  urban_score numeric DEFAULT 0, coastal_score numeric DEFAULT 0,
  nightlife_score numeric DEFAULT 0, food_score numeric DEFAULT 0,
  culture_score numeric DEFAULT 0, nature_score numeric DEFAULT 0,
  luxury_score numeric DEFAULT 0, budget_score numeric DEFAULT 0,
  family_score numeric DEFAULT 0, chill_score numeric DEFAULT 0,
  energetic_score numeric DEFAULT 0, localness_score numeric DEFAULT 0,
  touristiness_score numeric DEFAULT 0, walkability_score numeric DEFAULT 0,
  confidence_score numeric DEFAULT 0.5,
  source_breakdown_json jsonb DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);
ALTER TABLE public.semantic_place_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view semantic_place_profiles" ON public.semantic_place_profiles FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage semantic_place_profiles" ON public.semantic_place_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 40. weather_snapshots
CREATE TABLE IF NOT EXISTS public.weather_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  provider_key text DEFAULT 'open_meteo',
  forecast_time timestamptz,
  payload_json jsonb NOT NULL DEFAULT '{}',
  freshness_expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.weather_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view weather_snapshots" ON public.weather_snapshots FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage weather_snapshots" ON public.weather_snapshots FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 41. seasonality_profiles
CREATE TABLE IF NOT EXISTS public.seasonality_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  monthly_scores jsonb NOT NULL DEFAULT '[0,0,0,0,0,0,0,0,0,0,0,0]',
  confidence_score numeric DEFAULT 0.5,
  source_type text DEFAULT 'manual',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);
ALTER TABLE public.seasonality_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view seasonality_profiles" ON public.seasonality_profiles FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage seasonality_profiles" ON public.seasonality_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 42. Future stubs: stays, restaurants, transport_legs, trip_collaborations
CREATE TABLE IF NOT EXISTS public.stays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  destination_id uuid,
  area_id uuid,
  latitude numeric, longitude numeric,
  stay_type text DEFAULT 'hotel',
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.stays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view stays" ON public.stays FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Auth users manage stays" ON public.stays FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  destination_id uuid,
  area_id uuid,
  latitude numeric, longitude numeric,
  cuisine_type text,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view restaurants" ON public.restaurants FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Auth users manage restaurants" ON public.restaurants FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.transport_legs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  origin_name text NOT NULL,
  dest_name text NOT NULL,
  mode text DEFAULT 'drive',
  duration_minutes integer,
  cost_estimate numeric,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.transport_legs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view transport_legs" ON public.transport_legs FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Auth users manage transport_legs" ON public.transport_legs FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.trip_collaborations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid NOT NULL,
  invited_user_id uuid,
  invited_email text,
  role text DEFAULT 'viewer',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.trip_collaborations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage trip_collaborations" ON public.trip_collaborations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 43. robots_policies table
CREATE TABLE IF NOT EXISTS public.robots_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_family text NOT NULL,
  user_agent text NOT NULL DEFAULT '*',
  directive text NOT NULL DEFAULT 'allow',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(route_family, user_agent)
);
ALTER TABLE public.robots_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view robots_policies" ON public.robots_policies FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage robots_policies" ON public.robots_policies FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO public.robots_policies (route_family, user_agent, directive) VALUES
  ('/admin', '*', 'disallow'),
  ('/auth', '*', 'disallow'),
  ('/profile', '*', 'disallow'),
  ('/my-itineraries', '*', 'disallow'),
  ('/my-trips', '*', 'disallow'),
  ('/liked', '*', 'disallow'),
  ('/search', '*', 'disallow'),
  ('/', '*', 'allow'),
  ('/things-to-do', '*', 'allow'),
  ('/itineraries', '*', 'allow'),
  ('/hosts', '*', 'allow'),
  ('/collections', '*', 'allow')
ON CONFLICT (route_family, user_agent) DO NOTHING;
