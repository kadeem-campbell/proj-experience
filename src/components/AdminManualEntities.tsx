import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useCategories, useCities, useCreators } from '@/hooks/useAppData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

interface CreatePayload {
  table: string;
  payload: Record<string, any>;
  successTitle: string;
  invalidateKeys: string[];
}

export const AdminManualEntities = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useCategories();
  const { data: cities = [] } = useCities();
  const { data: creators = [] } = useCreators();

  const { data: publicItineraries = [] } = useQuery({
    queryKey: ['admin-manual-itineraries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_itineraries')
        .select('id, name, slug, is_active')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) return [];
      return data || [];
    },
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['admin-manual-collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('id, name, slug, collection_type, is_active')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) return [];
      return data || [];
    },
  });

  const [categoryForm, setCategoryForm] = useState({ name: '', emoji: '', description: '' });
  const [cityForm, setCityForm] = useState({ name: '', country: '', flag_emoji: '', flag_svg_url: '', airport_code: '', launch_date: '', latitude: '', longitude: '' });
  const [creatorForm, setCreatorForm] = useState({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: '',
    instagram: '',
    tiktok: '',
    website: '',
  });
  const [itineraryForm, setItineraryForm] = useState({ name: '', slug: '', description: '', tag: 'popular' });
  const [collectionForm, setCollectionForm] = useState({
    name: '',
    slug: '',
    description: '',
    collection_type: 'experiences',
    tag: '',
  });

  const createMutation = useMutation({
    mutationFn: async ({ table, payload }: CreatePayload) => {
      const { error } = await (supabase as any).from(table).insert(payload);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      vars.invalidateKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      toast({ title: vars.successTitle });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const collectionTypeCounts = useMemo(() => {
    const experiences = collections.filter((c: any) => c.collection_type === 'experiences').length;
    const itineraries = collections.filter((c: any) => c.collection_type === 'itineraries').length;
    return { experiences, itineraries };
  }, [collections]);

  return (
    <Card className="p-4 mb-6">
      <div className="mb-4">
        <h3 className="font-semibold">Manual Add — All Content Types</h3>
        <p className="text-xs text-muted-foreground">Create categories, cities, creators, itineraries, and collections directly from here.</p>
      </div>

      <Tabs defaultValue="categories">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="cities">Cities</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="itineraries">Itineraries</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Name *</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => setCategoryForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Adventure"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Emoji</Label>
              <Input
                value={categoryForm.emoji}
                onChange={(e) => setCategoryForm((p) => ({ ...p, emoji: e.target.value }))}
                placeholder="🏄"
              />
            </div>
            <div className="md:col-span-1">
              <Label className="text-xs mb-1 block">Description</Label>
              <Input
                value={categoryForm.description}
                onChange={(e) => setCategoryForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Short description"
              />
            </div>
          </div>
          <Button
            size="sm"
            disabled={!categoryForm.name.trim() || createMutation.isPending}
            onClick={() => {
              createMutation.mutate({
                table: 'categories',
                payload: {
                  name: categoryForm.name.trim(),
                  emoji: categoryForm.emoji.trim(),
                  description: categoryForm.description.trim(),
                },
                successTitle: 'Category created',
                invalidateKeys: ['categories'],
              });
              setCategoryForm({ name: '', emoji: '', description: '' });
            }}
          >
            Add Category
          </Button>
          <div className="text-xs text-muted-foreground">{categories.length} categories</div>
        </TabsContent>

        <TabsContent value="cities" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs mb-1 block">City *</Label>
              <Input value={cityForm.name} onChange={(e) => setCityForm((p) => ({ ...p, name: e.target.value }))} placeholder="Zanzibar" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Country</Label>
              <Input value={cityForm.country} onChange={(e) => setCityForm((p) => ({ ...p, country: e.target.value }))} placeholder="Tanzania" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Flag</Label>
              <Input value={cityForm.flag_emoji} onChange={(e) => setCityForm((p) => ({ ...p, flag_emoji: e.target.value }))} placeholder="🇹🇿" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Airport code</Label>
              <Input value={cityForm.airport_code} onChange={(e) => setCityForm((p) => ({ ...p, airport_code: e.target.value }))} placeholder="ZNZ" />
            </div>
          </div>
          <Button
            size="sm"
            disabled={!cityForm.name.trim() || createMutation.isPending}
            onClick={() => {
              createMutation.mutate({
                table: 'cities',
                payload: {
                  name: cityForm.name.trim(),
                  country: cityForm.country.trim(),
                  flag_emoji: cityForm.flag_emoji.trim(),
                  airport_code: cityForm.airport_code.trim(),
                },
                successTitle: 'City created',
                invalidateKeys: ['cities'],
              });
              setCityForm({ name: '', country: '', flag_emoji: '', airport_code: '' });
            }}
          >
            Add City
          </Button>
          <div className="text-xs text-muted-foreground">{cities.length} cities</div>
        </TabsContent>

        <TabsContent value="creators" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Username *</Label>
              <Input value={creatorForm.username} onChange={(e) => setCreatorForm((p) => ({ ...p, username: e.target.value }))} placeholder="kadeem" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Display name</Label>
              <Input value={creatorForm.display_name} onChange={(e) => setCreatorForm((p) => ({ ...p, display_name: e.target.value }))} placeholder="Kadeem" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Avatar URL</Label>
              <Input value={creatorForm.avatar_url} onChange={(e) => setCreatorForm((p) => ({ ...p, avatar_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="md:col-span-3">
              <Label className="text-xs mb-1 block">Bio</Label>
              <Textarea rows={2} value={creatorForm.bio} onChange={(e) => setCreatorForm((p) => ({ ...p, bio: e.target.value }))} placeholder="Short bio" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Instagram</Label>
              <Input value={creatorForm.instagram} onChange={(e) => setCreatorForm((p) => ({ ...p, instagram: e.target.value }))} placeholder="@handle" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">TikTok</Label>
              <Input value={creatorForm.tiktok} onChange={(e) => setCreatorForm((p) => ({ ...p, tiktok: e.target.value }))} placeholder="@handle" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Website</Label>
              <Input value={creatorForm.website} onChange={(e) => setCreatorForm((p) => ({ ...p, website: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <Button
            size="sm"
            disabled={!creatorForm.username.trim() || createMutation.isPending}
            onClick={() => {
              createMutation.mutate({
                table: 'creators',
                payload: {
                  username: creatorForm.username.trim(),
                  display_name: creatorForm.display_name.trim(),
                  bio: creatorForm.bio.trim(),
                  avatar_url: creatorForm.avatar_url.trim(),
                  social_links: {
                    instagram: creatorForm.instagram.trim(),
                    tiktok: creatorForm.tiktok.trim(),
                    website: creatorForm.website.trim(),
                  },
                },
                successTitle: 'Creator created',
                invalidateKeys: ['creators'],
              });
              setCreatorForm({ username: '', display_name: '', bio: '', avatar_url: '', instagram: '', tiktok: '', website: '' });
            }}
          >
            Add Creator
          </Button>
          <div className="text-xs text-muted-foreground">{creators.length} creators</div>
        </TabsContent>

        <TabsContent value="itineraries" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Name *</Label>
              <Input value={itineraryForm.name} onChange={(e) => setItineraryForm((p) => ({ ...p, name: e.target.value, slug: p.slug || toSlug(e.target.value) }))} placeholder="Best of Zanzibar" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Slug *</Label>
              <Input value={itineraryForm.slug} onChange={(e) => setItineraryForm((p) => ({ ...p, slug: toSlug(e.target.value) }))} placeholder="best-of-zanzibar" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Tag</Label>
              <Select value={itineraryForm.tag} onValueChange={(v) => setItineraryForm((p) => ({ ...p, tag: v }))}>
                <SelectTrigger><SelectValue placeholder="Tag" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">popular</SelectItem>
                  <SelectItem value="fave">fave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-1">
              <Label className="text-xs mb-1 block">Description</Label>
              <Input value={itineraryForm.description} onChange={(e) => setItineraryForm((p) => ({ ...p, description: e.target.value }))} placeholder="Short description" />
            </div>
          </div>
          <Button
            size="sm"
            disabled={!itineraryForm.name.trim() || !itineraryForm.slug.trim() || createMutation.isPending}
            onClick={() => {
              createMutation.mutate({
                table: 'public_itineraries',
                payload: {
                  name: itineraryForm.name.trim(),
                  slug: itineraryForm.slug.trim(),
                  description: itineraryForm.description.trim(),
                  tag: itineraryForm.tag,
                  is_active: true,
                },
                successTitle: 'Public itinerary created',
                invalidateKeys: ['public-itineraries', 'admin-manual-itineraries', 'link-manager-itineraries'],
              });
              setItineraryForm({ name: '', slug: '', description: '', tag: 'popular' });
            }}
          >
            Add Itinerary
          </Button>
          <div className="space-y-1 max-h-40 overflow-y-auto border rounded-md p-2">
            {publicItineraries.slice(0, 30).map((it: any) => (
              <div key={it.id} className="text-xs flex items-center justify-between">
                <span className="truncate">{it.name}</span>
                <span className="text-muted-foreground">/{it.slug}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="collections" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Name *</Label>
              <Input
                value={collectionForm.name}
                onChange={(e) => setCollectionForm((p) => ({ ...p, name: e.target.value, slug: p.slug || toSlug(e.target.value) }))}
                placeholder="Best of Zanzibar"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Slug *</Label>
              <Input
                value={collectionForm.slug}
                onChange={(e) => setCollectionForm((p) => ({ ...p, slug: toSlug(e.target.value) }))}
                placeholder="best-of-zanzibar"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Type</Label>
              <Select value={collectionForm.collection_type} onValueChange={(v) => setCollectionForm((p) => ({ ...p, collection_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="experiences">experiences</SelectItem>
                  <SelectItem value="itineraries">itineraries</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Tag</Label>
              <Input value={collectionForm.tag} onChange={(e) => setCollectionForm((p) => ({ ...p, tag: e.target.value }))} placeholder="popular" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Description</Label>
              <Input value={collectionForm.description} onChange={(e) => setCollectionForm((p) => ({ ...p, description: e.target.value }))} placeholder="Short description" />
            </div>
          </div>
          <Button
            size="sm"
            disabled={!collectionForm.name.trim() || !collectionForm.slug.trim() || createMutation.isPending}
            onClick={() => {
              createMutation.mutate({
                table: 'collections',
                payload: {
                  name: collectionForm.name.trim(),
                  slug: collectionForm.slug.trim(),
                  description: collectionForm.description.trim(),
                  collection_type: collectionForm.collection_type,
                  tag: collectionForm.tag.trim(),
                  is_active: true,
                },
                successTitle: 'Collection created',
                invalidateKeys: ['admin-manual-collections', 'link-manager-collections'],
              });
              setCollectionForm({ name: '', slug: '', description: '', collection_type: 'experiences', tag: '' });
            }}
          >
            Add Collection
          </Button>
          <div className="text-xs text-muted-foreground">
            {collections.length} collections · {collectionTypeCounts.experiences} experience · {collectionTypeCounts.itineraries} itinerary
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto border rounded-md p-2">
            {collections.slice(0, 30).map((col: any) => (
              <div key={col.id} className="text-xs flex items-center justify-between gap-2">
                <span className="truncate">{col.name}</span>
                <span className="text-muted-foreground">{col.collection_type}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};