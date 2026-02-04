-- Create table for storing user likes (experiences and itineraries)
CREATE TABLE public.user_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('experience', 'itinerary')),
  item_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id, item_type)
);

-- Enable Row Level Security
ALTER TABLE public.user_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for user likes
CREATE POLICY "Users can view their own likes"
ON public.user_likes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own likes"
ON public.user_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
ON public.user_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for fast lookups
CREATE INDEX idx_user_likes_user_id ON public.user_likes(user_id);
CREATE INDEX idx_user_likes_item ON public.user_likes(user_id, item_id, item_type);