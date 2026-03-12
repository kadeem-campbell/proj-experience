
-- Cities table - every city shown in the app
CREATE TABLE public.cities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  country text NOT NULL DEFAULT '',
  cover_image text DEFAULT '',
  airport_code text DEFAULT '',
  flag_emoji text DEFAULT '',
  latitude numeric DEFAULT 0,
  longitude numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active cities" ON public.cities FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage cities" ON public.cities FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Categories table
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  emoji text DEFAULT '',
  icon_image text DEFAULT '',
  description text DEFAULT '',
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active categories" ON public.categories FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Collections table (groups of experiences or itineraries)
CREATE TABLE public.collections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  cover_image text DEFAULT '',
  collection_type text NOT NULL DEFAULT 'experiences',
  city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL,
  tag text DEFAULT '',
  display_order int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active collections" ON public.collections FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage collections" ON public.collections FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Collection items (links experiences or itineraries to collections)
CREATE TABLE public.collection_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  item_id uuid NOT NULL,
  item_type text NOT NULL DEFAULT 'experience',
  position int DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view collection items" ON public.collection_items FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage collection items" ON public.collection_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add city_id to experiences table for proper linking
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL;

-- Triggers for updated_at
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON public.cities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON public.collections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
