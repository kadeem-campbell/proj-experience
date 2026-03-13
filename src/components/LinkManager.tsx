import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X, GripVertical, Search, Link2, BookOpen, FolderOpen, MapPin } from 'lucide-react';

interface LinkedItem {
  id: string;
  linkId: string;
  title: string;
  slug: string;
  type: 'experience' | 'itinerary';
  order: number;
}

const usePublicItineraries = () => useQuery({
  queryKey: ['link-manager-itineraries'],
  queryFn: async () => {
    const { data } = await supabase.from('public_itineraries').select('id, name, slug').eq('is_active', true).order('name');
    return data || [];
  },
  staleTime: 60000,
});

const useExperiences = () => useQuery({
  queryKey: ['link-manager-experiences'],
  queryFn: async () => {
    const { data } = await supabase.from('experiences').select('id, title, slug, category').eq('is_active', true).order('title');
    return data || [];
  },
  staleTime: 60000,
});

const useCollections = () => useQuery({
  queryKey: ['link-manager-collections'],
  queryFn: async () => {
    const { data } = await supabase.from('collections').select('id, name, slug, collection_type').eq('is_active', true).order('name');
    return data || [];
  },
  staleTime: 60000,
});

// Fetch linked experiences for an itinerary
const useItineraryLinks = (itineraryId: string | null) => useQuery({
  queryKey: ['itinerary-links', itineraryId],
  queryFn: async () => {
    if (!itineraryId) return [];
    const { data } = await (supabase as any).from('itinerary_experiences')
      .select('id, experience_id, display_order, notes, experiences(id, title, slug)')
      .eq('itinerary_id', itineraryId)
      .order('display_order');
    return (data || []).map((d: any) => ({
      id: d.experiences?.id || d.experience_id,
      linkId: d.id,
      title: d.experiences?.title || 'Unknown',
      slug: d.experiences?.slug || '',
      type: 'experience' as const,
      order: d.display_order || 0,
    }));
  },
  enabled: !!itineraryId,
});

// Fetch linked experiences for a collection
const useCollectionExpLinks = (collectionId: string | null) => useQuery({
  queryKey: ['collection-exp-links', collectionId],
  queryFn: async () => {
    if (!collectionId) return [];
    const { data } = await (supabase as any).from('collection_experiences')
      .select('id, experience_id, display_order, experiences(id, title, slug)')
      .eq('collection_id', collectionId)
      .order('display_order');
    return (data || []).map((d: any) => ({
      id: d.experiences?.id || d.experience_id,
      linkId: d.id,
      title: d.experiences?.title || 'Unknown',
      slug: d.experiences?.slug || '',
      type: 'experience' as const,
      order: d.display_order || 0,
    }));
  },
  enabled: !!collectionId,
});

// Fetch linked itineraries for a collection
const useCollectionItinLinks = (collectionId: string | null) => useQuery({
  queryKey: ['collection-itin-links', collectionId],
  queryFn: async () => {
    if (!collectionId) return [];
    const { data } = await (supabase as any).from('collection_items')
      .select('id, item_id, position')
      .eq('collection_id', collectionId)
      .eq('item_type', 'itinerary')
      .order('position');
    if (!data || data.length === 0) return [];
    // Fetch itinerary details
    const ids = data.map((d: any) => d.item_id);
    const { data: itins } = await supabase.from('public_itineraries').select('id, name, slug').in('id', ids);
    const itinMap: Record<string, { id: string; name: string; slug: string }> = {};
    (itins || []).forEach(i => { itinMap[i.id] = i; });
    return data.map((d: any) => {
      const itin = itinMap[d.item_id];
      return {
        id: d.item_id,
        linkId: d.id,
        title: itin?.name || 'Unknown',
        slug: itin?.slug || '',
        type: 'itinerary' as const,
        order: d.position || 0,
      };
    });
  },
  enabled: !!collectionId,
});

export const LinkManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('itinerary');
  const [selectedItinerary, setSelectedItinerary] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [expSearch, setExpSearch] = useState('');
  const [itinSearch, setItinSearch] = useState('');

  const { data: itineraries = [] } = usePublicItineraries();
  const { data: experiences = [] } = useExperiences();
  const { data: collections = [] } = useCollections();

  const { data: itinLinks = [] } = useItineraryLinks(selectedItinerary);
  const { data: collExpLinks = [] } = useCollectionExpLinks(
    activeTab === 'collection-exp' ? selectedCollection : null
  );
  const { data: collItinLinks = [] } = useCollectionItinLinks(
    activeTab === 'collection-itin' ? selectedCollection : null
  );

  const linkedExpIds = new Set<string>(itinLinks.map(l => l.id));
  const linkedCollExpIds = new Set<string>(collExpLinks.map(l => l.id));
  const linkedCollItinIds = new Set<string>(collItinLinks.map(l => l.id));

  const filteredExperiences = experiences.filter(e =>
    e.title.toLowerCase().includes(expSearch.toLowerCase()) ||
    e.category?.toLowerCase().includes(expSearch.toLowerCase())
  );

  const filteredItineraries = itineraries.filter(i =>
    i.name.toLowerCase().includes(itinSearch.toLowerCase())
  );

  const addExpToItinerary = async (expId: string) => {
    if (!selectedItinerary) return;
    const { error } = await (supabase as any).from('itinerary_experiences').insert({
      itinerary_id: selectedItinerary,
      experience_id: expId,
      display_order: itinLinks.length,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Experience linked ✓' });
      queryClient.invalidateQueries({ queryKey: ['itinerary-links', selectedItinerary] });
    }
  };

  const removeFromItinerary = async (linkId: string) => {
    const { error } = await (supabase as any).from('itinerary_experiences').delete().eq('id', linkId);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['itinerary-links', selectedItinerary] });
      toast({ title: 'Removed' });
    }
  };

  const addExpToCollection = async (expId: string) => {
    if (!selectedCollection) return;
    const { error } = await (supabase as any).from('collection_experiences').insert({
      collection_id: selectedCollection,
      experience_id: expId,
      display_order: collExpLinks.length,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Experience linked ✓' });
      queryClient.invalidateQueries({ queryKey: ['collection-exp-links', selectedCollection] });
    }
  };

  const removeExpFromCollection = async (linkId: string) => {
    const { error } = await (supabase as any).from('collection_experiences').delete().eq('id', linkId);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['collection-exp-links', selectedCollection] });
      toast({ title: 'Removed' });
    }
  };

  const addItinToCollection = async (itinId: string) => {
    if (!selectedCollection) return;
    const { error } = await (supabase as any).from('collection_items').insert({
      collection_id: selectedCollection,
      item_id: itinId,
      item_type: 'itinerary',
      position: collItinLinks.length,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Itinerary linked ✓' });
      queryClient.invalidateQueries({ queryKey: ['collection-itin-links', selectedCollection] });
    }
  };

  const removeItinFromCollection = async (linkId: string) => {
    const { error } = await (supabase as any).from('collection_items').delete().eq('id', linkId);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['collection-itin-links', selectedCollection] });
      toast({ title: 'Removed' });
    }
  };

  const moveItem = async (
    table: string,
    linkId: string,
    links: LinkedItem[],
    currentIndex: number,
    direction: 'up' | 'down',
    queryKey: any[]
  ) => {
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= links.length) return;

    const orderField = table === 'collection_items' ? 'position' : 'display_order';
    const current = links[currentIndex];
    const swap = links[newIndex];

    await Promise.all([
      (supabase as any).from(table).update({ [orderField]: newIndex }).eq('id', current.linkId),
      (supabase as any).from(table).update({ [orderField]: currentIndex }).eq('id', swap.linkId),
    ]);
    queryClient.invalidateQueries({ queryKey });
  };

  const renderLinkedItems = (
    links: LinkedItem[],
    onRemove: (linkId: string) => void,
    table: string,
    queryKey: any[]
  ) => (
    <div className="space-y-1">
      {links.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center">No items linked yet. Click + on items from the right panel to add them.</p>
      )}
      {links.map((item, idx) => (
        <div key={item.linkId} className="flex items-center gap-2 p-2.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors group">
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => moveItem(table, item.linkId, links, idx, 'up', queryKey)}
              disabled={idx === 0}
              className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-opacity"
            >▲</button>
            <button
              onClick={() => moveItem(table, item.linkId, links, idx, 'down', queryKey)}
              disabled={idx === links.length - 1}
              className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-opacity"
            >▼</button>
          </div>
          <span className="text-xs text-muted-foreground w-6 text-center">{idx + 1}</span>
          <Badge variant={item.type === 'experience' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
            {item.type === 'experience' ? '📍' : '🗺️'}
          </Badge>
          <span className="text-sm font-medium flex-1 truncate">{item.title}</span>
          <span className="text-[10px] text-muted-foreground truncate max-w-24">/{item.slug}</span>
          <Button
            variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
            onClick={() => onRemove(item.linkId)}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );

  const renderAvailableExperiences = (
    linkedIds: Set<string>,
    onAdd: (id: string) => void
  ) => (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search experiences..."
          value={expSearch}
          onChange={(e) => setExpSearch(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>
      <div className="space-y-1 max-h-[500px] overflow-y-auto">
        {filteredExperiences.map(exp => {
          const isLinked = linkedIds.has(exp.id);
          return (
            <div key={exp.id} className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-colors ${isLinked ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/30'}`}>
              <span className="flex-1 truncate font-medium">{exp.title}</span>
              <Badge variant="outline" className="text-[10px] shrink-0">{exp.category}</Badge>
              {isLinked ? (
                <Badge variant="secondary" className="text-[10px] shrink-0">Added</Badge>
              ) : (
                <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={() => onAdd(exp.id)}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAvailableItineraries = (
    linkedIds: Set<string>,
    onAdd: (id: string) => void
  ) => (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search itineraries..."
          value={itinSearch}
          onChange={(e) => setItinSearch(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>
      <div className="space-y-1 max-h-[500px] overflow-y-auto">
        {filteredItineraries.map(itin => {
          const isLinked = linkedIds.has(itin.id);
          return (
            <div key={itin.id} className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-colors ${isLinked ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/30'}`}>
              <span className="flex-1 truncate font-medium">{itin.name}</span>
              {isLinked ? (
                <Badge variant="secondary" className="text-[10px] shrink-0">Added</Badge>
              ) : (
                <Button variant="outline" size="icon" className="h-7 w-7 shrink-0" onClick={() => onAdd(itin.id)}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setExpSearch(''); setItinSearch(''); }}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="itinerary" className="gap-1.5 text-xs">
            <MapPin className="w-3.5 h-3.5" /> Experiences → Itinerary
          </TabsTrigger>
          <TabsTrigger value="collection-exp" className="gap-1.5 text-xs">
            <FolderOpen className="w-3.5 h-3.5" /> Experiences → Collection
          </TabsTrigger>
          <TabsTrigger value="collection-itin" className="gap-1.5 text-xs">
            <BookOpen className="w-3.5 h-3.5" /> Itineraries → Collection
          </TabsTrigger>
        </TabsList>

        {/* Experiences → Itinerary */}
        <TabsContent value="itinerary">
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Select Itinerary</Label>
            <Select value={selectedItinerary || ''} onValueChange={setSelectedItinerary}>
              <SelectTrigger><SelectValue placeholder="Choose an itinerary..." /></SelectTrigger>
              <SelectContent>
                {itineraries.map(i => (
                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedItinerary && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Link2 className="w-4 h-4" /> Linked Experiences ({itinLinks.length})
                </h4>
                {renderLinkedItems(itinLinks, removeFromItinerary, 'itinerary_experiences', ['itinerary-links', selectedItinerary])}
              </Card>
              <Card className="p-4">
                <h4 className="text-sm font-semibold mb-3">Available Experiences</h4>
                {renderAvailableExperiences(linkedExpIds, addExpToItinerary)}
              </Card>
            </div>
          )}
          {!selectedItinerary && (
            <p className="text-center text-muted-foreground py-12">Select an itinerary above to manage its experiences</p>
          )}
        </TabsContent>

        {/* Experiences → Collection */}
        <TabsContent value="collection-exp">
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Select Collection</Label>
            <Select value={selectedCollection || ''} onValueChange={setSelectedCollection}>
              <SelectTrigger><SelectValue placeholder="Choose a collection..." /></SelectTrigger>
              <SelectContent>
                {collections.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.collection_type})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedCollection && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Link2 className="w-4 h-4" /> Linked Experiences ({collExpLinks.length})
                </h4>
                {renderLinkedItems(collExpLinks, removeExpFromCollection, 'collection_experiences', ['collection-exp-links', selectedCollection])}
              </Card>
              <Card className="p-4">
                <h4 className="text-sm font-semibold mb-3">Available Experiences</h4>
                {renderAvailableExperiences(linkedCollExpIds, addExpToCollection)}
              </Card>
            </div>
          )}
          {!selectedCollection && (
            <p className="text-center text-muted-foreground py-12">Select a collection above to manage its experiences</p>
          )}
        </TabsContent>

        {/* Itineraries → Collection */}
        <TabsContent value="collection-itin">
          <div className="mb-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Select Collection</Label>
            <Select value={selectedCollection || ''} onValueChange={setSelectedCollection}>
              <SelectTrigger><SelectValue placeholder="Choose a collection..." /></SelectTrigger>
              <SelectContent>
                {collections.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.collection_type})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedCollection && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Link2 className="w-4 h-4" /> Linked Itineraries ({collItinLinks.length})
                </h4>
                {renderLinkedItems(collItinLinks, removeItinFromCollection, 'collection_items', ['collection-itin-links', selectedCollection])}
              </Card>
              <Card className="p-4">
                <h4 className="text-sm font-semibold mb-3">Available Itineraries</h4>
                {renderAvailableItineraries(linkedCollItinIds, addItinToCollection)}
              </Card>
            </div>
          )}
          {!selectedCollection && (
            <p className="text-center text-muted-foreground py-12">Select a collection above to manage its itineraries</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
