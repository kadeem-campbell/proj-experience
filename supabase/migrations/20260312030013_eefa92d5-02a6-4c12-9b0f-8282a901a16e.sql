
-- Create experiences table with all fields visible on the detail page
CREATE TABLE public.experiences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  creator text NOT NULL DEFAULT '',
  description text DEFAULT '',
  category text NOT NULL DEFAULT 'Adventure',
  location text NOT NULL DEFAULT '',
  price text DEFAULT '',
  duration text DEFAULT '',
  group_size text DEFAULT '',
  rating numeric DEFAULT 4.7,
  weather text DEFAULT '',
  best_time text DEFAULT '',
  video_thumbnail text DEFAULT '',
  video_url text DEFAULT '',
  gallery jsonb DEFAULT '[]'::jsonb,
  highlights jsonb DEFAULT '[]'::jsonb,
  meeting_points jsonb DEFAULT '[]'::jsonb,
  faqs jsonb DEFAULT '[]'::jsonb,
  tiktok_videos jsonb DEFAULT '[]'::jsonb,
  instagram_embed text DEFAULT '',
  social_links jsonb DEFAULT '{}'::jsonb,
  views text DEFAULT '0',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

-- Anyone can read active experiences (public content)
CREATE POLICY "Anyone can view active experiences"
  ON public.experiences FOR SELECT
  TO public
  USING (is_active = true);

-- Only admins can insert/update/delete (managed via database directly)
CREATE POLICY "Admins can insert experiences"
  ON public.experiences FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update experiences"
  ON public.experiences FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete experiences"
  ON public.experiences FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_experiences_updated_at
  BEFORE UPDATE ON public.experiences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
