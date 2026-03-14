import { useMemo, useState, useCallback } from 'react';
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
import { Pencil, Check, X, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const toSlug = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

// Common country codes for hatscripts circle-flags
const COUNTRY_OPTIONS = [
  { code: 'tz', name: 'Tanzania' },
  { code: 'tz-zanzibar', name: 'Tanzania - Zanzibar' },
  { code: 'ke', name: 'Kenya' },
  { code: 'za', name: 'South Africa' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'us', name: 'United States' },
  { code: 'ae', name: 'United Arab Emirates' },
  { code: 'fr', name: 'France' },
  { code: 'es', name: 'Spain' },
  { code: 'it', name: 'Italy' },
  { code: 'pt', name: 'Portugal' },
  { code: 'gr', name: 'Greece' },
  { code: 'th', name: 'Thailand' },
  { code: 'id', name: 'Indonesia' },
  { code: 'jp', name: 'Japan' },
  { code: 'au', name: 'Australia' },
  { code: 'br', name: 'Brazil' },
  { code: 'mx', name: 'Mexico' },
  { code: 'co', name: 'Colombia' },
  { code: 'ma', name: 'Morocco' },
  { code: 'eg', name: 'Egypt' },
  { code: 'ng', name: 'Nigeria' },
  { code: 'gh', name: 'Ghana' },
  { code: 'et', name: 'Ethiopia' },
  { code: 'ug', name: 'Uganda' },
  { code: 'rw', name: 'Rwanda' },
  { code: 'mz', name: 'Mozambique' },
  { code: 'mu', name: 'Mauritius' },
  { code: 'sc', name: 'Seychelles' },
  { code: 'mg', name: 'Madagascar' },
  { code: 'in', name: 'India' },
  { code: 'cn', name: 'China' },
  { code: 'kr', name: 'South Korea' },
  { code: 'sg', name: 'Singapore' },
  { code: 'my', name: 'Malaysia' },
  { code: 'ph', name: 'Philippines' },
  { code: 'vn', name: 'Vietnam' },
  { code: 'tr', name: 'Turkey' },
  { code: 'hr', name: 'Croatia' },
  { code: 'me', name: 'Montenegro' },
  { code: 'de', name: 'Germany' },
  { code: 'nl', name: 'Netherlands' },
  { code: 'se', name: 'Sweden' },
  { code: 'no', name: 'Norway' },
  { code: 'dk', name: 'Denmark' },
  { code: 'fi', name: 'Finland' },
  { code: 'is', name: 'Iceland' },
  { code: 'ca', name: 'Canada' },
  { code: 'ar', name: 'Argentina' },
  { code: 'pe', name: 'Peru' },
  { code: 'cl', name: 'Chile' },
  { code: 'cr', name: 'Costa Rica' },
  { code: 'jm', name: 'Jamaica' },
  { code: 'cu', name: 'Cuba' },
  { code: 'do', name: 'Dominican Republic' },
  { code: 'mv', name: 'Maldives' },
  { code: 'lk', name: 'Sri Lanka' },
  { code: 'np', name: 'Nepal' },
  { code: 'nz', name: 'New Zealand' },
  { code: 'fj', name: 'Fiji' },
].sort((a, b) => a.name.localeCompare(b.name));

const flagUrl = (code: string) => `https://hatscripts.github.io/circle-flags/flags/${code}.svg`;

// --- Inline editable row ---
const EditableRow = ({
  record,
  fields,
  table,
  invalidateKeys,
}: {
  record: Record<string, any>;
  fields: { key: string; label: string; type?: string; options?: { value: string; label: string }[] }[];
  table: string;
  invalidateKeys: string[];
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  const startEdit = useCallback(() => {
    const init: Record<string, any> = {};
    fields.forEach(f => { init[f.key] = record[f.key] ?? ''; });
    setForm(init);
    setEditing(true);
  }, [record, fields]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates: Record<string, any> = {};
      fields.forEach(f => {
        const val = form[f.key];
        if (f.type === 'number') updates[f.key] = val ? parseFloat(val) : null;
        else updates[f.key] = typeof val === 'string' ? val.trim() : val;
      });
      const { error } = await (supabase as any).from(table).update(updates).eq('id', record.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateKeys.forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
      toast({ title: 'Updated' });
      setEditing(false);
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  if (!editing) {
    return (
      <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/40 group text-xs">
        <div className="flex-1 flex items-center gap-2 min-w-0 truncate">
          {record.flag_svg_url && <img src={record.flag_svg_url} className="w-5 h-5 rounded-full" alt="" />}
          <span className="font-medium truncate">{record.name || record.username || record.title || '—'}</span>
          {record.airport_code && <span className="text-muted-foreground">({record.airport_code})</span>}
          {record.slug && <span className="text-muted-foreground">/{record.slug}</span>}
          {record.country && <span className="text-muted-foreground">{record.country}</span>}
        </div>
        <button onClick={startEdit} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted">
          <Pencil className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-3 bg-muted/20 space-y-2 text-xs">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {fields.map(f => (
          <div key={f.key}>
            <Label className="text-[10px] mb-0.5 block">{f.label}</Label>
            {f.key === 'flag_svg_url' ? (
              <div className="space-y-1">
                <Select
                  value=""
                  onValueChange={(code) => setForm(p => ({ ...p, flag_svg_url: flagUrl(code) }))}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Pick country flag" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {COUNTRY_OPTIONS.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        <span className="flex items-center gap-2">
                          <img src={flagUrl(c.code)} className="w-4 h-4 rounded-full" alt="" />
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input className="h-7 text-xs" value={form.flag_svg_url || ''} onChange={e => setForm(p => ({ ...p, flag_svg_url: e.target.value }))} placeholder="or paste URL" />
                {form.flag_svg_url && <img src={form.flag_svg_url} className="w-6 h-6 rounded-full" alt="preview" />}
              </div>
            ) : f.options ? (
              <Select value={form[f.key] || ''} onValueChange={v => setForm(p => ({ ...p, [f.key]: v }))}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{f.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            ) : (
              <Input className="h-7 text-xs" type={f.type || 'text'} value={form[f.key] ?? ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <Button size="sm" variant="default" className="h-6 text-xs px-2" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Check className="w-3 h-3 mr-1" /> Save
        </Button>
        <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditing(false)}>
          <X className="w-3 h-3 mr-1" /> Cancel
        </Button>
      </div>
    </div>
  );
};

// --- Main component ---
export const AdminManualEntities = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const { data: cities = [] } = useCities();
  const { data: creators = [] } = useCreators();

  const { data: publicItineraries = [] } = useQuery({
    queryKey: ['admin-manual-itineraries'],
    queryFn: async () => {
      const { data, error } = await supabase.from('public_itineraries').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) return [];
      return data || [];
    },
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['admin-manual-collections'],
    queryFn: async () => {
      const { data, error } = await supabase.from('collections').select('*').order('created_at', { ascending: false }).limit(200);
      if (error) return [];
      return data || [];
    },
  });

  // ---- Add forms state ----
  const [categoryForm, setCategoryForm] = useState({ name: '', emoji: '', description: '' });
  const [cityForm, setCityForm] = useState({ name: '', country: '', flag_emoji: '', flag_svg_url: '', airport_code: '', launch_date: '', latitude: '', longitude: '' });
  const [creatorForm, setCreatorForm] = useState({ username: '', display_name: '', bio: '', avatar_url: '', instagram: '', tiktok: '', website: '', category_ids: [] as string[] });
  const [itineraryForm, setItineraryForm] = useState({ name: '', slug: '', description: '', tag: 'popular' });
  const [collectionForm, setCollectionForm] = useState({ name: '', slug: '', description: '', collection_type: 'experiences', tag: '' });

  const createMutation = useMutation({
    mutationFn: async ({ table, payload }: { table: string; payload: Record<string, any>; successTitle: string; invalidateKeys: string[] }) => {
      const { error } = await (supabase as any).from(table).insert(payload);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      vars.invalidateKeys.forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
      toast({ title: vars.successTitle });
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  return (
    <Card className="p-4 mb-6">
      <div className="mb-4">
        <h3 className="font-semibold">Manage — All Content Types</h3>
        <p className="text-xs text-muted-foreground">Add new or edit existing entities. Click the pencil to edit.</p>
      </div>

      <Tabs defaultValue="cities">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="cities">Cities</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="itineraries">Itineraries</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>

        {/* ===== CATEGORIES ===== */}
        <TabsContent value="categories" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label className="text-xs mb-1 block">Name *</Label><Input value={categoryForm.name} onChange={e => setCategoryForm(p => ({ ...p, name: e.target.value }))} placeholder="Adventure" /></div>
            <div><Label className="text-xs mb-1 block">Emoji</Label><Input value={categoryForm.emoji} onChange={e => setCategoryForm(p => ({ ...p, emoji: e.target.value }))} placeholder="🏄" /></div>
            <div><Label className="text-xs mb-1 block">Description</Label><Input value={categoryForm.description} onChange={e => setCategoryForm(p => ({ ...p, description: e.target.value }))} placeholder="Short description" /></div>
          </div>
          <Button size="sm" disabled={!categoryForm.name.trim() || createMutation.isPending} onClick={() => {
            createMutation.mutate({ table: 'categories', payload: { name: categoryForm.name.trim(), emoji: categoryForm.emoji.trim(), description: categoryForm.description.trim() }, successTitle: 'Category created', invalidateKeys: ['categories'] });
            setCategoryForm({ name: '', emoji: '', description: '' });
          }}>Add Category</Button>
          <p className="text-xs text-muted-foreground font-medium">{categories.length} existing categories</p>
          <div className="space-y-0.5 max-h-60 overflow-y-auto border rounded-md p-2">
            {categories.map((cat: any) => (
              <EditableRow key={cat.id} record={cat} table="categories" invalidateKeys={['categories']}
                fields={[
                  { key: 'name', label: 'Name' },
                  { key: 'emoji', label: 'Emoji' },
                  { key: 'description', label: 'Description' },
                  { key: 'display_order', label: 'Order', type: 'number' },
                ]}
              />
            ))}
          </div>
        </TabsContent>

        {/* ===== CITIES ===== */}
        <TabsContent value="cities" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div><Label className="text-xs mb-1 block">City *</Label><Input value={cityForm.name} onChange={e => setCityForm(p => ({ ...p, name: e.target.value }))} placeholder="London" /></div>
            <div><Label className="text-xs mb-1 block">Country</Label><Input value={cityForm.country} onChange={e => setCityForm(p => ({ ...p, country: e.target.value }))} placeholder="United Kingdom" /></div>
            <div>
              <Label className="text-xs mb-1 block">Country Flag</Label>
              <Select value="" onValueChange={(code) => setCityForm(p => ({ ...p, flag_svg_url: flagUrl(code) }))}>
                <SelectTrigger><SelectValue placeholder="Pick flag" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {COUNTRY_OPTIONS.map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="flex items-center gap-2">
                        <img src={flagUrl(c.code)} className="w-4 h-4 rounded-full" alt="" />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cityForm.flag_svg_url && (
                <div className="flex items-center gap-2 mt-1">
                  <img src={cityForm.flag_svg_url} className="w-6 h-6 rounded-full" alt="flag preview" />
                  <span className="text-[10px] text-muted-foreground truncate">{cityForm.flag_svg_url}</span>
                </div>
              )}
            </div>
            <div><Label className="text-xs mb-1 block">Airport Code</Label><Input value={cityForm.airport_code} onChange={e => setCityForm(p => ({ ...p, airport_code: e.target.value.toUpperCase() }))} placeholder="LHR" /></div>
            <div><Label className="text-xs mb-1 block">Launch Date</Label><Input type="date" value={cityForm.launch_date} onChange={e => setCityForm(p => ({ ...p, launch_date: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1 block">Latitude</Label><Input value={cityForm.latitude} onChange={e => setCityForm(p => ({ ...p, latitude: e.target.value }))} placeholder="-6.16" /></div>
            <div><Label className="text-xs mb-1 block">Longitude</Label><Input value={cityForm.longitude} onChange={e => setCityForm(p => ({ ...p, longitude: e.target.value }))} placeholder="39.19" /></div>
          </div>
          <Button size="sm" disabled={!cityForm.name.trim() || createMutation.isPending} onClick={() => {
            const payload: Record<string, any> = { name: cityForm.name.trim(), country: cityForm.country.trim(), airport_code: cityForm.airport_code.trim() };
            if (cityForm.flag_svg_url.trim()) payload.flag_svg_url = cityForm.flag_svg_url.trim();
            if (cityForm.launch_date) payload.launch_date = cityForm.launch_date;
            if (cityForm.latitude) payload.latitude = parseFloat(cityForm.latitude);
            if (cityForm.longitude) payload.longitude = parseFloat(cityForm.longitude);
            createMutation.mutate({ table: 'cities', payload, successTitle: 'City created', invalidateKeys: ['cities'] });
            setCityForm({ name: '', country: '', flag_emoji: '', flag_svg_url: '', airport_code: '', launch_date: '', latitude: '', longitude: '' });
          }}>Add City</Button>
          <p className="text-xs text-muted-foreground font-medium">{cities.length} existing cities</p>
          <div className="space-y-0.5 max-h-72 overflow-y-auto border rounded-md p-2">
            {cities.map((city: any) => (
              <EditableRow key={city.id} record={city} table="cities" invalidateKeys={['cities']}
                fields={[
                  { key: 'name', label: 'City' },
                  { key: 'country', label: 'Country' },
                  { key: 'flag_svg_url', label: 'Flag SVG' },
                  { key: 'airport_code', label: 'Airport Code' },
                  { key: 'launch_date', label: 'Launch Date', type: 'date' },
                  { key: 'latitude', label: 'Lat', type: 'number' },
                  { key: 'longitude', label: 'Lng', type: 'number' },
                ]}
              />
            ))}
          </div>
        </TabsContent>

        {/* ===== CREATORS ===== */}
        <TabsContent value="creators" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label className="text-xs mb-1 block">Username *</Label><Input value={creatorForm.username} onChange={e => setCreatorForm(p => ({ ...p, username: e.target.value }))} placeholder="kadeem" /></div>
            <div><Label className="text-xs mb-1 block">Display name</Label><Input value={creatorForm.display_name} onChange={e => setCreatorForm(p => ({ ...p, display_name: e.target.value }))} placeholder="Kadeem" /></div>
            <div><Label className="text-xs mb-1 block">Avatar URL</Label><Input value={creatorForm.avatar_url} onChange={e => setCreatorForm(p => ({ ...p, avatar_url: e.target.value }))} placeholder="https://..." /></div>
            <div className="md:col-span-3"><Label className="text-xs mb-1 block">Bio</Label><Textarea rows={2} value={creatorForm.bio} onChange={e => setCreatorForm(p => ({ ...p, bio: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1 block">Instagram</Label><Input value={creatorForm.instagram} onChange={e => setCreatorForm(p => ({ ...p, instagram: e.target.value }))} placeholder="@handle" /></div>
            <div><Label className="text-xs mb-1 block">TikTok</Label><Input value={creatorForm.tiktok} onChange={e => setCreatorForm(p => ({ ...p, tiktok: e.target.value }))} placeholder="@handle" /></div>
            <div><Label className="text-xs mb-1 block">Website</Label><Input value={creatorForm.website} onChange={e => setCreatorForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." /></div>
          </div>
          <Button size="sm" disabled={!creatorForm.username.trim() || createMutation.isPending} onClick={() => {
            createMutation.mutate({
              table: 'creators', payload: { username: creatorForm.username.trim(), display_name: creatorForm.display_name.trim(), bio: creatorForm.bio.trim(), avatar_url: creatorForm.avatar_url.trim(), social_links: { instagram: creatorForm.instagram.trim(), tiktok: creatorForm.tiktok.trim(), website: creatorForm.website.trim() } },
              successTitle: 'Creator created', invalidateKeys: ['creators'],
            });
            setCreatorForm({ username: '', display_name: '', bio: '', avatar_url: '', instagram: '', tiktok: '', website: '' });
          }}>Add Creator</Button>
          <p className="text-xs text-muted-foreground font-medium">{creators.length} existing creators</p>
          <div className="space-y-0.5 max-h-60 overflow-y-auto border rounded-md p-2">
            {creators.map((cr: any) => (
              <EditableRow key={cr.id} record={cr} table="creators" invalidateKeys={['creators']}
                fields={[
                  { key: 'username', label: 'Username' },
                  { key: 'display_name', label: 'Display Name' },
                  { key: 'bio', label: 'Bio' },
                  { key: 'avatar_url', label: 'Avatar URL' },
                ]}
              />
            ))}
          </div>
        </TabsContent>

        {/* ===== ITINERARIES ===== */}
        <TabsContent value="itineraries" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div><Label className="text-xs mb-1 block">Name *</Label><Input value={itineraryForm.name} onChange={e => setItineraryForm(p => ({ ...p, name: e.target.value, slug: p.slug || toSlug(e.target.value) }))} placeholder="Best of Zanzibar" /></div>
            <div><Label className="text-xs mb-1 block">Slug *</Label><Input value={itineraryForm.slug} onChange={e => setItineraryForm(p => ({ ...p, slug: toSlug(e.target.value) }))} placeholder="best-of-zanzibar" /></div>
            <div>
              <Label className="text-xs mb-1 block">Tag</Label>
              <Select value={itineraryForm.tag} onValueChange={v => setItineraryForm(p => ({ ...p, tag: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="popular">popular</SelectItem><SelectItem value="fave">fave</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Description</Label><Input value={itineraryForm.description} onChange={e => setItineraryForm(p => ({ ...p, description: e.target.value }))} /></div>
          </div>
          <Button size="sm" disabled={!itineraryForm.name.trim() || !itineraryForm.slug.trim() || createMutation.isPending} onClick={() => {
            createMutation.mutate({ table: 'public_itineraries', payload: { name: itineraryForm.name.trim(), slug: itineraryForm.slug.trim(), description: itineraryForm.description.trim(), tag: itineraryForm.tag, is_active: true }, successTitle: 'Itinerary created', invalidateKeys: ['public-itineraries', 'admin-manual-itineraries', 'link-manager-itineraries'] });
            setItineraryForm({ name: '', slug: '', description: '', tag: 'popular' });
          }}>Add Itinerary</Button>
          <p className="text-xs text-muted-foreground font-medium">{publicItineraries.length} existing itineraries</p>
          <div className="space-y-0.5 max-h-60 overflow-y-auto border rounded-md p-2">
            {publicItineraries.map((it: any) => (
              <EditableRow key={it.id} record={it} table="public_itineraries" invalidateKeys={['public-itineraries', 'admin-manual-itineraries']}
                fields={[
                  { key: 'name', label: 'Name' },
                  { key: 'slug', label: 'Slug' },
                  { key: 'description', label: 'Description' },
                  { key: 'tag', label: 'Tag', options: [{ value: 'popular', label: 'popular' }, { value: 'fave', label: 'fave' }] },
                  { key: 'cover_image', label: 'Cover Image' },
                ]}
              />
            ))}
          </div>
        </TabsContent>

        {/* ===== COLLECTIONS ===== */}
        <TabsContent value="collections" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div><Label className="text-xs mb-1 block">Name *</Label><Input value={collectionForm.name} onChange={e => setCollectionForm(p => ({ ...p, name: e.target.value, slug: p.slug || toSlug(e.target.value) }))} /></div>
            <div><Label className="text-xs mb-1 block">Slug *</Label><Input value={collectionForm.slug} onChange={e => setCollectionForm(p => ({ ...p, slug: toSlug(e.target.value) }))} /></div>
            <div>
              <Label className="text-xs mb-1 block">Type</Label>
              <Select value={collectionForm.collection_type} onValueChange={v => setCollectionForm(p => ({ ...p, collection_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="experiences">experiences</SelectItem><SelectItem value="itineraries">itineraries</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs mb-1 block">Tag</Label><Input value={collectionForm.tag} onChange={e => setCollectionForm(p => ({ ...p, tag: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1 block">Description</Label><Input value={collectionForm.description} onChange={e => setCollectionForm(p => ({ ...p, description: e.target.value }))} /></div>
          </div>
          <Button size="sm" disabled={!collectionForm.name.trim() || !collectionForm.slug.trim() || createMutation.isPending} onClick={() => {
            createMutation.mutate({ table: 'collections', payload: { name: collectionForm.name.trim(), slug: collectionForm.slug.trim(), description: collectionForm.description.trim(), collection_type: collectionForm.collection_type, tag: collectionForm.tag.trim(), is_active: true }, successTitle: 'Collection created', invalidateKeys: ['admin-manual-collections', 'link-manager-collections'] });
            setCollectionForm({ name: '', slug: '', description: '', collection_type: 'experiences', tag: '' });
          }}>Add Collection</Button>
          <p className="text-xs text-muted-foreground font-medium">{collections.length} existing collections</p>
          <div className="space-y-0.5 max-h-60 overflow-y-auto border rounded-md p-2">
            {collections.map((col: any) => (
              <EditableRow key={col.id} record={col} table="collections" invalidateKeys={['admin-manual-collections', 'link-manager-collections']}
                fields={[
                  { key: 'name', label: 'Name' },
                  { key: 'slug', label: 'Slug' },
                  { key: 'description', label: 'Description' },
                  { key: 'collection_type', label: 'Type', options: [{ value: 'experiences', label: 'experiences' }, { value: 'itineraries', label: 'itineraries' }] },
                  { key: 'tag', label: 'Tag' },
                  { key: 'cover_image', label: 'Cover Image' },
                ]}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
