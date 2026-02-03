import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { User, Briefcase } from 'lucide-react';

export const RoleSelector = () => {
  const { user, userProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [currentRole, setCurrentRole] = useState<'traveller' | 'creator'>('traveller');
  const [switching, setSwitching] = useState(false);

  // Initialize role from user profile
  useEffect(() => {
    if (userProfile?.role) {
      // Map database roles to UI roles
      const roleMapping: Record<string, 'traveller' | 'creator'> = {
        'user': 'traveller',
        'traveler': 'traveller', 
        'creator': 'creator',
        'admin': 'creator', // Admins can view as creators
        'team_member': 'creator'
      };
      setCurrentRole(roleMapping[userProfile.role] || 'traveller');
    }
  }, [userProfile]);

  const handleRoleSwitch = async (newRole: 'traveller' | 'creator') => {
    if (!user || newRole === currentRole) return;

    setSwitching(true);
    try {
      // Map UI roles to database roles
      const dbRole = newRole === 'traveller' ? 'traveler' : 'creator';
      
      // Use edge function for role changes (server-side validation)
      const { data, error } = await supabase.functions.invoke('change-role', {
        body: { role: dbRole }
      });

      if (error) throw error;

      // Update local state
      setCurrentRole(newRole);
      
      // Refresh user profile to get updated data
      await refreshProfile?.();
      
      toast({
        title: `Switched to ${newRole}`,
        description: `You're now viewing the app as a ${newRole}`,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch role';
      toast({
        title: "Error switching role",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSwitching(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">View as:</span>
            <Badge variant={currentRole === 'traveller' ? 'default' : 'secondary'}>
              {currentRole === 'traveller' ? (
                <User className="w-3 h-3 mr-1" />
              ) : (
                <Briefcase className="w-3 h-3 mr-1" />
              )}
              {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)}
            </Badge>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={currentRole === 'traveller' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleRoleSwitch('traveller')}
            disabled={switching}
          >
            <User className="w-4 h-4 mr-2" />
            Traveller
          </Button>
          <Button
            variant={currentRole === 'creator' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleRoleSwitch('creator')}
            disabled={switching}
          >
            <Briefcase className="w-4 h-4 mr-2" />
            Creator
          </Button>
        </div>
      </div>
    </Card>
  );
};