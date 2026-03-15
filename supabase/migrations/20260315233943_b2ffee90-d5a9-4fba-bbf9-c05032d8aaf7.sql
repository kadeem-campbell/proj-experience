
ALTER TABLE public.destinations 
  ADD COLUMN IF NOT EXISTS flag_emoji text DEFAULT '',
  ADD COLUMN IF NOT EXISTS flag_svg_url text DEFAULT '';
