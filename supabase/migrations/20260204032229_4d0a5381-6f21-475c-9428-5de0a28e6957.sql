-- Fix itineraries RLS policy conflict by consolidating SELECT policies
-- Remove the separate "deny anonymous" policy and create a single clear policy

-- Drop existing conflicting SELECT policies
DROP POLICY IF EXISTS "Deny anonymous access to itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Authenticated users can view itineraries" ON public.itineraries;

-- Create a single consolidated SELECT policy that:
-- 1. Only allows authenticated users (TO authenticated)
-- 2. Allows viewing own itineraries, public itineraries, or itineraries where user is a collaborator
CREATE POLICY "Authenticated users can view itineraries"
ON public.itineraries
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR is_public = true 
  OR auth.uid()::text = ANY(collaborators)
);

-- Ensure RLS is enabled
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;