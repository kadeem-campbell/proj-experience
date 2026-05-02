/**
 * Admin Carousel Manager — now built on the shared AdminEntityEditor primitive.
 *
 * Carousels are display modules placed on a page (home, search, etc.).
 * They are SEPARATE from collections. A carousel can:
 *   - reference one or more collections (resolution_mode = 'collection')
 *   - reference products/itineraries/pois directly (resolution_mode = 'manual')
 *   - auto-resolve from market + category context (resolution_mode = 'auto')
 */
import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, X, Folder } from 'lucide-react';
import { AdminEntityEditor, AdminEntityConfig } from './shared/AdminEntityEditor';
import { friendlyError } from './shared/friendlyError';

export const AdminCarouselManager = () => {
  const config: AdminEntityConfig = useMemo(() => ({
    entityName: 'Carousel',
    entityNamePlural: 'Carousels',
    table: 'carousels',
    primaryLabelColumn: 'name',
    searchColumns: ['name', 'slug', 'page_location'],
    orderBy: { column: 'display_order', ascending: true },
    groupBy: { key: 'page_location', labels: { home: 'Home', search: 'Search', destination: 'Destination' } },
    invalidateKeys: [['home-carousels'], ['admin-carousels']],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'e.g. Top in {{city}}', help: 'use {{city}} for dynamic city substitution', width: 0.5 },
      { key: 'slug', label: 'Slug', type: 'slug', deriveFrom: 'name', width: 0.5 },
      { key: 'description', label: 'Description', type: 'textarea', rows: 2 },
      { key: 'page_location', label: 'Page', type: 'select', defaultValue: 'home', width: 0.25, options: [
        { value: 'home', label: 'Home' }, { value: 'search', label: 'Search' }, { value: 'destination', label: 'Destination' },
      ]},
      { key: 'content_type', label: 'Content', type: 'select', defaultValue: 'product', width: 0.25, options: [
        { value: 'product', label: 'Products' }, { value: 'itinerary', label: 'Itineraries' },
        { value: 'poi', label: 'Places' }, { value: 'collection', label: 'Collections' }, { value: 'mixed', label: 'Mixed' },
      ]},
      { key: 'resolution_mode', label: 'Resolution', type: 'select', defaultValue: 'manual', width: 0.25, options: [
        { value: 'manual', label: 'Manual' }, { value: 'collection', label: 'From Collections' }, { value: 'auto', label: 'Auto by context' },
      ]},
      { key: 'display_order', label: 'Order', type: 'number', defaultValue: 100, width: 0.25 },
      { key: 'max_items', label: 'Max items', type: 'number', defaultValue: 10, width: 0.5 },
      { key: 'cover_image', label: 'Cover image (optional)', type: 'image', storageBucket: 'product-images', width: 0.5 },
      { key: 'is_active', label: 'Active', type: 'switch', defaultValue: true },
    ],
    rowBadges: [
      { key: 'resolution_mode' },
      { key: 'content_type' },
    ],
    relations: [
      {
        key: 'markets',
        label: 'Markets (cities)',
        joinTable: 'carousel_destinations',
        selfColumn: 'carousel_id',
        refColumn: 'destination_id',
        refTable: 'destinations',
        refLabelColumn: 'name',
        refExtraColumns: ['flag_svg_url'],
        refFilter: { column: 'is_active', value: true },
        emptyHint: 'Leave all unchecked = visible in every market.',
        badgeStyle: 'primary',
      },
      {
        key: 'categories',
        label: 'Categories',
        joinTable: 'carousel_categories',
        selfColumn: 'carousel_id',
        refColumn: 'activity_type_id',
        refTable: 'activity_types',
        refLabelColumn: 'name',
        emptyHint: 'Leave all unchecked = shown for every category.',
        badgeStyle: 'accent',
      },
    ],
    customExpandSlot: (item) => item.resolution_mode === 'auto'
      ? <div className="rounded-md border bg-background/50 p-3 text-xs text-muted-foreground">Auto mode: items resolved from markets and categories above.</div>
      : <CarouselItemsEditor carouselId={item.id} mode={item.resolution_mode} contentType={item.content_type} />,
  }), []);

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/80">
        <strong>Carousels are display modules.</strong> They reference collections, products, or auto-resolve by context.
        Collections themselves never appear on a page automatically — only carousels do.
      </div>
      <AdminEntityEditor config={config} />
    </div>
  );
};

// ─────────────────── Items editor (kept custom because it's bespoke) ───────────────────
const CarouselItemsEditor = ({ carouselId, mode, contentType }: { carouselId: string; mode: string; contentType: string }) => {
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: linkedItems = [] } = useQuery({
    queryKey: ['carousel-items-admin', carouselId],
    queryFn: async () => {
      const { data } = await (supabase as any).from('carousel_items')
        .select('id, item_id, item_type, position').eq('carousel_id', carouselId).order('position');
      return data || [];
    },
  });

  const itemTypeForMode = mode === 'collection' ? 'collection' : (
    contentType === 'poi' ? 'poi' : contentType === 'itinerary' ? 'itinerary' : 'product'
  );

  const { data: searchPool = [] } = useQuery({
    queryKey: ['carousel-search-pool', mode, contentType],
    queryFn: async () => {
      if (mode === 'collection') {
        const { data } = await (supabase as any).from('collections').select('id, name, slug, collection_type').eq('is_active', true).order('name');
        return (data || []).map((c: any) => ({ id: c.id, label: c.name, sub: c.collection_type }));
      }
      if (contentType === 'poi') {
        const { data } = await supabase.from('pois').select('id, name, poi_type').eq('is_active', true).order('name');
        return (data || []).map((p: any) => ({ id: p.id, label: p.name, sub: p.poi_type }));
      }
      if (contentType === 'product') {
        const { data } = await supabase.from('products').select('id, title, slug, publish_state, visibility_output_state')
          .eq('publish_state', 'published')
          .in('visibility_output_state', ['public', 'public_indexed', 'marketplace_active'])
          .order('title');
        return (data || []).map((p: any) => ({ id: p.id, label: p.title, sub: p.slug }));
      }
      const { data } = await (supabase as any).from('public_itineraries').select('id, name, tag').eq('is_active', true).order('name');
      return (data || []).map((i: any) => ({ id: i.id, label: i.name, sub: i.tag }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const linkedIds = new Set(linkedItems.map((x: any) => x.item_id));
  const filteredPool = useMemo(() => {
    const base = searchPool.filter((p: any) => !linkedIds.has(p.id));
    if (!searchTerm.trim()) return base.slice(0, 25);
    const q = searchTerm.toLowerCase();
    return base.filter((p: any) => p.label?.toLowerCase().includes(q) || p.sub?.toLowerCase().includes(q)).slice(0, 25);
  }, [searchTerm, searchPool, linkedIds]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['carousel-items-admin', carouselId] });
    qc.invalidateQueries({ queryKey: ['home-carousels'] });
  };

  const add = async (itemId: string) => {
    const { error } = await (supabase as any).from('carousel_items').insert({
      carousel_id: carouselId, item_id: itemId, item_type: itemTypeForMode, position: linkedItems.length + 1,
    });
    if (error) { toast.error(friendlyError(error)); return; }
    toast.success('Added');
    invalidate();
  };

  const remove = async (linkId: string) => {
    const { error } = await (supabase as any).from('carousel_items').delete().eq('id', linkId);
    if (error) { toast.error(friendlyError(error)); return; }
    invalidate();
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold flex items-center gap-2">
          {mode === 'collection' ? <><Folder className="w-3 h-3" /> Linked collections</> : <>Linked items</>}
          <span className="text-muted-foreground font-normal">({linkedItems.length})</span>
        </Label>
        <div className="space-y-1 mt-2">
          {linkedItems.map((it: any, idx: number) => {
            const meta = searchPool.find((p: any) => p.id === it.item_id);
            return (
              <div key={it.id} className="flex items-center gap-2 text-sm border rounded px-3 py-1.5 bg-background">
                <span className="text-xs text-muted-foreground w-5">{idx + 1}</span>
                <Badge variant="outline" className="text-[10px] shrink-0">{it.item_type}</Badge>
                <span className="flex-1 truncate">{meta?.label || it.item_id.slice(0, 8)}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => remove(it.id)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
          {linkedItems.length === 0 && <p className="text-xs text-muted-foreground italic">Nothing linked yet.</p>}
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold">Add {mode === 'collection' ? 'collection' : 'item'}</Label>
        <div className="relative mt-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder={`Search ${mode === 'collection' ? 'collections' : 'items'}…`} className="pl-7" />
        </div>
        <div className="mt-2 max-h-56 overflow-y-auto space-y-1">
          {filteredPool.map((p: any) => (
            <button key={p.id} onClick={() => add(p.id)}
              className="w-full text-left flex items-center gap-2 text-sm border rounded px-3 py-1.5 hover:bg-muted/50 transition-colors">
              <Plus className="w-3 h-3 text-muted-foreground" />
              <span className="flex-1 truncate">{p.label}</span>
              {p.sub && <span className="text-[10px] text-muted-foreground">{p.sub}</span>}
            </button>
          ))}
          {filteredPool.length === 0 && <p className="text-xs text-muted-foreground italic">No matches.</p>}
        </div>
      </div>
    </div>
  );
};
