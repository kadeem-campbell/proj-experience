/**
 * Collections section — manage collections with inline item linking.
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
import { Plus, Trash2, GripVertical, Eye, Archive, ExternalLink } from 'lucide-react';

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
    queryFn: async () => { const { data } = await supabase.from('destinations').select('id, name').eq('is_active', true).order('name'); return data || []; },
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

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Collections</h2>
      <p className="text-sm text-muted-foreground mb-4">Curated groups of products — /collections/:slug</p>

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
          { key: 'slug', label: 'Slug', width: 'flex-1', render: (c: any) => (
            <a href={`https://swam.app/collections/${c.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs font-mono text-muted-foreground hover:text-primary flex items-center gap-1">
              /collections/{c.slug} <ExternalLink className="w-3 h-3" />
            </a>
          ) },
          { key: 'is_active', label: 'Status', width: 'w-[80px]', render: (c: any) => <Badge variant={c.is_active ? 'default' : 'secondary'} className="text-[10px]">{c.is_active ? 'Active' : 'Off'}</Badge> },
        ]}
        defaultItem={{ name: '', slug: '', description: '', collection_type: 'experiences', content_type: 'experience', is_active: true, show_on_home: false, home_display_order: 0 }}
        renderForm={(item: any, onChange) => (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="h-auto flex-wrap gap-1">
              <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
              <TabsTrigger value="items" className="text-xs">Items</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-3 mt-3">
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
                  <Label className="text-xs text-muted-foreground">Destination</Label>
                  <Select value={item.destination_id || '__none__'} onValueChange={v => onChange('destination_id', v === '__none__' ? null : v)}>
                    <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">All destinations</SelectItem>
                      {destinations.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs text-muted-foreground">Home Order</Label><Input type="number" value={item.home_display_order || 0} onChange={e => onChange('home_display_order', parseInt(e.target.value) || 0)} /></div>
              </div>
              <div><Label className="text-xs text-muted-foreground">Cover Image</Label><Input value={item.cover_image || ''} onChange={e => onChange('cover_image', e.target.value)} /></div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><Switch checked={item.show_on_home ?? false} onCheckedChange={v => onChange('show_on_home', v)} /><span className="text-xs">Show on Home</span></div>
                <div className="flex items-center gap-2"><Switch checked={item.is_active ?? true} onCheckedChange={v => onChange('is_active', v)} /><span className="text-xs">{item.is_active ? 'Active' : 'Inactive'}</span></div>
              </div>
            </TabsContent>

            <TabsContent value="items" className="mt-3">
              {item.id ? (
                <CollectionItemsEditor collectionId={item.id} collectionType={item.collection_type} />
              ) : (
                <p className="text-xs text-muted-foreground">Save the collection first to manage items.</p>
              )}
            </TabsContent>
          </Tabs>
        )}
        onSave={saveCollection}
        onDelete={async (ids) => {
          for (const id of ids) await (supabase as any).from('collections').update({ is_active: false }).eq('id', id);
          invalidate();
          toast({ title: `Archived ${ids.length} collection(s)` });
        }}
        bulkActions={[
          {
            label: 'Show on Home', icon: <Eye className="w-3 h-3" />,
            action: async (ids) => {
              for (const id of ids) await (supabase as any).from('collections').update({ show_on_home: true }).eq('id', id);
              invalidate(); toast({ title: `${ids.length} shown on home` });
            },
          },
          {
            label: 'Archive', icon: <Archive className="w-3 h-3" />,
            action: async (ids) => {
              for (const id of ids) await (supabase as any).from('collections').update({ is_active: false }).eq('id', id);
              invalidate(); toast({ title: `Archived ${ids.length}` });
            },
          },
        ]}
      />
    </div>
  );
};

// ============ COLLECTION ITEMS EDITOR ============

const CollectionItemsEditor = ({ collectionId, collectionType }: { collectionId: string; collectionType: string }) => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: items = [] } = useQuery({
    queryKey: ['admin-collection-items', collectionId],
    queryFn: async () => {
      const { data } = await (supabase as any).from('collection_items').select('*').eq('collection_id', collectionId).order('position');
      return data || [];
    },
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['admin-products-picker'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, title, slug') as any;
      return data || [];
    },
  });

  const { data: allItineraries = [] } = useQuery({
    queryKey: ['admin-itineraries-picker'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('public_itineraries').select('id, name, slug');
      return data || [];
    },
  });

  // Resolve item names
  const resolveTitle = (item: any) => {
    if (item.item_type === 'product') {
      const p = allProducts.find((pr: any) => pr.id === item.item_id);
      return p?.title || item.item_id.slice(0, 8);
    }
    const it = allItineraries.find((i: any) => i.id === item.item_id);
    return it?.name || item.item_id.slice(0, 8);
  };

  const addItem = async (itemId: string, itemType: string) => {
    if (items.some((i: any) => i.item_id === itemId)) return;
    await (supabase as any).from('collection_items').insert({
      collection_id: collectionId, item_id: itemId, item_type: itemType, position: items.length + 1,
    });
    qc.invalidateQueries({ queryKey: ['admin-collection-items', collectionId] });
    toast({ title: 'Item added' });
  };

  const removeItem = async (id: string) => {
    await (supabase as any).from('collection_items').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-collection-items', collectionId] });
    toast({ title: 'Item removed' });
  };

  const showProducts = collectionType !== 'itineraries';
  const showItineraries = collectionType !== 'experiences';

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{items.length} items in this collection.</p>

      {items.map((item: any, idx: number) => (
        <div key={item.id} className="flex items-center gap-2 text-sm border border-border rounded px-3 py-2">
          <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground w-5">{idx + 1}</span>
          <Badge variant="outline" className="text-[10px] shrink-0">{item.item_type}</Badge>
          <span className="flex-1 truncate">{resolveTitle(item)}</span>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeItem(item.id)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ))}

      <div className="flex gap-2">
        {showProducts && (
          <Select onValueChange={v => addItem(v, 'product')}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Add product…" /></SelectTrigger>
            <SelectContent>
              {allProducts.filter((p: any) => !items.some((i: any) => i.item_id === p.id))
                .map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {showItineraries && (
          <Select onValueChange={v => addItem(v, 'itinerary')}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Add itinerary…" /></SelectTrigger>
            <SelectContent>
              {allItineraries.filter((i: any) => !items.some((ci: any) => ci.item_id === i.id))
                .map((i: any) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};
