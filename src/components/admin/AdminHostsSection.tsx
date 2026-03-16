/**
 * Hosts & Creators section — full CRUD, profile management, merge support.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { AdminEntityTable } from './AdminEntityTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const toSlug = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

export const AdminHostsSection = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: hosts = [], isLoading } = useQuery({
    queryKey: ['admin-hosts-full'],
    queryFn: async () => { const { data } = await supabase.from('hosts').select('*').order('display_name'); return data || []; },
  });

  const { data: creators = [] } = useQuery({
    queryKey: ['admin-creators-full'],
    queryFn: async () => { const { data } = await supabase.from('creators').select('*').order('username'); return data || []; },
  });

  const { data: destinations = [] } = useQuery({
    queryKey: ['admin-dest-list'],
    queryFn: async () => { const { data } = await supabase.from('destinations').select('id, name').eq('is_active', true).order('name'); return data || []; },
  });

  const invalidate = () => {
    ['admin-hosts-full', 'admin-creators-full', 'admin-overview-counts'].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
  };

  const saveHost = async (item: any, isNew: boolean) => {
    const { id, created_at, updated_at, ...rest } = item;
    if (isNew) {
      const { error } = await supabase.from('hosts').insert(rest as any);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('hosts').update(rest as any).eq('id', id);
      if (error) throw error;
    }
    invalidate();
    toast({ title: isNew ? 'Host created' : 'Host saved' });
  };

  const deleteHost = async (ids: string[]) => {
    for (const id of ids) await supabase.from('hosts').delete().eq('id', id);
    invalidate();
    toast({ title: `Deleted ${ids.length} host(s)` });
  };

  const saveCreator = async (item: any, isNew: boolean) => {
    const { id, created_at, updated_at, ...rest } = item;
    if (isNew) {
      const { error } = await supabase.from('creators').insert(rest as any);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('creators').update(rest as any).eq('id', id);
      if (error) throw error;
    }
    invalidate();
    toast({ title: isNew ? 'Creator created' : 'Creator saved' });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Hosts & Creators</h2>
      <p className="text-sm text-muted-foreground mb-4">Manage supply-side provider profiles</p>

      <Tabs defaultValue="hosts">
        <TabsList className="mb-4">
          <TabsTrigger value="hosts">Hosts ({hosts.length})</TabsTrigger>
          <TabsTrigger value="creators">Legacy Creators ({creators.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="hosts">
          <AdminEntityTable
            items={hosts}
            entityName="Host"
            isLoading={isLoading}
            columns={[
              { key: 'display_name', label: 'Name', width: 'flex-[2]', render: (h: any) => (
                <div className="flex items-center gap-2">
                  {h.avatar_url && <img src={h.avatar_url} className="w-5 h-5 rounded-full object-cover" alt="" />}
                  <span className="font-medium">{h.display_name || h.username}</span>
                  {h.is_verified && <Badge variant="outline" className="text-[10px]">✓</Badge>}
                </div>
              )},
              { key: 'slug', label: 'Slug', width: 'flex-1', render: (h: any) => <span className="text-xs font-mono text-muted-foreground">{h.slug}</span> },
              { key: 'is_active', label: 'Status', width: 'w-[80px]', render: (h: any) => <Badge variant={h.is_active ? 'default' : 'secondary'} className="text-[10px]">{h.is_active ? 'Active' : 'Off'}</Badge> },
            ]}
            defaultItem={{ username: '', display_name: '', slug: '', bio: '', avatar_url: '', is_active: true, is_verified: false }}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Username</Label><Input value={item.username || ''} onChange={e => { onChange('username', e.target.value); if (!item.id) onChange('slug', toSlug(e.target.value)); }} /></div>
                  <div><Label className="text-xs text-muted-foreground">Display Name</Label><Input value={item.display_name || ''} onChange={e => onChange('display_name', e.target.value)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Slug</Label><Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} className="font-mono text-xs" /></div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Bio</Label><Textarea value={item.bio || ''} onChange={e => onChange('bio', e.target.value)} rows={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Avatar URL</Label><Input value={item.avatar_url || ''} onChange={e => onChange('avatar_url', e.target.value)} /></div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Destination</Label>
                    <Select value={item.destination_id || ''} onValueChange={v => onChange('destination_id', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{destinations.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2"><Switch checked={item.is_verified ?? false} onCheckedChange={v => onChange('is_verified', v)} /><span className="text-xs">Verified</span></div>
                  <div className="flex items-center gap-2"><Switch checked={item.is_active ?? true} onCheckedChange={v => onChange('is_active', v)} /><span className="text-xs">{item.is_active ? 'Active' : 'Inactive'}</span></div>
                </div>
              </div>
            )}
            onSave={saveHost}
            onDelete={deleteHost}
          />
        </TabsContent>

        <TabsContent value="creators">
          <div className="mb-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-700">
            ⚠️ Legacy creators — migrate to Hosts for the normalized model. These records exist for backward compatibility.
          </div>
          <AdminEntityTable
            items={creators}
            entityName="Creator"
            columns={[
              { key: 'display_name', label: 'Name', width: 'flex-[2]', render: (c: any) => (
                <div className="flex items-center gap-2">
                  {c.avatar_url && <img src={c.avatar_url} className="w-5 h-5 rounded-full object-cover" alt="" />}
                  <span className="font-medium">{c.display_name || c.username}</span>
                </div>
              )},
              { key: 'username', label: 'Username', width: 'flex-1' },
              { key: 'is_active', label: 'Status', width: 'w-[80px]', render: (c: any) => <Badge variant={c.is_active ? 'default' : 'secondary'} className="text-[10px]">{c.is_active ? 'Active' : 'Off'}</Badge> },
            ]}
            defaultItem={{ username: '', display_name: '', bio: '', avatar_url: '', is_active: true }}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Username</Label><Input value={item.username || ''} onChange={e => onChange('username', e.target.value)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Display Name</Label><Input value={item.display_name || ''} onChange={e => onChange('display_name', e.target.value)} /></div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Bio</Label><Textarea value={item.bio || ''} onChange={e => onChange('bio', e.target.value)} rows={2} /></div>
                <div><Label className="text-xs text-muted-foreground">Avatar URL</Label><Input value={item.avatar_url || ''} onChange={e => onChange('avatar_url', e.target.value)} /></div>
              </div>
            )}
            onSave={saveCreator}
            onDelete={async (ids) => {
              for (const id of ids) await supabase.from('creators').delete().eq('id', id);
              invalidate();
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
