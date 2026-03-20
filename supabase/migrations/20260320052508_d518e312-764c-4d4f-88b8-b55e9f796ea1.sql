
-- Add google_maps_url to products for exact location linking
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS google_maps_url text;

-- Add google_place_id to products 
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS google_place_id text;

-- Add place_name for display
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS place_name text;
