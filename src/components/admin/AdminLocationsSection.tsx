/**
 * Locations section — Countries, Destinations, Areas, POIs management.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { AdminEntityTable } from './AdminEntityTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CountryFlagPicker } from './CountryFlagPicker';

const toSlug = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

export const AdminLocationsSection = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: countries = [], isLoading: loadingCountries } = useQuery({
    queryKey: ['admin-countries-full'],
    queryFn: async () => { const { data } = await supabase.from('countries').select('*').order('name'); return data || []; },
  });
  const { data: destinations = [], isLoading: loadingDest } = useQuery({
    queryKey: ['admin-dest-full'],
    queryFn: async () => { const { data } = await supabase.from('destinations').select('*').order('display_order'); return data || []; },
  });
  const { data: areas = [], isLoading: loadingAreas } = useQuery({
    queryKey: ['admin-areas-full'],
    queryFn: async () => { const { data } = await supabase.from('areas').select('*').order('name'); return data || []; },
  });
  const { data: pois = [], isLoading: loadingPois } = useQuery({
    queryKey: ['admin-pois-full'],
    queryFn: async () => { const { data } = await supabase.from('pois').select('*').order('name'); return data || []; },
  });

  const invalidate = () => {
    ['admin-countries-full', 'admin-dest-full', 'admin-areas-full', 'admin-pois-full', 'admin-overview-counts', 'destinations'].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
  };

  const saveEntity = async (table: string, item: any, isNew: boolean) => {
    const { id, created_at, updated_at, ...rest } = item;
    if (isNew) {
      const { error } = await (supabase as any).from(table).insert(rest);
      if (error) throw error;
    } else {
      const { error } = await (supabase as any).from(table).update(rest).eq('id', id);
      if (error) throw error;
    }
    invalidate();
    toast({ title: isNew ? 'Created' : 'Saved' });
  };

  const deleteEntity = async (table: string, ids: string[]) => {
    for (const id of ids) await (supabase as any).from(table).delete().eq('id', id);
    invalidate();
    toast({ title: `Deleted ${ids.length} item(s)` });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Locations</h2>
      <p className="text-sm text-muted-foreground mb-4">Countries, Destinations, Areas, and Points of Interest</p>

      <Tabs defaultValue="countries">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="countries">Countries ({countries.length})</TabsTrigger>
          <TabsTrigger value="destinations">Destinations ({destinations.length})</TabsTrigger>
          <TabsTrigger value="areas">Areas ({areas.length})</TabsTrigger>
          <TabsTrigger value="pois">POIs ({pois.length})</TabsTrigger>
        </TabsList>

        {/* ── Countries ── */}
        <TabsContent value="countries">
          <AdminEntityTable
            items={countries}
            entityName="Country"
            isLoading={loadingCountries}
            columns={[
              { key: 'name', label: 'Name', width: 'flex-[2]', render: (c: any) => (
                <div className="flex items-center gap-2">
                  {c.flag_svg_url && <img src={c.flag_svg_url} className="w-5 h-5 rounded-full" alt="" />}
                  <span className="font-medium">{c.name}</span>
                  {c.iso_code && <span className="text-xs text-muted-foreground uppercase">({c.iso_code})</span>}
                </div>
              )},
              { key: 'iso_code', label: 'ISO', width: 'w-[60px]', render: (c: any) => <span className="text-xs font-mono text-muted-foreground uppercase">{c.iso_code}</span> },
              { key: 'is_active', label: 'Status', width: 'w-[80px]', render: (c: any) => <Badge variant={c.is_active ? 'default' : 'secondary'} className="text-[10px]">{c.is_active ? 'Active' : 'Off'}</Badge> },
            ]}
            defaultItem={{ name: '', iso_code: '', flag_svg_url: '', flag_emoji: '', is_active: true }}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={item.name || ''} onChange={e => onChange('name', e.target.value)} /></div>
                  <div><Label className="text-xs text-muted-foreground">ISO Code (2-letter)</Label><Input value={item.iso_code || ''} onChange={e => onChange('iso_code', e.target.value.toUpperCase().slice(0, 2))} maxLength={2} className="font-mono uppercase" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Country Flag</Label>
                    <CountryFlagPicker
                      value={item.flag_svg_url || ''}
                      onSelect={(url, emoji) => { onChange('flag_svg_url', url); onChange('flag_emoji', emoji); }}
                    />
                  </div>
                  <div><Label className="text-xs text-muted-foreground">Flag Emoji</Label><Input value={item.flag_emoji || ''} readOnly className="bg-muted/50" /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={item.is_active ?? true} onCheckedChange={v => onChange('is_active', v)} />
                  <span className="text-xs">{item.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            )}
            onSave={(item, isNew) => saveEntity('countries', item, isNew)}
            onDelete={(ids) => deleteEntity('countries', ids)}
          />
        </TabsContent>

        {/* ── Destinations ── */}
        <TabsContent value="destinations">
          <AdminEntityTable
            items={destinations}
            entityName="Destination"
            isLoading={loadingDest}
            columns={[
              { key: 'name', label: 'Name', width: 'flex-[2]', render: (d: any) => (
                <div className="flex items-center gap-2">
                  {d.flag_svg_url && <img src={d.flag_svg_url} className="w-4 h-4 rounded-full" alt="" />}
                  <span className="font-medium">{d.name}</span>
                </div>
              )},
              { key: 'country_id', label: 'Country', width: 'flex-1', render: (d: any) => {
                const c = countries.find((x: any) => x.id === d.country_id);
                return c ? (
                  <div className="flex items-center gap-1.5">
                    {c.flag_svg_url && <img src={c.flag_svg_url} className="w-3.5 h-3.5 rounded-full" alt="" />}
                    <span className="text-xs">{c.name}</span>
                  </div>
                ) : <span className="text-xs text-muted-foreground">—</span>;
              }},
              { key: 'slug', label: 'Slug', width: 'flex-1', render: (d: any) => <span className="text-xs font-mono text-muted-foreground">{d.slug}</span> },
              { key: 'is_active', label: 'Status', width: 'w-[80px]', render: (d: any) => <Badge variant={d.is_active ? 'default' : 'secondary'} className="text-[10px]">{d.is_active ? 'Active' : 'Off'}</Badge> },
            ]}
            defaultItem={{ name: '', slug: '', description: '', cover_image: '', is_active: true, display_order: 0, country_id: '' }}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={item.name || ''} onChange={e => { onChange('name', e.target.value); if (!item.id) onChange('slug', toSlug(e.target.value)); }} /></div>
                  <div><Label className="text-xs text-muted-foreground">Slug</Label><Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} className="font-mono text-xs" /></div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Country</Label>
                  <Select value={item.country_id || ''} onValueChange={v => onChange('country_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent>
                      {countries.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          <div className="flex items-center gap-2">
                            {c.flag_svg_url && <img src={c.flag_svg_url} className="w-4 h-4 rounded-full" alt="" />}
                            <span>{c.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={item.description || ''} onChange={e => onChange('description', e.target.value)} rows={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Country Flag</Label>
                    <CountryFlagPicker
                      value={item.flag_svg_url || ''}
                      onSelect={(url, emoji) => { onChange('flag_svg_url', url); onChange('flag_emoji', emoji); }}
                    />
                  </div>
                  <div><Label className="text-xs text-muted-foreground">Flag Emoji</Label><Input value={item.flag_emoji || ''} readOnly className="bg-muted/50" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Cover Image</Label><Input value={item.cover_image || ''} onChange={e => onChange('cover_image', e.target.value)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Latitude</Label><Input type="number" step="any" value={item.latitude || ''} onChange={e => onChange('latitude', parseFloat(e.target.value) || null)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Longitude</Label><Input type="number" step="any" value={item.longitude || ''} onChange={e => onChange('longitude', parseFloat(e.target.value) || null)} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={item.is_active ?? true} onCheckedChange={v => onChange('is_active', v)} />
                  <span className="text-xs">{item.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            )}
            onSave={(item, isNew) => saveEntity('destinations', item, isNew)}
            onDelete={(ids) => deleteEntity('destinations', ids)}
          />
        </TabsContent>

        {/* ── Areas ── */}
        <TabsContent value="areas">
          <AdminEntityTable
            items={areas}
            entityName="Area"
            isLoading={loadingAreas}
            columns={[
              { key: 'name', label: 'Name', width: 'flex-[2]', render: (a: any) => <span className="font-medium">{a.name}</span> },
              { key: 'destination_id', label: 'Destination', width: 'flex-1', render: (a: any) => {
                const d = destinations.find((x: any) => x.id === a.destination_id);
                return d ? <Badge variant="outline" className="text-[10px]">{d.name}</Badge> : <span className="text-xs text-destructive">—</span>;
              }},
              { key: 'is_active', label: 'Status', width: 'w-[80px]', render: (a: any) => <Badge variant={a.is_active ? 'default' : 'secondary'} className="text-[10px]">{a.is_active ? 'Active' : 'Off'}</Badge> },
            ]}
            defaultItem={{ name: '', slug: '', destination_id: '', description: '', is_active: true }}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={item.name || ''} onChange={e => { onChange('name', e.target.value); if (!item.id) onChange('slug', toSlug(e.target.value)); }} /></div>
                  <div><Label className="text-xs text-muted-foreground">Slug</Label><Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} className="font-mono text-xs" /></div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Destination</Label>
                  <Select value={item.destination_id || ''} onValueChange={v => onChange('destination_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{destinations.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={item.description || ''} onChange={e => onChange('description', e.target.value)} rows={2} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Cover Image</Label><Input value={item.cover_image || ''} onChange={e => onChange('cover_image', e.target.value)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Latitude</Label><Input type="number" step="any" value={item.latitude || ''} onChange={e => onChange('latitude', parseFloat(e.target.value) || null)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Longitude</Label><Input type="number" step="any" value={item.longitude || ''} onChange={e => onChange('longitude', parseFloat(e.target.value) || null)} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={item.is_active ?? true} onCheckedChange={v => onChange('is_active', v)} />
                  <span className="text-xs">{item.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            )}
            onSave={(item, isNew) => saveEntity('areas', item, isNew)}
            onDelete={(ids) => deleteEntity('areas', ids)}
          />
        </TabsContent>

        {/* ── POIs ── */}
        <TabsContent value="pois">
          <AdminEntityTable
            items={pois}
            entityName="POI"
            isLoading={loadingPois}
            columns={[
              { key: 'name', label: 'Name', width: 'flex-[2]', render: (p: any) => <span className="font-medium">{p.name}</span> },
              { key: 'poi_type', label: 'Type', width: 'w-[100px]', render: (p: any) => <Badge variant="outline" className="text-[10px]">{p.poi_type}</Badge> },
              { key: 'destination_id', label: 'Destination', width: 'flex-1', render: (p: any) => {
                const d = destinations.find((x: any) => x.id === p.destination_id);
                return d ? <span className="text-xs">{d.name}</span> : <span className="text-xs text-muted-foreground">—</span>;
              }},
            ]}
            defaultItem={{ name: '', slug: '', destination_id: '', poi_type: 'attraction', is_active: true }}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={item.name || ''} onChange={e => { onChange('name', e.target.value); if (!item.id) onChange('slug', toSlug(e.target.value)); }} /></div>
                  <div><Label className="text-xs text-muted-foreground">Slug</Label><Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} className="font-mono text-xs" /></div>
                </div>
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
                        {['attraction', 'beach', 'landmark', 'natural_site', 'nature', 'marine', 'island', 'viewpoint', 'market', 'restaurant', 'hotel'].map(t =>
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={item.description || ''} onChange={e => onChange('description', e.target.value)} rows={2} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Cover Image</Label><Input value={item.cover_image || ''} onChange={e => onChange('cover_image', e.target.value)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Latitude</Label><Input type="number" step="any" value={item.latitude || ''} onChange={e => onChange('latitude', parseFloat(e.target.value) || null)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Longitude</Label><Input type="number" step="any" value={item.longitude || ''} onChange={e => onChange('longitude', parseFloat(e.target.value) || null)} /></div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Google Place ID</Label><Input value={item.google_place_id || ''} onChange={e => onChange('google_place_id', e.target.value)} /></div>
              </div>
            )}
            onSave={(item, isNew) => saveEntity('pois', item, isNew)}
            onDelete={(ids) => deleteEntity('pois', ids)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
