/**
 * Itineraries section — manage public itineraries with UGC filtering
 * and inline items editor to add/remove products.
 */
import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, User } from 'lucide-react';

const toSlug = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

export const AdminItinerariesSection = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [sourceFilter, setSourceFilter] = useState<'all' | 'internal' | 'ugc'>('all');

  const { data: itineraries = [], isLoading } = useQuery({
    queryKey: ['admin-itineraries-full'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('public_itineraries').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-profiles-basic'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, email, full_name');
      return data || [];
    },
  });

  const { data: destinations = [] } = useQuery({
    queryKey: ['admin-dest-list'],
    queryFn: async () => {
      const { data } = await supabase.from('destinations').select('id, name, slug').eq('is_active', true).order('name');
      return data || [];
    },
  });

  const filtered = itineraries.filter((i: any) => {
    if (sourceFilter === 'internal') return !!i.creator_id;
    if (sourceFilter === 'ugc') return !i.creator_id;
    return true;
  });

  const getCreatorName = (creatorId: string | null) => {
    if (!creatorId) return 'UGC';
    return 'Editorial';
  };

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
      <p className="text-sm text-muted-foreground mb-3">Public itineraries — /itineraries/:slug</p>

      <div className="flex gap-2 mb-4">
        {(['all', 'internal', 'ugc'] as const).map(f => (
          <Button key={f} size="sm" variant={sourceFilter === f ? 'default' : 'outline'} onClick={() => setSourceFilter(f)} className="text-xs capitalize">
            {f === 'ugc' ? 'User Generated' : f}
          </Button>
        ))}
        <span className="text-xs text-muted-foreground self-center ml-2">{filtered.length} itineraries</span>
      </div>

      <AdminEntityTable
        items={filtered}
        entityName="Itinerary"
        isLoading={isLoading}
        columns={[
          { key: 'name', label: 'Name', width: 'flex-[2]', render: (i: any) => <span className="font-medium">{i.name}</span> },
          { key: 'slug', label: 'Slug', width: 'flex-1', render: (i: any) => <span className="text-xs font-mono text-muted-foreground">/itineraries/{i.slug}</span> },
          {
            key: 'creator_id', label: 'Source', width: 'w-[120px]',
            render: (i: any) => (
              <div className="flex items-center gap-1">
                {i.creator_id ? <User className="w-3 h-3 text-muted-foreground" /> : null}
                <Badge variant={i.creator_id ? 'secondary' : 'outline'} className="text-[10px]">
                  {getCreatorName(i.creator_id)}
                </Badge>
              </div>
            ),
          },
          {
            key: 'experiences', label: 'Items', width: 'w-[60px]',
            render: (i: any) => <span className="text-xs">{Array.isArray(i.experiences) ? i.experiences.length : 0}</span>,
          },
          { key: 'is_active', label: 'Status', width: 'w-[80px]', render: (i: any) => <Badge variant={i.is_active ? 'default' : 'secondary'} className="text-[10px]">{i.is_active ? 'Active' : 'Off'}</Badge> },
        ]}
        defaultItem={{ name: '', slug: '', description: '', cover_image: '', tag: 'popular', is_active: true, experiences: [] }}
        renderForm={(item: any, onChange) => (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="h-auto flex-wrap gap-1">
              <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
              <TabsTrigger value="items" className="text-xs">Products / Items</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-3 mt-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={item.name || ''} onChange={e => { onChange('name', e.target.value); if (!item.id) onChange('slug', toSlug(e.target.value)); }} /></div>
                <div><Label className="text-xs text-muted-foreground">Slug</Label><Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} className="font-mono text-xs" /></div>
              </div>
              <div><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={item.description || ''} onChange={e => onChange('description', e.target.value)} rows={2} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs text-muted-foreground">Cover Image</Label><Input value={item.cover_image || ''} onChange={e => onChange('cover_image', e.target.value)} /></div>
                <div><Label className="text-xs text-muted-foreground">Tag</Label><Input value={item.tag || ''} onChange={e => onChange('tag', e.target.value)} /></div>
                <div>
                  <Label className="text-xs text-muted-foreground">Destination</Label>
                  <Select value={item.destination_id || '__none__'} onValueChange={v => onChange('destination_id', v === '__none__' ? null : v)}>
                    <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      {destinations.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {item.creator_id && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded p-2">
                  <User className="w-3 h-3" />
                  <span>Created by: {getCreatorName(item.creator_id)}</span>
                  <span className="font-mono text-[10px]">({item.creator_id?.slice(0, 8)}…)</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch checked={item.is_active ?? true} onCheckedChange={v => onChange('is_active', v)} />
                <span className="text-xs">{item.is_active ? 'Active' : 'Inactive'}</span>
              </div>
            </TabsContent>

            <TabsContent value="items" className="mt-3">
              {item.id ? (
                <ItineraryItemsEditor itinerary={item} onChange={onChange} />
              ) : (
                <p className="text-xs text-muted-foreground">Save the itinerary first to manage items.</p>
              )}
            </TabsContent>
          </Tabs>
        )}
        onSave={saveItinerary}
        onDelete={async (ids) => {
          for (const id of ids) await (supabase as any).from('public_itineraries').delete().eq('id', id);
          invalidate();
          toast({ title: `Deleted ${ids.length} itinerary(ies)` });
        }}
        filterOptions={[
          { key: 'is_active', label: 'Status', options: [{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }] },
        ]}
        bulkActions={[
          {
            label: 'Activate',
            icon: <Plus className="w-3 h-3" />,
            action: async (ids) => {
              for (const id of ids) await (supabase as any).from('public_itineraries').update({ is_active: true }).eq('id', id);
              invalidate(); toast({ title: `Activated ${ids.length}` });
            },
          },
          {
            label: 'Deactivate',
            icon: <Trash2 className="w-3 h-3" />,
            action: async (ids) => {
              for (const id of ids) await (supabase as any).from('public_itineraries').update({ is_active: false }).eq('id', id);
              invalidate(); toast({ title: `Deactivated ${ids.length}` });
            },
          },
        ]}
      />
    </div>
  );
};

// ============ ITINERARY ITEMS EDITOR ============

const ItineraryItemsEditor = ({ itinerary, onChange }: { itinerary: any; onChange: (f: string, v: any) => void }) => {
  const { toast } = useToast();
  const experiences: any[] = Array.isArray(itinerary.experiences) ? itinerary.experiences : [];

  const { data: allProducts = [] } = useQuery({
    queryKey: ['admin-products-picker'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, title, slug, destination_id').order('title') as any;
      return data || [];
    },
  });

  const addProduct = (productId: string) => {
    const product = allProducts.find((p: any) => p.id === productId);
    if (!product || experiences.some((e: any) => e.id === productId)) return;
    const updated = [...experiences, { id: product.id, title: product.title }];
    onChange('experiences', updated);
    toast({ title: `Added ${product.title}` });
  };

  const removeProduct = (productId: string) => {
    const updated = experiences.filter((e: any) => e.id !== productId);
    onChange('experiences', updated);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{experiences.length} products in this itinerary. Changes save when you click Save.</p>
      {experiences.map((exp: any, idx: number) => (
        <div key={exp.id} className="flex items-center gap-2 text-sm border border-border rounded px-3 py-2">
          <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground w-5">{idx + 1}</span>
          <span className="flex-1 truncate">{exp.title}</span>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeProduct(exp.id)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ))}
      <Select onValueChange={addProduct}>
        <SelectTrigger className="w-64"><SelectValue placeholder="Add product…" /></SelectTrigger>
        <SelectContent>
          {allProducts.filter((p: any) => !experiences.some((e: any) => e.id === p.id))
            .map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
};
