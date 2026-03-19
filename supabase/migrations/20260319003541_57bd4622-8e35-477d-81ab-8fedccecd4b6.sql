
-- =============================================================
-- NEW TABLES: semantic_product_profiles, traveller_intent_profiles,
-- product_intent_affinities, product_positioning_profiles, entity_documents
-- =============================================================

CREATE TABLE public.semantic_product_profiles (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  romance_score numeric DEFAULT 0,
  family_score numeric DEFAULT 0,
  solo_score numeric DEFAULT 0,
  adventure_score numeric DEFAULT 0,
  food_score numeric DEFAULT 0,
  wellness_score numeric DEFAULT 0,
  comfort_score numeric DEFAULT 0,
  effort_score numeric DEFAULT 0,
  luxury_score numeric DEFAULT 0,
  value_score numeric DEFAULT 0,
  localness_score numeric DEFAULT 0,
  beginner_friendliness_score numeric DEFAULT 0,
  confidence_score numeric DEFAULT 0.5,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.semantic_product_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read semantic_product_profiles" ON public.semantic_product_profiles FOR SELECT USING (true);
CREATE POLICY "Auth manage semantic_product_profiles" ON public.semantic_product_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.traveller_intent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.traveller_intent_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read traveller_intent_profiles" ON public.traveller_intent_profiles FOR SELECT USING (true);
CREATE POLICY "Auth manage traveller_intent_profiles" ON public.traveller_intent_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.product_intent_affinities (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  traveller_intent_profile_id uuid NOT NULL REFERENCES public.traveller_intent_profiles(id) ON DELETE CASCADE,
  affinity_score numeric DEFAULT 0,
  reason_text text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (product_id, traveller_intent_profile_id)
);

ALTER TABLE public.product_intent_affinities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_intent_affinities" ON public.product_intent_affinities FOR SELECT USING (true);
CREATE POLICY "Auth manage product_intent_affinities" ON public.product_intent_affinities FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.product_positioning_profiles (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  budget_score numeric DEFAULT 0,
  value_score numeric DEFAULT 0,
  premium_score numeric DEFAULT 0,
  luxury_score numeric DEFAULT 0,
  comfort_score numeric DEFAULT 0,
  social_score numeric DEFAULT 0,
  exclusivity_score numeric DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.product_positioning_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_positioning_profiles" ON public.product_positioning_profiles FOR SELECT USING (true);
CREATE POLICY "Auth manage product_positioning_profiles" ON public.product_positioning_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.entity_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  document_type text NOT NULL,
  document_json jsonb DEFAULT '{}'::jsonb,
  version integer DEFAULT 1,
  generated_at timestamptz DEFAULT now(),
  generation_status text DEFAULT 'pending',
  source_hash text
);

CREATE UNIQUE INDEX idx_entity_documents_unique ON public.entity_documents (entity_type, entity_id, document_type);

ALTER TABLE public.entity_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read entity_documents" ON public.entity_documents FOR SELECT USING (true);
CREATE POLICY "Auth manage entity_documents" ON public.entity_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed default traveller intent profiles
INSERT INTO public.traveller_intent_profiles (slug, name, description) VALUES
  ('honeymoon', 'Honeymoon', 'Romantic getaway for couples'),
  ('foodie-trip', 'Foodie Trip', 'Culinary exploration and local food discovery'),
  ('solo-adventure', 'Solo Adventure', 'Independent travel and personal discovery'),
  ('family-holiday', 'Family Holiday', 'Fun and safe activities for families with children'),
  ('cultural-immersion', 'Cultural Immersion', 'Deep dive into local culture, history, and traditions'),
  ('low-effort-beach-break', 'Low-Effort Beach Break', 'Relaxed beach-focused getaway with minimal planning'),
  ('remote-work-escape', 'Remote Work Escape', 'Productive travel with good wifi and work-life balance'),
  ('special-occasion', 'Special Occasion', 'Celebrations, anniversaries, and milestone trips');
