/**
 * Products section — full CRUD with tabbed admin for all product layers:
 * Basics, Geography, Taxonomy, Options/Pricing, Hosts, Semantics,
 * Intent, Positioning, Generated Outputs, Governance.
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { Archive, Eye, RefreshCw, Plus, Trash2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
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
      const { error } = await supabase.from('products').update(rest as any).eq('id', id);
      if (error) throw error;
    }
    // Auto-validate and generate docs after save
    if (id || !isNew) {
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
      render: (p: any) => <span className="text-muted-foreground text-xs font-mono">{p.slug}</span>,
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
        <TabsTrigger value="hosts" className="text-xs">Hosts</TabsTrigger>
        <TabsTrigger value="semantics" className="text-xs">Semantics</TabsTrigger>
        <TabsTrigger value="intent" className="text-xs">Intent</TabsTrigger>
        <TabsTrigger value="positioning" className="text-xs">Positioning</TabsTrigger>
        <TabsTrigger value="outputs" className="text-xs">Outputs</TabsTrigger>
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
            <Label className="text-xs text-muted-foreground">Cover Image URL</Label>
            <Input value={item.cover_image_url || ''} onChange={e => onChange('cover_image_url', e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs text-muted-foreground">Video URL</Label><Input value={item.video_url || ''} onChange={e => onChange('video_url', e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">SEO Title</Label><Input value={item.seo_title || ''} onChange={e => onChange('seo_title', e.target.value)} maxLength={60} /></div>
        </div>
        <div><Label className="text-xs text-muted-foreground">SEO Description</Label><Textarea value={item.seo_description || ''} onChange={e => onChange('seo_description', e.target.value)} rows={2} /></div>
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
            <Select value={item.primary_area_id || ''} onValueChange={v => onChange('primary_area_id', v || null)}>
              <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {areas.filter((a: any) => !item.destination_id || a.destination_id === item.destination_id).map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">POI</Label>
            <Select value={item.primary_poi_id || ''} onValueChange={v => onChange('primary_poi_id', v || null)}>
              <SelectTrigger><SelectValue placeholder="Select POI" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {pois.filter((p: any) => !item.primary_area_id || p.area_id === item.primary_area_id).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Products link to locations only through these canonical place references. Use meeting_points_json for operational pickup/check-in info.</p>
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
        {item.id ? <OptionsEditor productId={item.id} /> : <p className="text-xs text-muted-foreground">Save the product first to manage options.</p>}
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

// ============ SUB-EDITORS ============

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
  const { data: prices = [] } = useQuery({
    queryKey: ['admin-prices', optionId],
    queryFn: async () => {
      const { data } = await supabase.from('price_options').select('*').eq('option_id', optionId) as any;
      return data || [];
    },
  });

  const addPrice = async () => {
    await supabase.from('price_options').insert({ option_id: optionId, pricing_category: 'adult', currency_code: 'USD', amount: 0 } as any);
    qc.invalidateQueries({ queryKey: ['admin-prices', optionId] });
  };

  return (
    <div className="pl-4 border-l-2 border-border space-y-1">
      {prices.map((p: any) => (
        <div key={p.id} className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground w-20">{p.pricing_category}</span>
          <span>{p.currency_code} {p.amount}</span>
        </div>
      ))}
      <Button size="sm" variant="ghost" className="text-xs h-6" onClick={addPrice}><Plus className="w-3 h-3 mr-1" />Price</Button>
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

  const regenerate = async (docType: string) => {
    // Upsert a pending doc to trigger generation (actual generation is a separate pipeline)
    await supabase.from('entity_documents').upsert({
      entity_type: 'product', entity_id: productId, document_type: docType,
      generation_status: 'pending', generated_at: new Date().toISOString(), document_json: {},
    } as any, { onConflict: 'entity_type,entity_id,document_type' });
    qc.invalidateQueries({ queryKey: ['admin-entity-docs', productId] });
    toast({ title: `Queued ${docType} for regeneration` });
  };

  return (
    <div className="space-y-3">
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
              <Button size="sm" variant="outline" onClick={() => regenerate(dt)}><RefreshCw className="w-3 h-3 mr-1" />Regenerate</Button>
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
      const { data: opts } = await supabase.from('options').select('*, price_options(*)').eq('product_id', productId) as any;
      const { data: hostLinks } = await supabase.from('product_hosts').select('*, hosts(*)').eq('product_id', productId) as any;
      const hosts = (hostLinks || []).map((h: any) => h.hosts).filter(Boolean);
      const res = validateProduct({ product, options: opts || [], hosts });
      await persistReadinessScore(res);
      await persistValidationResults(res);
      await supabase.from('products').update({ publish_score: res.publish_score } as any).eq('id', productId);
      setResult(res);
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <Button size="sm" onClick={runValidation} disabled={loading}>
        {loading ? <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}
        Run Validation
      </Button>
      {result && (
        <Card className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{result.publish_score}%</span>
            <Badge variant={result.is_publishable ? 'default' : 'destructive'} className="text-[10px]">
              {result.is_publishable ? 'Publishable' : 'Not Ready'}
            </Badge>
            <Badge variant="outline" className="text-[10px]">{result.recommended_state}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{result.summary}</p>
          <div className="space-y-1">
            {result.checks.filter((c: any) => !c.passed).map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {c.severity === 'blocker' ? <XCircle className="w-3 h-3 text-destructive" /> :
                  c.severity === 'error' ? <AlertTriangle className="w-3 h-3 text-orange-500" /> :
                  <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                <span>{c.message}</span>
                {c.suggested_fix && <span className="text-muted-foreground">→ {c.suggested_fix}</span>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
