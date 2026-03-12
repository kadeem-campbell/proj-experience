
-- Add URL/slug column to experiences if not present
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS slug text;

-- Create index on slug for fast lookups
CREATE INDEX IF NOT EXISTS idx_experiences_slug ON public.experiences(slug);

-- Create FAQs table for individual FAQ management
CREATE TABLE IF NOT EXISTS public.experience_faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for experience_faqs
ALTER TABLE public.experience_faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active faqs"
  ON public.experience_faqs FOR SELECT TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage faqs"
  ON public.experience_faqs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update existing experiences to have slugs based on title
UPDATE public.experiences SET slug = lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')) WHERE slug IS NULL;

-- Add Nature and Safari as separate categories if not present
INSERT INTO public.categories (name, emoji, description, display_order)
VALUES 
  ('Nature', '🌿', 'Natural wonders and scenic landscapes', 3),
  ('Safari', '🦁', 'Wildlife safaris and game drives', 7)
ON CONFLICT DO NOTHING;
