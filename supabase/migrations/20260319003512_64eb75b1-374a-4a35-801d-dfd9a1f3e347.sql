
-- =============================================================
-- OPTIONS TABLE: tighten to spec
-- =============================================================
ALTER TABLE public.options
  ADD COLUMN IF NOT EXISTS option_type text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS is_default_option boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS capacity_min integer,
  ADD COLUMN IF NOT EXISTS capacity_max integer,
  ADD COLUMN IF NOT EXISTS duration_minutes integer,
  ADD COLUMN IF NOT EXISTS availability_mode text DEFAULT 'on_request',
  ADD COLUMN IF NOT EXISTS start_time_rule text;

ALTER TABLE public.options
  DROP COLUMN IF EXISTS tier,
  DROP COLUMN IF EXISTS format_type,
  DROP COLUMN IF EXISTS group_size,
  DROP COLUMN IF EXISTS display_order;

-- =============================================================
-- PRICE_OPTIONS TABLE: tighten to spec
-- =============================================================
ALTER TABLE public.price_options
  ADD COLUMN IF NOT EXISTS pricing_category text DEFAULT 'adult',
  ADD COLUMN IF NOT EXISTS pricing_unit text DEFAULT 'per_person',
  ADD COLUMN IF NOT EXISTS valid_from date,
  ADD COLUMN IF NOT EXISTS valid_to date;

ALTER TABLE public.price_options RENAME COLUMN currency TO currency_code;
ALTER TABLE public.price_options
  DROP COLUMN IF EXISTS label,
  DROP COLUMN IF EXISTS original_amount,
  DROP COLUMN IF EXISTS display_order;

-- =============================================================
-- PRODUCT_HOSTS TABLE: add role_type & updated_at
-- =============================================================
ALTER TABLE public.product_hosts
  ADD COLUMN IF NOT EXISTS role_type text DEFAULT 'operator',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.product_hosts
  DROP COLUMN IF EXISTS display_order;
