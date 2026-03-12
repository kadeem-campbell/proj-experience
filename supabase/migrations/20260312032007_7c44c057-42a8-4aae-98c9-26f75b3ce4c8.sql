
-- Function to handle like_count increment/decrement
CREATE OR REPLACE FUNCTION public.update_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment like_count on the target table
    IF NEW.item_type = 'experience' THEN
      UPDATE public.experiences SET like_count = COALESCE(like_count, 0) + 1 WHERE id::text = NEW.item_id;
    ELSIF NEW.item_type = 'itinerary' THEN
      UPDATE public.public_itineraries SET like_count = COALESCE(like_count, 0) + 1 WHERE id::text = NEW.item_id OR slug = NEW.item_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement like_count on the target table
    IF OLD.item_type = 'experience' THEN
      UPDATE public.experiences SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) WHERE id::text = OLD.item_id;
    ELSIF OLD.item_type = 'itinerary' THEN
      UPDATE public.public_itineraries SET like_count = GREATEST(COALESCE(like_count, 0) - 1, 0) WHERE id::text = OLD.item_id OR slug = OLD.item_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger on user_likes for INSERT
CREATE TRIGGER on_user_like_insert
  AFTER INSERT ON public.user_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_like_count();

-- Trigger on user_likes for DELETE
CREATE TRIGGER on_user_like_delete
  AFTER DELETE ON public.user_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_like_count();
