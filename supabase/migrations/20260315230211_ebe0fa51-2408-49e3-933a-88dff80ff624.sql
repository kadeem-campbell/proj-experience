-- Backfill products from legacy experiences so routing and entity pages resolve without fallback paths.

-- 1) Fill destination_id from linked legacy experience location when missing
UPDATE public.products p
SET destination_id = d.id,
    updated_at = now()
FROM public.experiences e,
     public.destinations d
WHERE p.legacy_experience_id = e.id
  AND p.destination_id IS NULL
  AND lower(trim(e.location)) = lower(trim(d.name));

-- 2) Fallback: fill destination_id from product slug/title prefix when still missing
UPDATE public.products p
SET destination_id = d.id,
    updated_at = now()
FROM public.destinations d
WHERE p.destination_id IS NULL
  AND (
    p.slug = d.slug
    OR p.slug LIKE d.slug || '-%'
    OR lower(p.title) = lower(d.name)
    OR lower(p.title) LIKE lower(d.name) || ' %'
  );

-- 3) Fill area_id from destination-scoped area name / slug matches when missing
UPDATE public.products p
SET area_id = a.id,
    updated_at = now()
FROM public.experiences e,
     public.areas a
WHERE p.legacy_experience_id = e.id
  AND p.destination_id IS NOT NULL
  AND p.area_id IS NULL
  AND a.destination_id = p.destination_id
  AND (
       lower(e.location) LIKE '%' || lower(a.name) || '%'
    OR lower(p.slug) LIKE '%' || lower(a.slug) || '%'
    OR lower(p.title) LIKE '%' || lower(a.name) || '%'
  );

-- 4) Backfill canonical_url to the new product route when possible
UPDATE public.products p
SET canonical_url = '/things-to-do/' || d.slug || '/' || p.slug,
    updated_at = now()
FROM public.destinations d
WHERE p.destination_id = d.id
  AND (p.canonical_url IS NULL OR p.canonical_url = '' OR p.canonical_url LIKE '%/explore/%');

-- 5) Create missing host records from legacy creators when there is no mapped host yet
INSERT INTO public.hosts (
  username,
  slug,
  display_name,
  bio,
  is_active,
  is_verified,
  created_at,
  updated_at
)
SELECT DISTINCT
  lower(trim(both '-' from regexp_replace(trim(e.creator), '[^a-zA-Z0-9]+', '-', 'g'))) AS username,
  lower(trim(both '-' from regexp_replace(trim(e.creator), '[^a-zA-Z0-9]+', '-', 'g'))) AS slug,
  trim(e.creator) AS display_name,
  '' AS bio,
  true,
  false,
  now(),
  now()
FROM public.experiences e
LEFT JOIN public.hosts h
  ON lower(h.slug) = lower(trim(both '-' from regexp_replace(trim(e.creator), '[^a-zA-Z0-9]+', '-', 'g')))
WHERE trim(coalesce(e.creator, '')) <> ''
  AND h.id IS NULL;

-- 6) Link products to hosts from linked legacy experience creator where missing
INSERT INTO public.product_hosts (product_id, host_id, is_primary, display_order, created_at)
SELECT p.id, h.id, true, 0, now()
FROM public.products p
JOIN public.experiences e
  ON p.legacy_experience_id = e.id
JOIN public.hosts h
  ON lower(h.slug) = lower(trim(both '-' from regexp_replace(trim(e.creator), '[^a-zA-Z0-9]+', '-', 'g')))
LEFT JOIN public.product_hosts ph
  ON ph.product_id = p.id
 AND ph.host_id = h.id
WHERE trim(coalesce(e.creator, '')) <> ''
  AND ph.id IS NULL;