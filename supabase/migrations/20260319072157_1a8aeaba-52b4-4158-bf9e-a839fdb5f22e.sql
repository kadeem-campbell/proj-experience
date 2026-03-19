ALTER TABLE public.public_itineraries ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'editorial';

-- Update existing rows: those with creator_id are editorial, those without are also editorial
-- (since they were all admin-created in public_itineraries table)
UPDATE public.public_itineraries SET source_type = 'editorial' WHERE source_type IS NULL OR source_type = '';