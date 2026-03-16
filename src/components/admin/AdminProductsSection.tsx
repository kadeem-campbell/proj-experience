/**
 * Products section — full CRUD for products, options, price options.
 * Links to destinations, areas, hosts, activity types, themes.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { AdminEntityTable, ColumnDef } from './AdminEntityTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Archive, Eye } from 'lucide-react';

const toSlug = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

export const AdminProductsSection = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products-full'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').order('title');
      return data || [];
    },
  });

  const { data: destinations = [] } = useQuery({
    queryKey: ['admin-dest-list'],
    queryFn: async () => { const { data } = await supabase.from('destinations').select('id, name, slug').eq('is_active', true).order('name'); return data || []; },
  });

  const { data: areas = [] } = useQuery({
    queryKey: ['admin-areas-list'],
    queryFn: async () => { const { data } = await supabase.from('areas').select('id, name, slug, destination_id').eq('is_active', true).order('name'); return data || []; },
  });

  const { data: activityTypes = [] } = useQuery({
    queryKey: ['admin-at-list'],
    queryFn: async () => { const { data } = await supabase.from('activity_types').select('id, name, emoji').eq('is_active', true).order('display_order'); return data || []; },
  });

  const { data: hosts = [] } = useQuery({
    queryKey: ['admin-hosts-list'],
    queryFn: async () => { const { data } = await supabase.from('hosts').select('id, display_name, username').eq('is_active', true).order('display_name'); return data || []; },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-products-full'] });
    qc.invalidateQueries({ queryKey: ['admin-overview-counts'] });
    qc.invalidateQueries({ queryKey: ['admin-overview-quality'] });
  };

  const saveTo = async (item: any, isNew: boolean) => {
    const { id, created_at, updated_at, ...rest } = item;
    if (isNew) {
      const { error } = await supabase.from('products').insert(rest as any);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('products').update(rest as any).eq('id', id);
      if (error) throw error;
    }
    invalidate();
    toast({ title: isNew ? 'Product created' : 'Product saved' });
  };

  const deleteFn = async (ids: string[]) => {
    for (const id of ids) {
      await supabase.from('products').delete().eq('id', id);
    }
    invalidate();
    toast({ title: `Deleted ${ids.length} product(s)` });
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'title', label: 'Title', width: 'flex-[2]',
      render: (p: any) => <span className="font-medium">{p.title}</span>,
    },
    {
      key: 'slug', label: 'Slug', width: 'flex-1',
      render: (p: any) => <span className="text-muted-foreground text-xs font-mono">{p.slug}</span>,
    },
    {
      key: 'destination_id', label: 'Destination', width: 'w-[120px]',
      render: (p: any) => {
        const d = destinations.find((x: any) => x.id === p.destination_id);
        return d ? <Badge variant="outline" className="text-[10px]">{d.name}</Badge> : <span className="text-destructive text-xs">—</span>;
      },
    },
    {
      key: 'is_active', label: 'Status', width: 'w-[80px]',
      render: (p: any) => (
        <Badge variant={p.is_active ? 'default' : 'secondary'} className="text-[10px]">
          {p.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'publish_score', label: 'Score', width: 'w-[60px]',
      render: (p: any) => <span className="text-xs">{p.publish_score ?? '—'}%</span>,
    },
  ];

  const renderForm = (item: any, onChange: (f: string, v: any) => void) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Title *</Label>
          <Input value={item.title || ''} onChange={e => { onChange('title', e.target.value); if (!item.id) onChange('slug', toSlug(e.target.value)); }} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Slug</Label>
          <Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} className="font-mono text-xs" />
        </div>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Description</Label>
        <Textarea value={item.description || ''} onChange={e => onChange('description', e.target.value)} rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Destination</Label>
          <Select value={item.destination_id || ''} onValueChange={v => onChange('destination_id', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{destinations.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Area</Label>
          <Select value={item.area_id || ''} onValueChange={v => onChange('area_id', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{areas.filter((a: any) => !item.destination_id || a.destination_id === item.destination_id).map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Activity Type</Label>
          <Select value={item.activity_type_id || ''} onValueChange={v => onChange('activity_type_id', v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>{activityTypes.map((at: any) => <SelectItem key={at.id} value={at.id}>{at.emoji} {at.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Tier</Label>
          <Select value={item.tier || 'standard'} onValueChange={v => onChange('tier', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="luxury">Luxury</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Format</Label>
          <Select value={item.format_type || 'shared'} onValueChange={v => onChange('format_type', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Private</SelectItem>
              <SelectItem value="shared">Shared</SelectItem>
              <SelectItem value="group">Group</SelectItem>
              <SelectItem value="self-guided">Self-guided</SelectItem>
              <SelectItem value="hosted">Hosted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs text-muted-foreground">Cover Image</Label><Input value={item.cover_image || ''} onChange={e => onChange('cover_image', e.target.value)} /></div>
        <div><Label className="text-xs text-muted-foreground">Video URL</Label><Input value={item.video_url || ''} onChange={e => onChange('video_url', e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label className="text-xs text-muted-foreground">Duration</Label><Input value={item.duration || ''} onChange={e => onChange('duration', e.target.value)} placeholder="2 hours" /></div>
        <div><Label className="text-xs text-muted-foreground">Latitude</Label><Input type="number" step="any" value={item.latitude || ''} onChange={e => onChange('latitude', parseFloat(e.target.value) || null)} /></div>
        <div><Label className="text-xs text-muted-foreground">Longitude</Label><Input type="number" step="any" value={item.longitude || ''} onChange={e => onChange('longitude', parseFloat(e.target.value) || null)} /></div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch checked={item.is_active ?? true} onCheckedChange={v => onChange('is_active', v)} />
          <span className="text-xs">{item.is_active ? 'Active' : 'Inactive'}</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={item.is_indexable ?? true} onCheckedChange={v => onChange('is_indexable', v)} />
          <span className="text-xs">{item.is_indexable ? 'Indexable' : 'No-index'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Products</h2>
      <p className="text-sm text-muted-foreground mb-4">Manage all products in the normalized model</p>
      <AdminEntityTable
        items={products}
        columns={columns}
        entityName="Product"
        defaultItem={{ title: '', slug: '', description: '', is_active: true, tier: 'standard', format_type: 'shared' }}
        renderForm={renderForm}
        onSave={saveTo}
        onDelete={deleteFn}
        isLoading={isLoading}
        filterOptions={[
          { key: 'is_active', label: 'Status', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] },
        ]}
        bulkActions={[
          {
            label: 'Archive', icon: <Archive className="w-3 h-3" />,
            action: async (ids) => {
              for (const id of ids) await supabase.from('products').update({ is_active: false } as any).eq('id', id);
              invalidate();
              toast({ title: `Archived ${ids.length} products` });
            },
          },
          {
            label: 'Activate', icon: <Eye className="w-3 h-3" />,
            action: async (ids) => {
              for (const id of ids) await supabase.from('products').update({ is_active: true } as any).eq('id', id);
              invalidate();
              toast({ title: `Activated ${ids.length} products` });
            },
          },
        ]}
      />
    </div>
  );
};
