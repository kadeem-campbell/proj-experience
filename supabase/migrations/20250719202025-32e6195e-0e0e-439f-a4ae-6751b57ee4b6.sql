-- Create chatbot interactions table for storing conversation data and parameters
CREATE TABLE public.chatbot_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL DEFAULT gen_random_uuid(),
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'bot')),
  content TEXT NOT NULL,
  parameters JSONB DEFAULT '{}',
  experiences_found JSONB DEFAULT '[]',
  ground_team_data JSONB DEFAULT '{}',
  confidence_score NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chatbot_knowledge table for storing parametric information
CREATE TABLE public.chatbot_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  keywords TEXT[],
  response_template TEXT,
  parameters JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.chatbot_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_knowledge ENABLE ROW LEVEL SECURITY;

-- RLS policies for chatbot_interactions
CREATE POLICY "Users can view their own chatbot interactions"
ON public.chatbot_interactions
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create chatbot interactions"
ON public.chatbot_interactions
FOR INSERT
WITH CHECK (true);

-- RLS policies for chatbot_knowledge
CREATE POLICY "Everyone can view active chatbot knowledge"
ON public.chatbot_knowledge
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage chatbot knowledge"
ON public.chatbot_knowledge
FOR ALL
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Create trigger for updating chatbot_knowledge timestamps
CREATE TRIGGER update_chatbot_knowledge_updated_at
BEFORE UPDATE ON public.chatbot_knowledge
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial knowledge base entries
INSERT INTO public.chatbot_knowledge (category, keywords, response_template, parameters) VALUES
('adventure', ARRAY['adventure', 'extreme', 'thrill', 'adrenaline'], 
 'I found some amazing adventure experiences for you! Check out these high-energy activities:', 
 '{"experience_types": ["water_sports", "climbing", "extreme"], "priority_locations": ["dar_es_salaam", "zanzibar"]}'::jsonb),
 
('beach', ARRAY['beach', 'water', 'swimming', 'sun'], 
 'Perfect beach weather today! Here are the best beach experiences available:', 
 '{"weather_dependent": true, "crowd_factors": ["time_of_day", "season"], "popular_spots": ["coco_beach", "masaki"]}'::jsonb),
 
('food', ARRAY['food', 'eat', 'restaurant', 'local', 'cuisine'], 
 'Let me show you the best local food experiences! Our ground team has the latest updates:', 
 '{"include_street_food": true, "dietary_restrictions": ["vegetarian", "halal"], "price_ranges": ["budget", "mid", "luxury"]}'::jsonb),
 
('nightlife', ARRAY['party', 'night', 'club', 'music', 'dancing'], 
 'The nightlife scene is buzzing! Here are tonight''s hottest spots:', 
 '{"time_sensitive": true, "age_restrictions": true, "popular_venues": ["slipway", "masaki"], "event_types": ["live_music", "dj", "rooftop"]}'::jsonb);