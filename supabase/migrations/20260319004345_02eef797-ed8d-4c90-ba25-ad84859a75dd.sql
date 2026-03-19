
-- product_relationships: links products to each other with typed relationships
CREATE TABLE IF NOT EXISTS public.product_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  target_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'related',
  score NUMERIC(3,2) DEFAULT 0.5,
  reason_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(source_product_id, target_product_id, relationship_type),
  CHECK(source_product_id != target_product_id)
);

-- Enable RLS
ALTER TABLE public.product_relationships ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "product_relationships_public_read" ON public.product_relationships
  FOR SELECT TO anon, authenticated USING (true);

-- Admin write
CREATE POLICY "product_relationships_admin_write" ON public.product_relationships
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_product_rel_source ON public.product_relationships(source_product_id);
CREATE INDEX idx_product_rel_target ON public.product_relationships(target_product_id);
CREATE INDEX idx_product_rel_type ON public.product_relationships(relationship_type);

-- Add unique constraint on entity_documents for upsert support
CREATE UNIQUE INDEX IF NOT EXISTS idx_entity_docs_unique 
  ON public.entity_documents(entity_type, entity_id, document_type);
