CREATE OR REPLACE FUNCTION public.guard_unique_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slug IS NULL OR length(trim(NEW.slug)) = 0 THEN
    RAISE EXCEPTION 'Slug cannot be empty' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Slug "%" must be lowercase letters, numbers and hyphens only', NEW.slug USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;