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
import { Plus, Trash2, GripVertical, User, ExternalLink } from 'lucide-react';
import { EntityVisibilityControls } from './shared/EntityVisibilityControls';

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
    if (sourceFilter === 'internal') return i.source_type === 'editorial' || !!i.creator_id;
    if (sourceFilter === 'ugc') return i.source_type === 'ugc' || (i.source_type !== 'editorial' && !i.creator_id);
    return true;
  });

  const getCreatorName = (item: any) => {
    if (item.source_type === 'editorial' || item.creator_id) return 'Editorial';
    return 'UGC';
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
          { key: 'slug', label: 'Slug', width: 'flex-1', render: (i: any) => (
            <a href={`https://swam.app/itineraries/${i.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-mono text-primary hover:underline">
              /itineraries/{i.slug} <ExternalLink className="w-3 h-3" />
            </a>
          ) },
          {
            key: 'creator_id', label: 'Source', width: 'w-[120px]',
            render: (i: any) => (
              <div className="flex items-center gap-1">
                {!i.creator_id && i.source_type !== 'editorial' ? <User className="w-3 h-3 text-muted-foreground" /> : null}
                <Badge variant={i.source_type === 'editorial' || i.creator_id ? 'outline' : 'secondary'} className="text-[10px]">
                  {getCreatorName(i)}
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
        defaultItem={{ name: '', slug: '', description: '', cover_image: '', tag: 'popular', is_active: true, experiences: [], publish_state: 'draft', visibility_output_state: 'internal_only', indexability_state: 'public_noindex' }}
        renderForm={(item: any, onChange) => (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="h-auto flex-wrap gap-1">
              <TabsTrigger value="details" className="text-xs">Details</TabsTrigger>
              <TabsTrigger value="items" className="text-xs">Products / Items</TabsTrigger>
              <TabsTrigger value="links" className="text-xs">Links</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-3 mt-3">
              <EntityVisibilityControls item={item} onChange={onChange} entityType="itinerary" pathHint={item.slug ? `/itineraries/${item.slug}` : undefined} />
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-xs text-muted-foreground">SEO Title (≤60)</Label><Input value={item.seo_title || ''} onChange={e => onChange('seo_title', e.target.value)} maxLength={60} /></div>
                <div><Label className="text-xs text-muted-foreground">SEO Description (≤155)</Label><Input value={item.seo_description || ''} onChange={e => onChange('seo_description', e.target.value)} maxLength={155} /></div>
              </div>
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
                  <span>Created by: {getCreatorName(item)}</span>
                  {item.creator_id && <span className="font-mono text-[10px]">({item.creator_id?.slice(0, 8)}…)</span>}
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

            <TabsContent value="links" className="mt-3">
              {item.id ? (
                <ItineraryLinksViewer itineraryId={item.id} />
              ) : (
                <p className="text-xs text-muted-foreground">Save first to see links.</p>
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

const ItineraryItemsEditor = ({ itinerary }: { itinerary: any; onChange: (f: string, v: any) => void }) => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: items = [], refetch } = useQuery({
    queryKey: ['admin-itinerary-items', itinerary.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('public_itinerary_items')
        .select('id, entity_type, entity_id, display_order, day_number, title, custom_title')
        .eq('public_itinerary_id', itinerary.id)
        .order('day_number', { ascending: true })
        .order('display_order', { ascending: true });
      return data || [];
    },
  });

  const productIds = items.filter((i: any) => i.entity_type === 'product').map((i: any) => i.entity_id);
  const { data: productMeta = [] } = useQuery({
    queryKey: ['admin-itinerary-items-product-meta', productIds.sort().join(',')],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, title').in('id', productIds);
      return data || [];
    },
  });
  const titleFor = (it: any) => {
    if (it.title || it.custom_title) return it.title || it.custom_title;
    return productMeta.find((p: any) => p.id === it.entity_id)?.title || '(unknown)';
  };

  const { data: allProducts = [] } = useQuery({
    queryKey: ['admin-products-picker'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, title, slug').order('title') as any;
      return data || [];
    },
  });

  const invalidate = () => {
    refetch();
    qc.invalidateQueries({ queryKey: ['public-itineraries'] });
    qc.invalidateQueries({ queryKey: ['admin-itineraries-full'] });
  };

  const addProduct = async (productId: string) => {
    if (items.some((i: any) => i.entity_id === productId)) return;
    const product = allProducts.find((p: any) => p.id === productId);
    const nextOrder = items.length;
    const { error } = await (supabase as any).from('public_itinerary_items').insert({
      public_itinerary_id: itinerary.id,
      entity_type: 'product',
      entity_id: productId,
      day_number: 1,
      display_order: nextOrder,
      title: product?.title || null,
    });
    if (error) { toast({ title: 'Failed to add', description: error.message, variant: 'destructive' }); return; }
    invalidate();
    toast({ title: `Added ${product?.title || 'product'}` });
  };

  const removeItem = async (itemId: string) => {
    const { error } = await (supabase as any).from('public_itinerary_items').delete().eq('id', itemId);
    if (error) { toast({ title: 'Failed to remove', description: error.message, variant: 'destructive' }); return; }
    invalidate();
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">{items.length} products in this itinerary. Changes save instantly.</p>
      {items.map((it: any, idx: number) => (
        <div key={it.id} className="flex items-center gap-2 text-sm border border-border rounded px-3 py-2">
          <GripVertical className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground w-5">{idx + 1}</span>
          <span className="flex-1 truncate">{titleFor(it)}</span>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => removeItem(it.id)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ))}
      <Select onValueChange={addProduct}>
        <SelectTrigger className="w-64"><SelectValue placeholder="Add product…" /></SelectTrigger>
        <SelectContent>
          {allProducts.filter((p: any) => !items.some((i: any) => i.entity_id === p.id))
            .map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
};

// ============ ITINERARY LINKS VIEWER ============

const ItineraryLinksViewer = ({ itineraryId }: { itineraryId: string }) => {
  const { data: collectionLinks = [] } = useQuery({
    queryKey: ['admin-itinerary-collection-links', itineraryId],
    queryFn: async () => {
      const { data } = await (supabase as any).from('collection_items').select('id, collection_id, position').eq('item_id', itineraryId).eq('item_type', 'itinerary');
      if (!data?.length) return [];
      const collIds = data.map((ci: any) => ci.collection_id);
      const { data: colls } = await (supabase as any).from('collections').select('id, name, slug').in('id', collIds);
      return data.map((ci: any) => {
        const c = colls?.find((x: any) => x.id === ci.collection_id);
        return { ...ci, collection_name: c?.name || ci.collection_id.slice(0, 8), collection_slug: c?.slug };
      });
    },
  });

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">In Collections ({collectionLinks.length})</h4>
      {collectionLinks.length === 0 && <p className="text-xs text-muted-foreground">Not in any collections yet.</p>}
      {collectionLinks.map((cl: any) => (
        <div key={cl.id} className="flex items-center gap-2 text-sm border border-border rounded px-3 py-2">
          <Badge variant="outline" className="text-[10px]">Collection</Badge>
          <span className="flex-1 truncate">{cl.collection_name}</span>
          <span className="text-[10px] text-muted-foreground font-mono">/collections/{cl.collection_slug}</span>
        </div>
      ))}
    </div>
  );
};
