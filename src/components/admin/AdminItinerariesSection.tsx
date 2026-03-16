/**
 * Itineraries section — manage public itineraries.
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

const toSlug = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

export const AdminItinerariesSection = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: itineraries = [], isLoading } = useQuery({
    queryKey: ['admin-itineraries-full'],
    queryFn: async () => { const { data } = await (supabase as any).from('public_itineraries').select('*').order('name'); return data || []; },
  });

  const invalidate = () => {
    ['admin-itineraries-full', 'admin-overview-counts', 'public-itineraries'].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
  };

  const saveItinerary = async (item: any, isNew: boolean) => {
    const { id, created_at, updated_at, ...rest } = item;
    if (isNew) {
      const { error } = await (supabase as any).from('public_itineraries').insert(rest);
      if (error) throw error;
    } else {
      const { error } = await (supabase as any).from('public_itineraries').update(rest).eq('id', id);
      if (error) throw error;
    }
    invalidate();
    toast({ title: isNew ? 'Itinerary created' : 'Itinerary saved' });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Itineraries</h2>
      <p className="text-sm text-muted-foreground mb-4">Public itineraries — /itineraries/:slug</p>

      <AdminEntityTable
        items={itineraries}
        entityName="Itinerary"
        isLoading={isLoading}
        columns={[
          { key: 'name', label: 'Name', width: 'flex-[2]', render: (i: any) => <span className="font-medium">{i.name}</span> },
          { key: 'slug', label: 'Slug', width: 'flex-1', render: (i: any) => <span className="text-xs font-mono text-muted-foreground">/itineraries/{i.slug}</span> },
          { key: 'tag', label: 'Tag', width: 'w-[80px]', render: (i: any) => i.tag ? <Badge variant="outline" className="text-[10px]">{i.tag}</Badge> : null },
          { key: 'is_active', label: 'Status', width: 'w-[80px]', render: (i: any) => <Badge variant={i.is_active ? 'default' : 'secondary'} className="text-[10px]">{i.is_active ? 'Active' : 'Off'}</Badge> },
        ]}
        defaultItem={{ name: '', slug: '', description: '', cover_image: '', tag: 'popular', is_active: true }}
        renderForm={(item: any, onChange) => (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={item.name || ''} onChange={e => { onChange('name', e.target.value); if (!item.id) onChange('slug', toSlug(e.target.value)); }} /></div>
              <div><Label className="text-xs text-muted-foreground">Slug</Label><Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} className="font-mono text-xs" /></div>
            </div>
            <div><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={item.description || ''} onChange={e => onChange('description', e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-muted-foreground">Cover Image</Label><Input value={item.cover_image || ''} onChange={e => onChange('cover_image', e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Tag</Label><Input value={item.tag || ''} onChange={e => onChange('tag', e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={item.is_active ?? true} onCheckedChange={v => onChange('is_active', v)} />
              <span className="text-xs">{item.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        )}
        onSave={saveItinerary}
        onDelete={async (ids) => {
          for (const id of ids) await (supabase as any).from('public_itineraries').delete().eq('id', id);
          invalidate();
          toast({ title: `Deleted ${ids.length} itinerary(ies)` });
        }}
      />
    </div>
  );
};
