import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Navigation } from '@/components/Navigation';
import { logger } from '@/utils/logger';
import { 
  Settings, 
  Users, 
  FileText, 
  MessageSquare, 
  Shield, 
  Activity, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Download,
  Upload,
  Clock,
  AlertTriangle,
  Eye
} from 'lucide-react';

interface Experience {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  category: string;
  creator: string;
  status: string;
  created_at: string;
  created_by: string;
}

interface ChatbotKnowledge {
  id: string;
  category: string;
  keywords: string[];
  response_template: string;
  parameters: any;
  priority: number;
  is_active: boolean;
  created_at: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values: any;
  new_values: any;
  created_at: string;
  profiles: { full_name: string; email: string };
}

interface ContentApproval {
  id: string;
  content_type: string;
  content_id: string;
  status: string;
  review_notes: string;
  submitted_at: string;
  reviewed_at: string;
  original_data: any;
  submitted_by: string;
  profiles: { full_name: string; email: string };
}

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
  updated_at: string;
}

interface TeamAssignment {
  id: string;
  user_id: string;
  region: string;
  specialties: string[];
  is_active: boolean;
  created_at: string;
  profiles: { full_name: string; email: string };
}

export default function ManagementDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Data states
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [chatbotKnowledge, setChatbotKnowledge] = useState<ChatbotKnowledge[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [contentApprovals, setContentApprovals] = useState<ContentApproval[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [teamAssignments, setTeamAssignments] = useState<TeamAssignment[]>([]);

  // Form states
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [selectedKnowledge, setSelectedKnowledge] = useState<ChatbotKnowledge | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'experience' | 'knowledge' | 'team'>('experience');

  // Check user authorization
  useEffect(() => {
    const checkAuth = async () => {
      logger.debug('ManagementDashboard: Checking auth state');
      
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      if (!isAuthenticated || !user) {
        logger.debug('ManagementDashboard: Not authenticated, redirecting');
        navigate('/auth');
        return;
      }

      try {
        // Fetch role from user_roles table (roles are stored separately for security)
        // Using type assertion since types may not be regenerated yet
        const { data: roleData, error: roleError } = await (supabase as any)
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (roleError) {
          logger.error('ManagementDashboard: Role fetch error');
        }
        
        const userRole = roleData?.role as string | undefined;
        if (!userRole || !['admin', 'team_member', 'creator'].includes(userRole)) {
          logger.debug('ManagementDashboard: Access denied');
          toast({
            title: "Access Denied",
            description: `You don't have permission to access this dashboard.`,
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        logger.debug('ManagementDashboard: Access granted');
        setUserRole(userRole);
        await fetchAllData();
      } catch (error) {
        logger.error('ManagementDashboard: Authorization check failed');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [user, isAuthenticated, authLoading, navigate, toast]);

  // Fetch all dashboard data - using mock data since tables don't exist yet
  const fetchAllData = async () => {
    // Mock data for demonstration
    setExperiences([
      { id: '1', title: 'Jet Ski Adventure', description: 'Thrilling experience', location: 'Dar es Salaam', price: 75, category: 'Water Sports', creator: 'Beach Co', status: 'active', created_at: new Date().toISOString(), created_by: '1' },
      { id: '2', title: 'Spice Farm Tour', description: 'Cultural experience', location: 'Zanzibar', price: 45, category: 'Culture', creator: 'Island Tours', status: 'active', created_at: new Date().toISOString(), created_by: '1' }
    ]);
    setChatbotKnowledge([]);
    setAuditLogs([]);
    setContentApprovals([]);
    setSystemSettings([]);
    setTeamAssignments([]);
  };

  // Handle experience operations - mock for now
  const handleExperienceAction = async (action: 'approve' | 'reject' | 'delete', experienceId: string) => {
    if (action === 'delete') {
      setExperiences(prev => prev.filter(e => e.id !== experienceId));
      toast({ title: "Success", description: "Experience deleted successfully (Demo mode)" });
    } else {
      const status = action === 'approve' ? 'active' : 'inactive';
      setExperiences(prev => prev.map(e => e.id === experienceId ? { ...e, status } : e));
      toast({ title: "Success", description: `Experience ${action}d successfully (Demo mode)` });
    }
  };

  // Handle chatbot knowledge operations - mock for now
  const handleKnowledgeToggle = async (knowledgeId: string, isActive: boolean) => {
    setChatbotKnowledge(prev => prev.map(k => k.id === knowledgeId ? { ...k, is_active: isActive } : k));
    toast({ title: "Success", description: "Knowledge base updated (Demo mode)" });
  };

  // Handle approval workflow - mock for now
  const handleApprovalAction = async (approvalId: string, action: 'approve' | 'reject', notes: string = '') => {
    setContentApprovals(prev => prev.map(a => a.id === approvalId ? {
      ...a,
      status: action === 'approve' ? 'approved' : 'rejected',
      review_notes: notes,
      reviewed_at: new Date().toISOString()
    } : a));
    toast({ title: "Success", description: `Content ${action}d successfully (Demo mode)` });
  };

  // Handle system settings - mock for now
  const handleSettingUpdate = async (settingKey: string, newValue: any) => {
    setSystemSettings(prev => prev.map(s => s.setting_key === settingKey ? { ...s, setting_value: newValue } : s));
    toast({ title: "Success", description: "Setting updated (Demo mode)" });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const stats = {
    totalExperiences: experiences.length,
    activeExperiences: experiences.filter(e => e.status === 'active').length,
    pendingApprovals: contentApprovals.filter(a => a.status === 'pending').length,
    totalKnowledge: chatbotKnowledge.length,
    activeKnowledge: chatbotKnowledge.filter(k => k.is_active).length,
    teamMembers: teamAssignments.length
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Management Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive management interface for experiences, chatbot, and system settings
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="experiences" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Experiences
            </TabsTrigger>
            <TabsTrigger value="chatbot" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chatbot
            </TabsTrigger>
            <TabsTrigger value="approvals" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Approvals
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Teams
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Experiences</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalExperiences}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeExperiences} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
                  <p className="text-xs text-muted-foreground">
                    Require review
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Chatbot Knowledge</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalKnowledge}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeKnowledge} active entries
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.teamMembers}</div>
                  <p className="text-xs text-muted-foreground">
                    Active assignments
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system changes and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center space-x-4">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {log.profiles?.full_name || 'System'} {log.action.toLowerCase()} {log.table_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant={log.action === 'DELETE' ? 'destructive' : log.action === 'INSERT' ? 'default' : 'secondary'}>
                        {log.action}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Experiences Tab */}
          <TabsContent value="experiences" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Experience Management</h2>
              <Button onClick={() => navigate('/create-experience')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Experience
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {experiences.map((experience) => (
                      <TableRow key={experience.id}>
                        <TableCell className="font-medium">{experience.title}</TableCell>
                        <TableCell>{experience.location}</TableCell>
                        <TableCell>${experience.price}</TableCell>
                        <TableCell>
                          <Badge variant={experience.status === 'active' ? 'default' : 'secondary'}>
                            {experience.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(experience.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {userRole === 'admin' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleExperienceAction('approve', experience.id)}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleExperienceAction('reject', experience.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Experience</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the experience.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleExperienceAction('delete', experience.id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chatbot Tab */}
          <TabsContent value="chatbot" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Chatbot Knowledge Base</h2>
              <Dialog open={isDialogOpen && dialogType === 'knowledge'} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setDialogType('knowledge')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Knowledge
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Chatbot Knowledge</DialogTitle>
                    <DialogDescription>
                      Create a new knowledge entry for the chatbot
                    </DialogDescription>
                  </DialogHeader>
                  {/* Knowledge form would go here */}
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Keywords</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chatbotKnowledge.map((knowledge) => (
                      <TableRow key={knowledge.id}>
                        <TableCell className="font-medium">{knowledge.category}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {knowledge.keywords.slice(0, 3).map((keyword, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {knowledge.keywords.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{knowledge.keywords.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{knowledge.priority}</TableCell>
                        <TableCell>
                          <Switch
                            checked={knowledge.is_active}
                            onCheckedChange={(checked) => handleKnowledgeToggle(knowledge.id, checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approvals Tab */}
          <TabsContent value="approvals" className="space-y-6">
            <h2 className="text-2xl font-bold">Content Approvals</h2>
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content Type</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contentApprovals.map((approval) => (
                      <TableRow key={approval.id}>
                        <TableCell className="font-medium capitalize">{approval.content_type}</TableCell>
                        <TableCell>{approval.profiles?.full_name || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge variant={
                            approval.status === 'pending' ? 'secondary' :
                            approval.status === 'approved' ? 'default' : 'destructive'
                          }>
                            {approval.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(approval.submitted_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {approval.status === 'pending' && userRole === 'admin' && (
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => handleApprovalAction(approval.id, 'approve')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleApprovalAction(approval.id, 'reject')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-6">
            <h2 className="text-2xl font-bold">Audit Logs</h2>
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.profiles?.full_name || 'System'}</TableCell>
                        <TableCell>
                          <Badge variant={
                            log.action === 'DELETE' ? 'destructive' :
                            log.action === 'INSERT' ? 'default' : 'secondary'
                          }>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{log.table_name}</TableCell>
                        <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Team Management</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Specialties</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{assignment.profiles?.full_name}</TableCell>
                        <TableCell>{assignment.region}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {assignment.specialties.map((specialty, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={assignment.is_active ? 'default' : 'secondary'}>
                            {assignment.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(assignment.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold">System Settings</h2>
            
            <div className="grid gap-6">
              {systemSettings.map((setting) => (
                <Card key={setting.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{setting.setting_key.replace(/_/g, ' ').toUpperCase()}</CardTitle>
                    <CardDescription>{setting.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-4">
                      {typeof setting.setting_value === 'boolean' ? (
                        <Switch
                          checked={setting.setting_value}
                          onCheckedChange={(checked) => handleSettingUpdate(setting.setting_key, checked)}
                        />
                      ) : (
                        <Input
                          value={JSON.stringify(setting.setting_value).replace(/"/g, '')}
                          onChange={(e) => {
                            const value = isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value);
                            handleSettingUpdate(setting.setting_key, value);
                          }}
                          className="max-w-xs"
                        />
                      )}
                      <span className="text-sm text-muted-foreground">
                        Last updated: {new Date(setting.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}