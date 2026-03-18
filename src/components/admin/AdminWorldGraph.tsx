/**
 * Admin World Graph — place relationships, travel time edges,
 * semantic profiles, weather snapshots, seasonality
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Map, Thermometer, Calendar, ArrowRight } from 'lucide-react';

export const AdminWorldGraph = () => {
  const { data: placeRels = [] } = useQuery({
    queryKey: ['place-relationships'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('place_relationships').select('*').limit(50);
      return data || [];
    },
  });

  const { data: travelEdges = [] } = useQuery({
    queryKey: ['travel-time-edges'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('travel_time_edges').select('*').limit(50);
      return data || [];
    },
  });

  const { data: semanticProfiles = [] } = useQuery({
    queryKey: ['semantic-place-profiles'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('semantic_place_profiles').select('*').limit(50);
      return data || [];
    },
  });

  const { data: weather = [] } = useQuery({
    queryKey: ['weather-snapshots'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('weather_snapshots').select('*').order('created_at', { ascending: false }).limit(20);
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">World Graph</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{placeRels.length}</p><p className="text-xs text-muted-foreground">Place Relations</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{travelEdges.length}</p><p className="text-xs text-muted-foreground">Travel Edges</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{semanticProfiles.length}</p><p className="text-xs text-muted-foreground">Semantic Profiles</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{weather.length}</p><p className="text-xs text-muted-foreground">Weather Snapshots</p></CardContent></Card>
      </div>

      <Tabs defaultValue="relations">
        <TabsList>
          <TabsTrigger value="relations">Relations</TabsTrigger>
          <TabsTrigger value="travel">Travel Times</TabsTrigger>
          <TabsTrigger value="semantic">Semantic</TabsTrigger>
          <TabsTrigger value="weather">Weather</TabsTrigger>
        </TabsList>

        <TabsContent value="relations">
          <Card>
            <CardContent className="pt-4">
              {placeRels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No place relationships yet. Use bulk import or manual entry.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead></TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Strength</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {placeRels.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs"><Badge variant="outline" className="text-[9px]">{r.source_type}</Badge> {r.source_id?.slice(0,8)}</TableCell>
                        <TableCell><ArrowRight className="w-3 h-3 text-muted-foreground" /></TableCell>
                        <TableCell className="text-xs"><Badge variant="outline" className="text-[9px]">{r.target_type}</Badge> {r.target_id?.slice(0,8)}</TableCell>
                        <TableCell><Badge className="text-[10px]">{r.relationship_type}</Badge></TableCell>
                        <TableCell className="text-xs">{r.strength?.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="travel">
          <Card>
            <CardContent className="pt-4">
              {travelEdges.length === 0 ? (
                <p className="text-sm text-muted-foreground">No travel time data yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Origin</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Typical</TableHead>
                      <TableHead>Peak</TableHead>
                      <TableHead>Friction</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {travelEdges.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs">{t.origin_type} {t.origin_id?.slice(0,8)}</TableCell>
                        <TableCell className="text-xs">{t.dest_type} {t.dest_id?.slice(0,8)}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{t.mode}</Badge></TableCell>
                        <TableCell className="text-xs">{t.duration_minutes_typical}m</TableCell>
                        <TableCell className="text-xs">{t.duration_minutes_peak}m</TableCell>
                        <TableCell className="text-xs">{t.friction_score?.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="semantic">
          <Card>
            <CardContent className="pt-4">
              {semanticProfiles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No semantic profiles yet.</p>
              ) : (
                <div className="space-y-3">
                  {semanticProfiles.map((s: any) => (
                    <div key={s.id} className="p-3 rounded-lg border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-[10px]">{s.entity_type}</Badge>
                        <span className="text-xs font-mono">{s.entity_id?.slice(0,8)}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">conf: {s.confidence_score?.toFixed(2)}</span>
                      </div>
                      <div className="grid grid-cols-4 md:grid-cols-7 gap-1">
                        {[
                          ['🏙️', 'urban', s.urban_score], ['🏖️', 'coastal', s.coastal_score],
                          ['🌙', 'nightlife', s.nightlife_score], ['🍽️', 'food', s.food_score],
                          ['🏛️', 'culture', s.culture_score], ['🌿', 'nature', s.nature_score],
                          ['✨', 'luxury', s.luxury_score], ['🎯', 'budget', s.budget_score],
                          ['👨‍👩‍👧', 'family', s.family_score], ['😌', 'chill', s.chill_score],
                          ['⚡', 'energy', s.energetic_score], ['📍', 'local', s.localness_score],
                          ['🗺️', 'tourist', s.touristiness_score], ['🚶', 'walk', s.walkability_score],
                        ].map(([emoji, label, val]: any) => (
                          <div key={label} className="text-center text-[10px]">
                            <span>{emoji}</span>
                            <div className="h-1 rounded bg-muted mt-0.5">
                              <div className="h-full rounded bg-primary" style={{ width: `${(val || 0) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="weather">
          <Card>
            <CardContent className="pt-4">
              {weather.length === 0 ? (
                <p className="text-sm text-muted-foreground">No weather data yet. Connect a weather provider.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Forecast</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {weather.map((w: any) => (
                      <TableRow key={w.id}>
                        <TableCell className="text-xs">{w.entity_type} {w.entity_id?.slice(0,8)}</TableCell>
                        <TableCell className="text-xs">{w.provider_key}</TableCell>
                        <TableCell className="text-xs">{w.forecast_time?.split('T')[0]}</TableCell>
                        <TableCell className="text-xs">{w.freshness_expires_at?.split('T')[0] || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
