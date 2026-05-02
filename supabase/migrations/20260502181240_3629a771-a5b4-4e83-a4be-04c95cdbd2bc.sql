ALTER TABLE public.user_likes
DROP CONSTRAINT IF EXISTS user_likes_item_type_check;

ALTER TABLE public.user_likes
ADD CONSTRAINT user_likes_item_type_check
CHECK (item_type = ANY (ARRAY['experience'::text, 'product'::text, 'poi'::text, 'itinerary'::text]));