-- Fix Issue 1: Add collaborator access to itineraries RLS policies
-- Drop existing policies that need to be updated
DROP POLICY IF EXISTS "Authenticated users can view itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can update their own itineraries" ON public.itineraries;

-- Recreate SELECT policy with collaborator access
CREATE POLICY "Authenticated users can view itineraries"
ON public.itineraries
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  is_public = true OR 
  auth.uid()::text = ANY(collaborators)
);

-- Recreate UPDATE policy with collaborator access
CREATE POLICY "Users can update their own itineraries"
ON public.itineraries
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id OR 
  auth.uid()::text = ANY(collaborators)
)
WITH CHECK (
  auth.uid() = user_id OR 
  auth.uid()::text = ANY(collaborators)
);