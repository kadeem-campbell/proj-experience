
-- Drop RLS policy that depends on is_active
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;

-- Drop deprecated columns (is_active first since policy is gone now)
ALTER TABLE public.products
  DROP COLUMN IF EXISTS best_time,
  DROP COLUMN IF EXISTS weather,
  DROP COLUMN IF EXISTS tier,
  DROP COLUMN IF EXISTS format_type,
  DROP COLUMN IF EXISTS rating,
  DROP COLUMN IF EXISTS like_count,
  DROP COLUMN IF EXISTS view_count,
  DROP COLUMN IF EXISTS latitude,
  DROP COLUMN IF EXISTS longitude,
  DROP COLUMN IF EXISTS is_active,
  DROP COLUMN IF EXISTS is_indexable,
  DROP COLUMN IF EXISTS best_for,
  DROP COLUMN IF EXISTS pair_with_ids,
  DROP COLUMN IF EXISTS legacy_experience_id,
  DROP COLUMN IF EXISTS duration;

-- Recreate public read policy using visibility_output_state instead of is_active
CREATE POLICY "Anyone can view published products"
  ON public.products FOR SELECT
  USING (visibility_output_state != 'internal_only');
