-- Fix PUBLIC_DATA_EXPOSURE: Restrict anonymous access to itineraries
-- Drop the existing policy that allows anonymous access to public itineraries
DROP POLICY IF EXISTS "Users can view their own itineraries" ON public.itineraries;

-- Create new policy that requires authentication to view any itineraries
-- Users can view their own itineraries OR public itineraries, but must be authenticated
CREATE POLICY "Authenticated users can view itineraries"
ON public.itineraries
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR (is_public = true));

-- Block anonymous access completely
CREATE POLICY "Deny anonymous access to itineraries"
ON public.itineraries
FOR SELECT
TO anon
USING (false);