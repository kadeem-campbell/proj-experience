-- Drop the restrictive SELECT policy and replace with PERMISSIVE
DROP POLICY IF EXISTS "Authenticated users can view itineraries" ON public.itineraries;

-- Create permissive policy that allows:
-- 1. Owner to view their own itineraries
-- 2. Anyone to view public itineraries (even unauthenticated)
-- 3. Collaborators to view shared itineraries
CREATE POLICY "Anyone can view public itineraries"
ON public.itineraries
FOR SELECT
USING (
  is_public = true 
  OR auth.uid() = user_id 
  OR (auth.uid())::text = ANY (collaborators)
);