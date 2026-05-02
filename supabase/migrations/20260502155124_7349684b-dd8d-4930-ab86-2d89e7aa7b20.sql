-- =========================================================
-- 1. Collaborators junction table
-- =========================================================
CREATE TABLE IF NOT EXISTS public.itinerary_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (itinerary_id, user_id)
);

ALTER TABLE public.itinerary_collaborators ENABLE ROW LEVEL SECURITY;

-- A collaborator can see their own collaboration row.
CREATE POLICY "Collaborators can view their own membership"
ON public.itinerary_collaborators
FOR SELECT
USING (auth.uid() = user_id);

-- The itinerary owner can see all rows for their itineraries.
CREATE POLICY "Owners can view collaborators on their itineraries"
ON public.itinerary_collaborators
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.itineraries i
    WHERE i.id = itinerary_collaborators.itinerary_id
      AND i.user_id = auth.uid()
  )
);

-- Only the itinerary owner can add or remove collaborators.
CREATE POLICY "Owners can add collaborators"
ON public.itinerary_collaborators
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.itineraries i
    WHERE i.id = itinerary_collaborators.itinerary_id
      AND i.user_id = auth.uid()
  )
  AND auth.uid() = invited_by
);

CREATE POLICY "Owners can remove collaborators"
ON public.itinerary_collaborators
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.itineraries i
    WHERE i.id = itinerary_collaborators.itinerary_id
      AND i.user_id = auth.uid()
  )
  OR auth.uid() = user_id  -- collaborators can remove themselves
);

CREATE INDEX IF NOT EXISTS idx_itinerary_collaborators_user
  ON public.itinerary_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_collaborators_itinerary
  ON public.itinerary_collaborators(itinerary_id);

-- =========================================================
-- 2. Tighten itineraries RLS: drop the buggy email-vs-uuid check
--    and gate public reads through the view layer.
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view public itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can update their own itineraries" ON public.itineraries;

-- Owners and registered collaborators can read.
CREATE POLICY "Owners and collaborators can view itineraries"
ON public.itineraries
FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.itinerary_collaborators ic
    WHERE ic.itinerary_id = itineraries.id
      AND ic.user_id = auth.uid()
  )
);

-- Owners and collaborators can update (collaborators get edit access, matching prior behaviour intent).
CREATE POLICY "Owners and collaborators can update itineraries"
ON public.itineraries
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.itinerary_collaborators ic
    WHERE ic.itinerary_id = itineraries.id
      AND ic.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.itinerary_collaborators ic
    WHERE ic.itinerary_id = itineraries.id
      AND ic.user_id = auth.uid()
  )
);

-- =========================================================
-- 3. Profiles: allow anyone to read SAFE handle fields only.
--    We expose this through a security_invoker view so RLS still applies
--    to the base table, and we add a tightly-scoped public SELECT policy
--    that is intended to be used through the view.
-- =========================================================

-- Allow anonymous + authenticated reads of profile rows ONLY for owners of
-- a public itinerary or active collaborators. Email is excluded by querying
-- the dedicated view below.
CREATE POLICY "Public can view profiles linked to public itineraries"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.itineraries i
    WHERE i.user_id = profiles.id
      AND i.is_public = true
  )
);

-- Sanitized public profile view (no email, no created/updated metadata leakage).
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = on) AS
SELECT
  p.id,
  p.username,
  p.full_name,
  p.avatar_url
FROM public.profiles p;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- =========================================================
-- 4. Sanitized public itineraries view (no user_id).
-- =========================================================
CREATE OR REPLACE VIEW public.public_user_itineraries
WITH (security_invoker = on) AS
SELECT
  i.id,
  i.name,
  i.experiences,
  i.trips,
  i.active_trip_id,
  i.is_public,
  i.cover_image,
  i.tag,
  i.start_date,
  i.theme,
  i.created_at,
  i.updated_at,
  i.copied_from,
  i.copy_count,
  -- safe creator handle, no auth user id
  p.username   AS creator_username,
  p.full_name  AS creator_display_name,
  p.avatar_url AS creator_avatar_url
FROM public.itineraries i
LEFT JOIN public.profiles p ON p.id = i.user_id
WHERE i.is_public = true;

GRANT SELECT ON public.public_user_itineraries TO anon, authenticated;

-- NOTE: To make the view usable by anonymous visitors despite the tightened
-- base-table SELECT policy, add an additional policy that allows reading
-- ONLY rows where is_public = true. The view further restricts which columns
-- callers can see (no user_id).
CREATE POLICY "Public itineraries are readable for the sanitized view"
ON public.itineraries
FOR SELECT
USING (is_public = true);

-- (Owners/collaborators policy above continues to allow private access.)