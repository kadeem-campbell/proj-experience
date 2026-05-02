
ALTER TABLE public.carousel_destinations ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.carousel_categories ADD COLUMN IF NOT EXISTS id uuid NOT NULL DEFAULT gen_random_uuid();

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'carousel_destinations_pkey') THEN
    ALTER TABLE public.carousel_destinations ADD PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'carousel_categories_pkey') THEN
    ALTER TABLE public.carousel_categories ADD PRIMARY KEY (id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS carousel_destinations_unique ON public.carousel_destinations(carousel_id, destination_id);
CREATE UNIQUE INDEX IF NOT EXISTS carousel_categories_unique ON public.carousel_categories(carousel_id, activity_type_id);
