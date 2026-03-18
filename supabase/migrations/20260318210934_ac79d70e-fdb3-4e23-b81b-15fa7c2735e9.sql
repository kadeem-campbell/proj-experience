
-- =============================================================
-- WORLD MODEL SCHEMA UPGRADE: cities → destinations canonical
-- =============================================================

-- ── 1. UPGRADE COUNTRIES ──
ALTER TABLE public.countries
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS name_common text,
  ADD COLUMN IF NOT EXISTS name_official text,
  ADD COLUMN IF NOT EXISTS iso_alpha2 text,
  ADD COLUMN IF NOT EXISTS iso_alpha3 text,
  ADD COLUMN IF NOT EXISTS iso_numeric text,
  ADD COLUMN IF NOT EXISTS continent text,
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS currency_code text,
  ADD COLUMN IF NOT EXISTS default_language text,
  ADD COLUMN IF NOT EXISTS tld text,
  ADD COLUMN IF NOT EXISTS calling_code text,
  ADD COLUMN IF NOT EXISTS population bigint,
  ADD COLUMN IF NOT EXISTS area_sq_km numeric,
  ADD COLUMN IF NOT EXISTS capital_destination_id uuid;

-- Populate slug and iso_alpha2 from existing iso_code
UPDATE public.countries SET slug = lower(replace(name, ' ', '-')) WHERE slug IS NULL;
UPDATE public.countries SET iso_alpha2 = iso_code WHERE iso_alpha2 IS NULL AND iso_code IS NOT NULL;

-- Drop flag_emoji from countries
ALTER TABLE public.countries DROP COLUMN IF EXISTS flag_emoji;

-- Add unique constraint on slug
CREATE UNIQUE INDEX IF NOT EXISTS countries_slug_uniq ON public.countries (slug);
CREATE UNIQUE INDEX IF NOT EXISTS countries_iso_alpha2_uniq ON public.countries (iso_alpha2);

-- ── 2. UPGRADE DESTINATIONS ──
ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS destination_type text NOT NULL DEFAULT 'city',
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS currency_code text,
  ADD COLUMN IF NOT EXISTS iata_code text,
  ADD COLUMN IF NOT EXISTS best_time_to_visit_text text,
  ADD COLUMN IF NOT EXISTS visibility_state text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS readiness_score numeric;

-- Migrate cover_image → hero_image_url for existing data
UPDATE public.destinations SET hero_image_url = cover_image WHERE hero_image_url IS NULL AND cover_image IS NOT NULL;

-- Migrate airport_code → iata_code
UPDATE public.destinations SET iata_code = airport_code WHERE iata_code IS NULL AND airport_code IS NOT NULL;

-- Copy description → short_description
UPDATE public.destinations SET short_description = description WHERE short_description IS NULL AND description IS NOT NULL;

-- Drop flag_emoji from destinations
ALTER TABLE public.destinations DROP COLUMN IF EXISTS flag_emoji;

-- Drop airport_code from destinations (replaced by iata_code)
ALTER TABLE public.destinations DROP COLUMN IF EXISTS airport_code;

-- ── 3. UPGRADE AREAS ──
ALTER TABLE public.areas
  ADD COLUMN IF NOT EXISTS area_type text NOT NULL DEFAULT 'neighbourhood',
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS vibe_description text,
  ADD COLUMN IF NOT EXISTS safety_score numeric,
  ADD COLUMN IF NOT EXISTS is_marketplace_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_partner_feed_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS visibility_state text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS readiness_score numeric;

-- Copy description → short_description
UPDATE public.areas SET short_description = description WHERE short_description IS NULL AND description IS NOT NULL;

-- ── 4. UPGRADE POIS ──
ALTER TABLE public.pois
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS address_text text,
  ADD COLUMN IF NOT EXISTS opening_hours_json jsonb,
  ADD COLUMN IF NOT EXISTS price_level integer,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS visibility_state text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS readiness_score numeric;

-- Copy description → short_description
UPDATE public.pois SET short_description = description WHERE short_description IS NULL AND description IS NOT NULL;

-- ── 5. MIGRATE CITIES DATA INTO DESTINATIONS ──
-- All cities already exist in destinations via legacy_city_id mapping.
-- Verify and copy any missing flag_svg_url from cities to destinations.
UPDATE public.destinations d
  SET flag_svg_url = c.flag_svg_url
  FROM public.cities c
  WHERE d.legacy_city_id = c.id
    AND (d.flag_svg_url IS NULL OR d.flag_svg_url = '')
    AND c.flag_svg_url IS NOT NULL;

-- Copy lat/lng from cities where destinations are missing them
UPDATE public.destinations d
  SET latitude = c.latitude, longitude = c.longitude
  FROM public.cities c
  WHERE d.legacy_city_id = c.id
    AND d.latitude IS NULL
    AND c.latitude IS NOT NULL;

-- ── 6. REPOINT FOREIGN KEYS ──

-- 6a. public_itineraries: add destination_id, migrate, drop city_id
ALTER TABLE public.public_itineraries
  ADD COLUMN IF NOT EXISTS destination_id uuid REFERENCES public.destinations(id);

UPDATE public.public_itineraries pi
  SET destination_id = d.id
  FROM public.destinations d
  WHERE d.legacy_city_id = pi.city_id
    AND pi.city_id IS NOT NULL
    AND pi.destination_id IS NULL;

ALTER TABLE public.public_itineraries DROP CONSTRAINT IF EXISTS public_itineraries_city_id_fkey;
ALTER TABLE public.public_itineraries DROP COLUMN IF EXISTS city_id;

-- 6b. collections: add destination_id, migrate, drop city_id
ALTER TABLE public.collections
  ADD COLUMN IF NOT EXISTS destination_id uuid REFERENCES public.destinations(id);

UPDATE public.collections c
  SET destination_id = d.id
  FROM public.destinations d
  WHERE d.legacy_city_id = c.city_id
    AND c.city_id IS NOT NULL
    AND c.destination_id IS NULL;

ALTER TABLE public.collections DROP CONSTRAINT IF EXISTS collections_city_id_fkey;
ALTER TABLE public.collections DROP COLUMN IF EXISTS city_id;

-- 6c. experiences: city_id → use destination mapping
-- experiences already has city_id; add destination_id column
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS destination_id uuid REFERENCES public.destinations(id);

UPDATE public.experiences e
  SET destination_id = d.id
  FROM public.destinations d
  WHERE d.legacy_city_id = e.city_id
    AND e.city_id IS NOT NULL
    AND e.destination_id IS NULL;

ALTER TABLE public.experiences DROP CONSTRAINT IF EXISTS experiences_city_id_fkey;
ALTER TABLE public.experiences DROP COLUMN IF EXISTS city_id;

-- 6d. destinations: drop legacy_city_id
ALTER TABLE public.destinations DROP CONSTRAINT IF EXISTS destinations_legacy_city_id_fkey;
ALTER TABLE public.destinations DROP COLUMN IF EXISTS legacy_city_id;

-- ── 7. DROP CITIES TABLE ──
DROP TABLE IF EXISTS public.cities CASCADE;

-- ── 8. COMPLETE WORLD-MODEL SUPPORT TABLES ──

-- geo_launch_profiles: add missing useful columns
ALTER TABLE public.geo_launch_profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS description text;

-- geo_shapes: add indexes
CREATE INDEX IF NOT EXISTS geo_shapes_entity_idx ON public.geo_shapes (entity_type, entity_id);

-- place_relationships: add created_at if missing
ALTER TABLE public.place_relationships
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
CREATE INDEX IF NOT EXISTS place_rel_source_idx ON public.place_relationships (source_type, source_id);
CREATE INDEX IF NOT EXISTS place_rel_target_idx ON public.place_relationships (target_type, target_id);

-- travel_time_edges: add indexes
CREATE INDEX IF NOT EXISTS travel_edges_origin_idx ON public.travel_time_edges (origin_type, origin_id);
CREATE INDEX IF NOT EXISTS travel_edges_dest_idx ON public.travel_time_edges (dest_type, dest_id);

-- semantic_place_profiles: add indexes
CREATE INDEX IF NOT EXISTS semantic_profiles_entity_idx ON public.semantic_place_profiles (entity_type, entity_id);

-- seasonality_profiles: add indexes
CREATE INDEX IF NOT EXISTS seasonality_entity_idx ON public.seasonality_profiles (entity_type, entity_id);

-- weather_snapshots: add indexes
CREATE INDEX IF NOT EXISTS weather_entity_idx ON public.weather_snapshots (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS weather_forecast_time_idx ON public.weather_snapshots (forecast_time);

-- ── 9. ADD UPDATED_AT TRIGGERS ──
CREATE OR REPLACE TRIGGER countries_updated_at
  BEFORE UPDATE ON public.countries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER destinations_updated_at
  BEFORE UPDATE ON public.destinations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER areas_updated_at
  BEFORE UPDATE ON public.areas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER pois_updated_at
  BEFORE UPDATE ON public.pois
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 10. ENSURE FK: capital_destination_id ──
ALTER TABLE public.countries
  ADD CONSTRAINT countries_capital_destination_id_fkey
  FOREIGN KEY (capital_destination_id) REFERENCES public.destinations(id);
