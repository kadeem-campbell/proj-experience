/**
 * Admin Notifications — view/manage system notifications for all users.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bell, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export const AdminNotificationsSection = () => {
  const qc = useQueryClient();
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      return data || [];
    },
  });

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-notifications'] });
    toast.success('Deleted');
  };

  const NOTIFICATION_TYPES: Record<string, string> = {
    itinerary_copied: 'Itinerary Copied',
    itinerary_liked: 'Itinerary Liked',
    new_follower: 'New Follower',
    question_answered: 'Question Answered',
    host_published: 'Host Published',
    plan_updated: 'Plan Updated',
    system: 'System',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Notifications</h2>
        <p className="text-sm text-muted-foreground">System-wide notification log and broadcast tools</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{notifications.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Unread</p>
          <p className="text-2xl font-bold text-primary">{notifications.filter((n: any) => !n.is_read).length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Unique Types</p>
          <p className="text-2xl font-bold">{new Set(notifications.map((n: any) => n.type)).size}</p>
        </Card>
      </div>

      {/* Recent notifications */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="w-28">Type</TableHead>
              <TableHead className="w-16">Read</TableHead>
              <TableHead className="w-32">Created</TableHead>
              <TableHead className="w-16">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : notifications.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No notifications</TableCell></TableRow>
            ) : (
              notifications.slice(0, 100).map((n: any) => (
                <TableRow key={n.id}>
                  <TableCell>
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground line-clamp-1">{n.body}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{NOTIFICATION_TYPES[n.type] || n.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={n.is_read ? 'secondary' : 'default'} className="text-[10px]">
                      {n.is_read ? 'Read' : 'New'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteNotification(n.id)}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
