
CREATE TABLE public.collection_destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  destination_id uuid NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(collection_id, destination_id)
);

ALTER TABLE public.collection_destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view collection_destinations" ON public.collection_destinations FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage collection_destinations" ON public.collection_destinations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Seed from existing city_id data (map city_id to destination via legacy_city_id)
INSERT INTO public.collection_destinations (collection_id, destination_id)
SELECT c.id, d.id
FROM public.collections c
JOIN public.destinations d ON d.legacy_city_id = c.city_id
WHERE c.city_id IS NOT NULL
ON CONFLICT DO NOTHING;
