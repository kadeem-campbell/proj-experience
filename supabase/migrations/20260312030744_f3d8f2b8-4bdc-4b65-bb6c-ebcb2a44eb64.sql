
-- Creators table for content creator display profiles (not auth users)
CREATE TABLE public.creators (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL UNIQUE,
  display_name text DEFAULT '',
  avatar_url text DEFAULT '',
  bio text DEFAULT '',
  social_links jsonb DEFAULT '{}'::jsonb,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active creators" ON public.creators FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage creators" ON public.creators FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON public.creators FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add creator_id to experiences for proper linking
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES public.creators(id) ON DELETE SET NULL;

-- Add creator_id to itineraries for public itineraries
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES public.creators(id) ON DELETE SET NULL;

-- Public itineraries table (separate from user itineraries to avoid auth constraints)
CREATE TABLE public.public_itineraries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  cover_image text DEFAULT '',
  city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL,
  creator_id uuid REFERENCES public.creators(id) ON DELETE SET NULL,
  experiences jsonb DEFAULT '[]'::jsonb,
  trips jsonb DEFAULT '[]'::jsonb,
  tag text DEFAULT 'popular',
  like_count int DEFAULT 0,
  view_count int DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.public_itineraries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active public itineraries" ON public.public_itineraries FOR SELECT TO public USING (is_active = true);
CREATE POLICY "Admins can manage public itineraries" ON public.public_itineraries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_public_itineraries_updated_at BEFORE UPDATE ON public.public_itineraries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add like_count and view_count to experiences
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS like_count int DEFAULT 0;
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS view_count int DEFAULT 0;
