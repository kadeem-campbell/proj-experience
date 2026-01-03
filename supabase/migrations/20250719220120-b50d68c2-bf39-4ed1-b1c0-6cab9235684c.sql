-- Create audit logs table for tracking all system changes
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content approval workflow table
CREATE TABLE public.content_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL, -- 'experience' or 'chatbot_knowledge'
  content_id UUID NOT NULL,
  submitted_by UUID REFERENCES public.profiles(id),
  reviewed_by UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  review_notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  original_data JSONB NOT NULL,
  changes_requested JSONB
);

-- Create system settings table for configurable options
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team assignments table for organizing ground teams
CREATE TABLE public.team_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  region TEXT NOT NULL,
  specialties TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (get_current_user_role() = 'admin');

CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for content_approvals
CREATE POLICY "Team members can view relevant approvals" 
ON public.content_approvals 
FOR SELECT 
USING (
  get_current_user_role() IN ('admin', 'team_member') OR 
  submitted_by = auth.uid() OR 
  reviewed_by = auth.uid()
);

CREATE POLICY "Team members can create approval requests" 
ON public.content_approvals 
FOR INSERT 
WITH CHECK (
  get_current_user_role() IN ('admin', 'team_member') AND 
  submitted_by = auth.uid()
);

CREATE POLICY "Admins can update approval status" 
ON public.content_approvals 
FOR UPDATE 
USING (get_current_user_role() = 'admin');

-- RLS Policies for system_settings
CREATE POLICY "Admins can manage system settings" 
ON public.system_settings 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Team members can view system settings" 
ON public.system_settings 
FOR SELECT 
USING (get_current_user_role() IN ('admin', 'team_member'));

-- RLS Policies for team_assignments
CREATE POLICY "Team members can view assignments" 
ON public.team_assignments 
FOR SELECT 
USING (
  get_current_user_role() IN ('admin', 'team_member') OR 
  user_id = auth.uid()
);

CREATE POLICY "Admins can manage team assignments" 
ON public.team_assignments 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Create triggers for audit logging
CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, OLD.id, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_values)
    VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, NEW.id, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to important tables
CREATE TRIGGER experiences_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.experiences
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER profiles_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

CREATE TRIGGER chatbot_knowledge_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.chatbot_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_function();

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('max_file_upload_size', '"10MB"', 'Maximum file upload size for experiences'),
('auto_approve_team_edits', 'false', 'Automatically approve edits from team members'),
('require_approval_for_new_experiences', 'true', 'Require admin approval for new experiences'),
('chatbot_confidence_threshold', '0.7', 'Minimum confidence score for chatbot responses'),
('bulk_upload_batch_size', '100', 'Number of records to process per batch in bulk uploads');

-- Create updated_at triggers for new tables
CREATE TRIGGER update_content_approvals_updated_at
  BEFORE UPDATE ON public.content_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_assignments_updated_at
  BEFORE UPDATE ON public.team_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();