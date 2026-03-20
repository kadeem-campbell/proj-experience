
-- 1. Inclusion items index (reusable across products)
CREATE TABLE public.inclusion_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'general',
  emoji TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.inclusion_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inclusion items readable by all" ON public.inclusion_items FOR SELECT USING (true);

-- 2. Product inclusions join table
CREATE TABLE public.product_inclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  inclusion_item_id UUID NOT NULL REFERENCES public.inclusion_items(id) ON DELETE CASCADE,
  is_included BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, inclusion_item_id)
);
ALTER TABLE public.product_inclusions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product inclusions readable by all" ON public.product_inclusions FOR SELECT USING (true);

-- 3. Transport modes index
CREATE TABLE public.transport_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  emoji TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.transport_modes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Transport modes readable by all" ON public.transport_modes FOR SELECT USING (true);

-- 4. Product transport join table
CREATE TABLE public.product_transport (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  transport_mode_id UUID NOT NULL REFERENCES public.transport_modes(id) ON DELETE CASCADE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, transport_mode_id)
);
ALTER TABLE public.product_transport ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Product transport readable by all" ON public.product_transport FOR SELECT USING (true);

-- 5. Add local_tips and getting_there_description to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS local_tips_json JSONB DEFAULT '[]';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS getting_there_description TEXT;

-- 6. Add amount_max to price_options for range pricing
ALTER TABLE public.price_options ADD COLUMN IF NOT EXISTS amount_max NUMERIC;

-- 7. Seed inclusion items (common beach/adventure activities)
INSERT INTO public.inclusion_items (name, slug, category, emoji) VALUES
  ('Jet Ski', 'jet-ski', 'equipment', '🚤'),
  ('Guide', 'guide', 'service', '🧑‍🏫'),
  ('Instructor', 'instructor', 'service', '👨‍🏫'),
  ('Marine Conservation Fee', 'marine-conservation-fee', 'fee', '🐠'),
  ('Snorkelling Gear', 'snorkelling-gear', 'equipment', '🤿'),
  ('Mineral Water', 'mineral-water', 'food_drink', '💧'),
  ('Soft Drinks', 'soft-drinks', 'food_drink', '🥤'),
  ('Life Jacket', 'life-jacket', 'equipment', '🦺'),
  ('Stop Watch', 'stop-watch', 'equipment', '⏱️'),
  ('Snorkelling Site', 'snorkelling-site', 'access', '🏝️'),
  ('Food', 'food', 'food_drink', '🍽️'),
  ('Sunscreen', 'sunscreen', 'equipment', '🧴'),
  ('Towel', 'towel', 'equipment', '🏖️'),
  ('Transfer', 'transfer', 'transport', '🚐'),
  ('Boat Ride', 'boat-ride', 'transport', '⛵'),
  ('Photography', 'photography', 'service', '📸'),
  ('First Aid Kit', 'first-aid-kit', 'safety', '🩹'),
  ('Insurance', 'insurance', 'safety', '🛡️')
ON CONFLICT (slug) DO NOTHING;

-- 8. Seed transport modes
INSERT INTO public.transport_modes (name, slug, emoji) VALUES
  ('Car', 'car', '🚗'),
  ('Flight', 'flight', '✈️'),
  ('Boda Boda', 'boda-boda', '🏍️'),
  ('Boat', 'boat', '⛵'),
  ('Bus', 'bus', '🚌'),
  ('Walking', 'walking', '🚶'),
  ('Bicycle', 'bicycle', '🚲'),
  ('Taxi', 'taxi', '🚕'),
  ('Ferry', 'ferry', '⛴️'),
  ('Dalla Dalla', 'dalla-dalla', '🚐'),
  ('Tuk Tuk', 'tuk-tuk', '🛺')
ON CONFLICT (slug) DO NOTHING;
