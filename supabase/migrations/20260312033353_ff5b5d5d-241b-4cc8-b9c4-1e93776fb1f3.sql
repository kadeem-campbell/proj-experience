
-- 1. Add unique constraint on profiles.username
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- 2. Add unique constraint on profiles.email  
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- 3. Create experience_photos table for gallery management
CREATE TABLE IF NOT EXISTS public.experience_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  url text NOT NULL,
  caption text DEFAULT '',
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.experience_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active photos"
  ON public.experience_photos FOR SELECT TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage photos"
  ON public.experience_photos FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Create itinerary_experiences junction table for linking experiences to itineraries/public_itineraries
CREATE TABLE IF NOT EXISTS public.itinerary_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid REFERENCES public.public_itineraries(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(itinerary_id, experience_id)
);

ALTER TABLE public.itinerary_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view itinerary experiences"
  ON public.itinerary_experiences FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins can manage itinerary experiences"
  ON public.itinerary_experiences FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Create collection_experiences junction table
CREATE TABLE IF NOT EXISTS public.collection_experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(collection_id, experience_id)
);

ALTER TABLE public.collection_experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view collection experiences"
  ON public.collection_experiences FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins can manage collection experiences"
  ON public.collection_experiences FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6. Add url column to collections and public_itineraries if not present
ALTER TABLE public.collections ADD COLUMN IF NOT EXISTS url text;
ALTER TABLE public.public_itineraries ADD COLUMN IF NOT EXISTS url text;
