
ALTER TABLE public.collections 
  ADD COLUMN IF NOT EXISTS show_on_home boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS home_display_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'itinerary';
