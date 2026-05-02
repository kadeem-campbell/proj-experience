/**
 * Admin Carousel Manager — manages the `carousels` table.
 *
 * Carousels are display modules placed on a page (home, search, etc.).
 * They are SEPARATE from collections. A carousel can:
 *   - reference one or more collections (resolution_mode = 'collection')
 *   - reference products/itineraries/pois directly (resolution_mode = 'manual')
 *   - auto-resolve from market + category context (resolution_mode = 'auto')
 *
 * Collections are NOT carousels. A collection only appears on a page when
 * a carousel explicitly attaches it.
 */
import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Layers, Search, X, Package, ListMusic, MapPin, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

const CONTENT_TYPES = [
  { value: 'product', label: 'Products', icon: Package },
  { value: 'itinerary', label: 'Itineraries', icon: ListMusic },
  { value: 'poi', label: 'Places (POIs)', icon: MapPin },
  { value: 'mixed', label: 'Mixed', icon: Layers },
] as const;

const PAGE_LOCATIONS = [
  { value: 'home', label: 'Home' },
  { value: 'search', label: 'Search' },
  { value: 'destination', label: 'Destination' },
] as const;

const RESOLUTION_MODES = [
  { value: 'manual', label: 'Manual — pick items myself' },
  { value: 'collection', label: 'From Collection(s)' },
  { value: 'auto', label: 'Auto — by market + category' },
] as const;

const slugify = (v: string) =>
  v.toLowerCase().replace(/\{[^}]+\}/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

export const AdminCarouselManager = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPage, setNewPage] = useState('home');
  const [newType, setNewType] = useState('product');
  const [newMode, setNewMode] = useState('manual');

  const { data: carousels = [], isLoading } = useQuery({
    queryKey: ['admin-carousels'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('carousels')
        .select('*')
        .order('display_order');
      return data || [];
    },
  });

  const { data: destinations = [] } = useQuery({
    queryKey: ['admin-destinations-list'],
    queryFn: async () => {
      const { data } = await supabase.from('destinations').select('id, name, slug, flag_svg_url').eq('is_active', true).order('name');
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: activityTypes = [] } = useQuery({
    queryKey: ['admin-activity-types-list'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('activity_types').select('id, name, slug').order('name');
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: carouselDests = [], refetch: refetchCD } = useQuery({
    queryKey: ['carousel-destinations'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('carousel_destinations').select('id, carousel_id, destination_id');
      return data || [];
    },
  });

  const { data: carouselCats = [], refetch: refetchCC } = useQuery({
    queryKey: ['carousel-categories'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('carousel_categories').select('id, carousel_id, activity_type_id');
      return data || [];
    },
  });

  const getDestIds = (cid: string): string[] =>
    carouselDests.filter((cd: any) => cd.carousel_id === cid).map((cd: any) => cd.destination_id);
  const getCatIds = (cid: string): string[] =>
    carouselCats.filter((cc: any) => cc.carousel_id === cid).map((cc: any) => cc.activity_type_id);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['admin-carousels'] });
    qc.invalidateQueries({ queryKey: ['home-carousels'] });
    qc.invalidateQueries({ queryKey: ['carousel-destinations'] });
    qc.invalidateQueries({ queryKey: ['carousel-categories'] });
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const slug = slugify(newName) || `carousel-${Date.now()}`;
    const { error } = await (supabase as any).from('carousels').insert({
      name: newName,
      slug,
      page_location: newPage,
      content_type: newType,
      resolution_mode: newMode,
      is_active: true,
      display_order: carousels.length,
      max_items: 12,
    });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Carousel created', description: newName });
      setNewName('');
      invalidateAll();
    }
  };

  const handleUpdate = async (id: string, updates: Record<string, any>) => {
    const { error } = await (supabase as any).from('carousels').update(updates).eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else invalidateAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this carousel? Items inside it will be unlinked but underlying products/collections are not affected.')) return;
    await (supabase as any).from('carousels').delete().eq('id', id);
    invalidateAll();
  };

  const toggleDest = async (cid: string, did: string, linked: boolean) => {
    if (linked) {
      const link = carouselDests.find((x: any) => x.carousel_id === cid && x.destination_id === did);
      if (link) await (supabase as any).from('carousel_destinations').delete().eq('id', (link as any).id);
    } else {
      await (supabase as any).from('carousel_destinations').insert({ carousel_id: cid, destination_id: did });
    }
    refetchCD(); invalidateAll();
  };

  const toggleCat = async (cid: string, atid: string, linked: boolean) => {
    if (linked) {
      const link = carouselCats.find((x: any) => x.carousel_id === cid && x.activity_type_id === atid);
      if (link) await (supabase as any).from('carousel_categories').delete().eq('id', (link as any).id);
    } else {
      await (supabase as any).from('carousel_categories').insert({ carousel_id: cid, activity_type_id: atid });
    }
    refetchCC(); invalidateAll();
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground text-sm">Loading carousels...</div>;

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    carousels.forEach((c: any) => {
      const key = c.page_location || 'home';
      (g[key] ||= []).push(c);
    });
    return g;
  }, [carousels]);

  return (
    <div className="space-y-6">
      <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/80">
        <strong>Carousels are display modules.</strong> They reference collections, products, or auto-resolve by context.
        Collections themselves never appear on a page automatically — only carousels do.
      </div>

      {/* Create new */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Plus className="w-4 h-4" /> New Carousel</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Use <code className="bg-muted px-1 rounded">{'{{city}}'}</code> in the name for dynamic city substitution.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <Input placeholder="Name (e.g. Top in {{city}})" value={newName} onChange={e => setNewName(e.target.value)} className="sm:col-span-2" />
          <Select value={newPage} onValueChange={setNewPage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAGE_LOCATIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={newType} onValueChange={setNewType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONTENT_TYPES.map(ct => (
                <SelectItem key={ct.value} value={ct.value}>
                  <div className="flex items-center gap-2"><ct.icon className="w-3.5 h-3.5" />{ct.label}</div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={newMode} onValueChange={setNewMode}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {RESOLUTION_MODES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 flex justify-end">
          <Button onClick={handleCreate} disabled={!newName.trim()}>Create carousel</Button>
        </div>
      </Card>

      {/* Grouped by page */}
      {Object.entries(grouped).map(([page, list]) => (
        <div key={page}>
          <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
            {PAGE_LOCATIONS.find(p => p.value === page)?.label || page} ({list.length})
          </h3>
          <div className="space-y-2">
            {list.map((c: any) => (
              <CarouselRow
                key={c.id}
                c={c}
                destinations={destinations}
                activityTypes={activityTypes}
                destIds={getDestIds(c.id)}
                catIds={getCatIds(c.id)}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
                handleUpdate={handleUpdate}
                handleDelete={handleDelete}
                toggleDest={toggleDest}
                toggleCat={toggleCat}
              />
            ))}
          </div>
        </div>
      ))}

      {carousels.length === 0 && (
        <p className="text-xs text-muted-foreground py-8 text-center">No carousels yet. Create one above.</p>
      )}
    </div>
  );
};

const CarouselRow = ({ c, destinations, activityTypes, destIds, catIds, expandedId, setExpandedId, handleUpdate, handleDelete, toggleDest, toggleCat }: any) => {
  const ContentIcon = CONTENT_TYPES.find(ct => ct.value === c.content_type)?.icon || Layers;
  const destNames = destIds.map((d: string) => destinations.find((x: any) => x.id === d)?.name).filter(Boolean);
  const catNames = catIds.map((a: string) => activityTypes.find((x: any) => x.id === a)?.name).filter(Boolean);
  const expanded = expandedId === c.id;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(expanded ? null : c.id)}>
          <div className="flex items-center gap-2 flex-wrap">
            <ContentIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-medium text-sm">{c.name}</span>
            <Badge variant="outline" className="text-[10px]">{c.resolution_mode}</Badge>
            <Badge variant="outline" className="text-[10px]">{c.content_type}</Badge>
            {destNames.length > 0
              ? destNames.map((n: string) => <Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>)
              : <Badge variant="outline" className="text-[10px] text-muted-foreground">All markets</Badge>}
            {catNames.map((n: string) => <Badge key={n} className="text-[10px] bg-accent/30 border-0">{n}</Badge>)}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">/{c.page_location} · slug: {c.slug}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Switch checked={c.is_active} onCheckedChange={v => handleUpdate(c.id, { is_active: v })} className="scale-75" />
          <span className="text-[10px] text-muted-foreground w-8">{c.is_active ? 'On' : 'Off'}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => handleDelete(c.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <button onClick={() => setExpandedId(expanded ? null : c.id)}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t p-4 bg-muted/20 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Name <span className="text-muted-foreground">(use {'{{city}}'} for dynamic)</span></Label>
              <Input defaultValue={c.name} onBlur={e => handleUpdate(c.id, { name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Slug</Label>
              <Input defaultValue={c.slug} onBlur={e => handleUpdate(c.id, { slug: e.target.value })} className="font-mono text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">Page</Label>
              <Select defaultValue={c.page_location || 'home'} onValueChange={v => handleUpdate(c.id, { page_location: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PAGE_LOCATIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Content type</Label>
              <Select defaultValue={c.content_type} onValueChange={v => handleUpdate(c.id, { content_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONTENT_TYPES.map(ct => <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Resolution</Label>
              <Select defaultValue={c.resolution_mode} onValueChange={v => handleUpdate(c.id, { resolution_mode: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{RESOLUTION_MODES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Display order</Label>
              <Input type="number" defaultValue={c.display_order || 0} onBlur={e => handleUpdate(c.id, { display_order: parseInt(e.target.value) || 0 })} />
            </div>
          </div>

          {/* Markets */}
          <div>
            <Label className="text-xs font-semibold">Markets</Label>
            <p className="text-[11px] text-muted-foreground mb-2">Leave all unchecked = visible in every market.</p>
            <div className="flex flex-wrap gap-2">
              {destinations.map((d: any) => {
                const linked = destIds.includes(d.id);
                return (
                  <label key={d.id} className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-colors",
                    linked ? "bg-primary/10 border-primary/30 text-primary font-medium" : "bg-background border-border text-muted-foreground hover:bg-muted"
                  )}>
                    <Checkbox checked={linked} onCheckedChange={() => toggleDest(c.id, d.id, linked)} className="h-3.5 w-3.5" />
                    {d.flag_svg_url && <img src={d.flag_svg_url} className="w-3.5 h-3.5 rounded-full" alt="" />}
                    {d.name}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Categories */}
          <div>
            <Label className="text-xs font-semibold">Categories (activity types)</Label>
            <p className="text-[11px] text-muted-foreground mb-2">Leave all unchecked = shown for every category.</p>
            <div className="flex flex-wrap gap-2">
              {activityTypes.map((a: any) => {
                const linked = catIds.includes(a.id);
                return (
                  <label key={a.id} className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-colors",
                    linked ? "bg-accent/30 border-accent text-foreground font-medium" : "bg-background border-border text-muted-foreground hover:bg-muted"
                  )}>
                    <Checkbox checked={linked} onCheckedChange={() => toggleCat(c.id, a.id, linked)} className="h-3.5 w-3.5" />
                    {a.name}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Items / collections */}
          {c.resolution_mode !== 'auto' && (
            <CarouselItemsEditor carouselId={c.id} mode={c.resolution_mode} contentType={c.content_type} />
          )}
          {c.resolution_mode === 'auto' && (
            <div className="rounded-md border border-border bg-background/50 p-3 text-xs text-muted-foreground">
              Auto mode: items are resolved automatically based on the markets and categories above.
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

const CarouselItemsEditor = ({ carouselId, mode, contentType }: { carouselId: string; mode: string; contentType: string }) => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: linkedItems = [] } = useQuery({
    queryKey: ['carousel-items-admin', carouselId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('carousel_items')
        .select('id, item_id, item_type, position')
        .eq('carousel_id', carouselId)
        .order('position');
      return data || [];
    },
  });

  const itemTypeForMode = mode === 'collection' ? 'collection' : (
    contentType === 'product' ? 'product' :
    contentType === 'itinerary' ? 'itinerary' :
    contentType === 'poi' ? 'poi' : 'product'
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

  const invalidate = () => qc.invalidateQueries({ queryKey: ['carousel-items-admin', carouselId] });

  const add = async (itemId: string) => {
    await (supabase as any).from('carousel_items').insert({
      carousel_id: carouselId,
      item_id: itemId,
      item_type: itemTypeForMode,
      position: linkedItems.length + 1,
    });
    invalidate();
    qc.invalidateQueries({ queryKey: ['home-carousels'] });
    toast({ title: 'Added' });
  };

  const remove = async (linkId: string) => {
    await (supabase as any).from('carousel_items').delete().eq('id', linkId);
    invalidate();
    qc.invalidateQueries({ queryKey: ['home-carousels'] });
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
              <div key={it.id} className="flex items-center gap-2 text-sm border border-border rounded px-3 py-1.5 bg-background">
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
            <button
              key={p.id}
              onClick={() => add(p.id)}
              className="w-full text-left flex items-center gap-2 text-sm border border-border rounded px-3 py-1.5 hover:bg-muted/50 transition-colors"
            >
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
