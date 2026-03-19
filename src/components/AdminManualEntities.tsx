import { useMemo, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useCategories, useCreators } from '@/hooks/useAppData';
import { useDestinations } from '@/hooks/useProducts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, Check, X, Trash2, Tag, CheckSquare } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

const toSlug = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

// Common country codes for hatscripts circle-flags
const COUNTRY_OPTIONS = [
  { code: 'tz', name: 'Tanzania' },
  { code: 'ke', name: 'Kenya' },
  { code: 'za', name: 'South Africa' },
  { code: 'gb', name: 'United Kingdom' },
  { code: 'us', name: 'United States' },
  { code: 'ae', name: 'United Arab Emirates' },
  { code: 'fr', name: 'France' },
  { code: 'es', name: 'Spain' },
  { code: 'th', name: 'Thailand' },
  { code: 'id', name: 'Indonesia' },
  { code: 'au', name: 'Australia' },
  { code: 'ma', name: 'Morocco' },
  { code: 'eg', name: 'Egypt' },
  { code: 'mu', name: 'Mauritius' },
  { code: 'sc', name: 'Seychelles' },
  { code: 'in', name: 'India' },
  { code: 'pt', name: 'Portugal' },
  { code: 'gr', name: 'Greece' },
  { code: 'it', name: 'Italy' },
  { code: 'hr', name: 'Croatia' },
  { code: 'mv', name: 'Maldives' },
  { code: 'lk', name: 'Sri Lanka' },
  { code: 'nz', name: 'New Zealand' },
  { code: 'fj', name: 'Fiji' },
].sort((a, b) => a.name.localeCompare(b.name));

const flagUrl = (code: string) => `https://hatscripts.github.io/circle-flags/flags/${code}.svg`;

// --- Inline editable row with delete ---
const EditableRow = ({
  record,
  fields,
  table,
  invalidateKeys,
  onDelete,
}: {
  record: Record<string, any>;
  fields: { key: string; label: string; type?: string; options?: { value: string; label: string }[] }[];
  table: string;
  invalidateKeys: string[];
  onDelete?: () => void;
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
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={startEdit} className="p-1 rounded hover:bg-muted">
            <Pencil className="w-3 h-3" />
          </button>
          {onDelete && (
            <button onClick={() => { if (confirm('Delete this item?')) onDelete(); }} className="p-1 rounded hover:bg-destructive/10 text-destructive/60 hover:text-destructive">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
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
                <Select value="" onValueChange={(code) => setForm(p => ({ ...p, flag_svg_url: flagUrl(code) }))}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Pick flag" /></SelectTrigger>
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

// --- Creator Category Editor ---
const CreatorCategoryEditor = ({ creatorId, categories }: { creatorId: string; categories: any[] }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: creatorCats = [] } = useQuery({
    queryKey: ['creator-categories', creatorId],
    queryFn: async () => {
      const { data } = await (supabase as any).from('creator_categories').select('category_id').eq('creator_id', creatorId);
      return (data || []).map((r: any) => r.category_id);
    },
  });

  const startEdit = () => { setSelectedIds([...creatorCats]); setEditing(true); };

  const handleSave = async () => {
    await (supabase as any).from('creator_categories').delete().eq('creator_id', creatorId);
    if (selectedIds.length > 0) {
      await (supabase as any).from('creator_categories').insert(selectedIds.map(cid => ({ creator_id: creatorId, category_id: cid })));
    }
    queryClient.invalidateQueries({ queryKey: ['creator-categories', creatorId] });
    toast({ title: 'Categories updated' });
    setEditing(false);
  };

  const catNames = creatorCats.map((cid: string) => categories.find((c: any) => c.id === cid)).filter(Boolean).map((c: any) => `${c.emoji || ''} ${c.name}`.trim());

  if (!editing) {
    return (
      <button onClick={startEdit} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
        <Tag className="w-2.5 h-2.5" />
        {catNames.length > 0 ? catNames.join(', ') : 'Add categories'}
      </button>
    );
  }

  return (
    <div className="mt-1 p-2 border rounded-md bg-muted/20 space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat: any) => (
          <label key={cat.id} className="flex items-center gap-1 cursor-pointer text-xs">
            <Checkbox checked={selectedIds.includes(cat.id)} onCheckedChange={() => setSelectedIds(prev => prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id])} />
            <span>{cat.emoji} {cat.name}</span>
          </label>
        ))}
      </div>
      <div className="flex gap-1">
        <Button size="sm" className="h-5 text-[10px] px-2" onClick={handleSave}><Check className="w-2.5 h-2.5 mr-0.5" /> Save</Button>
        <Button size="sm" variant="ghost" className="h-5 text-[10px] px-2" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </div>
  );
};

// --- Main component ---
export const AdminManualEntities = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories();
  const { data: destinations = [] } = useDestinations();
  const { data: creators = [] } = useCreators();

  const { data: publicItineraries = [] } = useQuery({
    queryKey: ['admin-manual-itineraries'],
    queryFn: async () => {
      const { data } = await supabase.from('public_itineraries').select('*').order('created_at', { ascending: false }).limit(200);
      return data || [];
    },
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['admin-manual-collections'],
    queryFn: async () => {
      const { data } = await supabase.from('collections').select('*').order('created_at', { ascending: false }).limit(200);
      return data || [];
    },
  });

  // Add forms state
  const [categoryForm, setCategoryForm] = useState({ name: '', emoji: '', description: '' });
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

  const deleteRecord = async (table: string, id: string, invalidateKeys: string[]) => {
    if (!confirm('Delete this item permanently?')) return;
    const { error } = await (supabase as any).from(table).delete().eq('id', id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    invalidateKeys.forEach(k => queryClient.invalidateQueries({ queryKey: [k] }));
    toast({ title: 'Deleted' });
  };

  return (
    <Card className="p-4 mb-6">
      <div className="mb-4">
        <h3 className="font-semibold">Manage — Categories, Hosts, Itineraries, Collections</h3>
        <p className="text-xs text-muted-foreground">Add, edit, or delete entities. Hover to see edit/delete controls.</p>
      </div>

      <Tabs defaultValue="categories">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="creators">Hosts</TabsTrigger>
          <TabsTrigger value="itineraries">Itineraries</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
        </TabsList>

        {/* CATEGORIES */}
        <TabsContent value="categories" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label className="text-xs mb-1 block">Name *</Label><Input value={categoryForm.name} onChange={e => setCategoryForm(p => ({ ...p, name: e.target.value }))} placeholder="Adventure" /></div>
            <div><Label className="text-xs mb-1 block">Emoji</Label><Input value={categoryForm.emoji} onChange={e => setCategoryForm(p => ({ ...p, emoji: e.target.value }))} placeholder="🏄" /></div>
            <div><Label className="text-xs mb-1 block">Description</Label><Input value={categoryForm.description} onChange={e => setCategoryForm(p => ({ ...p, description: e.target.value }))} /></div>
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
                onDelete={() => deleteRecord('categories', cat.id, ['categories'])}
              />
            ))}
          </div>
        </TabsContent>

        {/* CREATORS/HOSTS */}
        <TabsContent value="creators" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label className="text-xs mb-1 block">Username *</Label><Input value={creatorForm.username} onChange={e => setCreatorForm(p => ({ ...p, username: e.target.value }))} placeholder="kadeem" /></div>
            <div><Label className="text-xs mb-1 block">Display name</Label><Input value={creatorForm.display_name} onChange={e => setCreatorForm(p => ({ ...p, display_name: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1 block">Avatar URL</Label><Input value={creatorForm.avatar_url} onChange={e => setCreatorForm(p => ({ ...p, avatar_url: e.target.value }))} /></div>
            <div className="md:col-span-3"><Label className="text-xs mb-1 block">Bio</Label><Textarea rows={2} value={creatorForm.bio} onChange={e => setCreatorForm(p => ({ ...p, bio: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1 block">Instagram</Label><Input value={creatorForm.instagram} onChange={e => setCreatorForm(p => ({ ...p, instagram: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1 block">TikTok</Label><Input value={creatorForm.tiktok} onChange={e => setCreatorForm(p => ({ ...p, tiktok: e.target.value }))} /></div>
            <div><Label className="text-xs mb-1 block">Website</Label><Input value={creatorForm.website} onChange={e => setCreatorForm(p => ({ ...p, website: e.target.value }))} /></div>
          </div>
          <Button size="sm" disabled={!creatorForm.username.trim() || createMutation.isPending} onClick={async () => {
            const categoryIds = [...creatorForm.category_ids];
            createMutation.mutate({
              table: 'creators', payload: { username: creatorForm.username.trim(), display_name: creatorForm.display_name.trim(), bio: creatorForm.bio.trim(), avatar_url: creatorForm.avatar_url.trim(), social_links: { instagram: creatorForm.instagram.trim(), tiktok: creatorForm.tiktok.trim(), website: creatorForm.website.trim() } },
              successTitle: 'Host created', invalidateKeys: ['creators'],
            });
            if (categoryIds.length > 0) {
              setTimeout(async () => {
                const { data: newCreator } = await supabase.from('creators').select('id').eq('username', creatorForm.username.trim()).maybeSingle();
                if (newCreator) {
                  await (supabase as any).from('creator_categories').insert(categoryIds.map(cid => ({ creator_id: newCreator.id, category_id: cid })));
                  queryClient.invalidateQueries({ queryKey: ['creator-categories'] });
                }
              }, 500);
            }
            setCreatorForm({ username: '', display_name: '', bio: '', avatar_url: '', instagram: '', tiktok: '', website: '', category_ids: [] });
          }}>Add Host</Button>
          <p className="text-xs text-muted-foreground font-medium">{creators.length} existing hosts</p>
          <div className="space-y-1 max-h-[400px] overflow-y-auto border rounded-md p-2">
            {creators.map((cr: any) => (
              <div key={cr.id} className="border-b border-border/20 last:border-b-0 pb-1.5">
                <EditableRow record={cr} table="creators" invalidateKeys={['creators']}
                  fields={[
                    { key: 'username', label: 'Username' },
                    { key: 'display_name', label: 'Display Name' },
                    { key: 'bio', label: 'Bio' },
                    { key: 'avatar_url', label: 'Avatar URL' },
                  ]}
                  onDelete={() => deleteRecord('creators', cr.id, ['creators'])}
                />
                <div className="px-2">
                  <CreatorCategoryEditor creatorId={cr.id} categories={categories} />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ITINERARIES */}
        <TabsContent value="itineraries" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div><Label className="text-xs mb-1 block">Name *</Label><Input value={itineraryForm.name} onChange={e => setItineraryForm(p => ({ ...p, name: e.target.value, slug: p.slug || toSlug(e.target.value) }))} /></div>
            <div><Label className="text-xs mb-1 block">Slug *</Label><Input value={itineraryForm.slug} onChange={e => setItineraryForm(p => ({ ...p, slug: toSlug(e.target.value) }))} /></div>
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
            createMutation.mutate({ table: 'public_itineraries', payload: { name: itineraryForm.name.trim(), slug: itineraryForm.slug.trim(), description: itineraryForm.description.trim(), tag: itineraryForm.tag, is_active: true, source_type: 'editorial' }, successTitle: 'Itinerary created', invalidateKeys: ['public-itineraries', 'admin-manual-itineraries'] });
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
                onDelete={() => deleteRecord('public_itineraries', it.id, ['public-itineraries', 'admin-manual-itineraries'])}
              />
            ))}
          </div>
        </TabsContent>

        {/* COLLECTIONS */}
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
                onDelete={() => deleteRecord('collections', col.id, ['admin-manual-collections', 'link-manager-collections'])}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
