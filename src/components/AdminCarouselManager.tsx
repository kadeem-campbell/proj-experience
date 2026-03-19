/**
 * Admin Carousel/Collection Manager — manage home page carousels,
 * collection membership, ordering, and multi-city assignment.
 * Supports itinerary, experience, product, and POI content types.
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
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Layers, Search, X, MapPin, Package, ListMusic } from 'lucide-react';
import { cn } from '@/lib/utils';

const CONTENT_TYPES = [
  { value: 'itinerary', label: 'Itineraries', icon: ListMusic },
  { value: 'product', label: 'Products', icon: Package },
  { value: 'poi', label: 'Places (POIs)', icon: MapPin },
] as const;

const contentTypeLabel = (t: string) => CONTENT_TYPES.find(ct => ct.value === t)?.label || t;

export const AdminCarouselManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newType, setNewType] = useState('itinerary');

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['admin-collections'],
    queryFn: async () => {
      const { data } = await supabase
        .from('collections')
        .select('*')
        .eq('is_active', true)
        .order('home_display_order');
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

  const { data: collectionDestinations = [], refetch: refetchCD } = useQuery({
    queryKey: ['collection-destinations'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('collection_destinations').select('id, collection_id, destination_id');
      return data || [];
    },
  });

  const getDestIdsForCollection = (colId: string): string[] =>
    collectionDestinations.filter((cd: any) => cd.collection_id === colId).map((cd: any) => cd.destination_id);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
    queryClient.invalidateQueries({ queryKey: ['home-carousels'] });
    queryClient.invalidateQueries({ queryKey: ['collection-destinations'] });
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) return;
    const { error } = await (supabase as any).from('collections').insert({
      name: newName, slug: newSlug,
      collection_type: newType === 'itinerary' ? 'itineraries' : newType === 'product' ? 'products' : 'pois',
      content_type: newType,
      show_on_home: false, home_display_order: collections.length,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Created', description: `Carousel "${newName}" created` });
      setNewName(''); setNewSlug('');
      invalidateAll();
    }
  };

  const handleUpdate = async (id: string, updates: Record<string, any>) => {
    const { error } = await (supabase as any).from('collections').update(updates).eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else invalidateAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Archive this collection?')) return;
    await (supabase as any).from('collections').update({ is_active: false }).eq('id', id);
    invalidateAll();
  };

  const toggleDestination = async (collectionId: string, destId: string, currentlyLinked: boolean) => {
    if (currentlyLinked) {
      const link = collectionDestinations.find((cd: any) => cd.collection_id === collectionId && cd.destination_id === destId);
      if (link) await (supabase as any).from('collection_destinations').delete().eq('id', (link as any).id);
    } else {
      await (supabase as any).from('collection_destinations').insert({ collection_id: collectionId, destination_id: destId });
    }
    refetchCD();
    invalidateAll();
  };

  const homeCarousels = collections.filter((c: any) => c.show_on_home);
  const otherCollections = collections.filter((c: any) => !c.show_on_home);

  if (isLoading) return <div className="text-center py-8 text-muted-foreground text-sm">Loading collections...</div>;

  return (
    <div className="space-y-6">
      {/* Create new */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Plus className="w-4 h-4" /> New Carousel / Collection</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Use <code className="bg-muted px-1 rounded">{'{{city}}'}</code> in the name for dynamic city substitution (e.g. &quot;Top in {'{{city}}'}&quot;)
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Input placeholder="Name (e.g. Top in {city})" value={newName} onChange={e => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/\{city\}/g, 'city').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')); }} />
          <Input placeholder="Slug" value={newSlug} onChange={e => setNewSlug(e.target.value)} className="font-mono text-xs" />
          <Select value={newType} onValueChange={setNewType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONTENT_TYPES.map(ct => (
                <SelectItem key={ct.value} value={ct.value}>
                  <div className="flex items-center gap-2">
                    <ct.icon className="w-3.5 h-3.5" />
                    {ct.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
        </div>
      </Card>

      {/* Home Carousels */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          🏠 Homepage Carousels ({homeCarousels.length})
        </h3>
        <div className="space-y-2">
          {homeCarousels.map((col: any) => (
            <CarouselRow
              key={col.id}
              col={col}
              destinations={destinations}
              destIds={getDestIdsForCollection(col.id)}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              handleUpdate={handleUpdate}
              handleDelete={handleDelete}
              toggleDestination={toggleDestination}
            />
          ))}
          {homeCarousels.length === 0 && (
            <p className="text-xs text-muted-foreground py-4 text-center">No carousels on home yet. Toggle "Home" on a collection to show it.</p>
          )}
        </div>
      </div>

      {/* Other Collections */}
      {otherCollections.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
            📦 Other Collections ({otherCollections.length})
          </h3>
          <div className="space-y-2">
            {otherCollections.map((col: any) => (
              <CarouselRow
                key={col.id}
                col={col}
                destinations={destinations}
                destIds={getDestIdsForCollection(col.id)}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
                handleUpdate={handleUpdate}
                handleDelete={handleDelete}
                toggleDestination={toggleDestination}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CarouselRow = ({ col, destinations, destIds, expandedId, setExpandedId, handleUpdate, handleDelete, toggleDestination }: any) => {
  const destNames = destIds.map((did: string) => destinations.find((d: any) => d.id === did)?.name).filter(Boolean);
  const ContentIcon = CONTENT_TYPES.find(ct => ct.value === col.content_type)?.icon || Layers;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(expandedId === col.id ? null : col.id)}>
          <div className="flex items-center gap-2 flex-wrap">
            <ContentIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-medium text-sm">{col.name}</span>
            <Badge variant="outline" className="text-[10px]">{contentTypeLabel(col.content_type)}</Badge>
            {col.show_on_home && <Badge className="text-[10px] bg-primary/10 text-primary border-0">Home #{col.home_display_order}</Badge>}
            {destNames.map((n: string) => (
              <Badge key={n} variant="secondary" className="text-[10px]">{n}</Badge>
            ))}
            {destIds.length === 0 && <Badge variant="outline" className="text-[10px] text-muted-foreground">All markets</Badge>}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">/collections/{col.slug}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Switch checked={col.show_on_home} onCheckedChange={(v) => handleUpdate(col.id, { show_on_home: v })} className="scale-75" />
          <span className="text-[10px] text-muted-foreground w-8">{col.show_on_home ? 'Home' : 'Off'}</span>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={() => handleDelete(col.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <button onClick={() => setExpandedId(expandedId === col.id ? null : col.id)}>
            {expandedId === col.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expandedId === col.id && (
        <div className="border-t p-4 bg-muted/20 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Name <span className="text-muted-foreground">(use {'{city}'} for dynamic)</span></Label>
              <Input defaultValue={col.name} onBlur={e => handleUpdate(col.id, { name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Slug</Label>
              <Input defaultValue={col.slug} onBlur={e => handleUpdate(col.id, { slug: e.target.value })} className="font-mono text-xs" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Home Display Order</Label>
              <Input type="number" defaultValue={col.home_display_order || 0} onBlur={e => handleUpdate(col.id, { home_display_order: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <Label className="text-xs">Content Type</Label>
              <Select defaultValue={col.content_type || 'itinerary'} onValueChange={v => handleUpdate(col.id, { content_type: v, collection_type: v === 'itinerary' ? 'itineraries' : v === 'product' ? 'products' : 'pois' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map(ct => (
                    <SelectItem key={ct.value} value={ct.value}>
                      <div className="flex items-center gap-2"><ct.icon className="w-3.5 h-3.5" />{ct.label}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input defaultValue={col.description || ''} onBlur={e => handleUpdate(col.id, { description: e.target.value })} />
            </div>
          </div>

          {/* Multi-market selector */}
          <div>
            <Label className="text-xs font-semibold">Markets (destinations)</Label>
            <p className="text-[11px] text-muted-foreground mb-2">
              Leave all unchecked = visible in every market. Check specific ones to restrict. Use {'{city}'} in carousel name for dynamic substitution.
            </p>
            <div className="flex flex-wrap gap-2">
              {destinations.map((d: any) => {
                const isLinked = destIds.includes(d.id);
                return (
                  <label key={d.id} className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-colors",
                    isLinked ? "bg-primary/10 border-primary/30 text-primary font-medium" : "bg-background border-border text-muted-foreground hover:bg-muted"
                  )}>
                    <Checkbox
                      checked={isLinked}
                      onCheckedChange={() => toggleDestination(col.id, d.id, isLinked)}
                      className="h-3.5 w-3.5"
                    />
                    {d.flag_svg_url && <img src={d.flag_svg_url} className="w-3.5 h-3.5 rounded-full" alt="" />}
                    {d.name}
                  </label>
                );
              })}
            </div>
          </div>

          <CollectionItemsEditor collectionId={col.id} contentType={col.content_type || 'itinerary'} />
        </div>
      )}
    </Card>
  );
};

// Searchable item picker + linked items editor
const CollectionItemsEditor = ({ collectionId, contentType }: { collectionId: string; contentType: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: linkedItems = [], refetch } = useQuery({
    queryKey: ['collection-items-admin', collectionId, contentType],
    queryFn: async () => {
      // Fetch ALL items for this collection (don't filter by item_type — content_type on the collection determines rendering)
      const { data } = await (supabase as any)
        .from('collection_items')
        .select('id, item_id, item_type, position')
        .eq('collection_id', collectionId)
        .order('position');
      
      const ids = (data || []).map((r: any) => r.item_id);
      let nameMap: Record<string, { label: string; sub?: string }> = {};
      
      if (ids.length > 0) {
        // Resolve names from the table matching the collection's content_type
        if (contentType === 'poi') {
          const { data: pois } = await supabase.from('pois').select('id, name, poi_type').in('id', ids);
          (pois || []).forEach((p: any) => { nameMap[p.id] = { label: p.name, sub: p.poi_type }; });
        } else if (contentType === 'product') {
          const { data: products } = await supabase.from('products').select('id, title, slug').in('id', ids);
          (products || []).forEach((p: any) => { nameMap[p.id] = { label: p.title, sub: p.slug }; });
        } else {
          const { data: itins } = await (supabase as any).from('public_itineraries').select('id, name').in('id', ids);
          (itins || []).forEach((i: any) => { nameMap[i.id] = { label: i.name }; });
        }
      }
      
      return (data || []).map((r: any) => ({
        linkId: r.id,
        itemId: r.item_id,
        label: nameMap[r.item_id]?.label || r.item_id,
        sub: nameMap[r.item_id]?.sub || r.item_type,
        table: 'collection_items',
      }));
    },
  });

  const { data: searchPool = [] } = useQuery({
    queryKey: ['collection-search-pool', contentType],
    queryFn: async () => {
      if (contentType === 'poi') {
        const { data } = await supabase.from('pois').select('id, name, poi_type, destination_id').eq('is_active', true).order('name');
        return (data || []).map((p: any) => ({ id: p.id, label: p.name, sub: p.poi_type }));
      } else if (contentType === 'product') {
        const { data } = await supabase.from('products').select('id, title, slug').order('title');
        return (data || []).map((p: any) => ({ id: p.id, label: p.title, sub: p.slug }));
      } else {
        const { data } = await (supabase as any).from('public_itineraries').select('id, name, tag').eq('is_active', true).order('name');
        return (data || []).map((i: any) => ({ id: i.id, label: i.name, sub: i.tag }));
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const linkedIds = new Set(linkedItems.map((i: any) => i.itemId));

  const filteredPool = useMemo(() => {
    if (!searchTerm.trim()) return searchPool.filter((p: any) => !linkedIds.has(p.id)).slice(0, 20);
    const q = searchTerm.toLowerCase();
    return searchPool.filter((p: any) => !linkedIds.has(p.id) && (p.label?.toLowerCase().includes(q) || p.sub?.toLowerCase().includes(q))).slice(0, 20);
  }, [searchTerm, searchPool, linkedIds]);

  const handleAdd = async (itemId: string) => {
    const itemType = contentType === 'poi' ? 'poi' : contentType === 'product' ? 'product' : 'itinerary';
    await (supabase as any).from('collection_items').insert({ collection_id: collectionId, item_id: itemId, item_type: itemType, position: linkedItems.length });
    refetch();
    queryClient.invalidateQueries({ queryKey: ['home-carousels'] });
    toast({ title: 'Added' });
  };

  const handleRemove = async (linkId: string, table: string) => {
    await (supabase as any).from(table).delete().eq('id', linkId);
    refetch();
    queryClient.invalidateQueries({ queryKey: ['home-carousels'] });
  };

  const ContentIcon = CONTENT_TYPES.find(ct => ct.value === contentType)?.icon || Layers;

  return (
    <div className="border-t pt-3">
      <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
        <ContentIcon className="w-3 h-3" /> Linked {contentTypeLabel(contentType)} ({linkedItems.length})
      </h4>
      <p className="text-[11px] text-muted-foreground mb-2">
        Empty = auto-populate from all available {contentTypeLabel(contentType).toLowerCase()} for the selected market(s)
      </p>

      <div className="space-y-1 mb-3 max-h-[200px] overflow-y-auto">
        {linkedItems.map((item: any) => (
          <div key={item.linkId} className="flex items-center gap-2 p-1.5 bg-background rounded text-xs">
            <span className="flex-1 truncate font-medium">{item.label}</span>
            {item.sub && <span className="text-muted-foreground truncate max-w-[120px]">{item.sub}</span>}
            <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive/60 hover:text-destructive shrink-0" onClick={() => handleRemove(item.linkId, item.table)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
        {linkedItems.length === 0 && <p className="text-xs text-muted-foreground py-2">No items linked — will auto-populate from all available {contentTypeLabel(contentType).toLowerCase()}</p>}
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder={`Search ${contentTypeLabel(contentType).toLowerCase()} to add...`}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="text-xs pl-8 pr-8"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-2.5">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>
      {(searchTerm || linkedItems.length === 0) && filteredPool.length > 0 && (
        <div className="mt-1 max-h-[180px] overflow-y-auto border rounded-md bg-background">
          {filteredPool.map((item: any) => (
            <button
              key={item.id}
              onClick={() => handleAdd(item.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-left border-b last:border-0"
            >
              <Plus className="w-3 h-3 text-primary shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.sub && <span className="text-muted-foreground truncate max-w-[100px]">{item.sub}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
