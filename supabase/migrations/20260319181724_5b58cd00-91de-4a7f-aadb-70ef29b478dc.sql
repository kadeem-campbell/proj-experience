
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS primary_area_id uuid REFERENCES public.areas(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS primary_poi_id uuid;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS average_price_per_person numeric;
