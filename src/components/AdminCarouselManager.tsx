/**
 * Admin Carousel/Collection Manager — manage home page carousels,
 * collection membership, ordering, and city assignment.
 */
import { useState } from 'react';
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
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Eye, EyeOff, ExternalLink, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AdminCarouselManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newType, setNewType] = useState('itineraries');

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
      const { data } = await supabase.from('destinations').select('id, name, slug, flag_emoji').eq('is_active', true).order('name');
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
    queryClient.invalidateQueries({ queryKey: ['home-carousels'] });
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newSlug.trim()) return;
    const { error } = await (supabase as any).from('collections').insert({
      name: newName,
      slug: newSlug,
      collection_type: newType,
      content_type: newType === 'itineraries' ? 'itinerary' : 'experience',
      show_on_home: false,
      home_display_order: collections.length,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Created', description: `Collection "${newName}" created` });
      setNewName(''); setNewSlug('');
      invalidateAll();
    }
  };

  const handleUpdate = async (id: string, updates: Record<string, any>) => {
    const { error } = await (supabase as any).from('collections').update(updates).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      invalidateAll();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this collection?')) return;
    await (supabase as any).from('collections').update({ is_active: false }).eq('id', id);
    invalidateAll();
  };

  if (isLoading) return <div className="text-center py-8 text-muted-foreground text-sm">Loading collections...</div>;

  return (
    <div className="space-y-6">
      {/* Create new */}
      <Card className="p-4">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Plus className="w-4 h-4" /> New Collection / Carousel</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Input placeholder="Name (e.g. Top in Zanzibar)" value={newName} onChange={e => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')); }} />
          <Input placeholder="Slug" value={newSlug} onChange={e => setNewSlug(e.target.value)} />
          <Select value={newType} onValueChange={setNewType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="itineraries">Itineraries</SelectItem>
              <SelectItem value="experiences">Experiences</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleCreate} disabled={!newName.trim()}>Create</Button>
        </div>
      </Card>

      {/* List */}
      <div className="space-y-2">
        {collections.map((col: any, idx: number) => (
          <Card key={col.id} className="overflow-hidden">
            <div className="flex items-center gap-2 p-3">
              <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedId(expandedId === col.id ? null : col.id)}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{col.name}</span>
                  <Badge variant="outline" className="text-[10px]">{col.collection_type}</Badge>
                  {col.show_on_home && <Badge className="text-[10px] bg-primary/10 text-primary border-0">Home #{col.home_display_order}</Badge>}
                  {col.city_id && <Badge variant="secondary" className="text-[10px]">
                    {destinations.find((d: any) => d.id === col.city_id)?.name || 'City'}
                  </Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">/collections/{col.slug}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Switch
                  checked={col.show_on_home}
                  onCheckedChange={(v) => handleUpdate(col.id, { show_on_home: v })}
                  className="scale-75"
                />
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
              <div className="border-t p-4 bg-muted/20 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input defaultValue={col.name} onBlur={e => handleUpdate(col.id, { name: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Slug</Label>
                    <Input defaultValue={col.slug} onBlur={e => handleUpdate(col.id, { slug: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Home Display Order</Label>
                    <Input type="number" defaultValue={col.home_display_order || 0} onBlur={e => handleUpdate(col.id, { home_display_order: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label className="text-xs">City Filter</Label>
                    <Select defaultValue={col.city_id || 'none'} onValueChange={v => handleUpdate(col.id, { city_id: v === 'none' ? null : v })}>
                      <SelectTrigger><SelectValue placeholder="No city filter" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">All cities</SelectItem>
                        {destinations.map((d: any) => (
                          <SelectItem key={d.id} value={d.id}>{d.flag_emoji} {d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Collection Type</Label>
                    <Select defaultValue={col.collection_type} onValueChange={v => handleUpdate(col.id, { collection_type: v, content_type: v === 'itineraries' ? 'itinerary' : 'experience' })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="itineraries">Itineraries</SelectItem>
                        <SelectItem value="experiences">Experiences</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Input defaultValue={col.description || ''} onBlur={e => handleUpdate(col.id, { description: e.target.value })} />
                  </div>
                </div>
                <CollectionItemsEditor collectionId={col.id} collectionType={col.collection_type} />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

// Inline editor for collection items
const CollectionItemsEditor = ({ collectionId, collectionType }: { collectionId: string; collectionType: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newItemId, setNewItemId] = useState('');

  const { data: linkedItems = [], refetch } = useQuery({
    queryKey: ['collection-items-admin', collectionId],
    queryFn: async () => {
      if (collectionType === 'experiences') {
        const { data } = await (supabase as any)
          .from('collection_experiences')
          .select('id, experience_id, display_order, experiences(id, title, location)')
          .eq('collection_id', collectionId)
          .order('display_order');
        return (data || []).map((r: any) => ({ linkId: r.id, itemId: r.experience_id, label: r.experiences?.title || r.experience_id, sub: r.experiences?.location }));
      } else {
        const { data } = await (supabase as any)
          .from('collection_items')
          .select('id, item_id, item_type, position')
          .eq('collection_id', collectionId)
          .order('position');
        return (data || []).map((r: any) => ({ linkId: r.id, itemId: r.item_id, label: r.item_id, sub: r.item_type }));
      }
    },
  });

  const handleAdd = async () => {
    if (!newItemId.trim()) return;
    const ids = newItemId.split(',').map(s => s.trim()).filter(Boolean);
    for (const id of ids) {
      if (collectionType === 'experiences') {
        await (supabase as any).from('collection_experiences').insert({ collection_id: collectionId, experience_id: id, display_order: linkedItems.length });
      } else {
        await (supabase as any).from('collection_items').insert({ collection_id: collectionId, item_id: id, item_type: 'itinerary', position: linkedItems.length });
      }
    }
    setNewItemId('');
    refetch();
    queryClient.invalidateQueries({ queryKey: ['home-carousels'] });
    toast({ title: 'Added', description: `${ids.length} item(s) linked` });
  };

  const handleRemove = async (linkId: string) => {
    const table = collectionType === 'experiences' ? 'collection_experiences' : 'collection_items';
    await (supabase as any).from(table).delete().eq('id', linkId);
    refetch();
    queryClient.invalidateQueries({ queryKey: ['home-carousels'] });
  };

  return (
    <div className="mt-3 border-t pt-3">
      <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
        <Layers className="w-3 h-3" /> Linked Items ({linkedItems.length})
      </h4>
      <div className="space-y-1 mb-3 max-h-[200px] overflow-y-auto">
        {linkedItems.map((item: any) => (
          <div key={item.linkId} className="flex items-center gap-2 p-1.5 bg-background rounded text-xs">
            <span className="flex-1 truncate">{item.label}</span>
            {item.sub && <span className="text-muted-foreground truncate">{item.sub}</span>}
            <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive/60 hover:text-destructive shrink-0" onClick={() => handleRemove(item.linkId)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
        {linkedItems.length === 0 && <p className="text-xs text-muted-foreground py-2">No items linked — will show all {collectionType} as fallback</p>}
      </div>
      <div className="flex gap-2">
        <Input placeholder="Paste item ID(s), comma-separated" value={newItemId} onChange={e => setNewItemId(e.target.value)} className="text-xs" />
        <Button size="sm" onClick={handleAdd} disabled={!newItemId.trim()} className="shrink-0">
          <Plus className="w-3 h-3 mr-1" /> Link
        </Button>
      </div>
    </div>
  );
};
