CREATE TABLE public.creator_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(creator_id, category_id)
);

ALTER TABLE public.creator_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view creator categories" ON public.creator_categories FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can manage creator categories" ON public.creator_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);