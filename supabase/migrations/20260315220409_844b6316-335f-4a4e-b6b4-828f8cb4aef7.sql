
-- =====================================================
-- SWAM PLATFORM ARCHITECTURE MIGRATION - PHASE 1
-- Core Entity Tables + Location Model + Product Decomposition
-- =====================================================

-- 1. COUNTRIES
CREATE TABLE public.countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  iso_code char(2) NOT NULL UNIQUE,
  flag_emoji text,
  flag_svg_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. DESTINATIONS (replaces cities as the discovery layer)
CREATE TABLE public.destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  country_id uuid REFERENCES public.countries(id),
  legacy_city_id uuid REFERENCES public.cities(id),
  description text DEFAULT '',
  cover_image text DEFAULT '',
  latitude numeric,
  longitude numeric,
  airport_code text DEFAULT '',
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. AREAS (sub-locations within destinations)
CREATE TABLE public.areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  destination_id uuid NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  description text DEFAULT '',
  cover_image text DEFAULT '',
  latitude numeric,
  longitude numeric,
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(destination_id, slug)
);

-- 4. POIS (points of interest)
CREATE TABLE public.pois (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  destination_id uuid REFERENCES public.destinations(id),
  area_id uuid REFERENCES public.areas(id),
  description text DEFAULT '',
  cover_image text DEFAULT '',
  latitude numeric,
  longitude numeric,
  google_place_id text,
  wikidata_id text,
  poi_type text DEFAULT 'attraction',
  is_public_page boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(destination_id, slug)
);

-- 5. ACTIVITY_TYPES (global normalized categories)
CREATE TABLE public.activity_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  legacy_category_id uuid REFERENCES public.categories(id),
  description text DEFAULT '',
  emoji text DEFAULT '',
  icon_image text DEFAULT '',
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. THEMES (discoverability attributes)
CREATE TABLE public.themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  emoji text DEFAULT '',
  is_public_page boolean DEFAULT false,
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. PRODUCTS (canonical public-facing thing-to-do)
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  legacy_experience_id uuid REFERENCES public.experiences(id),
  destination_id uuid REFERENCES public.destinations(id),
  area_id uuid REFERENCES public.areas(id),
  activity_type_id uuid REFERENCES public.activity_types(id),
  description text DEFAULT '',
  cover_image text DEFAULT '',
  video_url text DEFAULT '',
  gallery jsonb DEFAULT '[]'::jsonb,
  highlights jsonb DEFAULT '[]'::jsonb,
  meeting_points jsonb DEFAULT '[]'::jsonb,
  duration text DEFAULT '',
  best_time text DEFAULT '',
  weather text DEFAULT '',
  tier text DEFAULT 'standard',
  format_type text DEFAULT 'shared',
  rating numeric DEFAULT 4.7,
  like_count int DEFAULT 0,
  view_count int DEFAULT 0,
  latitude numeric,
  longitude numeric,
  is_active boolean DEFAULT true,
  is_indexable boolean DEFAULT true,
  canonical_url text,
  publish_score int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. PRODUCT_POIS (products linked to POIs)
CREATE TABLE public.product_pois (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  poi_id uuid NOT NULL REFERENCES public.pois(id) ON DELETE CASCADE,
  relationship_type text DEFAULT 'at',
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, poi_id)
);

-- 9. PRODUCT_THEMES (products linked to themes)
CREATE TABLE public.product_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  theme_id uuid NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, theme_id)
);

-- 10. PRODUCT_DESTINATIONS (products available in multiple destinations)
CREATE TABLE public.product_destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  destination_id uuid NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, destination_id)
);

-- 11. OPTIONS (variants under products)
CREATE TABLE public.options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text DEFAULT '',
  tier text DEFAULT 'standard',
  format_type text DEFAULT 'shared',
  duration text DEFAULT '',
  group_size text DEFAULT '',
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, slug)
);

-- 12. PRICE_OPTIONS (prices under options)
CREATE TABLE public.price_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id uuid NOT NULL REFERENCES public.options(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Adult',
  currency text NOT NULL DEFAULT 'USD',
  amount numeric NOT NULL DEFAULT 0,
  original_amount numeric,
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 13. HOSTS (rename from creators conceptually, keep table for compat)
CREATE TABLE public.hosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legacy_creator_id uuid REFERENCES public.creators(id),
  username text NOT NULL UNIQUE,
  display_name text DEFAULT '',
  slug text NOT NULL UNIQUE,
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  social_links jsonb DEFAULT '{}'::jsonb,
  destination_id uuid REFERENCES public.destinations(id),
  area_id uuid REFERENCES public.areas(id),
  latitude numeric,
  longitude numeric,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 14. HOST_LOCATIONS (meeting points / operational locations)
CREATE TABLE public.host_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES public.hosts(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text DEFAULT '',
  latitude numeric,
  longitude numeric,
  google_place_id text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 15. PRODUCT_HOSTS (many-to-many products to hosts)
CREATE TABLE public.product_hosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES public.hosts(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, host_id)
);

-- 16. MEDIA_ASSETS (centralized media)
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  url text NOT NULL,
  media_type text DEFAULT 'image',
  alt_text text DEFAULT '',
  caption text DEFAULT '',
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 17. REVIEWS
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  host_id uuid REFERENCES public.hosts(id) ON DELETE CASCADE,
  user_id uuid,
  rating numeric NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text DEFAULT '',
  body text DEFAULT '',
  source text DEFAULT 'swam',
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 18. REVIEW_AGGREGATES
CREATE TABLE public.review_aggregates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  total_reviews int DEFAULT 0,
  average_rating numeric DEFAULT 0,
  rating_distribution jsonb DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0}'::jsonb,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

-- 19. ITINERARY_DAYS (structured itinerary decomposition)
CREATE TABLE public.itinerary_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid NOT NULL,
  day_number int NOT NULL DEFAULT 1,
  title text DEFAULT '',
  description text DEFAULT '',
  date date,
  created_at timestamptz DEFAULT now(),
  UNIQUE(itinerary_id, day_number)
);

-- 20. ITINERARY_ITEMS (items within a day)
CREATE TABLE public.itinerary_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id uuid NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id),
  poi_id uuid REFERENCES public.pois(id),
  item_type text DEFAULT 'product',
  display_order int DEFAULT 0,
  time_slot text DEFAULT 'morning',
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 21. EVENTS (future dated occurrences)
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id),
  host_id uuid REFERENCES public.hosts(id),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  start_date timestamptz,
  end_date timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 22. TRAVELLERS (demand-side identity)
CREATE TABLE public.travellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  username text UNIQUE,
  display_name text DEFAULT '',
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  is_public boolean DEFAULT false,
  is_indexed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 23. INTERACTION_EVENTS (analytics & behavioral graph)
CREATE TABLE public.interaction_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 24. BOOKING_INTENTS
CREATE TABLE public.booking_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id),
  option_id uuid REFERENCES public.options(id),
  user_id uuid,
  intent_type text DEFAULT 'enquiry',
  status text DEFAULT 'pending',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 25. ENTITY_SLUG_HISTORY (canonical governance)
CREATE TABLE public.entity_slug_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  old_slug text NOT NULL,
  new_slug text NOT NULL,
  changed_at timestamptz DEFAULT now(),
  changed_by uuid
);

-- 26. CANONICAL_DECISIONS
CREATE TABLE public.canonical_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  canonical_url text NOT NULL,
  is_indexable boolean DEFAULT true,
  reason text DEFAULT '',
  decided_at timestamptz DEFAULT now(),
  decided_by uuid
);

-- 27. ENTITY_MERGES
CREATE TABLE public.entity_merges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  reason text DEFAULT '',
  merged_at timestamptz DEFAULT now(),
  merged_by uuid
);

-- 28. MODERATION_ACTIONS
CREATE TABLE public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action_type text NOT NULL,
  reason text DEFAULT '',
  performed_at timestamptz DEFAULT now(),
  performed_by uuid
);

-- 29. CONTENT_SOURCES
CREATE TABLE public.content_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  source_type text DEFAULT 'manual',
  source_url text DEFAULT '',
  confidence numeric DEFAULT 1.0,
  created_at timestamptz DEFAULT now()
);

-- 30. SEARCH_PERFORMANCE_SNAPSHOTS
CREATE TABLE public.search_performance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  url text NOT NULL,
  impressions int DEFAULT 0,
  clicks int DEFAULT 0,
  position numeric DEFAULT 0,
  snapshot_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 31. FEED_ISSUE_LOGS
CREATE TABLE public.feed_issue_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  issue_type text NOT NULL,
  message text DEFAULT '',
  severity text DEFAULT 'warning',
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 32. CRAWL_OBSERVATIONS
CREATE TABLE public.crawl_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  crawler text DEFAULT 'googlebot',
  status_code int,
  observed_at timestamptz DEFAULT now()
);

-- 33. ENTITY_FUNNEL_METRICS
CREATE TABLE public.entity_funnel_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  impressions int DEFAULT 0,
  detail_views int DEFAULT 0,
  saves int DEFAULT 0,
  booking_intents int DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 34. SCHEMA_GENERATION_LOGS
CREATE TABLE public.schema_generation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  schema_type text NOT NULL,
  schema_version int DEFAULT 1,
  schema_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_valid boolean DEFAULT true,
  validation_errors jsonb DEFAULT '[]'::jsonb,
  generated_at timestamptz DEFAULT now()
);

-- 35. PUBLISH_VALIDATION_RESULTS
CREATE TABLE public.publish_validation_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  publish_score int DEFAULT 0,
  checks jsonb DEFAULT '[]'::jsonb,
  is_publishable boolean DEFAULT false,
  validated_at timestamptz DEFAULT now()
);

-- 36. EXTERNAL_ENTITY_CONTRACTS
CREATE TABLE public.external_entity_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner text NOT NULL,
  entity_type text NOT NULL,
  contract_version int DEFAULT 1,
  field_mappings jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 37. SYNC_JOBS
CREATE TABLE public.sync_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  status text DEFAULT 'pending',
  source_system text NOT NULL,
  target_system text NOT NULL,
  records_processed int DEFAULT 0,
  records_failed int DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  error_log jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- 38. IDENTITY_RESOLUTION_LINKS
CREATE TABLE public.identity_resolution_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type_a text NOT NULL,
  entity_id_a uuid NOT NULL,
  entity_type_b text NOT NULL,
  entity_id_b uuid NOT NULL,
  confidence numeric DEFAULT 1.0,
  resolution_method text DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

-- 39. ENTITY_ALIASES
CREATE TABLE public.entity_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  alias text NOT NULL,
  alias_type text DEFAULT 'name',
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- RLS POLICIES (public read, authenticated admin write)
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_pois ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.host_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_hosts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_aggregates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interaction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_slug_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canonical_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_merges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_issue_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crawl_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_funnel_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schema_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publish_validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_entity_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_resolution_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_aliases ENABLE ROW LEVEL SECURITY;

-- Public read policies for discovery entities
CREATE POLICY "Anyone can view countries" ON public.countries FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Anyone can view destinations" ON public.destinations FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Anyone can view areas" ON public.areas FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Anyone can view pois" ON public.pois FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Anyone can view activity_types" ON public.activity_types FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Anyone can view themes" ON public.themes FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Anyone can view product_pois" ON public.product_pois FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can view product_themes" ON public.product_themes FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can view product_destinations" ON public.product_destinations FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can view options" ON public.options FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Anyone can view price_options" ON public.price_options FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Anyone can view hosts" ON public.hosts FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Anyone can view host_locations" ON public.host_locations FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can view product_hosts" ON public.product_hosts FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can view media_assets" ON public.media_assets FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Anyone can view review_aggregates" ON public.review_aggregates FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can view events" ON public.events FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Anyone can view itinerary_days" ON public.itinerary_days FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can view itinerary_items" ON public.itinerary_items FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can view entity_aliases" ON public.entity_aliases FOR SELECT TO public USING (true);

-- Authenticated write policies for admin/management
CREATE POLICY "Auth users manage countries" ON public.countries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage destinations" ON public.destinations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage areas" ON public.areas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage pois" ON public.pois FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage activity_types" ON public.activity_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage themes" ON public.themes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage product_pois" ON public.product_pois FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage product_themes" ON public.product_themes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage product_destinations" ON public.product_destinations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage options" ON public.options FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage price_options" ON public.price_options FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage hosts" ON public.hosts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage host_locations" ON public.host_locations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage product_hosts" ON public.product_hosts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage media_assets" ON public.media_assets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage reviews" ON public.reviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage review_aggregates" ON public.review_aggregates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage itinerary_days" ON public.itinerary_days FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage itinerary_items" ON public.itinerary_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage events" ON public.events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage travellers" ON public.travellers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage interaction_events" ON public.interaction_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage booking_intents" ON public.booking_intents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage entity_slug_history" ON public.entity_slug_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage canonical_decisions" ON public.canonical_decisions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage entity_merges" ON public.entity_merges FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage moderation_actions" ON public.moderation_actions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage content_sources" ON public.content_sources FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage search_performance" ON public.search_performance_snapshots FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage feed_issues" ON public.feed_issue_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage crawl_observations" ON public.crawl_observations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage entity_funnels" ON public.entity_funnel_metrics FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage schema_logs" ON public.schema_generation_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage publish_validation" ON public.publish_validation_results FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage external_contracts" ON public.external_entity_contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage sync_jobs" ON public.sync_jobs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage identity_links" ON public.identity_resolution_links FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth users manage entity_aliases" ON public.entity_aliases FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Traveller can view own data
CREATE POLICY "Travellers view own" ON public.travellers FOR SELECT TO public USING (is_public = true OR user_id = auth.uid());

-- Interaction events: users can insert their own
CREATE POLICY "Users insert own interactions" ON public.interaction_events FOR INSERT TO public WITH CHECK (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Anyone can view interactions" ON public.interaction_events FOR SELECT TO public USING (true);

-- Booking intents: users can manage their own
CREATE POLICY "Users manage own booking intents" ON public.booking_intents FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- =====================================================
-- INDEXES for performance
-- =====================================================
CREATE INDEX idx_products_destination ON public.products(destination_id);
CREATE INDEX idx_products_area ON public.products(area_id);
CREATE INDEX idx_products_activity_type ON public.products(activity_type_id);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_legacy ON public.products(legacy_experience_id);
CREATE INDEX idx_areas_destination ON public.areas(destination_id);
CREATE INDEX idx_pois_destination ON public.pois(destination_id);
CREATE INDEX idx_pois_area ON public.pois(area_id);
CREATE INDEX idx_options_product ON public.options(product_id);
CREATE INDEX idx_price_options_option ON public.price_options(option_id);
CREATE INDEX idx_hosts_slug ON public.hosts(slug);
CREATE INDEX idx_hosts_legacy ON public.hosts(legacy_creator_id);
CREATE INDEX idx_product_hosts_product ON public.product_hosts(product_id);
CREATE INDEX idx_product_hosts_host ON public.product_hosts(host_id);
CREATE INDEX idx_media_assets_entity ON public.media_assets(entity_type, entity_id);
CREATE INDEX idx_reviews_product ON public.reviews(product_id);
CREATE INDEX idx_interaction_events_entity ON public.interaction_events(entity_type, entity_id);
CREATE INDEX idx_interaction_events_user ON public.interaction_events(user_id);
CREATE INDEX idx_entity_slug_history_entity ON public.entity_slug_history(entity_type, entity_id);
CREATE INDEX idx_destinations_slug ON public.destinations(slug);
CREATE INDEX idx_areas_slug ON public.areas(destination_id, slug);
CREATE INDEX idx_pois_slug ON public.pois(destination_id, slug);

-- Updated_at triggers for key tables
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_destinations_updated_at BEFORE UPDATE ON public.destinations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hosts_updated_at BEFORE UPDATE ON public.hosts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_options_updated_at BEFORE UPDATE ON public.options FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON public.areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_travellers_updated_at BEFORE UPDATE ON public.travellers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
