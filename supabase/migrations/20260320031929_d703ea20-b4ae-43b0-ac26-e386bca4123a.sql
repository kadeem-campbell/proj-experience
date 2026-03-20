
-- Timing templates (reusable patterns)
CREATE TABLE public.timing_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  template_type TEXT NOT NULL DEFAULT 'standard',
  peak_start_hour INT NOT NULL DEFAULT 8,
  peak_end_hour INT NOT NULL DEFAULT 11,
  secondary_start_hour INT,
  secondary_end_hour INT,
  low_start_hour INT,
  low_end_hour INT,
  hourly_scores JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.timing_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read timing_templates" ON public.timing_templates FOR SELECT USING (true);
CREATE POLICY "Admin manage timing_templates" ON public.timing_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Product timing profiles
CREATE TABLE public.product_timing_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  profile_label TEXT NOT NULL DEFAULT 'Default',
  profile_type TEXT NOT NULL DEFAULT 'default',
  template_id UUID REFERENCES public.timing_templates(id),
  local_timezone TEXT NOT NULL DEFAULT 'Africa/Dar_es_Salaam',
  start_date DATE,
  end_date DATE,
  peak_start_hour INT NOT NULL DEFAULT 8,
  peak_end_hour INT NOT NULL DEFAULT 11,
  secondary_start_hour INT,
  secondary_end_hour INT,
  low_start_hour INT,
  low_end_hour INT,
  hourly_scores JSONB NOT NULL DEFAULT '[]',
  confidence_score NUMERIC DEFAULT 0.8,
  flexibility_level TEXT DEFAULT 'moderate',
  reason_tags JSONB DEFAULT '[]',
  timing_note TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, profile_type, start_date)
);
ALTER TABLE public.product_timing_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_timing_profiles" ON public.product_timing_profiles FOR SELECT USING (true);
CREATE POLICY "Admin manage product_timing_profiles" ON public.product_timing_profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_product_timing_product ON public.product_timing_profiles(product_id);
CREATE INDEX idx_product_timing_active ON public.product_timing_profiles(product_id, is_active) WHERE is_active = true;
