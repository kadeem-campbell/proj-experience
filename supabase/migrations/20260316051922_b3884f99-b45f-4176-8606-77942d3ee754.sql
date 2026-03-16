
-- ============================================================
-- SECTION 1: Core social graph + missing entity tables
-- ============================================================

-- 1. User Follows (host, user, destination)
CREATE TABLE public.user_follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  followed_id uuid NOT NULL,
  followed_type text NOT NULL DEFAULT 'host',
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, followed_id, followed_type)
);
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own follows" ON public.user_follows FOR ALL TO authenticated
  USING (follower_id = auth.uid()) WITH CHECK (follower_id = auth.uid());
CREATE POLICY "Anyone can view follows" ON public.user_follows FOR SELECT TO public
  USING (true);

-- 2. User Saves (save-for-later, distinct from likes)
CREATE TABLE public.user_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  item_id text NOT NULL,
  item_type text NOT NULL DEFAULT 'experience',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, item_id, item_type)
);
ALTER TABLE public.user_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saves" ON public.user_saves FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Anyone can view saves count" ON public.user_saves FOR SELECT TO public
  USING (true);

-- 3. Questions (experience or itinerary specific)
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  entity_type text NOT NULL DEFAULT 'experience',
  user_id uuid NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  vote_count int DEFAULT 0,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view questions" ON public.questions FOR SELECT TO public USING (true);
CREATE POLICY "Auth users create questions" ON public.questions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users manage own questions" ON public.questions FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin manage all questions" ON public.questions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. Answers
CREATE TABLE public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  body text NOT NULL,
  is_best boolean DEFAULT false,
  vote_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view answers" ON public.answers FOR SELECT TO public USING (true);
CREATE POLICY "Auth users create answers" ON public.answers FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users manage own answers" ON public.answers FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admin manage all answers" ON public.answers FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- 5. Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  body text DEFAULT '',
  entity_id uuid,
  entity_type text,
  actor_id uuid,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "Users mark own read" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 6. Experience relationships (pairing, substitution, similar)
CREATE TABLE public.experience_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL,
  target_id uuid NOT NULL,
  relationship_type text NOT NULL DEFAULT 'pairing',
  score numeric DEFAULT 1.0,
  source_type text NOT NULL DEFAULT 'product',
  created_at timestamptz DEFAULT now(),
  UNIQUE(source_id, target_id, relationship_type)
);
ALTER TABLE public.experience_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view relationships" ON public.experience_relationships FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage relationships" ON public.experience_relationships FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 7. Experience tags
CREATE TABLE public.experience_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  entity_type text NOT NULL DEFAULT 'product',
  tag text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(entity_id, tag)
);
ALTER TABLE public.experience_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view tags" ON public.experience_tags FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage tags" ON public.experience_tags FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 8. Quality scores
CREATE TABLE public.quality_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  entity_type text NOT NULL,
  overall_score int DEFAULT 0,
  title_score int DEFAULT 0,
  media_score int DEFAULT 0,
  metadata_score int DEFAULT 0,
  relation_score int DEFAULT 0,
  schema_score int DEFAULT 0,
  pairing_score int DEFAULT 0,
  question_score int DEFAULT 0,
  conversion_score int DEFAULT 0,
  computed_at timestamptz DEFAULT now(),
  UNIQUE(entity_id, entity_type)
);
ALTER TABLE public.quality_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view quality scores" ON public.quality_scores FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage quality_scores" ON public.quality_scores FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 9. Redirect registry
CREATE TABLE public.redirect_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_path text NOT NULL UNIQUE,
  target_path text NOT NULL,
  status_code int DEFAULT 301,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  notes text DEFAULT ''
);
ALTER TABLE public.redirect_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view redirects" ON public.redirect_registry FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage redirects" ON public.redirect_registry FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 10. Itinerary copies tracking
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS copied_from uuid;
ALTER TABLE public.itineraries ADD COLUMN IF NOT EXISTS copy_count int DEFAULT 0;

-- 11. Add copy_count to public_itineraries
ALTER TABLE public.public_itineraries ADD COLUMN IF NOT EXISTS copy_count int DEFAULT 0;
ALTER TABLE public.public_itineraries ADD COLUMN IF NOT EXISTS save_count int DEFAULT 0;

-- 12. Add persona/best-for to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS best_for text[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pair_with_ids uuid[] DEFAULT '{}';
