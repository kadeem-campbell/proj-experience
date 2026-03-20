ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS meeting_points_json JSONB;