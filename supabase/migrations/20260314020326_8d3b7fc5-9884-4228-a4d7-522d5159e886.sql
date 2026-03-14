ALTER TABLE public.cities
ADD COLUMN IF NOT EXISTS launch_date date,
ADD COLUMN IF NOT EXISTS flag_svg_url text;

CREATE INDEX IF NOT EXISTS idx_cities_launch_date ON public.cities (launch_date);