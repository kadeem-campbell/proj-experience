/**
 * Admin Entity Manager for Phase 3 — manages destinations, areas, products, options,
 * price options, hosts, themes, POIs from the new entity graph.
 */
import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, X, ChevronDown, ChevronUp, MapPin, Package, Tag, Globe, Mountain, Users, DollarSign, Gauge } from 'lucide-react';
import { validateProduct, validateDestination, validateHost, type PublishValidationResult } from '@/services/publishValidator';
import { cn } from '@/lib/utils';

const toSlug = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

// ============ PUBLISH SCORE BADGE ============
const PublishScoreBadge = ({ result }: { result: PublishValidationResult | null }) => {
  if (!result) return null;
  const color = result.publish_score >= 80 ? 'bg-green-500' : result.publish_score >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("w-2 h-2 rounded-full", color)} />
      <span className="text-xs font-medium">{result.publish_score}%</span>
      {!result.is_publishable && <span className="text-[10px] text-destructive">Not publishable</span>}
    </div>
  );
};

// ============ GENERIC ENTITY LIST ============
function EntityList<T extends { id: string }>({
  items,
  renderRow,
  renderForm,
  onSave,
  onToggleActive,
  entityName,
  defaultItem,
}: {
  items: T[];
  renderRow: (item: T) => React.ReactNode;
  renderForm: (item: Partial<T>, onChange: (field: string, value: any) => void) => React.ReactNode;
  onSave: (item: Partial<T>, isNew: boolean) => Promise<void>;
  onToggleActive?: (id: string, active: boolean) => void;
  entityName: string;
  defaultItem: Partial<T>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<T>>(defaultItem);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = items.filter((item: any) =>
    (item.name || item.title || item.display_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (isNew: boolean) => {
    setSaving(true);
    try {
      await onSave(formData, isNew);
      setExpandedId(null);
      setFormData(defaultItem);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={`Search ${entityName}...`} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button size="sm" className="gap-1" onClick={() => { setFormData(defaultItem); setExpandedId('new'); }}>
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      {expandedId === 'new' && (
        <Card className="p-4 mb-4 border-primary/30">
          <h3 className="font-semibold text-sm mb-3">New {entityName}</h3>
          {renderForm(formData, handleChange)}
          <div className="flex gap-2 mt-3">
            <Button size="sm" disabled={saving} onClick={() => handleSave(true)}>{saving ? 'Saving...' : 'Create'}</Button>
            <Button size="sm" variant="outline" onClick={() => setExpandedId(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
        {filtered.map(item => (
          <div key={item.id} className="border rounded-lg">
            <div className="flex items-center justify-between p-2.5 cursor-pointer" onClick={() => {
              if (expandedId === item.id) { setExpandedId(null); } else { setExpandedId(item.id); setFormData(item); }
            }}>
              <div className="flex-1 min-w-0">{renderRow(item)}</div>
              {expandedId === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
            {expandedId === item.id && (
              <div className="border-t p-3 bg-muted/20">
                {renderForm(formData, handleChange)}
                <div className="flex gap-2 mt-3">
                  <Button size="sm" disabled={saving} onClick={() => handleSave(false)}>{saving ? 'Saving...' : 'Save'}</Button>
                  <Button size="sm" variant="outline" onClick={() => setExpandedId(null)}>Close</Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No {entityName} found</p>}
      </div>
    </div>
  );
}

// ============ MAIN COMPONENT ============
export const AdminEntityManager = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  // Fetch data
  const { data: destinations = [] } = useQuery({
    queryKey: ['admin-destinations'],
    queryFn: async () => { const { data } = await supabase.from('destinations').select('*').order('display_order'); return data || []; },
  });
  const { data: areas = [] } = useQuery({
    queryKey: ['admin-areas'],
    queryFn: async () => { const { data } = await supabase.from('areas').select('*').order('name'); return data || []; },
  });
  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => { const { data } = await supabase.from('products').select('*').order('title'); return data || []; },
  });
  const { data: hosts = [] } = useQuery({
    queryKey: ['admin-hosts'],
    queryFn: async () => { const { data } = await supabase.from('hosts').select('*').order('display_name'); return data || []; },
  });
  const { data: themes = [] } = useQuery({
    queryKey: ['admin-themes'],
    queryFn: async () => { const { data } = await supabase.from('themes').select('*').order('display_order'); return data || []; },
  });
  const { data: activityTypes = [] } = useQuery({
    queryKey: ['admin-activity-types'],
    queryFn: async () => { const { data } = await supabase.from('activity_types').select('*').order('display_order'); return data || []; },
  });
  const { data: pois = [] } = useQuery({
    queryKey: ['admin-pois'],
    queryFn: async () => { const { data } = await supabase.from('pois').select('*').order('name'); return data || []; },
  });
  const { data: options = [] } = useQuery({
    queryKey: ['admin-options'],
    queryFn: async () => { const { data } = await supabase.from('options').select('*').order('display_order'); return data || []; },
  });

  const invalidateAll = () => {
    ['admin-destinations', 'admin-areas', 'admin-products', 'admin-hosts', 'admin-themes', 'admin-activity-types', 'admin-pois', 'admin-options', 'destinations', 'all-hosts-v2', 'products', 'themes', 'activity-types'].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
  };

  const saveTo = async (table: string, item: any, isNew: boolean) => {
    const { id, ...rest } = item;
    if (isNew) {
      const { error } = await (supabase as any).from(table).insert(rest);
      if (error) throw error;
    } else {
      const { error } = await (supabase as any).from(table).update(rest).eq('id', id);
      if (error) throw error;
    }
    invalidateAll();
    toast({ title: isNew ? 'Created' : 'Saved' });
  };

  // Common form fields
  const nameSlugFields = (item: any, onChange: (f: string, v: any) => void) => (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label className="text-xs text-muted-foreground">Name</Label>
        <Input value={item.name || ''} onChange={e => { onChange('name', e.target.value); if (!item.id) onChange('slug', toSlug(e.target.value)); }} />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Slug</Label>
        <Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} />
      </div>
    </div>
  );

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Gauge className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-lg">Entity Manager</h2>
        <Badge variant="outline" className="text-xs ml-auto">
          {destinations.length} dest · {products.length} prod · {hosts.length} hosts · {pois.length} POIs
        </Badge>
      </div>

      <Tabs defaultValue="destinations" className="w-full">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="destinations" className="text-xs gap-1"><Globe className="w-3 h-3" /> Destinations ({destinations.length})</TabsTrigger>
          <TabsTrigger value="areas" className="text-xs gap-1"><Mountain className="w-3 h-3" /> Areas ({areas.length})</TabsTrigger>
          <TabsTrigger value="products" className="text-xs gap-1"><Package className="w-3 h-3" /> Products ({products.length})</TabsTrigger>
          <TabsTrigger value="hosts" className="text-xs gap-1"><Users className="w-3 h-3" /> Hosts ({hosts.length})</TabsTrigger>
          <TabsTrigger value="themes" className="text-xs gap-1"><Tag className="w-3 h-3" /> Themes ({themes.length})</TabsTrigger>
          <TabsTrigger value="pois" className="text-xs gap-1"><MapPin className="w-3 h-3" /> POIs ({pois.length})</TabsTrigger>
          <TabsTrigger value="options" className="text-xs gap-1"><DollarSign className="w-3 h-3" /> Options ({options.length})</TabsTrigger>
        </TabsList>

        {/* DESTINATIONS */}
        <TabsContent value="destinations">
          <EntityList
            items={destinations}
            entityName="Destination"
            defaultItem={{ name: '', slug: '', description: '', cover_image: '', is_active: true, display_order: 0 }}
            renderRow={(d: any) => (
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{d.name}</span>
                <Badge variant={d.is_active ? 'default' : 'secondary'} className="text-[10px]">{d.is_active ? 'active' : 'inactive'}</Badge>
                <span className="text-xs text-muted-foreground">/{d.slug}</span>
              </div>
            )}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                {nameSlugFields(item, onChange)}
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea value={item.description || ''} onChange={e => onChange('description', e.target.value)} rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Cover Image URL</Label>
                    <Input value={item.cover_image || ''} onChange={e => onChange('cover_image', e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Airport Code</Label>
                    <Input value={item.airport_code || ''} onChange={e => onChange('airport_code', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Latitude</Label><Input type="number" step="any" value={item.latitude || ''} onChange={e => onChange('latitude', parseFloat(e.target.value) || null)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Longitude</Label><Input type="number" step="any" value={item.longitude || ''} onChange={e => onChange('longitude', parseFloat(e.target.value) || null)} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={item.is_active ?? true} onCheckedChange={v => onChange('is_active', v)} />
                  <span className="text-xs">{item.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            )}
            onSave={(item, isNew) => saveTo('destinations', item, isNew)}
          />
        </TabsContent>

        {/* AREAS */}
        <TabsContent value="areas">
          <EntityList
            items={areas}
            entityName="Area"
            defaultItem={{ name: '', slug: '', destination_id: '', description: '', is_active: true }}
            renderRow={(a: any) => (
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{a.name}</span>
                <span className="text-xs text-muted-foreground">{destinations.find((d: any) => d.id === a.destination_id)?.name || ''}</span>
              </div>
            )}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                {nameSlugFields(item, onChange)}
                <div>
                  <Label className="text-xs text-muted-foreground">Destination</Label>
                  <Select value={item.destination_id || ''} onValueChange={v => onChange('destination_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
                    <SelectContent>{destinations.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={item.description || ''} onChange={e => onChange('description', e.target.value)} rows={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Latitude</Label><Input type="number" step="any" value={item.latitude || ''} onChange={e => onChange('latitude', parseFloat(e.target.value) || null)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Longitude</Label><Input type="number" step="any" value={item.longitude || ''} onChange={e => onChange('longitude', parseFloat(e.target.value) || null)} /></div>
                </div>
              </div>
            )}
            onSave={(item, isNew) => saveTo('areas', item, isNew)}
          />
        </TabsContent>

        {/* PRODUCTS */}
        <TabsContent value="products">
          <EntityList
            items={products}
            entityName="Product"
            defaultItem={{ title: '', slug: '', description: '', destination_id: '', activity_type_id: '', is_active: true, tier: 'standard', format_type: 'shared' }}
            renderRow={(p: any) => (
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{p.title}</span>
                <Badge variant={p.is_active ? 'default' : 'secondary'} className="text-[10px]">{p.is_active ? 'active' : 'inactive'}</Badge>
                {p.publish_score != null && <span className="text-[10px] text-muted-foreground">{p.publish_score}%</span>}
              </div>
            )}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Title</Label><Input value={item.title || ''} onChange={e => { onChange('title', e.target.value); if (!item.id) onChange('slug', toSlug(e.target.value)); }} /></div>
                  <div><Label className="text-xs text-muted-foreground">Slug</Label><Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} /></div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={item.description || ''} onChange={e => onChange('description', e.target.value)} rows={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Destination</Label>
                    <Select value={item.destination_id || ''} onValueChange={v => onChange('destination_id', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{destinations.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Activity Type</Label>
                    <Select value={item.activity_type_id || ''} onValueChange={v => onChange('activity_type_id', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{activityTypes.map((at: any) => <SelectItem key={at.id} value={at.id}>{at.emoji} {at.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Tier</Label>
                    <Select value={item.tier || 'standard'} onValueChange={v => onChange('tier', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="luxury">Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Format</Label>
                    <Select value={item.format_type || 'shared'} onValueChange={v => onChange('format_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="shared">Shared</SelectItem>
                        <SelectItem value="group">Group</SelectItem>
                        <SelectItem value="self-guided">Self-guided</SelectItem>
                        <SelectItem value="hosted">Hosted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs text-muted-foreground">Duration</Label><Input value={item.duration || ''} onChange={e => onChange('duration', e.target.value)} placeholder="2 hours" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Cover Image</Label><Input value={item.cover_image || ''} onChange={e => onChange('cover_image', e.target.value)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Video URL</Label><Input value={item.video_url || ''} onChange={e => onChange('video_url', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Latitude</Label><Input type="number" step="any" value={item.latitude || ''} onChange={e => onChange('latitude', parseFloat(e.target.value) || null)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Longitude</Label><Input type="number" step="any" value={item.longitude || ''} onChange={e => onChange('longitude', parseFloat(e.target.value) || null)} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={item.is_active ?? true} onCheckedChange={v => onChange('is_active', v)} />
                  <span className="text-xs">{item.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            )}
            onSave={(item, isNew) => saveTo('products', item, isNew)}
          />
        </TabsContent>

        {/* HOSTS */}
        <TabsContent value="hosts">
          <EntityList
            items={hosts}
            entityName="Host"
            defaultItem={{ username: '', display_name: '', slug: '', bio: '', avatar_url: '', is_active: true, is_verified: false }}
            renderRow={(h: any) => (
              <div className="flex items-center gap-2">
                {h.avatar_url && <img src={h.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />}
                <span className="font-medium text-sm">{h.display_name || h.username}</span>
                {h.is_verified && <Badge variant="outline" className="text-[10px]">✓</Badge>}
              </div>
            )}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Username</Label><Input value={item.username || ''} onChange={e => { onChange('username', e.target.value); if (!item.id) onChange('slug', toSlug(e.target.value)); }} /></div>
                  <div><Label className="text-xs text-muted-foreground">Display Name</Label><Input value={item.display_name || ''} onChange={e => onChange('display_name', e.target.value)} /></div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Slug</Label><Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} /></div>
                <div><Label className="text-xs text-muted-foreground">Bio</Label><Textarea value={item.bio || ''} onChange={e => onChange('bio', e.target.value)} rows={2} /></div>
                <div><Label className="text-xs text-muted-foreground">Avatar URL</Label><Input value={item.avatar_url || ''} onChange={e => onChange('avatar_url', e.target.value)} /></div>
                <div>
                  <Label className="text-xs text-muted-foreground">Destination</Label>
                  <Select value={item.destination_id || ''} onValueChange={v => onChange('destination_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{destinations.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={item.is_verified ?? false} onCheckedChange={v => onChange('is_verified', v)} />
                  <span className="text-xs">Verified</span>
                  <Switch checked={item.is_active ?? true} onCheckedChange={v => onChange('is_active', v)} />
                  <span className="text-xs">{item.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            )}
            onSave={(item, isNew) => saveTo('hosts', item, isNew)}
          />
        </TabsContent>

        {/* THEMES */}
        <TabsContent value="themes">
          <EntityList
            items={themes}
            entityName="Theme"
            defaultItem={{ name: '', slug: '', emoji: '', description: '', is_active: true, is_public_page: false, display_order: 0 }}
            renderRow={(t: any) => (
              <div className="flex items-center gap-2">
                <span>{t.emoji}</span>
                <span className="font-medium text-sm">{t.name}</span>
                {t.is_public_page && <Badge variant="outline" className="text-[10px]">Public page</Badge>}
              </div>
            )}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                {nameSlugFields(item, onChange)}
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Emoji</Label><Input value={item.emoji || ''} onChange={e => onChange('emoji', e.target.value)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Display Order</Label><Input type="number" value={item.display_order || 0} onChange={e => onChange('display_order', parseInt(e.target.value) || 0)} /></div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={item.description || ''} onChange={e => onChange('description', e.target.value)} rows={2} /></div>
                <div className="flex items-center gap-3">
                  <Switch checked={item.is_public_page ?? false} onCheckedChange={v => onChange('is_public_page', v)} />
                  <span className="text-xs">Public page</span>
                </div>
              </div>
            )}
            onSave={(item, isNew) => saveTo('themes', item, isNew)}
          />
        </TabsContent>

        {/* POIs */}
        <TabsContent value="pois">
          <EntityList
            items={pois}
            entityName="POI"
            defaultItem={{ name: '', slug: '', destination_id: '', poi_type: 'attraction', is_active: true, is_public_page: false }}
            renderRow={(p: any) => (
              <div className="flex items-center gap-2">
                <MapPin className="w-3 h-3 text-muted-foreground" />
                <span className="font-medium text-sm">{p.name}</span>
                <span className="text-xs text-muted-foreground">{p.poi_type}</span>
              </div>
            )}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                {nameSlugFields(item, onChange)}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Destination</Label>
                    <Select value={item.destination_id || ''} onValueChange={v => onChange('destination_id', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{destinations.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <Select value={item.poi_type || 'attraction'} onValueChange={v => onChange('poi_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attraction">Attraction</SelectItem>
                        <SelectItem value="beach">Beach</SelectItem>
                        <SelectItem value="landmark">Landmark</SelectItem>
                        <SelectItem value="natural_site">Natural Site</SelectItem>
                        <SelectItem value="viewpoint">Viewpoint</SelectItem>
                        <SelectItem value="market">Market</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={item.description || ''} onChange={e => onChange('description', e.target.value)} rows={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Latitude</Label><Input type="number" step="any" value={item.latitude || ''} onChange={e => onChange('latitude', parseFloat(e.target.value) || null)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Longitude</Label><Input type="number" step="any" value={item.longitude || ''} onChange={e => onChange('longitude', parseFloat(e.target.value) || null)} /></div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Google Place ID</Label><Input value={item.google_place_id || ''} onChange={e => onChange('google_place_id', e.target.value)} /></div>
                <div className="flex items-center gap-3">
                  <Switch checked={item.is_public_page ?? false} onCheckedChange={v => onChange('is_public_page', v)} />
                  <span className="text-xs">Public page</span>
                </div>
              </div>
            )}
            onSave={(item, isNew) => saveTo('pois', item, isNew)}
          />
        </TabsContent>

        {/* OPTIONS */}
        <TabsContent value="options">
          <EntityList
            items={options}
            entityName="Option"
            defaultItem={{ name: '', slug: '', product_id: '', tier: 'standard', format_type: 'shared', is_active: true }}
            renderRow={(o: any) => (
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{o.name}</span>
                <span className="text-xs text-muted-foreground">{o.tier} · {o.format_type}</span>
                <span className="text-xs text-muted-foreground">{products.find((p: any) => p.id === o.product_id)?.title || ''}</span>
              </div>
            )}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                {nameSlugFields(item, onChange)}
                <div>
                  <Label className="text-xs text-muted-foreground">Product</Label>
                  <Select value={item.product_id || ''} onValueChange={v => onChange('product_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>{products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Tier</Label>
                    <Select value={item.tier || 'standard'} onValueChange={v => onChange('tier', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="luxury">Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Format</Label>
                    <Select value={item.format_type || 'shared'} onValueChange={v => onChange('format_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="shared">Shared</SelectItem>
                        <SelectItem value="group">Group</SelectItem>
                        <SelectItem value="self-guided">Self-guided</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs text-muted-foreground">Duration</Label><Input value={item.duration || ''} onChange={e => onChange('duration', e.target.value)} /></div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={item.description || ''} onChange={e => onChange('description', e.target.value)} rows={2} /></div>
              </div>
            )}
            onSave={(item, isNew) => saveTo('options', item, isNew)}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
};
