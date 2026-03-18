/**
 * Locations section — Countries, Destinations, Areas, POIs + World Model overlays.
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
import { Slider } from '@/components/ui/slider';

const toSlug = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

const CONTINENTS = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Antarctica'];
const REGIONS = [
  'East Africa', 'West Africa', 'North Africa', 'Southern Africa', 'Central Africa',
  'Caribbean', 'Central America', 'Northern Europe', 'Western Europe', 'Southern Europe', 'Eastern Europe',
  'South Asia', 'Southeast Asia', 'East Asia', 'Central Asia', 'Middle East',
  'Oceania', 'South America',
];
const CURRENCIES = [
  'TZS', 'KES', 'UGX', 'RWF', 'ETB', 'EGP', 'GHS', 'NGN', 'ZAR', 'JMD',
  'GBP', 'USD', 'EUR', 'CAD', 'AUD', 'INR', 'AED', 'SAR', 'JPY', 'CNY', 'BRL', 'MXN', 'THB',
];
const LANGUAGES = [
  'English', 'Swahili', 'French', 'Arabic', 'Amharic', 'Portuguese', 'Spanish',
  'Kinyarwanda', 'Yoruba', 'Hausa', 'Zulu', 'Afrikaans', 'Mandarin', 'Hindi',
];
const TIMEZONES = [
  'Africa/Dar_es_Salaam', 'Africa/Nairobi', 'Africa/Kampala', 'Africa/Kigali',
  'Africa/Addis_Ababa', 'Africa/Cairo', 'Africa/Accra', 'Africa/Lagos',
  'Africa/Johannesburg', 'Africa/Cape_Town',
  'America/Kingston', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland',
];
const BEST_TIME_OPTIONS = [
  { value: 'year_round', label: 'Year Round' },
  { value: 'jan_mar', label: 'Jan – Mar' },
  { value: 'apr_jun', label: 'Apr – Jun' },
  { value: 'jul_sep', label: 'Jul – Sep' },
  { value: 'oct_dec', label: 'Oct – Dec' },
  { value: 'jan_feb', label: 'Jan – Feb' },
  { value: 'mar_may', label: 'Mar – May' },
  { value: 'jun_aug', label: 'Jun – Aug' },
  { value: 'sep_nov', label: 'Sep – Nov' },
  { value: 'dec_feb', label: 'Dec – Feb' },
  { value: 'jun_oct', label: 'Jun – Oct' },
];

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
  const { data: semanticProfiles = [], isLoading: loadingSemantic } = useQuery({
    queryKey: ['admin-semantic-profiles'],
    queryFn: async () => { const { data } = await supabase.from('semantic_place_profiles').select('*').order('entity_type'); return data || []; },
  });
  const { data: seasonalityProfiles = [], isLoading: loadingSeasonality } = useQuery({
    queryKey: ['admin-seasonality-profiles'],
    queryFn: async () => { const { data } = await supabase.from('seasonality_profiles').select('*').order('entity_type'); return data || []; },
  });
  const { data: weatherSnapshots = [], isLoading: loadingWeather } = useQuery({
    queryKey: ['admin-weather-snapshots'],
    queryFn: async () => { const { data } = await supabase.from('weather_snapshots').select('*').order('created_at', { ascending: false }).limit(100); return data || []; },
  });
  const { data: geoShapes = [], isLoading: loadingGeoShapes } = useQuery({
    queryKey: ['admin-geo-shapes'],
    queryFn: async () => { const { data } = await supabase.from('geo_shapes').select('*').order('entity_type'); return data || []; },
  });
  const { data: placeRels = [], isLoading: loadingPlaceRels } = useQuery({
    queryKey: ['admin-place-relationships'],
    queryFn: async () => { const { data } = await supabase.from('place_relationships').select('*').order('source_type'); return data || []; },
  });
  const { data: travelEdges = [], isLoading: loadingTravelEdges } = useQuery({
    queryKey: ['admin-travel-edges'],
    queryFn: async () => { const { data } = await supabase.from('travel_time_edges').select('*').order('origin_type'); return data || []; },
  });

  const invalidate = () => {
    ['admin-countries-full', 'admin-dest-full', 'admin-areas-full', 'admin-pois-full', 'admin-semantic-profiles', 'admin-seasonality-profiles', 'admin-weather-snapshots', 'admin-geo-shapes', 'admin-place-relationships', 'admin-travel-edges', 'admin-overview-counts', 'destinations'].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
  };

  const saveEntity = async (table: string, item: any, isNew: boolean) => {
    const { id, created_at, updated_at, ...rest } = item;
    // Clear __inherit sentinel values
    if (rest.currency_code === '__inherit') rest.currency_code = null;
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

  const bulkUpdateEntity = async (table: string, ids: string[], field: string, value: any) => {
    const { error } = await (supabase as any).from(table).update({ [field]: value }).in('id', ids);
    if (error) { toast({ title: 'Bulk update failed', description: error.message, variant: 'destructive' }); return; }
    invalidate();
    toast({ title: `Updated ${ids.length} item(s)`, description: `Set ${field} → ${String(value)}` });
  };

  // Helper to find entity name for display
  const entityName = (type: string, id: string) => {
    if (type === 'destination') return destinations.find((d: any) => d.id === id)?.name || id;
    if (type === 'area') return areas.find((a: any) => a.id === id)?.name || id;
    if (type === 'poi') return pois.find((p: any) => p.id === id)?.name || id;
    if (type === 'country') return countries.find((c: any) => c.id === id)?.name || id;
    return id;
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Locations & World Model</h2>
      <p className="text-sm text-muted-foreground mb-4">Countries, Destinations, Areas, POIs, and overlay data</p>

      <Tabs defaultValue="countries">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="countries">Countries ({countries.length})</TabsTrigger>
          <TabsTrigger value="destinations">Destinations ({destinations.length})</TabsTrigger>
          <TabsTrigger value="areas">Areas ({areas.length})</TabsTrigger>
          <TabsTrigger value="pois">POIs ({pois.length})</TabsTrigger>
          <TabsTrigger value="relationships">Relationships ({placeRels.length})</TabsTrigger>
          <TabsTrigger value="travel">Travel ({travelEdges.length})</TabsTrigger>
          <TabsTrigger value="geo">Geo Shapes ({geoShapes.length})</TabsTrigger>
          <TabsTrigger value="semantic">Semantic ({semanticProfiles.length})</TabsTrigger>
          <TabsTrigger value="seasonality">Seasonality ({seasonalityProfiles.length})</TabsTrigger>
          <TabsTrigger value="weather">Weather ({weatherSnapshots.length})</TabsTrigger>
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
                  {c.iso_alpha2 && <span className="text-xs text-muted-foreground uppercase">({c.iso_alpha2})</span>}
                </div>
              )},
              { key: 'continent', label: 'Continent', width: 'w-[100px]', render: (c: any) => <span className="text-xs text-muted-foreground">{c.continent || '—'}</span> },
              { key: 'is_active', label: 'Status', width: 'w-[80px]', render: (c: any) => <Badge variant={c.is_active ? 'default' : 'secondary'} className="text-[10px]">{c.is_active ? 'Active' : 'Off'}</Badge> },
            ]}
            defaultItem={{ name: '', slug: '', iso_code: '', iso_alpha2: '', flag_svg_url: '', is_active: true }}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={item.name || ''} onChange={e => { onChange('name', e.target.value); if (!item.id) { onChange('slug', toSlug(e.target.value)); } }} /></div>
                  <div><Label className="text-xs text-muted-foreground">Slug</Label><Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} className="font-mono text-xs" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs text-muted-foreground">ISO Alpha-2</Label><Input value={item.iso_alpha2 || item.iso_code || ''} onChange={e => { onChange('iso_alpha2', e.target.value.toUpperCase().slice(0, 2)); onChange('iso_code', e.target.value.toUpperCase().slice(0, 2)); }} maxLength={2} className="font-mono uppercase" /></div>
                  <div><Label className="text-xs text-muted-foreground">ISO Alpha-3</Label><Input value={item.iso_alpha3 || ''} onChange={e => onChange('iso_alpha3', e.target.value.toUpperCase().slice(0, 3))} maxLength={3} className="font-mono uppercase" /></div>
                  <div><Label className="text-xs text-muted-foreground">ISO Numeric</Label><Input value={item.iso_numeric || ''} onChange={e => onChange('iso_numeric', e.target.value)} /></div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Country Flag</Label>
                  <CountryFlagPicker
                    value={item.flag_svg_url || ''}
                    onSelect={(url, _emoji) => { onChange('flag_svg_url', url); }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Continent</Label>
                    <Select value={item.continent || ''} onValueChange={v => onChange('continent', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{CONTINENTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Region</Label>
                    <Select value={item.region || ''} onValueChange={v => onChange('region', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Currency</Label>
                    <Select value={item.currency_code || ''} onValueChange={v => onChange('currency_code', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Default Language</Label>
                    <Select value={item.default_language || ''} onValueChange={v => onChange('default_language', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs text-muted-foreground">Calling Code</Label><Input value={item.calling_code || ''} onChange={e => onChange('calling_code', e.target.value)} placeholder="+255" /></div>
                  <div><Label className="text-xs text-muted-foreground">TLD</Label><Input value={item.tld || ''} onChange={e => onChange('tld', e.target.value)} placeholder=".tz" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Population</Label><Input type="number" value={item.population || ''} onChange={e => onChange('population', parseInt(e.target.value) || null)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Area (sq km)</Label><Input type="number" value={item.area_sq_km || ''} onChange={e => onChange('area_sq_km', parseFloat(e.target.value) || null)} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={item.is_active ?? true} onCheckedChange={v => onChange('is_active', v)} />
                  <span className="text-xs">{item.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            )}
            onSave={(item, isNew) => saveEntity('countries', item, isNew)}
            onDelete={(ids) => deleteEntity('countries', ids)}
            onBulkUpdate={(ids, field, value) => bulkUpdateEntity('countries', ids, field, value)}
            bulkFields={[
              { key: 'is_active', label: 'Active', type: 'boolean' },
              { key: 'continent', label: 'Continent', type: 'select', options: CONTINENTS.map(c => ({ value: c, label: c })) },
              { key: 'region', label: 'Region', type: 'select', options: REGIONS.map(r => ({ value: r, label: r })) },
              { key: 'currency_code', label: 'Currency', type: 'select', options: CURRENCIES.map(c => ({ value: c, label: c })) },
              { key: 'default_language', label: 'Language', type: 'select', options: LANGUAGES.map(l => ({ value: l, label: l })) },
            ]}
          />
        </TabsContent>

        {/* ── Destinations ── */}
        <TabsContent value="destinations">
          <AdminEntityTable
            items={destinations}
            entityName="Destination"
            isLoading={loadingDest}
            columns={[
              { key: 'name', label: 'Name', width: 'flex-[2]', render: (d: any) => {
                const c = countries.find((x: any) => x.id === d.country_id);
                const flag = c?.flag_svg_url || d.flag_svg_url;
                return (
                <div className="flex items-center gap-2">
                  {flag && <img src={flag} className="w-4 h-4 rounded-full" alt="" />}
                  <span className="font-medium">{d.name}</span>
                  {d.short_name && <span className="text-xs text-muted-foreground">({d.short_name})</span>}
                  <Badge variant="outline" className="text-[9px]">{d.destination_type}</Badge>
                </div>
              );}},
              { key: 'country_id', label: 'Country', width: 'flex-1', render: (d: any) => {
                const c = countries.find((x: any) => x.id === d.country_id);
                return c ? (
                  <div className="flex items-center gap-1.5">
                    {c.flag_svg_url && <img src={c.flag_svg_url} className="w-3.5 h-3.5 rounded-full" alt="" />}
                    <span className="text-xs">{c.name}</span>
                  </div>
                ) : <span className="text-xs text-muted-foreground">—</span>;
              }},
              { key: 'launch_status', label: 'Launch', width: 'w-[80px]', render: (d: any) => <Badge variant={d.launch_status === 'live' ? 'default' : 'secondary'} className="text-[10px]">{d.launch_status || 'planned'}</Badge> },
            ]}
            defaultItem={{ name: '', slug: '', description: '', short_description: '', cover_image: '', is_active: true, display_order: 0, country_id: '', destination_type: 'city', launch_status: 'planned' }}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={item.name || ''} onChange={e => { onChange('name', e.target.value); if (!item.id) onChange('slug', toSlug(e.target.value)); }} /></div>
                  <div><Label className="text-xs text-muted-foreground">Slug</Label><Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} className="font-mono text-xs" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                  <div>
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <Select value={item.destination_type || 'city'} onValueChange={v => onChange('destination_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['city', 'island', 'region', 'national_park', 'coastal_zone'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Short Name (for picker)</Label><Input value={item.short_name || ''} onChange={e => onChange('short_name', e.target.value)} placeholder="e.g. Dar" /></div>
                <div><Label className="text-xs text-muted-foreground">Short Description</Label><Textarea value={item.short_description || item.description || ''} onChange={e => { onChange('short_description', e.target.value); onChange('description', e.target.value); }} rows={2} /></div>
                <div><Label className="text-xs text-muted-foreground">Long Description</Label><Textarea value={item.long_description || ''} onChange={e => onChange('long_description', e.target.value)} rows={3} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Hero Image URL</Label><Input value={item.hero_image_url || item.cover_image || ''} onChange={e => { onChange('hero_image_url', e.target.value); onChange('cover_image', e.target.value); }} /></div>
                  <div><Label className="text-xs text-muted-foreground">Latitude</Label><Input type="number" step="any" value={item.latitude || ''} onChange={e => onChange('latitude', parseFloat(e.target.value) || null)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Longitude</Label><Input type="number" step="any" value={item.longitude || ''} onChange={e => onChange('longitude', parseFloat(e.target.value) || null)} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Timezone</Label>
                    <Select value={item.timezone || ''} onValueChange={v => onChange('timezone', v)}>
                      <SelectTrigger><SelectValue placeholder="Select timezone" /></SelectTrigger>
                      <SelectContent>{TIMEZONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Currency (override)</Label>
                    <Select value={item.currency_code || ''} onValueChange={v => onChange('currency_code', v)}>
                      <SelectTrigger><SelectValue placeholder={(() => { const c = countries.find((x: any) => x.id === item.country_id); return c?.currency_code ? `Inherit: ${c.currency_code}` : 'Select'; })()} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__inherit">Inherit from country</SelectItem>
                        {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs text-muted-foreground">IATA Code</Label><Input value={item.iata_code || ''} onChange={e => onChange('iata_code', e.target.value.toUpperCase())} maxLength={3} className="font-mono uppercase" /></div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Readiness Score</Label><Input type="number" min={0} max={100} value={item.readiness_score || ''} onChange={e => onChange('readiness_score', parseFloat(e.target.value) || null)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Launch Status</Label>
                    <Select value={item.launch_status || 'planned'} onValueChange={v => onChange('launch_status', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['planned', 'soft_live', 'live', 'paused', 'retired'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs text-muted-foreground">Launch Date</Label><Input type="date" value={item.launch_date || ''} onChange={e => onChange('launch_date', e.target.value || null)} /></div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Best Time to Visit</Label>
                  <Select value={item.best_time_to_visit_text || ''} onValueChange={v => onChange('best_time_to_visit_text', v)}>
                    <SelectTrigger><SelectValue placeholder="Select season" /></SelectTrigger>
                    <SelectContent>{BEST_TIME_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2"><Switch checked={item.is_active ?? true} onCheckedChange={v => onChange('is_active', v)} /><span className="text-xs">{item.is_active ? 'Active' : 'Inactive'}</span></div>
                  <div className="flex items-center gap-2"><Switch checked={item.is_marketplace_enabled ?? false} onCheckedChange={v => onChange('is_marketplace_enabled', v)} /><span className="text-xs">Marketplace</span></div>
                  <div className="flex items-center gap-2"><Switch checked={item.is_partner_feed_enabled ?? false} onCheckedChange={v => onChange('is_partner_feed_enabled', v)} /><span className="text-xs">Partner Feed</span></div>
                </div>
              </div>
            )}
            onSave={(item, isNew) => saveEntity('destinations', item, isNew)}
            onDelete={(ids) => deleteEntity('destinations', ids)}
            onBulkUpdate={(ids, field, value) => bulkUpdateEntity('destinations', ids, field, value)}
            bulkFields={[
              { key: 'is_active', label: 'Active', type: 'boolean' },
              { key: 'launch_status', label: 'Launch Status', type: 'select', options: [
                { value: 'planned', label: 'Planned' }, { value: 'soft_live', label: 'Soft Live' },
                { value: 'live', label: 'Live' }, { value: 'paused', label: 'Paused' }, { value: 'retired', label: 'Retired' },
              ]},
              { key: 'destination_type', label: 'Type', type: 'select', options: [
                { value: 'city', label: 'City' }, { value: 'island', label: 'Island' },
                { value: 'region', label: 'Region' }, { value: 'national_park', label: 'National Park' }, { value: 'coastal_zone', label: 'Coastal Zone' },
              ]},
              { key: 'currency_code', label: 'Currency', type: 'select', options: CURRENCIES.map(c => ({ value: c, label: c })) },
              { key: 'timezone', label: 'Timezone', type: 'select', options: TIMEZONES.map(t => ({ value: t, label: t })) },
              { key: 'best_time_to_visit_text', label: 'Best Time', type: 'select', options: BEST_TIME_OPTIONS },
              { key: 'is_marketplace_enabled', label: 'Marketplace', type: 'boolean' },
              { key: 'is_partner_feed_enabled', label: 'Partner Feed', type: 'boolean' },
              { key: 'readiness_score', label: 'Readiness Score', type: 'number' },
              { key: 'launch_date', label: 'Launch Date', type: 'text' },
            ]}
          />
        </TabsContent>

        {/* ── Areas ── */}
        <TabsContent value="areas">
          <AdminEntityTable
            items={areas}
            entityName="Area"
            isLoading={loadingAreas}
            columns={[
              { key: 'name', label: 'Name', width: 'flex-[2]', render: (a: any) => (
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.name}</span>
                  <Badge variant="outline" className="text-[9px]">{a.area_type}</Badge>
                </div>
              )},
              { key: 'destination_id', label: 'Destination', width: 'flex-1', render: (a: any) => {
                const d = destinations.find((x: any) => x.id === a.destination_id);
                return d ? <Badge variant="outline" className="text-[10px]">{d.name}</Badge> : <span className="text-xs text-destructive">—</span>;
              }},
              { key: 'visibility_state', label: 'State', width: 'w-[80px]', render: (a: any) => <Badge variant={a.visibility_state === 'live' ? 'default' : 'secondary'} className="text-[10px]">{a.visibility_state || 'draft'}</Badge> },
            ]}
            defaultItem={{ name: '', slug: '', destination_id: '', description: '', area_type: 'neighbourhood', is_active: true, visibility_state: 'draft' }}
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
                    <Select value={item.area_type || 'neighbourhood'} onValueChange={v => onChange('area_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['neighbourhood', 'town', 'village', 'district', 'beach_zone', 'coastal_strip'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Short Description</Label><Textarea value={item.short_description || item.description || ''} onChange={e => { onChange('short_description', e.target.value); onChange('description', e.target.value); }} rows={2} /></div>
                <div><Label className="text-xs text-muted-foreground">Vibe Description</Label><Textarea value={item.vibe_description || ''} onChange={e => onChange('vibe_description', e.target.value)} rows={2} placeholder="Chill, bohemian, local market vibes..." /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Cover Image</Label><Input value={item.cover_image || ''} onChange={e => onChange('cover_image', e.target.value)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Latitude</Label><Input type="number" step="any" value={item.latitude || ''} onChange={e => onChange('latitude', parseFloat(e.target.value) || null)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Longitude</Label><Input type="number" step="any" value={item.longitude || ''} onChange={e => onChange('longitude', parseFloat(e.target.value) || null)} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Safety Score</Label><Input type="number" min={0} max={100} value={item.safety_score || ''} onChange={e => onChange('safety_score', parseFloat(e.target.value) || null)} /></div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Visibility</Label>
                    <Select value={item.visibility_state || 'draft'} onValueChange={v => onChange('visibility_state', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{['draft', 'soft_live', 'live', 'archived'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs text-muted-foreground">Readiness</Label><Input type="number" min={0} max={100} value={item.readiness_score || ''} onChange={e => onChange('readiness_score', parseFloat(e.target.value) || null)} /></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2"><Switch checked={item.is_active ?? true} onCheckedChange={v => onChange('is_active', v)} /><span className="text-xs">{item.is_active ? 'Active' : 'Inactive'}</span></div>
                  <div className="flex items-center gap-2"><Switch checked={item.is_marketplace_enabled ?? false} onCheckedChange={v => onChange('is_marketplace_enabled', v)} /><span className="text-xs">Marketplace</span></div>
                  <div className="flex items-center gap-2"><Switch checked={item.is_partner_feed_enabled ?? false} onCheckedChange={v => onChange('is_partner_feed_enabled', v)} /><span className="text-xs">Partner Feed</span></div>
                </div>
              </div>
            )}
            onSave={(item, isNew) => saveEntity('areas', item, isNew)}
            onDelete={(ids) => deleteEntity('areas', ids)}
            onBulkUpdate={(ids, field, value) => bulkUpdateEntity('areas', ids, field, value)}
            bulkFields={[
              { key: 'is_active', label: 'Active', type: 'boolean' },
              { key: 'area_type', label: 'Type', type: 'select', options: [
                { value: 'neighbourhood', label: 'Neighbourhood' }, { value: 'town', label: 'Town' },
                { value: 'village', label: 'Village' }, { value: 'district', label: 'District' },
                { value: 'beach_zone', label: 'Beach Zone' }, { value: 'coastal_strip', label: 'Coastal Strip' },
              ]},
              { key: 'visibility_state', label: 'Visibility', type: 'select', options: [
                { value: 'draft', label: 'Draft' }, { value: 'soft_live', label: 'Soft Live' },
                { value: 'live', label: 'Live' }, { value: 'archived', label: 'Archived' },
              ]},
              { key: 'is_marketplace_enabled', label: 'Marketplace', type: 'boolean' },
              { key: 'is_partner_feed_enabled', label: 'Partner Feed', type: 'boolean' },
              { key: 'readiness_score', label: 'Readiness Score', type: 'number' },
              { key: 'safety_score', label: 'Safety Score', type: 'number' },
            ]}
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
            defaultItem={{ name: '', slug: '', destination_id: '', poi_type: 'attraction', is_active: true, visibility_state: 'draft' }}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={item.name || ''} onChange={e => { onChange('name', e.target.value); if (!item.id) onChange('slug', toSlug(e.target.value)); }} /></div>
                  <div><Label className="text-xs text-muted-foreground">Slug</Label><Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} className="font-mono text-xs" /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Destination</Label>
                    <Select value={item.destination_id || ''} onValueChange={v => onChange('destination_id', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{destinations.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Area (optional)</Label>
                    <Select value={item.area_id || '__none'} onValueChange={v => onChange('area_id', v === '__none' ? null : v)}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">None</SelectItem>
                        {areas.filter((a: any) => !item.destination_id || a.destination_id === item.destination_id).map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Type</Label>
                    <Select value={item.poi_type || 'attraction'} onValueChange={v => onChange('poi_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['attraction', 'beach', 'landmark', 'natural_site', 'nature', 'marine', 'island', 'viewpoint', 'market', 'restaurant', 'hotel', 'bar', 'club', 'temple', 'museum', 'park'].map(t =>
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Short Description</Label><Textarea value={item.short_description || item.description || ''} onChange={e => { onChange('short_description', e.target.value); onChange('description', e.target.value); }} rows={2} /></div>
                <div><Label className="text-xs text-muted-foreground">Long Description</Label><Textarea value={item.long_description || ''} onChange={e => onChange('long_description', e.target.value)} rows={3} /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Cover Image</Label><Input value={item.cover_image || ''} onChange={e => onChange('cover_image', e.target.value)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Latitude</Label><Input type="number" step="any" value={item.latitude || ''} onChange={e => onChange('latitude', parseFloat(e.target.value) || null)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Longitude</Label><Input type="number" step="any" value={item.longitude || ''} onChange={e => onChange('longitude', parseFloat(e.target.value) || null)} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Address</Label><Input value={item.address_text || ''} onChange={e => onChange('address_text', e.target.value)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Website</Label><Input value={item.website_url || ''} onChange={e => onChange('website_url', e.target.value)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Phone</Label><Input value={item.phone || ''} onChange={e => onChange('phone', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Price Level (1-4)</Label><Input type="number" min={1} max={4} value={item.price_level || ''} onChange={e => onChange('price_level', parseInt(e.target.value) || null)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Google Place ID</Label><Input value={item.google_place_id || ''} onChange={e => onChange('google_place_id', e.target.value)} className="font-mono text-xs" /></div>
                  <div><Label className="text-xs text-muted-foreground">Wikidata ID</Label><Input value={item.wikidata_id || ''} onChange={e => onChange('wikidata_id', e.target.value)} className="font-mono text-xs" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Visibility</Label>
                    <Select value={item.visibility_state || 'draft'} onValueChange={v => onChange('visibility_state', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{['draft', 'soft_live', 'live', 'archived'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs text-muted-foreground">Readiness</Label><Input type="number" min={0} max={100} value={item.readiness_score || ''} onChange={e => onChange('readiness_score', parseFloat(e.target.value) || null)} /></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2"><Switch checked={item.is_active ?? true} onCheckedChange={v => onChange('is_active', v)} /><span className="text-xs">{item.is_active ? 'Active' : 'Inactive'}</span></div>
                  <div className="flex items-center gap-2"><Switch checked={item.is_public_page ?? false} onCheckedChange={v => onChange('is_public_page', v)} /><span className="text-xs">Public Page</span></div>
                </div>
              </div>
            )}
            onSave={(item, isNew) => saveEntity('pois', item, isNew)}
            onDelete={(ids) => deleteEntity('pois', ids)}
            onBulkUpdate={(ids, field, value) => bulkUpdateEntity('pois', ids, field, value)}
            bulkFields={[
              { key: 'is_active', label: 'Active', type: 'boolean' },
              { key: 'poi_type', label: 'Type', type: 'select', options: [
                { value: 'restaurant', label: 'Restaurant' }, { value: 'bar', label: 'Bar' },
                { value: 'hotel', label: 'Hotel' }, { value: 'attraction', label: 'Attraction' },
                { value: 'shop', label: 'Shop' }, { value: 'beach', label: 'Beach' },
                { value: 'activity', label: 'Activity' }, { value: 'other', label: 'Other' },
              ]},
              { key: 'visibility_state', label: 'Visibility', type: 'select', options: [
                { value: 'draft', label: 'Draft' }, { value: 'soft_live', label: 'Soft Live' },
                { value: 'live', label: 'Live' }, { value: 'archived', label: 'Archived' },
              ]},
              { key: 'is_public_page', label: 'Public Page', type: 'boolean' },
              { key: 'readiness_score', label: 'Readiness Score', type: 'number' },
              { key: 'price_level', label: 'Price Level', type: 'number' },
            ]}
          />
        </TabsContent>

        {/* ── Place Relationships ── */}
        <TabsContent value="relationships">
          <AdminEntityTable
            items={placeRels}
            entityName="Relationship"
            isLoading={loadingPlaceRels}
            columns={[
              { key: 'source_type', label: 'Source Type', width: 'w-[80px]', render: (r: any) => <Badge variant="outline" className="text-[10px]">{r.source_type}</Badge> },
              { key: 'source_id', label: 'Source', width: 'flex-1', render: (r: any) => <span className="text-xs font-medium">{entityName(r.source_type, r.source_id)}</span> },
              { key: 'relationship_type', label: 'Rel', width: 'w-[90px]', render: (r: any) => <Badge className="text-[10px]">{r.relationship_type}</Badge> },
              { key: 'target_type', label: 'Target Type', width: 'w-[80px]', render: (r: any) => <Badge variant="outline" className="text-[10px]">{r.target_type}</Badge> },
              { key: 'target_id', label: 'Target', width: 'flex-1', render: (r: any) => <span className="text-xs font-medium">{entityName(r.target_type, r.target_id)}</span> },
              { key: 'strength', label: 'Strength', width: 'w-[70px]', render: (r: any) => <span className="text-xs">{r.strength ?? '—'}</span> },
            ]}
            defaultItem={{ source_type: 'destination', source_id: '', target_type: 'area', target_id: '', relationship_type: 'contains', strength: 1.0 }}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Source Type</Label>
                    <Select value={item.source_type || 'destination'} onValueChange={v => onChange('source_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{['country', 'destination', 'area', 'poi'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Source</Label>
                    <Select value={item.source_id || ''} onValueChange={v => onChange('source_id', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {(item.source_type === 'destination' ? destinations : item.source_type === 'area' ? areas : item.source_type === 'poi' ? pois : countries).map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Relationship</Label>
                    <Select value={item.relationship_type || 'contains'} onValueChange={v => onChange('relationship_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{['contains', 'proximity', 'adjacent', 'overlaps', 'serves'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Target Type</Label>
                    <Select value={item.target_type || 'area'} onValueChange={v => onChange('target_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{['country', 'destination', 'area', 'poi'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Strength</Label>
                    <Input type="number" min={0} max={1} step={0.1} value={item.strength ?? ''} onChange={e => onChange('strength', parseFloat(e.target.value) || null)} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Target</Label>
                  <Select value={item.target_id || ''} onValueChange={v => onChange('target_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {(item.target_type === 'destination' ? destinations : item.target_type === 'area' ? areas : item.target_type === 'poi' ? pois : countries).map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs text-muted-foreground">Source Origin</Label><Input value={item.source_origin || ''} onChange={e => onChange('source_origin', e.target.value)} placeholder="manual, inferred, import" /></div>
              </div>
            )}
            onSave={(item, isNew) => saveEntity('place_relationships', item, isNew)}
            onDelete={(ids) => deleteEntity('place_relationships', ids)}
          />
        </TabsContent>

        {/* ── Travel Time Edges ── */}
        <TabsContent value="travel">
          <AdminEntityTable
            items={travelEdges}
            entityName="Travel Edge"
            isLoading={loadingTravelEdges}
            columns={[
              { key: 'origin_type', label: 'From Type', width: 'w-[80px]', render: (e: any) => <Badge variant="outline" className="text-[10px]">{e.origin_type}</Badge> },
              { key: 'origin_id', label: 'From', width: 'flex-1', render: (e: any) => <span className="text-xs font-medium">{entityName(e.origin_type, e.origin_id)}</span> },
              { key: 'mode', label: 'Mode', width: 'w-[70px]', render: (e: any) => <Badge className="text-[10px]">{e.mode}</Badge> },
              { key: 'dest_type', label: 'To Type', width: 'w-[80px]', render: (e: any) => <Badge variant="outline" className="text-[10px]">{e.dest_type}</Badge> },
              { key: 'dest_id', label: 'To', width: 'flex-1', render: (e: any) => <span className="text-xs font-medium">{entityName(e.dest_type, e.dest_id)}</span> },
              { key: 'duration_minutes_typical', label: 'Mins', width: 'w-[50px]', render: (e: any) => <span className="text-xs">{e.duration_minutes_typical ?? '—'}</span> },
              { key: 'friction_score', label: 'Friction', width: 'w-[60px]', render: (e: any) => <span className="text-xs">{e.friction_score ?? '—'}</span> },
            ]}
            defaultItem={{ origin_type: 'destination', origin_id: '', dest_type: 'destination', dest_id: '', mode: 'drive', duration_minutes_typical: null, duration_minutes_peak: null, friction_score: null }}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Origin Type</Label>
                    <Select value={item.origin_type || 'destination'} onValueChange={v => onChange('origin_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{['country', 'destination', 'area', 'poi'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Origin</Label>
                    <Select value={item.origin_id || ''} onValueChange={v => onChange('origin_id', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {(item.origin_type === 'destination' ? destinations : item.origin_type === 'area' ? areas : item.origin_type === 'poi' ? pois : countries).map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Dest Type</Label>
                    <Select value={item.dest_type || 'destination'} onValueChange={v => onChange('dest_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{['country', 'destination', 'area', 'poi'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Destination</Label>
                    <Select value={item.dest_id || ''} onValueChange={v => onChange('dest_id', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {(item.dest_type === 'destination' ? destinations : item.dest_type === 'area' ? areas : item.dest_type === 'poi' ? pois : countries).map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Mode</Label>
                    <Select value={item.mode || 'drive'} onValueChange={v => onChange('mode', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{['drive', 'walk', 'ferry', 'flight', 'bus', 'train', 'taxi'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs text-muted-foreground">Typical (min)</Label><Input type="number" value={item.duration_minutes_typical ?? ''} onChange={e => onChange('duration_minutes_typical', parseInt(e.target.value) || null)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Peak (min)</Label><Input type="number" value={item.duration_minutes_peak ?? ''} onChange={e => onChange('duration_minutes_peak', parseInt(e.target.value) || null)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Friction</Label><Input type="number" min={0} max={1} step={0.05} value={item.friction_score ?? ''} onChange={e => onChange('friction_score', parseFloat(e.target.value) || null)} /></div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Source</Label><Input value={item.source_type || ''} onChange={e => onChange('source_type', e.target.value)} placeholder="manual, google_maps, inferred" /></div>
              </div>
            )}
            onSave={(item, isNew) => saveEntity('travel_time_edges', item, isNew)}
            onDelete={(ids) => deleteEntity('travel_time_edges', ids)}
          />
        </TabsContent>

        {/* ── Geo Shapes ── */}
        <TabsContent value="geo">
          <AdminEntityTable
            items={geoShapes}
            entityName="Geo Shape"
            isLoading={loadingGeoShapes}
            columns={[
              { key: 'entity_type', label: 'Type', width: 'w-[80px]', render: (g: any) => <Badge variant="outline" className="text-[10px]">{g.entity_type}</Badge> },
              { key: 'entity_id', label: 'Name', width: 'flex-[2]', render: (g: any) => <span className="text-xs font-medium">{entityName(g.entity_type, g.entity_id)}</span> },
              { key: 'source_type', label: 'Source', width: 'w-[80px]', render: (g: any) => <span className="text-xs text-muted-foreground">{g.source_type || '—'}</span> },
              { key: 'confidence_score', label: 'Confidence', width: 'w-[80px]', render: (g: any) => <span className="text-xs">{g.confidence_score ?? '—'}</span> },
            ]}
            defaultItem={{ entity_type: 'destination', entity_id: '', shape_json: {}, source_type: 'manual', confidence_score: 0.5 }}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Entity Type</Label>
                    <Select value={item.entity_type || 'destination'} onValueChange={v => onChange('entity_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{['country', 'destination', 'area', 'poi'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Entity</Label>
                    <Select value={item.entity_id || ''} onValueChange={v => onChange('entity_id', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {(item.entity_type === 'destination' ? destinations : item.entity_type === 'area' ? areas : item.entity_type === 'poi' ? pois : countries).map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Shape (GeoJSON)</Label><Textarea value={typeof item.shape_json === 'object' ? JSON.stringify(item.shape_json, null, 2) : item.shape_json || '{}'} onChange={e => { try { onChange('shape_json', JSON.parse(e.target.value)); } catch {} }} rows={5} className="font-mono text-xs" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Source</Label><Input value={item.source_type || ''} onChange={e => onChange('source_type', e.target.value)} placeholder="manual, osm, google" /></div>
                  <div><Label className="text-xs text-muted-foreground">Confidence</Label><Input type="number" min={0} max={1} step={0.1} value={item.confidence_score ?? ''} onChange={e => onChange('confidence_score', parseFloat(e.target.value) || null)} /></div>
                </div>
              </div>
            )}
            onSave={(item, isNew) => saveEntity('geo_shapes', item, isNew)}
            onDelete={(ids) => deleteEntity('geo_shapes', ids)}
          />
        </TabsContent>


        <TabsContent value="semantic">
          <AdminEntityTable
            items={semanticProfiles}
            entityName="Semantic Profile"
            isLoading={loadingSemantic}
            columns={[
              { key: 'entity_type', label: 'Entity', width: 'flex-1', render: (s: any) => <Badge variant="outline" className="text-[10px]">{s.entity_type}</Badge> },
              { key: 'entity_id', label: 'Name', width: 'flex-[2]', render: (s: any) => <span className="text-xs font-medium">{entityName(s.entity_type, s.entity_id)}</span> },
              { key: 'nightlife_score', label: 'Nightlife', width: 'w-[60px]', render: (s: any) => <span className="text-xs">{s.nightlife_score ?? '—'}</span> },
              { key: 'nature_score', label: 'Nature', width: 'w-[60px]', render: (s: any) => <span className="text-xs">{s.nature_score ?? '—'}</span> },
              { key: 'food_score', label: 'Food', width: 'w-[60px]', render: (s: any) => <span className="text-xs">{s.food_score ?? '—'}</span> },
            ]}
            defaultItem={{ entity_type: 'destination', entity_id: '', nightlife_score: 50, nature_score: 50, food_score: 50, culture_score: 50, chill_score: 50, energetic_score: 50, luxury_score: 50, budget_score: 50, coastal_score: 50, urban_score: 50, walkability_score: 50, family_score: 50, localness_score: 50, touristiness_score: 50, confidence_score: 50 }}
            renderForm={(item: any, onChange) => {
              const scoreField = (key: string, label: string) => (
                <div>
                  <Label className="text-xs text-muted-foreground">{label}: {item[key] ?? 50}</Label>
                  <Slider min={0} max={100} step={1} value={[item[key] ?? 50]} onValueChange={([v]) => onChange(key, v)} />
                </div>
              );
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Entity Type</Label>
                      <Select value={item.entity_type || 'destination'} onValueChange={v => onChange('entity_type', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['country', 'destination', 'area', 'poi'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Entity</Label>
                      <Select value={item.entity_id || ''} onValueChange={v => onChange('entity_id', v)}>
                        <SelectTrigger><SelectValue placeholder="Select entity" /></SelectTrigger>
                        <SelectContent>
                          {(item.entity_type === 'destination' ? destinations : item.entity_type === 'area' ? areas : item.entity_type === 'poi' ? pois : countries).map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    {scoreField('nightlife_score', '🌙 Nightlife')}
                    {scoreField('nature_score', '🌿 Nature')}
                    {scoreField('food_score', '🍽️ Food')}
                    {scoreField('culture_score', '🎭 Culture')}
                    {scoreField('chill_score', '😎 Chill')}
                    {scoreField('energetic_score', '⚡ Energetic')}
                    {scoreField('luxury_score', '💎 Luxury')}
                    {scoreField('budget_score', '💰 Budget')}
                    {scoreField('coastal_score', '🏖️ Coastal')}
                    {scoreField('urban_score', '🏙️ Urban')}
                    {scoreField('walkability_score', '🚶 Walkable')}
                    {scoreField('family_score', '👨‍👩‍👧 Family')}
                    {scoreField('localness_score', '🏡 Local')}
                    {scoreField('touristiness_score', '📸 Tourist')}
                  </div>
                  <div><Label className="text-xs text-muted-foreground">Confidence: {item.confidence_score ?? 50}</Label><Slider min={0} max={100} step={1} value={[item.confidence_score ?? 50]} onValueChange={([v]) => onChange('confidence_score', v)} /></div>
                </div>
              );
            }}
            onSave={(item, isNew) => saveEntity('semantic_place_profiles', item, isNew)}
            onDelete={(ids) => deleteEntity('semantic_place_profiles', ids)}
          />
        </TabsContent>

        {/* ── Seasonality Profiles ── */}
        <TabsContent value="seasonality">
          <AdminEntityTable
            items={seasonalityProfiles}
            entityName="Seasonality Profile"
            isLoading={loadingSeasonality}
            columns={[
              { key: 'entity_type', label: 'Entity', width: 'flex-1', render: (s: any) => <Badge variant="outline" className="text-[10px]">{s.entity_type}</Badge> },
              { key: 'entity_id', label: 'Name', width: 'flex-[2]', render: (s: any) => <span className="text-xs font-medium">{entityName(s.entity_type, s.entity_id)}</span> },
              { key: 'source_type', label: 'Source', width: 'w-[80px]', render: (s: any) => <span className="text-xs text-muted-foreground">{s.source_type || '—'}</span> },
              { key: 'confidence_score', label: 'Confidence', width: 'w-[80px]', render: (s: any) => <span className="text-xs">{s.confidence_score ?? '—'}</span> },
            ]}
            defaultItem={{ entity_type: 'destination', entity_id: '', monthly_scores: {}, source_type: 'manual', confidence_score: 50 }}
            renderForm={(item: any, onChange) => {
              const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              const scores = typeof item.monthly_scores === 'object' && item.monthly_scores ? item.monthly_scores : {};
              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Entity Type</Label>
                      <Select value={item.entity_type || 'destination'} onValueChange={v => onChange('entity_type', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{['country', 'destination', 'area', 'poi'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Entity</Label>
                      <Select value={item.entity_id || ''} onValueChange={v => onChange('entity_id', v)}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {(item.entity_type === 'destination' ? destinations : item.entity_type === 'area' ? areas : item.entity_type === 'poi' ? pois : countries).map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Monthly Scores (0-100)</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {months.map((m, i) => (
                        <div key={m}>
                          <Label className="text-[10px] text-muted-foreground">{m}</Label>
                          <Input type="number" min={0} max={100} value={scores[String(i+1)] || ''} onChange={e => {
                            const updated = { ...scores, [String(i+1)]: parseInt(e.target.value) || 0 };
                            onChange('monthly_scores', updated);
                          }} className="text-xs h-8" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs text-muted-foreground">Source</Label><Input value={item.source_type || ''} onChange={e => onChange('source_type', e.target.value)} placeholder="manual, api, inferred" /></div>
                    <div><Label className="text-xs text-muted-foreground">Confidence</Label><Input type="number" min={0} max={100} value={item.confidence_score || ''} onChange={e => onChange('confidence_score', parseFloat(e.target.value) || null)} /></div>
                  </div>
                </div>
              );
            }}
            onSave={(item, isNew) => saveEntity('seasonality_profiles', item, isNew)}
            onDelete={(ids) => deleteEntity('seasonality_profiles', ids)}
          />
        </TabsContent>

        {/* ── Weather Snapshots ── */}
        <TabsContent value="weather">
          <AdminEntityTable
            items={weatherSnapshots}
            entityName="Weather Snapshot"
            isLoading={loadingWeather}
            columns={[
              { key: 'entity_type', label: 'Entity', width: 'w-[80px]', render: (w: any) => <Badge variant="outline" className="text-[10px]">{w.entity_type}</Badge> },
              { key: 'entity_id', label: 'Name', width: 'flex-[2]', render: (w: any) => <span className="text-xs font-medium">{entityName(w.entity_type, w.entity_id)}</span> },
              { key: 'provider_key', label: 'Provider', width: 'w-[80px]', render: (w: any) => <span className="text-xs text-muted-foreground">{w.provider_key || '—'}</span> },
              { key: 'forecast_time', label: 'Forecast', width: 'flex-1', render: (w: any) => <span className="text-xs text-muted-foreground">{w.forecast_time ? new Date(w.forecast_time).toLocaleDateString() : '—'}</span> },
            ]}
            defaultItem={{ entity_type: 'destination', entity_id: '', provider_key: 'manual', forecast_time: new Date().toISOString(), payload_json: {}, freshness_expires_at: null }}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Entity Type</Label>
                    <Select value={item.entity_type || 'destination'} onValueChange={v => onChange('entity_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{['destination', 'area', 'poi'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Entity</Label>
                    <Select value={item.entity_id || ''} onValueChange={v => onChange('entity_id', v)}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {(item.entity_type === 'area' ? areas : item.entity_type === 'poi' ? pois : destinations).map((e: any) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Provider</Label><Input value={item.provider_key || ''} onChange={e => onChange('provider_key', e.target.value)} placeholder="openweather, manual" /></div>
                  <div><Label className="text-xs text-muted-foreground">Forecast Time</Label><Input type="datetime-local" value={item.forecast_time?.slice(0, 16) || ''} onChange={e => onChange('forecast_time', new Date(e.target.value).toISOString())} /></div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Payload (JSON)</Label><Textarea value={typeof item.payload_json === 'object' ? JSON.stringify(item.payload_json, null, 2) : item.payload_json || '{}'} onChange={e => { try { onChange('payload_json', JSON.parse(e.target.value)); } catch {} }} rows={4} className="font-mono text-xs" /></div>
                <div><Label className="text-xs text-muted-foreground">Expires At</Label><Input type="datetime-local" value={item.freshness_expires_at?.slice(0, 16) || ''} onChange={e => onChange('freshness_expires_at', new Date(e.target.value).toISOString())} /></div>
              </div>
            )}
            onSave={(item, isNew) => saveEntity('weather_snapshots', item, isNew)}
            onDelete={(ids) => deleteEntity('weather_snapshots', ids)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
