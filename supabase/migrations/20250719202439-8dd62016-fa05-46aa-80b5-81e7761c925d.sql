-- Add RLS policy for creators to manage their own experiences
CREATE POLICY "Creators can manage their own experiences"
ON public.experiences
FOR ALL
USING (auth.uid() = created_by);