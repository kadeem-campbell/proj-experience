/**
 * Products section — full CRUD with tabbed admin for all product layers:
 * Basics, Geography, Taxonomy, Options/Pricing, Hosts, Semantics,
 * Intent, Positioning, Generated Outputs, Governance.
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { AdminEntityTable, ColumnDef } from './AdminEntityTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Archive, Eye, RefreshCw, Plus, Trash2, CheckCircle, AlertTriangle, XCircle, ExternalLink, Upload, Loader2 } from 'lucide-react';
import { TimingIcon } from '@/components/TimingIcon';
import { generateEntityDocuments } from '@/services/entityDocGenerator';
import { validateProduct, persistReadinessScore, persistValidationResults } from '@/services/publishValidator';

const toSlug = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

// ---- Score row component ----
const ScoreRow = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-muted-foreground w-36 shrink-0">{label}</span>
    <Slider min={0} max={1} step={0.05} value={[value ?? 0]} onValueChange={([v]) => onChange(v)} className="flex-1" />
    <span className="text-xs w-8 text-right">{(value ?? 0).toFixed(2)}</span>
  </div>
);

// ---- Highlights inline editor ----
const HighlightsEditor = ({ value, onChange }: { value: any[]; onChange: (v: string[]) => void }) => {
  const items: string[] = Array.isArray(value) ? value.filter(Boolean).map(String) : [];
  const [draft, setDraft] = useState('');

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onChange([...items, t]);
    setDraft('');
  };

  return (
    <div className="space-y-1.5">
      {items.map((h, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input value={h} className="text-xs" onChange={e => { const next = [...items]; next[i] = e.target.value; onChange(next); }} />
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input value={draft} placeholder="Add highlight..." className="text-xs" onChange={e => setDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} />
        <Button size="sm" variant="outline" onClick={add} disabled={!draft.trim()}><Plus className="w-3 h-3" /></Button>
      </div>
    </div>
  );
};

// ---- Gallery inline editor with file upload ----
const GalleryEditor = ({ value, onChange, productSlug }: { value: any[]; onChange: (v: string[]) => void; productSlug?: string }) => {
  const items: string[] = Array.isArray(value) ? value.filter(Boolean).map(String) : [];
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    const folder = productSlug || 'general';
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
      if (!error) {
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
        if (urlData?.publicUrl) newUrls.push(urlData.publicUrl);
      }
    }
    if (newUrls.length > 0) onChange([...items, ...newUrls]);
    setUploading(false);
  };

  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 gap-2">
        {items.map((url, i) => (
          <div key={i} className="relative group">
            <img src={url} alt="" className="w-full h-20 object-cover rounded-md border border-border" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            <Button size="sm" variant="ghost" className="absolute top-0 right-0 h-5 w-5 p-0 bg-background/80 rounded-full opacity-0 group-hover:opacity-100" onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3" /></Button>
          </div>
        ))}
      </div>
      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-md p-3 cursor-pointer hover:border-primary/50 transition-colors">
        <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleUpload(e.target.files)} disabled={uploading} />
        {uploading ? <><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /><span className="text-xs text-muted-foreground">Uploading…</span></> : <><Upload className="w-4 h-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Click to upload images</span></>}
      </label>
    </div>
  );
};

// ---- Cover Image uploader ----
const CoverImageUploader = ({ value, onChange, productSlug }: { value: string; onChange: (v: string) => void; productSlug?: string }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const file = files[0];
    const folder = productSlug || 'general';
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${folder}/cover-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      if (urlData?.publicUrl) onChange(urlData.publicUrl);
    }
    setUploading(false);
  };

  return (
    <div className="space-y-1.5">
      {value && (
        <div className="relative group w-full h-24 rounded-md overflow-hidden border border-border">
          <img src={value} alt="Cover" className="w-full h-full object-cover" />
          <Button size="sm" variant="ghost" className="absolute top-1 right-1 h-5 w-5 p-0 bg-background/80 rounded-full opacity-0 group-hover:opacity-100" onClick={() => onChange('')}><Trash2 className="w-3 h-3" /></Button>
        </div>
      )}
      <label className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-md p-2 cursor-pointer hover:border-primary/50 transition-colors">
        <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e.target.files)} disabled={uploading} />
        {uploading ? <><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /><span className="text-xs text-muted-foreground">Uploading…</span></> : <><Upload className="w-4 h-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">{value ? 'Replace cover' : 'Upload cover image'}</span></>}
      </label>
      <Input value={value} placeholder="Or paste URL..." className="text-xs" onChange={e => onChange(e.target.value)} />
    </div>
  );
};


export const AdminProductsSection = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products-full'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*').order('title') as any;
      return data || [];
    },
  });

  const { data: destinations = [] } = useQuery({
    queryKey: ['admin-dest-list'],
    queryFn: async () => { const { data } = await supabase.from('destinations').select('id, name, slug').eq('is_active', true).order('name'); return data || []; },
  });

  const { data: areas = [] } = useQuery({
    queryKey: ['admin-areas-list'],
    queryFn: async () => { const { data } = await supabase.from('areas').select('id, name, slug, destination_id').eq('is_active', true).order('name'); return data || []; },
  });

  const { data: pois = [] } = useQuery({
    queryKey: ['admin-pois-list'],
    queryFn: async () => { const { data } = await supabase.from('pois').select('id, name, slug, area_id') as any; return data || []; },
  });

  const { data: activityTypes = [] } = useQuery({
    queryKey: ['admin-at-list'],
    queryFn: async () => { const { data } = await supabase.from('activity_types').select('id, name, emoji').eq('is_active', true).order('display_order'); return data || []; },
  });

  const { data: themes = [] } = useQuery({
    queryKey: ['admin-themes-list'],
    queryFn: async () => { const { data } = await supabase.from('themes').select('id, name, slug').eq('is_active', true).order('display_order'); return data || []; },
  });

  const { data: hosts = [] } = useQuery({
    queryKey: ['admin-hosts-list'],
    queryFn: async () => { const { data } = await supabase.from('hosts').select('id, display_name, username').eq('is_active', true).order('display_name'); return data || []; },
  });

  const { data: intents = [] } = useQuery({
    queryKey: ['admin-intents-list'],
    queryFn: async () => { const { data } = await supabase.from('traveller_intent_profiles').select('*').order('name'); return data || []; },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-products-full'] });
    qc.invalidateQueries({ queryKey: ['admin-overview-counts'] });
    qc.invalidateQueries({ queryKey: ['admin-overview-quality'] });
  };

  const saveTo = async (item: any, isNew: boolean) => {
    const { id, created_at, updated_at, ...rest } = item;
    if (isNew) {
      const { error } = await supabase.from('products').insert(rest as any);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('products').update(rest as any).eq('id', id).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Update returned no rows — you may need to sign in first.');
    }
    // Auto-validate and generate docs after save
    const productId = id || rest.id;
    if (productId) {
      try {
        const result = validateProduct({ product: { ...rest, id: productId } });
        await persistReadinessScore(result);
        await persistValidationResults(result);
        await supabase.from('products').update({ publish_score: result.publish_score } as any).eq('id', productId);
        await generateEntityDocuments(productId);
      } catch (e) { console.warn('Post-save validation/generation:', e); }
    }
    invalidate();
    toast({ title: isNew ? 'Product created' : 'Product saved & validated' });
  };

  const deleteFn = async (ids: string[]) => {
    for (const id of ids) {
      await supabase.from('products').delete().eq('id', id);
    }
    invalidate();
    toast({ title: `Deleted ${ids.length} product(s)` });
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'title', label: 'Title', width: 'flex-[2]',
      render: (p: any) => <span className="font-medium">{p.title}</span>,
    },
    {
      key: 'slug', label: 'Slug', width: 'flex-1',
      render: (p: any) => {
        const dest = destinations.find((x: any) => x.id === p.destination_id);
        const area = areas.find((x: any) => x.id === p.primary_area_id);
        const segments = ['things-to-do', dest?.slug, area?.slug, p.slug].filter(Boolean).join('/');
        return (
          <a href={`https://swam.app/${segments}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground text-xs font-mono hover:text-primary flex items-center gap-1">
            {p.slug} <ExternalLink className="w-3 h-3" />
          </a>
        );
      },
    },
    {
      key: 'destination_id', label: 'Destination', width: 'w-[120px]',
      render: (p: any) => {
        const d = destinations.find((x: any) => x.id === p.destination_id);
        return d ? <Badge variant="outline" className="text-[10px]">{d.name}</Badge> : <span className="text-destructive text-xs">—</span>;
      },
    },
    {
      key: 'visibility_output_state', label: 'Visibility', width: 'w-[100px]',
      render: (p: any) => (
        <Badge variant={p.visibility_output_state === 'public' ? 'default' : 'secondary'} className="text-[10px]">
          {p.visibility_output_state || 'internal'}
        </Badge>
      ),
    },
    {
      key: 'publish_score', label: 'Score', width: 'w-[60px]',
      render: (p: any) => <span className="text-xs">{p.publish_score ?? '—'}%</span>,
    },
  ];

  const renderForm = (item: any, onChange: (f: string, v: any) => void) => (
    <Tabs defaultValue="basics" className="w-full">
      <TabsList className="flex flex-wrap gap-1 h-auto">
        <TabsTrigger value="basics" className="text-xs">Basics</TabsTrigger>
        <TabsTrigger value="geography" className="text-xs">Geography</TabsTrigger>
        <TabsTrigger value="taxonomy" className="text-xs">Taxonomy</TabsTrigger>
        <TabsTrigger value="options" className="text-xs">Options & Pricing</TabsTrigger>
        <TabsTrigger value="experience" className="text-xs">Experience</TabsTrigger>
        <TabsTrigger value="timing" className="text-xs">Timing</TabsTrigger>
        <TabsTrigger value="hosts" className="text-xs">Hosts</TabsTrigger>
        <TabsTrigger value="semantics" className="text-xs">Semantics</TabsTrigger>
        <TabsTrigger value="intent" className="text-xs">Intent</TabsTrigger>
        <TabsTrigger value="positioning" className="text-xs">Positioning</TabsTrigger>
        <TabsTrigger value="outputs" className="text-xs">Outputs</TabsTrigger>
        <TabsTrigger value="links" className="text-xs">Links</TabsTrigger>
        <TabsTrigger value="relationships" className="text-xs">Relations</TabsTrigger>
        <TabsTrigger value="governance" className="text-xs">Governance</TabsTrigger>
        <TabsTrigger value="validation" className="text-xs">Validation</TabsTrigger>
      </TabsList>

      {/* ======= BASICS ======= */}
      <TabsContent value="basics" className="space-y-3 mt-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Title *</Label>
            <Input value={item.title || ''} onChange={e => { onChange('title', e.target.value); if (!item.id) onChange('slug', toSlug(e.target.value)); }} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Slug</Label>
            <Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} className="font-mono text-xs" />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Description</Label>
          <Textarea value={item.description || ''} onChange={e => onChange('description', e.target.value)} rows={3} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Product Family</Label>
            <Select value={item.product_family || 'experience'} onValueChange={v => onChange('product_family', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="experience">Experience</SelectItem>
                <SelectItem value="tour">Tour</SelectItem>
                <SelectItem value="activity">Activity</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="rental">Rental</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Duration (minutes)</Label>
            <Input type="number" value={item.duration_minutes || ''} onChange={e => onChange('duration_minutes', parseInt(e.target.value) || null)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Cover Image</Label>
            <CoverImageUploader value={item.cover_image_url || ''} onChange={v => onChange('cover_image_url', v)} productSlug={item.slug} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs text-muted-foreground">Video URL</Label><Input value={item.video_url || ''} onChange={e => onChange('video_url', e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">SEO Title</Label><Input value={item.seo_title || ''} onChange={e => onChange('seo_title', e.target.value)} maxLength={60} /></div>
        </div>
        <div><Label className="text-xs text-muted-foreground">SEO Description</Label><Textarea value={item.seo_description || ''} onChange={e => onChange('seo_description', e.target.value)} rows={2} /></div>

        <Separator />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Highlights</h4>
        <p className="text-[10px] text-muted-foreground">Key selling points shown on the product page. Aim for 3–6 items.</p>
        <HighlightsEditor value={item.highlights_json || []} onChange={v => onChange('highlights_json', v)} />

        <Separator />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gallery</h4>
        <p className="text-[10px] text-muted-foreground">Upload product photos. The cover image is included automatically.</p>
        <GalleryEditor value={item.gallery_json || []} onChange={v => onChange('gallery_json', v)} productSlug={item.slug} />

        <Separator />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Social Media</h4>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs text-muted-foreground">TikTok URL</Label><Input placeholder="https://tiktok.com/@..." value={item.tiktok_url || ''} onChange={e => onChange('tiktok_url', e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Instagram URL</Label><Input placeholder="https://instagram.com/..." value={item.instagram_url || ''} onChange={e => onChange('instagram_url', e.target.value)} /></div>
        </div>
      </TabsContent>

      {/* ======= GEOGRAPHY ======= */}
      <TabsContent value="geography" className="space-y-3 mt-3">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Destination *</Label>
            <Select value={item.destination_id || ''} onValueChange={v => onChange('destination_id', v)}>
              <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
              <SelectContent>{destinations.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Area</Label>
            <Select value={item.primary_area_id || '__none__'} onValueChange={v => onChange('primary_area_id', v === '__none__' ? null : v)}>
              <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {areas.filter((a: any) => !item.destination_id || a.destination_id === item.destination_id).map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">POI</Label>
            <Select value={item.primary_poi_id || '__none__'} onValueChange={v => onChange('primary_poi_id', v === '__none__' ? null : v)}>
              <SelectTrigger><SelectValue placeholder="Select POI" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {pois.filter((p: any) => !item.primary_area_id || p.area_id === item.primary_area_id).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Exact Location</h4>
        <p className="text-[10px] text-muted-foreground">Link a Google Maps location for "Get Directions" and map display.</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Place Name</Label>
            <Input value={(item as any).place_name || ''} placeholder="e.g. Mnemba Atoll" onChange={e => onChange('place_name', e.target.value)} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Google Place ID</Label>
            <Input value={(item as any).google_place_id || ''} placeholder="ChIJ..." className="font-mono text-xs" onChange={e => onChange('google_place_id', e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Google Maps URL</Label>
          <Input value={(item as any).google_maps_url || ''} placeholder="https://maps.google.com/..." onChange={e => onChange('google_maps_url', e.target.value)} />
          <p className="text-[10px] text-muted-foreground mt-1">Paste a Google Maps share link or search URL for this exact location.</p>
        </div>
        <p className="text-xs text-muted-foreground">Products link to locations through canonical place references. Use meeting_points_json for operational pickup/check-in info.</p>
      </TabsContent>

      {/* ======= TAXONOMY ======= */}
      <TabsContent value="taxonomy" className="space-y-3 mt-3">
        <div>
          <Label className="text-xs text-muted-foreground">Activity Type</Label>
          <Select value={item.activity_type_id || ''} onValueChange={v => onChange('activity_type_id', v)}>
            <SelectTrigger><SelectValue placeholder="Select activity type" /></SelectTrigger>
            <SelectContent>{activityTypes.map((at: any) => <SelectItem key={at.id} value={at.id}>{at.emoji} {at.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {item.id ? <ThemeFormatEditor productId={item.id} themes={themes} /> : <p className="text-xs text-muted-foreground">Save product first to manage themes, formats, and POIs.</p>}
      </TabsContent>

      {/* ======= OPTIONS & PRICING (inline sub-editor) ======= */}
      <TabsContent value="options" className="space-y-3 mt-3">
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Average Price Per Person</h4>
          <p className="text-xs text-muted-foreground">Indicative price for display on cards and search results.</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Amount (USD)</Label>
              <Input type="number" placeholder="e.g. 45" value={item.average_price_per_person || ''} onChange={e => onChange('average_price_per_person', parseFloat(e.target.value) || null)} />
            </div>
          </div>
          <Separator />
        </div>
        {item.id ? <OptionsEditor productId={item.id} /> : <p className="text-xs text-muted-foreground">Save the product first to manage options.</p>}
      </TabsContent>

      {/* ======= EXPERIENCE (Inclusions, Transport, Meeting Points, Local Tips, Getting There) ======= */}
      <TabsContent value="experience" className="space-y-4 mt-3">
        {item.id ? (
          <>
            <InclusionsEditor productId={item.id} />
            <Separator />
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Meeting Points</h4>
            <p className="text-[10px] text-muted-foreground">Where customers access this experience (e.g. beach, dock, meeting spot).</p>
            <HighlightsEditor
              value={(item.meeting_points_json || []).map((mp: any) => typeof mp === 'string' ? mp : `${mp.name}|${mp.type || ''}`)}
              onChange={v => onChange('meeting_points_json', v.map(s => {
                const [name, type] = s.split('|');
                return { name: name?.trim() || s, type: type?.trim() || '' };
              }))}
            />
            <Separator />
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Getting There</h4>
            <TransportEditor productId={item.id} />
            <div>
              <Label className="text-xs text-muted-foreground">Getting There Description</Label>
              <Textarea value={item.getting_there_description || ''} onChange={e => onChange('getting_there_description', e.target.value)} rows={3} placeholder="Describe how to reach this experience..." />
            </div>
            <Separator />
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Local Tips</h4>
            <p className="text-[10px] text-muted-foreground">Insider tips for visitors. One tip per line.</p>
            <HighlightsEditor value={item.local_tips_json || []} onChange={v => onChange('local_tips_json', v)} />
          </>
        ) : <p className="text-xs text-muted-foreground">Save product first to manage experience details.</p>}
      </TabsContent>

      {/* ======= TIMING ======= */}
      <TabsContent value="timing" className="space-y-3 mt-3">
        {item.id ? <TimingEditor productId={item.id} /> : <p className="text-xs text-muted-foreground">Save product first to manage timing.</p>}
      </TabsContent>

      {/* ======= HOSTS ======= */}
      <TabsContent value="hosts" className="space-y-3 mt-3">
        {item.id ? <HostsEditor productId={item.id} hosts={hosts} /> : <p className="text-xs text-muted-foreground">Save the product first to manage hosts.</p>}
      </TabsContent>

      {/* ======= SEMANTICS ======= */}
      <TabsContent value="semantics" className="space-y-3 mt-3">
        {item.id ? <SemanticEditor productId={item.id} /> : <p className="text-xs text-muted-foreground">Save product first.</p>}
      </TabsContent>

      {/* ======= INTENT ======= */}
      <TabsContent value="intent" className="space-y-3 mt-3">
        {item.id ? <IntentEditor productId={item.id} intents={intents} /> : <p className="text-xs text-muted-foreground">Save product first.</p>}
      </TabsContent>

      {/* ======= POSITIONING ======= */}
      <TabsContent value="positioning" className="space-y-3 mt-3">
        {item.id ? <PositioningEditor productId={item.id} /> : <p className="text-xs text-muted-foreground">Save product first.</p>}
      </TabsContent>

      {/* ======= GENERATED OUTPUTS ======= */}
      <TabsContent value="outputs" className="space-y-3 mt-3">
        {item.id ? <OutputsViewer productId={item.id} /> : <p className="text-xs text-muted-foreground">Save product first.</p>}
      </TabsContent>

      {/* ======= GOVERNANCE ======= */}
      <TabsContent value="governance" className="space-y-3 mt-3">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Visibility</Label>
            <Select value={item.visibility_output_state || 'internal_only'} onValueChange={v => onChange('visibility_output_state', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="internal_only">Internal Only</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="unlisted">Unlisted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Publish State</Label>
            <Select value={item.publish_state || 'draft'} onValueChange={v => onChange('publish_state', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Indexability</Label>
            <Select value={item.indexability_state || 'draft_unpublished'} onValueChange={v => onChange('indexability_state', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft_unpublished">Draft</SelectItem>
                <SelectItem value="internal_only">Internal Only</SelectItem>
                <SelectItem value="public_noindex">Public No-index</SelectItem>
                <SelectItem value="public_indexed">Public Indexed</SelectItem>
                <SelectItem value="blocked_low_readiness">Blocked</SelectItem>
                <SelectItem value="deprecated_redirect">Deprecated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Publish Score</Label>
          <Input type="number" min={0} max={100} value={item.publish_score ?? 0} onChange={e => onChange('publish_score', parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Canonical URL</Label>
          <Input value={item.canonical_url || ''} onChange={e => onChange('canonical_url', e.target.value)} className="font-mono text-xs" />
        </div>
      </TabsContent>

      {/* ======= LINKS ======= */}
      <TabsContent value="links" className="space-y-3 mt-3">
        {item.id ? <ProductLinksViewer productId={item.id} productTitle={item.title} /> : <p className="text-xs text-muted-foreground">Save product first.</p>}
      </TabsContent>

      {/* ======= RELATIONSHIPS ======= */}
      <TabsContent value="relationships" className="space-y-3 mt-3">
        {item.id ? <RelationshipsEditor productId={item.id} /> : <p className="text-xs text-muted-foreground">Save product first.</p>}
      </TabsContent>

      {/* ======= VALIDATION ======= */}
      <TabsContent value="validation" className="space-y-3 mt-3">
        {item.id ? <ValidationViewer productId={item.id} /> : <p className="text-xs text-muted-foreground">Save product first.</p>}
      </TabsContent>
    </Tabs>
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Products</h2>
      <p className="text-sm text-muted-foreground mb-4">Canonical product management with full enrichment layers</p>
      <AdminEntityTable
        items={products}
        columns={columns}
        entityName="Product"
        defaultItem={{ title: '', slug: '', description: '', product_family: 'experience', visibility_output_state: 'internal_only', publish_state: 'draft', indexability_state: 'draft_unpublished', publish_score: 0 }}
        renderForm={renderForm}
        onSave={saveTo}
        onDelete={deleteFn}
        isLoading={isLoading}
        filterOptions={[
          { key: 'visibility_output_state', label: 'Visibility', options: [{ value: 'internal_only', label: 'Internal' }, { value: 'public', label: 'Public' }] },
          { key: 'publish_state', label: 'Publish', options: [{ value: 'draft', label: 'Draft' }, { value: 'published', label: 'Published' }] },
        ]}
        bulkActions={[
          {
            label: 'Archive', icon: <Archive className="w-3 h-3" />,
            action: async (ids) => {
              for (const id of ids) await supabase.from('products').update({ publish_state: 'archived', visibility_output_state: 'internal_only' } as any).eq('id', id);
              invalidate(); toast({ title: `Archived ${ids.length} products` });
            },
          },
          {
            label: 'Make Public', icon: <Eye className="w-3 h-3" />,
            action: async (ids) => {
              for (const id of ids) await supabase.from('products').update({ visibility_output_state: 'public' } as any).eq('id', id);
              invalidate(); toast({ title: `Made ${ids.length} products public` });
            },
          },
        ]}
      />
    </div>
  );
};

// ============ TIMING EDITOR ============

import { buildHourlyCurve, deriveTimingDisplay, validateTimingProfiles, normalizeHourlyScores, normalizeReasonTags } from '@/lib/timing';
import type { TimingProfileRecord, TimingDisplayOutput } from '@/lib/timing';

const COMMON_TIMEZONES = [
  'Africa/Dar_es_Salaam', 'Africa/Nairobi', 'Africa/Kampala', 'Africa/Kigali',
  'Africa/Addis_Ababa', 'Africa/Cairo', 'Africa/Johannesburg', 'Africa/Lagos',
  'Europe/London', 'Europe/Paris', 'America/New_York', 'Asia/Dubai', 'Asia/Kolkata',
  'Asia/Bangkok', 'Asia/Singapore', 'Australia/Sydney', 'Pacific/Auckland', 'UTC',
];

const FLEXIBILITY_OPTIONS = ['strict', 'moderate', 'high'];

const TimingEditor = ({ productId }: { productId: string }) => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-timing-profiles', productId],
    queryFn: async () => {
      const { data } = await supabase.from('product_timing_profiles').select('*').eq('product_id', productId).order('profile_type') as any;
      return data || [];
    },
  });

  const { data: dbTemplates = [] } = useQuery({
    queryKey: ['admin-timing-templates'],
    queryFn: async () => {
      const { data } = await supabase.from('timing_templates').select('*').eq('is_active', true).order('name') as any;
      return data || [];
    },
  });

  const addProfile = async (type: string) => {
    const curve = buildHourlyCurve(8, 11, 6, 8);
    const { error } = await supabase.from('product_timing_profiles').insert({
      product_id: productId,
      profile_label: type === 'default' ? 'Default' : type === 'seasonal' ? 'Seasonal' : 'Override',
      profile_type: type,
      local_timezone: 'Africa/Dar_es_Salaam',
      peak_start_hour: 8, peak_end_hour: 11,
      hourly_scores: curve,
      confidence_score: 0.8,
      flexibility_level: 'moderate',
      reason_tags: [],
      is_active: true,
    } as any);
    if (error) {
      toast({ title: 'Failed to add profile', description: error.message, variant: 'destructive' });
      return;
    }
    qc.invalidateQueries({ queryKey: ['admin-timing-profiles', productId] });
    toast({ title: 'Timing profile added' });
  };

  const updateProfile = async (id: string, field: string, value: any) => {
    await supabase.from('product_timing_profiles').update({ [field]: value } as any).eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-timing-profiles', productId] });
  };

  const deleteProfile = async (id: string) => {
    await supabase.from('product_timing_profiles').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-timing-profiles', productId] });
    toast({ title: 'Profile deleted' });
  };

  const applyDbTemplate = async (profileId: string, tpl: any) => {
    const curve = Array.isArray(tpl.hourly_scores) ? tpl.hourly_scores : buildHourlyCurve(tpl.peak_start_hour, tpl.peak_end_hour, tpl.secondary_start_hour, tpl.secondary_end_hour, tpl.low_start_hour, tpl.low_end_hour);
    await supabase.from('product_timing_profiles').update({
      peak_start_hour: tpl.peak_start_hour, peak_end_hour: tpl.peak_end_hour,
      secondary_start_hour: tpl.secondary_start_hour ?? null,
      secondary_end_hour: tpl.secondary_end_hour ?? null,
      low_start_hour: tpl.low_start_hour ?? null,
      low_end_hour: tpl.low_end_hour ?? null,
      hourly_scores: curve,
      profile_label: tpl.name,
      template_id: tpl.id,
    } as any).eq('id', profileId);
    qc.invalidateQueries({ queryKey: ['admin-timing-profiles', productId] });
    toast({ title: `Applied "${tpl.name}" template` });
  };

  const regenerateCurve = (prof: any) => {
    const curve = buildHourlyCurve(prof.peak_start_hour, prof.peak_end_hour, prof.secondary_start_hour, prof.secondary_end_hour, prof.low_start_hour, prof.low_end_hour);
    updateProfile(prof.id, 'hourly_scores', curve);
  };

  const hasDefault = profiles.some((p: any) => p.profile_type === 'default');

  // Validation
  const validationIssues = validateTimingProfiles(
    profiles as TimingProfileRecord[],
    dbTemplates.map((t: any) => ({ id: t.id })),
  );

  // Derive display preview from default
  const defaultProfile = profiles.find((p: any) => p.profile_type === 'default') || profiles[0];
  const displayPreview = defaultProfile ? deriveTimingDisplay(defaultProfile as TimingProfileRecord) : null;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Manage time-of-day intelligence. Start by adding a default profile, then optionally add seasonal overrides.</p>

      {/* Validation issues */}
      {validationIssues.length > 0 && (
        <div className="p-2 rounded-lg bg-destructive/10 space-y-1">
          {validationIssues.map((issue, i) => (
            <p key={i} className={cn("text-[10px] flex items-center gap-1", issue.severity === 'error' ? 'text-destructive' : 'text-yellow-600')}>
              {issue.severity === 'error' ? <XCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              {issue.message}
            </p>
          ))}
        </div>
      )}

      {/* Display preview */}
      {displayPreview && (
        <Card className="p-3 bg-muted/30">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wide">Frontend display preview</Label>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-primary">
              <TimingIcon icon={displayPreview.primary_time_icon} className="w-5 h-5" />
            </span>
            <div>
              <p className="text-xs font-medium">{displayPreview.primary_time_label}</p>
              <p className="text-[10px] text-muted-foreground">{displayPreview.short_timing_phrase}</p>
            </div>
          </div>
        </Card>
      )}

      {profiles.map((prof: any) => {
        const scores: number[] = normalizeHourlyScores(prof.hourly_scores);
        const maxScore = Math.max(...scores, 1);
        const tags = normalizeReasonTags(prof.reason_tags);
        return (
          <Card key={prof.id} className="p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={prof.profile_type === 'default' ? 'default' : 'outline'} className="text-[10px]">{prof.profile_type}</Badge>
                <Input className="text-xs w-32 h-7" value={prof.profile_label} onChange={e => updateProfile(prof.id, 'profile_label', e.target.value)} />
              </div>
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-[10px]">
                  {prof.is_active !== false ? 'Active' : 'Inactive'}
                </Badge>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => updateProfile(prof.id, 'is_active', !prof.is_active)}>
                  {prof.is_active !== false ? <Eye className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
                </Button>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => deleteProfile(prof.id)}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>

            {/* Template picker from DB */}
            <div>
              <Label className="text-[10px] text-muted-foreground">Apply template</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {dbTemplates.map((tpl: any) => (
                  <Button key={tpl.id} size="sm" variant={prof.template_id === tpl.id ? 'default' : 'outline'} className="text-[10px] h-6 px-2" onClick={() => applyDbTemplate(prof.id, tpl)}>
                    {tpl.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Timezone */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Timezone</Label>
                <Select value={prof.local_timezone || 'Africa/Dar_es_Salaam'} onValueChange={v => updateProfile(prof.id, 'local_timezone', v)}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMMON_TIMEZONES.map(tz => <SelectItem key={tz} value={tz}>{tz.split('/').pop()?.replace(/_/g, ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Peak start (h)</Label>
                <Input type="number" min={0} max={23} className="text-xs h-7" value={prof.peak_start_hour ?? ''} onChange={e => updateProfile(prof.id, 'peak_start_hour', parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Peak end (h)</Label>
                <Input type="number" min={0} max={23} className="text-xs h-7" value={prof.peak_end_hour ?? ''} onChange={e => updateProfile(prof.id, 'peak_end_hour', parseInt(e.target.value) || 0)} />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div><Label className="text-[10px] text-muted-foreground">Sec. start</Label><Input type="number" min={0} max={23} className="text-xs h-7" value={prof.secondary_start_hour ?? ''} onChange={e => updateProfile(prof.id, 'secondary_start_hour', parseInt(e.target.value) || null)} /></div>
              <div><Label className="text-[10px] text-muted-foreground">Sec. end</Label><Input type="number" min={0} max={23} className="text-xs h-7" value={prof.secondary_end_hour ?? ''} onChange={e => updateProfile(prof.id, 'secondary_end_hour', parseInt(e.target.value) || null)} /></div>
              <div><Label className="text-[10px] text-muted-foreground">Low start</Label><Input type="number" min={0} max={23} className="text-xs h-7" value={prof.low_start_hour ?? ''} onChange={e => updateProfile(prof.id, 'low_start_hour', parseInt(e.target.value) || null)} /></div>
              <div><Label className="text-[10px] text-muted-foreground">Low end</Label><Input type="number" min={0} max={23} className="text-xs h-7" value={prof.low_end_hour ?? ''} onChange={e => updateProfile(prof.id, 'low_end_hour', parseInt(e.target.value) || null)} /></div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px] text-muted-foreground">Confidence</Label>
                <Input type="number" min={0} max={1} step={0.1} className="text-xs h-7" value={prof.confidence_score ?? 0.8} onChange={e => updateProfile(prof.id, 'confidence_score', parseFloat(e.target.value) || 0.8)} />
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground">Flexibility</Label>
                <Select value={prof.flexibility_level || 'moderate'} onValueChange={v => updateProfile(prof.id, 'flexibility_level', v)}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FLEXIBILITY_OPTIONS.map(f => <SelectItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Seasonal date range */}
            {prof.profile_type !== 'default' && (
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-[10px] text-muted-foreground">Start date</Label><Input type="date" className="text-xs h-7" value={prof.start_date || ''} onChange={e => updateProfile(prof.id, 'start_date', e.target.value || null)} /></div>
                <div><Label className="text-[10px] text-muted-foreground">End date</Label><Input type="date" className="text-xs h-7" value={prof.end_date || ''} onChange={e => updateProfile(prof.id, 'end_date', e.target.value || null)} /></div>
              </div>
            )}

            {/* Reason tags */}
            <div>
              <Label className="text-[10px] text-muted-foreground">Reason tags (comma-separated)</Label>
              <Input className="text-xs h-7" value={tags.join(', ')} onChange={e => updateProfile(prof.id, 'reason_tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="e.g. tidal, wind, light, temperature" />
            </div>

            <div><Label className="text-[10px] text-muted-foreground">Timing note</Label><Input className="text-xs h-7" value={prof.timing_note || ''} onChange={e => updateProfile(prof.id, 'timing_note', e.target.value)} placeholder="e.g. Go early before the tide comes in" /></div>

            {/* 24h Curve preview */}
            <div>
              <Label className="text-[10px] text-muted-foreground">24h suitability curve</Label>
              <div className="flex items-end gap-[2px] h-20 mt-1 bg-muted/30 rounded p-1">
                {scores.map((s, h) => (
                  <div key={h} className="flex-1 flex flex-col items-center gap-0.5 group cursor-pointer" onClick={() => {
                    const newScores = [...scores];
                    newScores[h] = newScores[h] >= 0.8 ? 0.2 : newScores[h] >= 0.5 ? 0.8 : 0.5;
                    updateProfile(prof.id, 'hourly_scores', newScores);
                  }}>
                    <div
                      className={cn("w-full rounded-t-sm transition-all group-hover:opacity-80",
                        s >= 0.8 ? "bg-primary" : s >= 0.5 ? "bg-primary/50" : s >= 0.3 ? "bg-muted-foreground/30" : "bg-muted-foreground/10"
                      )}
                      style={{ height: `${(s / maxScore) * 100}%`, minHeight: '2px' }}
                      title={`${h}:00 — ${s.toFixed(2)}`}
                    />
                    {h % 3 === 0 && <span className="text-[7px] text-muted-foreground">{h}</span>}
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-muted-foreground mt-0.5">Click bars to toggle suitability. Or regenerate from windows below.</p>
            </div>

            <Button size="sm" variant="outline" className="text-[10px]" onClick={() => regenerateCurve(prof)}>
              <RefreshCw className="w-3 h-3 mr-1" /> Regenerate curve from windows
            </Button>
          </Card>
        );
      })}

      <div className="flex gap-2">
        {!hasDefault && <Button size="sm" variant="outline" onClick={() => addProfile('default')}><Plus className="w-3 h-3 mr-1" />Add Default Profile</Button>}
        <Button size="sm" variant="outline" onClick={() => addProfile('seasonal')}><Plus className="w-3 h-3 mr-1" />Add Seasonal</Button>
        <Button size="sm" variant="outline" onClick={() => addProfile('date_override')}><Plus className="w-3 h-3 mr-1" />Add Date Override</Button>
        <Button size="sm" variant="outline" onClick={() => addProfile('special_period')}><Plus className="w-3 h-3 mr-1" />Add Special Period</Button>
      </div>
    </div>
  );
};

// ============ INCLUSIONS EDITOR ============

const InclusionsEditor = ({ productId }: { productId: string }) => {
  const qc = useQueryClient();
  const { data: linked = [] } = useQuery({
    queryKey: ['admin-product-inclusions', productId],
    queryFn: async () => {
      const { data } = await supabase.from('product_inclusions').select('*, inclusion_items(*)').eq('product_id', productId).order('display_order') as any;
      return data || [];
    },
  });
  const { data: allItems = [] } = useQuery({
    queryKey: ['admin-inclusion-items'],
    queryFn: async () => { const { data } = await supabase.from('inclusion_items').select('*').eq('is_active', true).order('name') as any; return data || []; },
  });

  const add = async (itemId: string) => {
    await supabase.from('product_inclusions').insert({ product_id: productId, inclusion_item_id: itemId, display_order: linked.length } as any);
    qc.invalidateQueries({ queryKey: ['admin-product-inclusions', productId] });
  };
  const remove = async (id: string) => {
    await supabase.from('product_inclusions').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-product-inclusions', productId] });
  };

  return (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">What's Included</h4>
      <p className="text-[10px] text-muted-foreground mb-2">Add-ons and inclusions for this experience.</p>
      <div className="flex flex-wrap gap-1 mb-2">
        {linked.map((l: any) => (
          <Badge key={l.id} variant="secondary" className="text-[10px] cursor-pointer" onClick={() => remove(l.id)}>
            {l.inclusion_items?.emoji} {l.inclusion_items?.name} ✕
          </Badge>
        ))}
      </div>
      <Select onValueChange={add}>
        <SelectTrigger className="w-48"><SelectValue placeholder="Add inclusion..." /></SelectTrigger>
        <SelectContent>
          {allItems.filter((item: any) => !linked.some((l: any) => l.inclusion_item_id === item.id)).map((item: any) => (
            <SelectItem key={item.id} value={item.id}>{item.emoji} {item.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// ============ TRANSPORT EDITOR ============

const TransportEditor = ({ productId }: { productId: string }) => {
  const qc = useQueryClient();
  const { data: linked = [] } = useQuery({
    queryKey: ['admin-product-transport', productId],
    queryFn: async () => {
      const { data } = await supabase.from('product_transport').select('*, transport_modes(*)').eq('product_id', productId).order('display_order') as any;
      return data || [];
    },
  });
  const { data: allModes = [] } = useQuery({
    queryKey: ['admin-transport-modes'],
    queryFn: async () => { const { data } = await supabase.from('transport_modes').select('*').eq('is_active', true).order('name') as any; return data || []; },
  });

  const add = async (modeId: string) => {
    await supabase.from('product_transport').insert({ product_id: productId, transport_mode_id: modeId, display_order: linked.length } as any);
    qc.invalidateQueries({ queryKey: ['admin-product-transport', productId] });
  };
  const remove = async (id: string) => {
    await supabase.from('product_transport').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-product-transport', productId] });
  };
  const updateDesc = async (id: string, desc: string) => {
    await supabase.from('product_transport').update({ description: desc } as any).eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-product-transport', productId] });
  };

  return (
    <div className="space-y-2">
      {linked.map((l: any) => (
        <div key={l.id} className="flex items-start gap-2">
          <Badge variant="secondary" className="text-[10px] shrink-0 mt-1">{l.transport_modes?.emoji} {l.transport_modes?.name}</Badge>
          <Input className="text-xs flex-1" placeholder="Description..." defaultValue={l.description || ''} onBlur={e => updateDesc(l.id, e.target.value)} />
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={() => remove(l.id)}><Trash2 className="w-3 h-3" /></Button>
        </div>
      ))}
      <Select onValueChange={add}>
        <SelectTrigger className="w-48"><SelectValue placeholder="Add transport..." /></SelectTrigger>
        <SelectContent>
          {allModes.filter((m: any) => !linked.some((l: any) => l.transport_mode_id === m.id)).map((m: any) => (
            <SelectItem key={m.id} value={m.id}>{m.emoji} {m.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};



const OptionsEditor = ({ productId }: { productId: string }) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: options = [] } = useQuery({
    queryKey: ['admin-options', productId],
    queryFn: async () => {
      const { data } = await supabase.from('options').select('*').eq('product_id', productId) as any;
      return data || [];
    },
  });

  const addOption = async () => {
    await supabase.from('options').insert({ product_id: productId, name: 'Standard', slug: 'standard', is_default_option: options.length === 0 } as any);
    qc.invalidateQueries({ queryKey: ['admin-options', productId] });
  };

  return (
    <div className="space-y-3">
      {options.map((opt: any) => (
        <Card key={opt.id} className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Input value={opt.name} className="text-sm font-semibold" onChange={async (e) => {
              await supabase.from('options').update({ name: e.target.value, slug: toSlug(e.target.value) } as any).eq('id', opt.id);
              qc.invalidateQueries({ queryKey: ['admin-options', productId] });
            }} />
            <Badge variant={opt.is_default_option ? 'default' : 'outline'} className="text-[10px] shrink-0">
              {opt.is_default_option ? 'Default' : opt.option_type}
            </Badge>
          </div>
          <PriceEditor optionId={opt.id} />
        </Card>
      ))}
      <Button size="sm" variant="outline" onClick={addOption}><Plus className="w-3 h-3 mr-1" />Add Option</Button>
    </div>
  );
};

const PriceEditor = ({ optionId }: { optionId: string }) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: prices = [] } = useQuery({
    queryKey: ['admin-prices', optionId],
    queryFn: async () => {
      const { data } = await supabase.from('price_options').select('*').eq('option_id', optionId) as any;
      return data || [];
    },
  });

  const addPrice = async () => {
    await supabase.from('price_options').insert({ option_id: optionId, pricing_category: 'adult', pricing_unit: 'per_person', currency_code: 'USD', amount: 0 } as any);
    qc.invalidateQueries({ queryKey: ['admin-prices', optionId] });
  };

  const updatePrice = async (id: string, field: string, value: any) => {
    await supabase.from('price_options').update({ [field]: value } as any).eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-prices', optionId] });
  };

  const deletePrice = async (id: string) => {
    await supabase.from('price_options').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-prices', optionId] });
  };

  return (
    <div className="pl-4 border-l-2 border-border space-y-2">
      {prices.map((p: any) => (
        <div key={p.id} className="flex flex-wrap items-center gap-2 text-xs">
          <Select value={p.pricing_category} onValueChange={v => updatePrice(p.id, 'pricing_category', v)}>
            <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="adult">Adult</SelectItem>
              <SelectItem value="child">Child</SelectItem>
              <SelectItem value="resident">Resident</SelectItem>
              <SelectItem value="non_resident">Non-Resident</SelectItem>
              <SelectItem value="group">Group</SelectItem>
            </SelectContent>
          </Select>
          <Select value={p.pricing_unit || 'per_person'} onValueChange={v => updatePrice(p.id, 'pricing_unit', v)}>
            <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="per_person">Per Person</SelectItem>
              <SelectItem value="per_group">Per Group</SelectItem>
              <SelectItem value="per_hour">Per Hour</SelectItem>
            </SelectContent>
          </Select>
          <Select value={p.currency_code} onValueChange={v => updatePrice(p.id, 'currency_code', v)}>
            <SelectTrigger className="w-20 h-7 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="TZS">TZS</SelectItem>
              <SelectItem value="KES">KES</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Input type="number" className="w-20 h-7 text-xs" placeholder="Min" value={p.amount} onChange={e => updatePrice(p.id, 'amount', parseFloat(e.target.value) || 0)} />
            <span className="text-muted-foreground">–</span>
            <Input type="number" className="w-20 h-7 text-xs" placeholder="Max (opt)" value={p.amount_max || ''} onChange={e => updatePrice(p.id, 'amount_max', parseFloat(e.target.value) || null)} />
          </div>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 shrink-0" onClick={() => deletePrice(p.id)}><Trash2 className="w-3 h-3" /></Button>
        </div>
      ))}
      <Button size="sm" variant="ghost" className="text-xs h-6" onClick={addPrice}><Plus className="w-3 h-3 mr-1" />Add Price</Button>
    </div>
  );
};

const HostsEditor = ({ productId, hosts }: { productId: string; hosts: any[] }) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: linked = [] } = useQuery({
    queryKey: ['admin-product-hosts', productId],
    queryFn: async () => {
      const { data } = await supabase.from('product_hosts').select('*, hosts(id, display_name, username)').eq('product_id', productId) as any;
      return data || [];
    },
  });

  const attach = async (hostId: string) => {
    await supabase.from('product_hosts').insert({ product_id: productId, host_id: hostId, is_primary: linked.length === 0 } as any);
    qc.invalidateQueries({ queryKey: ['admin-product-hosts', productId] });
    toast({ title: 'Host attached' });
  };

  const detach = async (id: string) => {
    await supabase.from('product_hosts').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-product-hosts', productId] });
  };

  const setPrimary = async (id: string) => {
    for (const l of linked) await supabase.from('product_hosts').update({ is_primary: l.id === id } as any).eq('id', l.id);
    qc.invalidateQueries({ queryKey: ['admin-product-hosts', productId] });
  };

  return (
    <div className="space-y-2">
      {linked.map((l: any) => (
        <div key={l.id} className="flex items-center gap-2">
          <span className="text-sm">{l.hosts?.display_name || l.hosts?.username}</span>
          <Badge variant={l.is_primary ? 'default' : 'outline'} className="text-[10px] cursor-pointer" onClick={() => setPrimary(l.id)}>
            {l.is_primary ? 'Primary' : l.role_type}
          </Badge>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => detach(l.id)}><Trash2 className="w-3 h-3" /></Button>
        </div>
      ))}
      <Select onValueChange={attach}>
        <SelectTrigger className="w-48"><SelectValue placeholder="Attach host..." /></SelectTrigger>
        <SelectContent>{hosts.filter(h => !linked.some((l: any) => l.host_id === h.id)).map(h => <SelectItem key={h.id} value={h.id}>{h.display_name || h.username}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
};

const SemanticEditor = ({ productId }: { productId: string }) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: profile } = useQuery({
    queryKey: ['admin-sem-product', productId],
    queryFn: async () => {
      const { data } = await supabase.from('semantic_product_profiles').select('*').eq('product_id', productId).maybeSingle() as any;
      return data || { product_id: productId };
    },
  });

  const save = async (field: string, value: number) => {
    const update = { ...profile, [field]: value, product_id: productId };
    const { id, ...rest } = update;
    await supabase.from('semantic_product_profiles').upsert(rest as any, { onConflict: 'product_id' });
    qc.invalidateQueries({ queryKey: ['admin-sem-product', productId] });
  };

  if (!profile) return null;
  const fields = ['romance_score', 'family_score', 'solo_score', 'adventure_score', 'food_score', 'wellness_score', 'comfort_score', 'effort_score', 'luxury_score', 'value_score', 'localness_score', 'beginner_friendliness_score'];

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-2">Who is this product for? Score 0–1.</p>
      {fields.map(f => (
        <ScoreRow key={f} label={f.replace(/_/g, ' ').replace(' score', '')} value={profile[f] ?? 0} onChange={v => save(f, v)} />
      ))}
    </div>
  );
};

const IntentEditor = ({ productId, intents }: { productId: string; intents: any[] }) => {
  const qc = useQueryClient();
  const { data: affinities = [] } = useQuery({
    queryKey: ['admin-intent-aff', productId],
    queryFn: async () => {
      const { data } = await supabase.from('product_intent_affinities').select('*, traveller_intent_profiles(name)').eq('product_id', productId) as any;
      return data || [];
    },
  });

  const addAffinity = async (intentId: string) => {
    await supabase.from('product_intent_affinities').insert({ product_id: productId, traveller_intent_profile_id: intentId, affinity_score: 0.5 } as any);
    qc.invalidateQueries({ queryKey: ['admin-intent-aff', productId] });
  };

  return (
    <div className="space-y-2">
      {affinities.map((a: any) => (
        <div key={a.traveller_intent_profile_id} className="flex items-center gap-2">
          <span className="text-xs w-32">{a.traveller_intent_profiles?.name}</span>
          <Slider min={0} max={1} step={0.05} value={[a.affinity_score]} className="flex-1" onValueChange={async ([v]) => {
            await supabase.from('product_intent_affinities').update({ affinity_score: v } as any).eq('product_id', productId).eq('traveller_intent_profile_id', a.traveller_intent_profile_id);
            qc.invalidateQueries({ queryKey: ['admin-intent-aff', productId] });
          }} />
          <span className="text-xs w-8">{a.affinity_score?.toFixed(2)}</span>
        </div>
      ))}
      <Select onValueChange={addAffinity}>
        <SelectTrigger className="w-48"><SelectValue placeholder="Add intent..." /></SelectTrigger>
        <SelectContent>{intents.filter(i => !affinities.some((a: any) => a.traveller_intent_profile_id === i.id)).map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
};

const PositioningEditor = ({ productId }: { productId: string }) => {
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ['admin-pos-product', productId],
    queryFn: async () => {
      const { data } = await supabase.from('product_positioning_profiles').select('*').eq('product_id', productId).maybeSingle() as any;
      return data || { product_id: productId };
    },
  });

  const save = async (field: string, value: number) => {
    const update = { ...profile, [field]: value, product_id: productId };
    const { id, ...rest } = update;
    await supabase.from('product_positioning_profiles').upsert(rest as any, { onConflict: 'product_id' });
    qc.invalidateQueries({ queryKey: ['admin-pos-product', productId] });
  };

  if (!profile) return null;
  const fields = ['budget_score', 'value_score', 'premium_score', 'luxury_score', 'comfort_score', 'social_score', 'exclusivity_score'];

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-2">Budget / value / luxury positioning. Score 0–1.</p>
      {fields.map(f => (
        <ScoreRow key={f} label={f.replace(/_/g, ' ').replace(' score', '')} value={profile[f] ?? 0} onChange={v => save(f, v)} />
      ))}
    </div>
  );
};

const OutputsViewer = ({ productId }: { productId: string }) => {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: docs = [] } = useQuery({
    queryKey: ['admin-entity-docs', productId],
    queryFn: async () => {
      const { data } = await supabase.from('entity_documents').select('*').eq('entity_id', productId).eq('entity_type', 'product') as any;
      return data || [];
    },
  });

  const docTypes = ['json_ld', 'llm_grounding', 'search_document', 'feed_document', 'public_page_payload'];

  const [generating, setGenerating] = useState<string | null>(null);

  const regenerate = async (docType?: string) => {
    setGenerating(docType || 'all');
    try {
      await generateEntityDocuments(productId);
      qc.invalidateQueries({ queryKey: ['admin-entity-docs', productId] });
      toast({ title: docType ? `Regenerated ${docType}` : 'All documents regenerated' });
    } catch (e) {
      toast({ title: 'Generation failed', description: String(e), variant: 'destructive' });
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-3">
      <Button size="sm" onClick={() => regenerate()} disabled={!!generating}>
        <RefreshCw className={`w-3 h-3 mr-1 ${generating === 'all' ? 'animate-spin' : ''}`} />
        {generating === 'all' ? 'Generating…' : 'Regenerate All Documents'}
      </Button>
      {docTypes.map(dt => {
        const doc = docs.find((d: any) => d.document_type === dt);
        return (
          <Card key={dt} className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">{dt.replace(/_/g, ' ')}</span>
                {doc ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={doc.generation_status === 'complete' ? 'default' : 'secondary'} className="text-[10px]">{doc.generation_status}</Badge>
                    <span className="text-[10px] text-muted-foreground">v{doc.version} · {new Date(doc.generated_at).toLocaleDateString()}</span>
                  </div>
                ) : <p className="text-xs text-muted-foreground">Not generated</p>}
              </div>
              <Button size="sm" variant="outline" disabled={!!generating} onClick={() => regenerate(dt)}>
                <RefreshCw className={`w-3 h-3 mr-1 ${generating === dt ? 'animate-spin' : ''}`} />Regenerate
              </Button>
            </div>
            {doc?.document_json && Object.keys(doc.document_json).length > 0 && (
              <pre className="mt-2 text-[10px] bg-muted p-2 rounded max-h-32 overflow-auto font-mono">{JSON.stringify(doc.document_json, null, 2)}</pre>
            )}
          </Card>
        );
      })}
    </div>
  );
};

// ============ THEME / FORMAT / POI EDITOR ============

const ThemeFormatEditor = ({ productId, themes }: { productId: string; themes: any[] }) => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: linkedThemes = [] } = useQuery({
    queryKey: ['admin-pt', productId],
    queryFn: async () => {
      const { data } = await supabase.from('product_themes').select('*, themes(id, name, emoji)').eq('product_id', productId) as any;
      return data || [];
    },
  });

  const { data: linkedFormats = [] } = useQuery({
    queryKey: ['admin-pf', productId],
    queryFn: async () => {
      const { data } = await supabase.from('product_formats').select('*').eq('product_id', productId) as any;
      return data || [];
    },
  });

  const { data: linkedPois = [] } = useQuery({
    queryKey: ['admin-pp', productId],
    queryFn: async () => {
      const { data } = await supabase.from('product_pois').select('*, pois(id, name, slug)').eq('product_id', productId) as any;
      return data || [];
    },
  });

  const { data: allPois = [] } = useQuery({
    queryKey: ['admin-all-pois'],
    queryFn: async () => {
      const { data } = await supabase.from('pois').select('id, name, slug') as any;
      return data || [];
    },
  });

  const addTheme = async (themeId: string) => {
    await supabase.from('product_themes').insert({ product_id: productId, theme_id: themeId } as any);
    qc.invalidateQueries({ queryKey: ['admin-pt', productId] });
  };

  const removeTheme = async (id: string) => {
    await supabase.from('product_themes').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-pt', productId] });
  };

  const addFormat = async (formatType: string) => {
    await supabase.from('product_formats').insert({ product_id: productId, format_type: formatType } as any);
    qc.invalidateQueries({ queryKey: ['admin-pf', productId] });
  };

  const removeFormat = async (id: string) => {
    await supabase.from('product_formats').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-pf', productId] });
  };

  const addPoi = async (poiId: string) => {
    await supabase.from('product_pois').insert({ product_id: productId, poi_id: poiId, relationship_type: 'located_at', display_order: linkedPois.length } as any);
    qc.invalidateQueries({ queryKey: ['admin-pp', productId] });
  };

  const removePoi = async (id: string) => {
    await supabase.from('product_pois').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-pp', productId] });
  };

  const FORMAT_TYPES = ['shared', 'private', 'guided', 'self-guided', 'half-day', 'full-day', 'multi-day', 'morning', 'sunset', 'overnight'];

  return (
    <div className="space-y-4">
      {/* Themes */}
      <div>
        <Label className="text-xs text-muted-foreground font-semibold">Themes</Label>
        <div className="flex flex-wrap gap-1 mt-1">
          {linkedThemes.map((lt: any) => (
            <Badge key={lt.id} variant="secondary" className="text-[10px] cursor-pointer" onClick={() => removeTheme(lt.id)}>
              {lt.themes?.emoji} {lt.themes?.name} ✕
            </Badge>
          ))}
        </div>
        <Select onValueChange={addTheme}>
          <SelectTrigger className="w-48 mt-1"><SelectValue placeholder="Add theme..." /></SelectTrigger>
          <SelectContent>
            {themes.filter(t => !linkedThemes.some((lt: any) => lt.theme_id === t.id)).map(t => (
              <SelectItem key={t.id} value={t.id}>{t.emoji} {t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Formats */}
      <div>
        <Label className="text-xs text-muted-foreground font-semibold">Formats</Label>
        <div className="flex flex-wrap gap-1 mt-1">
          {linkedFormats.map((f: any) => (
            <Badge key={f.id} variant="outline" className="text-[10px] cursor-pointer" onClick={() => removeFormat(f.id)}>
              {f.format_type} ✕
            </Badge>
          ))}
        </div>
        <Select onValueChange={addFormat}>
          <SelectTrigger className="w-48 mt-1"><SelectValue placeholder="Add format..." /></SelectTrigger>
          <SelectContent>
            {FORMAT_TYPES.filter(ft => !linkedFormats.some((f: any) => f.format_type === ft)).map(ft => (
              <SelectItem key={ft} value={ft}>{ft}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* POIs */}
      <div>
        <Label className="text-xs text-muted-foreground font-semibold">Linked POIs</Label>
        <div className="flex flex-wrap gap-1 mt-1">
          {linkedPois.map((lp: any) => (
            <Badge key={lp.id} variant="secondary" className="text-[10px] cursor-pointer" onClick={() => removePoi(lp.id)}>
              📍 {lp.pois?.name} ({lp.relationship_type}) ✕
            </Badge>
          ))}
        </div>
        <Select onValueChange={addPoi}>
          <SelectTrigger className="w-48 mt-1"><SelectValue placeholder="Add POI..." /></SelectTrigger>
          <SelectContent>
            {allPois.filter((p: any) => !linkedPois.some((lp: any) => lp.poi_id === p.id)).map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

// ============ PRODUCT RELATIONSHIPS EDITOR ============

const RelationshipsEditor = ({ productId }: { productId: string }) => {
  const qc = useQueryClient();
  const { data: rels = [] } = useQuery({
    queryKey: ['admin-prod-rels', productId],
    queryFn: async () => {
      const { data } = await (supabase as any).from('product_relationships')
        .select('*, target:products!product_relationships_target_product_id_fkey(id, title, slug)')
        .eq('source_product_id', productId);
      return data || [];
    },
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['admin-products-mini-rels'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, title').order('title');
      return data || [];
    },
  });

  const REL_TYPES = ['related', 'complementary', 'alternative', 'upgrade', 'prerequisite', 'add_on'];

  const [relType, setRelType] = useState('related');

  const add = async (targetId: string) => {
    await (supabase as any).from('product_relationships').insert({
      source_product_id: productId,
      target_product_id: targetId,
      relationship_type: relType,
      score: 0.5,
    });
    qc.invalidateQueries({ queryKey: ['admin-prod-rels', productId] });
  };

  const remove = async (id: string) => {
    await (supabase as any).from('product_relationships').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-prod-rels', productId] });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Link this product to related products.</p>
      {rels.map((r: any) => (
        <div key={r.id} className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">{r.relationship_type}</Badge>
          <span className="text-sm">{r.target?.title}</span>
          <Slider min={0} max={1} step={0.05} value={[r.score ?? 0.5]} className="w-24" onValueChange={async ([v]) => {
            await (supabase as any).from('product_relationships').update({ score: v }).eq('id', r.id);
            qc.invalidateQueries({ queryKey: ['admin-prod-rels', productId] });
          }} />
          <span className="text-[10px]">{(r.score ?? 0.5).toFixed(2)}</span>
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => remove(r.id)}><Trash2 className="w-3 h-3" /></Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Select value={relType} onValueChange={setRelType}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>{REL_TYPES.map(rt => <SelectItem key={rt} value={rt}>{rt}</SelectItem>)}</SelectContent>
        </Select>
        <Select onValueChange={add}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Add product..." /></SelectTrigger>
          <SelectContent>
            {allProducts.filter((p: any) => p.id !== productId && !rels.some((r: any) => r.target_product_id === p.id))
              .map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

// ============ VALIDATION VIEWER ============

const ValidationViewer = ({ productId }: { productId: string }) => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runValidation = async () => {
    setLoading(true);
    try {
      const { data: product } = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
      if (!product) return;

      const batch1: any[] = await Promise.all([
        supabase.from('options').select('*, price_options(*)').eq('product_id', productId) as any,
        supabase.from('product_hosts').select('*, hosts(*)').eq('product_id', productId) as any,
        product.destination_id
          ? (supabase.from('destinations').select('*').eq('id', product.destination_id).maybeSingle() as any)
          : Promise.resolve({ data: null }),
        (product as any).primary_area_id
          ? (supabase.from('areas').select('*').eq('id', (product as any).primary_area_id).maybeSingle() as any)
          : Promise.resolve({ data: null }),
        supabase.from('product_themes').select('id').eq('product_id', productId) as any,
        (supabase.from('semantic_product_profiles').select('*').eq('product_id', productId).maybeSingle() as any),
        (supabase.from('product_positioning_profiles').select('*').eq('product_id', productId).maybeSingle() as any),
        supabase.from('product_intent_affinities').select('id').eq('product_id', productId) as any,
        supabase.from('entity_documents').select('id').eq('entity_id', productId).eq('entity_type', 'product') as any,
      ]);
      const batch2Promises: Promise<any>[] = [
        supabase.from('product_timing_profiles').select('*').eq('product_id', productId).eq('is_active', true) as any,
        supabase.from('experience_faqs').select('id').eq('experience_id', productId) as any,
        supabase.from('questions').select('id').eq('entity_id', productId).eq('entity_type', 'product') as any,
        (supabase.from('canonical_decisions').select('id').eq('entity_id', productId).eq('entity_type', 'product').maybeSingle()) as any,
        (supabase.from('page_route_registry').select('id').eq('entity_id', productId).eq('entity_type', 'product').maybeSingle()) as any,
        supabase.from('products').select('slug').eq('slug', product.slug).neq('id', productId) as any,
        supabase.from('user_likes').select('id').eq('item_id', productId) as any,
        supabase.from('media_assets').select('id').eq('entity_id', productId).eq('entity_type', 'product').eq('asset_type', 'image') as any,
      ];
      const batch2 = await Promise.all(batch2Promises);

      const opts = batch1[0].data;
      const hostLinks = batch1[1].data;
      const dest = batch1[2].data;
      const areaData = batch1[3].data;
      const themeLinks = batch1[4].data;
      const sem = batch1[5].data;
      const pos = batch1[6].data;
      const intentLinks = batch1[7].data;
      const entityDocs = batch1[8].data;
      const timingProfiles = batch2[0].data;
      const faqRows = batch2[1].data;
      const questionRows = batch2[2].data;
      const canonicalEntry = batch2[3].data;
      const routeEntry = batch2[4].data;
      const duplicateRows = batch2[5].data;
      const saveRows = batch2[6].data;
      const galleryMediaRows = batch2[7].data;

      const hosts = (hostLinks || []).map((h: any) => h.hosts).filter(Boolean);
      const galleryJson = (product as any).gallery_json || (product as any).gallery || [];
      const totalGallery = (Array.isArray(galleryMediaRows) ? galleryMediaRows.length : 0) + (Array.isArray(galleryJson) ? galleryJson.length : 0);
      const res = validateProduct({
        product,
        options: opts || [],
        hosts,
        destination: dest,
        area: areaData,
        themeCount: (themeLinks || []).length,
        semanticProfile: sem,
        positioningProfile: pos,
        intentAffinityCount: (intentLinks || []).length,
        entityDocCount: (entityDocs || []).length,
        timingProfiles: timingProfiles || [],
        faqCount: (faqRows || []).length,
        questionCount: (questionRows || []).length,
        hasCanonicalEntry: !!canonicalEntry,
        hasRouteEntry: !!routeEntry,
        duplicateSlugs: (duplicateRows || []).map((r: any) => r.slug),
        galleryCount: totalGallery,
        saveCount: (saveRows || []).length,
      });
      await persistReadinessScore(res);
      await persistValidationResults(res);
      await supabase.from('products').update({ publish_score: res.publish_score } as any).eq('id', productId);
      setResult(res);
    } finally { setLoading(false); }
  };

  // Map dimensions to their admin tab for quick navigation hints
  const DIMENSION_TAB_MAP: Record<string, { tab: string; label: string }> = {
    content: { tab: 'Basics', label: 'Content' },
    media: { tab: 'Basics', label: 'Media' },
    canonical: { tab: 'Governance', label: 'Canonical/SEO' },
    taxonomy: { tab: 'Taxonomy', label: 'Taxonomy' },
    commerce: { tab: 'Options & Pricing', label: 'Commerce' },
    feed: { tab: 'Basics', label: 'Feed Readiness' },
    graph: { tab: 'Relations', label: 'Graph' },
    geo: { tab: 'Geography', label: 'Geography' },
    qa: { tab: 'Validation', label: 'QA' },
    route: { tab: 'Governance', label: 'Route' },
    analytics: { tab: 'Links', label: 'Analytics' },
  };

  const severityLabel = (s: string) => {
    if (s === 'blocker') return '🔴 BLOCKER';
    if (s === 'error') return '🟠 Required';
    if (s === 'warning') return '🟡 Recommended';
    return '🔵 Nice to have';
  };

  return (
    <div className="space-y-3">
      <Button size="sm" onClick={runValidation} disabled={loading}>
        {loading ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}
        Run Validation
      </Button>
      {result && (
        <Card className="p-3 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{result.publish_score}%</span>
            <Badge variant={result.is_publishable ? 'default' : 'destructive'} className="text-[10px]">
              {result.is_publishable ? 'Publishable' : 'Not Ready'}
            </Badge>
            <Badge variant="outline" className="text-[10px]">{result.recommended_state}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{result.summary}</p>

          {/* Dimension scores overview */}
          <div className="grid grid-cols-3 gap-1.5">
            {(result.dimensions || []).map((d: any) => (
              <div key={d.dimension} className="flex items-center gap-1.5 text-[10px]">
                <div className={`w-2 h-2 rounded-full shrink-0 ${d.score >= 80 ? 'bg-green-500' : d.score >= 50 ? 'bg-yellow-500' : 'bg-destructive'}`} />
                <span className="text-muted-foreground">{DIMENSION_TAB_MAP[d.dimension]?.label || d.dimension}</span>
                <span className="font-semibold ml-auto">{d.score}%</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Failed checks grouped by dimension */}
          {Object.entries(
            result.checks.filter((c: any) => !c.passed).reduce((acc: Record<string, any[]>, c: any) => {
              const key = c.dimension || 'other';
              if (!acc[key]) acc[key] = [];
              acc[key].push(c);
              return acc;
            }, {})
          ).map(([dim, checks]: [string, any[]]) => (
            <div key={dim} className="space-y-1">
              <div className="flex items-center gap-1.5">
                <h5 className="text-xs font-semibold">{DIMENSION_TAB_MAP[dim]?.label || dim}</h5>
                <Badge variant="outline" className="text-[9px] h-4">→ {DIMENSION_TAB_MAP[dim]?.tab || 'Basics'} tab</Badge>
              </div>
              {checks.sort((a: any, b: any) => {
                const order = { blocker: 0, error: 1, warning: 2, info: 3 };
                return (order[a.severity as keyof typeof order] ?? 4) - (order[b.severity as keyof typeof order] ?? 4);
              }).map((c: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs pl-2">
                  {c.severity === 'blocker' ? <XCircle className="w-3 h-3 text-destructive mt-0.5 shrink-0" /> :
                    c.severity === 'error' ? <AlertTriangle className="w-3 h-3 text-destructive/70 mt-0.5 shrink-0" /> :
                    <AlertTriangle className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />}
                  <div>
                    <span className="text-[10px] font-medium text-muted-foreground mr-1.5">{severityLabel(c.severity)}</span>
                    <span>{c.message}</span>
                    {c.suggested_fix && <span className="text-muted-foreground ml-1">→ {c.suggested_fix}</span>}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {result.checks.filter((c: any) => !c.passed).length === 0 && (
            <p className="text-xs text-green-600 font-medium">✅ All checks passing!</p>
          )}
        </Card>
      )}
    </div>
  );
};

// ============ PRODUCT LINKS VIEWER ============

const ProductLinksViewer = ({ productId, productTitle }: { productId: string; productTitle: string }) => {
  const { data: collectionLinks = [] } = useQuery({
    queryKey: ['admin-product-collection-links', productId],
    queryFn: async () => {
      const { data } = await (supabase as any).from('collection_items').select('id, collection_id, position').eq('item_id', productId).in('item_type', ['product', 'experience']);
      if (!data?.length) return [];
      const collIds = data.map((ci: any) => ci.collection_id);
      const { data: colls } = await (supabase as any).from('collections').select('id, name, slug').in('id', collIds);
      return data.map((ci: any) => {
        const c = colls?.find((x: any) => x.id === ci.collection_id);
        return { ...ci, collection_name: c?.name || ci.collection_id.slice(0, 8), collection_slug: c?.slug };
      });
    },
  });

  const { data: itineraryLinks = [] } = useQuery({
    queryKey: ['admin-product-itinerary-links', productId],
    queryFn: async () => {
      const { data } = await (supabase as any).from('public_itineraries').select('id, name, slug, experiences');
      if (!data) return [];
      return data.filter((it: any) => {
        const exps = Array.isArray(it.experiences) ? it.experiences : [];
        return exps.some((e: any) => e.id === productId);
      }).map((it: any) => ({ id: it.id, name: it.name, slug: it.slug }));
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold mb-2">In Collections ({collectionLinks.length})</h4>
        {collectionLinks.length === 0 && <p className="text-xs text-muted-foreground">Not in any collections yet.</p>}
        {collectionLinks.map((cl: any) => (
          <div key={cl.id} className="flex items-center gap-2 text-sm border border-border rounded px-3 py-2 mb-1">
            <Badge variant="outline" className="text-[10px]">Collection</Badge>
            <span className="flex-1 truncate">{cl.collection_name}</span>
            <span className="text-[10px] text-muted-foreground font-mono">/collections/{cl.collection_slug}</span>
          </div>
        ))}
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-2">In Itineraries ({itineraryLinks.length})</h4>
        {itineraryLinks.length === 0 && <p className="text-xs text-muted-foreground">Not in any itineraries yet.</p>}
        {itineraryLinks.map((it: any) => (
          <div key={it.id} className="flex items-center gap-2 text-sm border border-border rounded px-3 py-2 mb-1">
            <Badge variant="outline" className="text-[10px]">Itinerary</Badge>
            <span className="flex-1 truncate">{it.name}</span>
            <span className="text-[10px] text-muted-foreground font-mono">/itineraries/{it.slug}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
