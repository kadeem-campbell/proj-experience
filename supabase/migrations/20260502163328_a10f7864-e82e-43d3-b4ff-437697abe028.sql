
-- Break recursion between itineraries and itinerary_collaborators RLS via SECURITY DEFINER helpers.

CREATE OR REPLACE FUNCTION public.is_itinerary_owner(_itinerary_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.itineraries
    WHERE id = _itinerary_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_itinerary_collaborator(_itinerary_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.itinerary_collaborators
    WHERE itinerary_id = _itinerary_id AND user_id = _user_id
  );
$$;

-- Rebuild itineraries policies using the helper (no direct reference to itinerary_collaborators).
DROP POLICY IF EXISTS "Owners and collaborators can view itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Owners and collaborators can update itineraries" ON public.itineraries;

CREATE POLICY "Owners and collaborators can view itineraries"
ON public.itineraries
FOR SELECT
USING (
  auth.uid() = user_id
  OR public.is_itinerary_collaborator(id, auth.uid())
);

CREATE POLICY "Owners and collaborators can update itineraries"
ON public.itineraries
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.is_itinerary_collaborator(id, auth.uid())
)
WITH CHECK (
  auth.uid() = user_id
  OR public.is_itinerary_collaborator(id, auth.uid())
);

-- Rebuild itinerary_collaborators policies using helper (no direct reference to itineraries).
DROP POLICY IF EXISTS "Owners can view collaborators on their itineraries" ON public.itinerary_collaborators;
DROP POLICY IF EXISTS "Owners can add collaborators" ON public.itinerary_collaborators;
DROP POLICY IF EXISTS "Owners can remove collaborators" ON public.itinerary_collaborators;

CREATE POLICY "Owners can view collaborators on their itineraries"
ON public.itinerary_collaborators
FOR SELECT
USING (public.is_itinerary_owner(itinerary_id, auth.uid()));

CREATE POLICY "Owners can add collaborators"
ON public.itinerary_collaborators
FOR INSERT
WITH CHECK (
  public.is_itinerary_owner(itinerary_id, auth.uid())
  AND auth.uid() = invited_by
);

CREATE POLICY "Owners can remove collaborators"
ON public.itinerary_collaborators
FOR DELETE
USING (
  public.is_itinerary_owner(itinerary_id, auth.uid())
  OR auth.uid() = user_id
);
