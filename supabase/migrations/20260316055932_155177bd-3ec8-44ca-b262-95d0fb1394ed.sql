
-- =============================================
-- SECTION 5: Analytics warehouse dim/fact tables
-- SECTION 4: Governance QA gates & defer register
-- SECTION 3: Feed export contract registry
-- =============================================

-- Fact: page views (warehouse-grade)
CREATE TABLE public.fact_pageviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid,
  anonymous_id text,
  entity_id uuid NOT NULL,
  entity_type text NOT NULL,
  page_url text NOT NULL,
  referrer text,
  device_type text,
  viewport text,
  locale text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fact_pageviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage fact_pageviews" ON public.fact_pageviews FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can insert pageviews" ON public.fact_pageviews FOR INSERT TO public WITH CHECK (true);

-- Fact: booking intents (warehouse-grade)
CREATE TABLE public.fact_booking_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text,
  user_id uuid,
  product_id uuid NOT NULL,
  option_id uuid,
  intent_stage text NOT NULL DEFAULT 'view_price',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fact_booking_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage fact_booking_intents" ON public.fact_booking_intents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can insert booking intents" ON public.fact_booking_intents FOR INSERT TO public WITH CHECK (true);

-- Dim: entities (denormalized for analytics)
CREATE TABLE public.dim_entities (
  entity_id uuid PRIMARY KEY,
  entity_type text NOT NULL,
  title text,
  slug text,
  destination_id uuid,
  destination_name text,
  area_id uuid,
  area_name text,
  activity_type text,
  host_id uuid,
  host_name text,
  indexability_state text DEFAULT 'draft_unpublished',
  publish_score integer DEFAULT 0,
  quality_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.dim_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage dim_entities" ON public.dim_entities FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public can view dim_entities" ON public.dim_entities FOR SELECT TO public USING (true);

-- Identity map: anonymous to authenticated
CREATE TABLE public.identity_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id text NOT NULL,
  user_id uuid NOT NULL,
  first_seen_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  UNIQUE(anonymous_id, user_id)
);
ALTER TABLE public.identity_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage identity_map" ON public.identity_map FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Feed export contract registry
CREATE TABLE public.export_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner text NOT NULL,
  feed_type text NOT NULL DEFAULT 'google_ttd',
  contract_version integer NOT NULL DEFAULT 1,
  field_exposure jsonb NOT NULL DEFAULT '{}',
  deep_link_template text DEFAULT 'https://swam.app/things-to-do/{destination_slug}/{product_slug}',
  is_active boolean DEFAULT true,
  requires_pricing boolean DEFAULT true,
  requires_geo boolean DEFAULT false,
  requires_image boolean DEFAULT true,
  min_description_length integer DEFAULT 30,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(partner, feed_type)
);
ALTER TABLE public.export_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage export_contracts" ON public.export_contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Governance: deploy gates
CREATE TABLE public.deploy_gates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_name text NOT NULL UNIQUE,
  gate_type text NOT NULL DEFAULT 'pre_launch',
  criteria jsonb NOT NULL DEFAULT '{}',
  is_passed boolean DEFAULT false,
  last_evaluated_at timestamptz,
  evaluated_by uuid,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.deploy_gates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage deploy_gates" ON public.deploy_gates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Governance: defer register (items explicitly deferred to later phase)
CREATE TABLE public.defer_register (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  category text NOT NULL DEFAULT 'feature',
  reason text DEFAULT '',
  deferred_to_phase text DEFAULT 'post_launch',
  severity text DEFAULT 'medium',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE public.defer_register ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage defer_register" ON public.defer_register FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Governance: audit log for admin actions
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users manage admin_audit_log" ON public.admin_audit_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
