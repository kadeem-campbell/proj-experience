/**
 * Collections section — manage collections with item linking.
 * Replaces AdminCarouselManager with unified collection management.
 */
import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { AdminEntityTable } from './AdminEntityTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const toSlug = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

export const AdminCollectionsSection = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['admin-collections-full'],
    queryFn: async () => { const { data } = await (supabase as any).from('collections').select('*').order('home_display_order'); return data || []; },
  });

  const { data: destinations = [] } = useQuery({
    queryKey: ['admin-dest-list'],
    queryFn: async () => { const { data } = await supabase.from('destinations').select('id, name, flag_emoji').eq('is_active', true).order('name'); return data || []; },
  });

  const invalidate = () => {
    ['admin-collections-full', 'admin-overview-counts', 'home-carousels', 'admin-collections'].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
  };

  const saveCollection = async (item: any, isNew: boolean) => {
    const { id, created_at, updated_at, ...rest } = item;
    if (isNew) {
      const { error } = await (supabase as any).from('collections').insert(rest);
      if (error) throw error;
    } else {
      const { error } = await (supabase as any).from('collections').update(rest).eq('id', id);
      if (error) throw error;
    }
    invalidate();
    toast({ title: isNew ? 'Collection created' : 'Collection saved' });
  };

  const deleteCollection = async (ids: string[]) => {
    for (const id of ids) await (supabase as any).from('collections').update({ is_active: false }).eq('id', id);
    invalidate();
    toast({ title: `Archived ${ids.length} collection(s)` });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Collections</h2>
      <p className="text-sm text-muted-foreground mb-4">Curated groups of products, itineraries, or mixed items — public URL: /collections/:slug</p>

      <AdminEntityTable
        items={collections}
        entityName="Collection"
        isLoading={isLoading}
        columns={[
          { key: 'name', label: 'Name', width: 'flex-[2]', render: (c: any) => (
            <div className="flex items-center gap-2">
              <span className="font-medium">{c.name}</span>
              <Badge variant="outline" className="text-[10px]">{c.collection_type}</Badge>
              {c.show_on_home && <Badge className="text-[10px] bg-primary/10 text-primary border-0">Home</Badge>}
            </div>
          )},
          { key: 'slug', label: 'Slug', width: 'flex-1', render: (c: any) => <span className="text-xs font-mono text-muted-foreground">/collections/{c.slug}</span> },
          { key: 'is_active', label: 'Status', width: 'w-[80px]', render: (c: any) => <Badge variant={c.is_active ? 'default' : 'secondary'} className="text-[10px]">{c.is_active ? 'Active' : 'Off'}</Badge> },
        ]}
        defaultItem={{ name: '', slug: '', description: '', collection_type: 'experiences', content_type: 'experience', is_active: true, show_on_home: false, home_display_order: 0 }}
        renderForm={(item: any, onChange) => (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={item.name || ''} onChange={e => { onChange('name', e.target.value); if (!item.id) onChange('slug', toSlug(e.target.value)); }} /></div>
              <div><Label className="text-xs text-muted-foreground">Slug</Label><Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} className="font-mono text-xs" /></div>
            </div>
            <div><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={item.description || ''} onChange={e => onChange('description', e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select value={item.collection_type || 'experiences'} onValueChange={v => onChange('collection_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="experiences">Experiences/Products</SelectItem>
                    <SelectItem value="itineraries">Itineraries</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Home Order</Label>
                <Input type="number" value={item.home_display_order || 0} onChange={e => onChange('home_display_order', parseInt(e.target.value) || 0)} />
              </div>
              <div><Label className="text-xs text-muted-foreground">Cover Image</Label><Input value={item.cover_image || ''} onChange={e => onChange('cover_image', e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><Switch checked={item.show_on_home ?? false} onCheckedChange={v => onChange('show_on_home', v)} /><span className="text-xs">Show on Home</span></div>
              <div className="flex items-center gap-2"><Switch checked={item.is_active ?? true} onCheckedChange={v => onChange('is_active', v)} /><span className="text-xs">{item.is_active ? 'Active' : 'Inactive'}</span></div>
            </div>
          </div>
        )}
        onSave={saveCollection}
        onDelete={deleteCollection}
      />
    </div>
  );
};
