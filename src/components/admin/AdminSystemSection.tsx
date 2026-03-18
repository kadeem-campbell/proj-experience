/**
 * Admin System Section — System Constants, Public Surfaces, 
 * Launch Profiles, Route Families, Principles
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, Globe, Shield, Route, Rocket, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';

export const AdminSystemSection = () => {
  const [activeTab, setActiveTab] = useState('constants');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">System Configuration</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="constants">Constants</TabsTrigger>
          <TabsTrigger value="surfaces">Surfaces</TabsTrigger>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="profiles">Launch</TabsTrigger>
          <TabsTrigger value="principles">Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="constants"><ConstantsTab /></TabsContent>
        <TabsContent value="surfaces"><SurfacesTab /></TabsContent>
        <TabsContent value="routes"><RouteFamiliesTab /></TabsContent>
        <TabsContent value="profiles"><LaunchProfilesTab /></TabsContent>
        <TabsContent value="principles"><PrinciplesTab /></TabsContent>
      </Tabs>
    </div>
  );
};

const ConstantsTab = () => {
  const { data: constants = [] } = useQuery({
    queryKey: ['system-constants'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('system_constants').select('*').order('key');
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">System Constants</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {constants.map((c: any) => (
              <TableRow key={c.key}>
                <TableCell className="font-mono text-xs">{c.key}</TableCell>
                <TableCell className="text-xs">{JSON.stringify(c.value_json)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{c.updated_at?.split('T')[0]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const SurfacesTab = () => {
  const { data: surfaces = [] } = useQuery({
    queryKey: ['public-surfaces'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('public_surfaces').select('*').order('surface_key');
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Public Surfaces Registry</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Surface</TableHead>
              <TableHead>Pattern</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Index?</TableHead>
              <TableHead>SSR?</TableHead>
              <TableHead>JSON-LD?</TableHead>
              <TableHead>Min Index</TableHead>
              <TableHead>Min Publish</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {surfaces.map((s: any) => (
              <TableRow key={s.surface_key}>
                <TableCell className="font-mono text-xs">{s.surface_key}</TableCell>
                <TableCell className="font-mono text-xs">{s.route_pattern}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{s.entity_type}</Badge></TableCell>
                <TableCell>{s.is_indexable_candidate ? '✅' : '❌'}</TableCell>
                <TableCell>{s.requires_ssr ? '✅' : '❌'}</TableCell>
                <TableCell>{s.requires_schema_jsonld ? '✅' : '❌'}</TableCell>
                <TableCell className="text-xs">{s.min_readiness_score_to_index}</TableCell>
                <TableCell className="text-xs">{s.min_readiness_score_to_publish}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const RouteFamiliesTab = () => {
  const { data: routes = [] } = useQuery({
    queryKey: ['route-families'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('route_families').select('*').order('family_key');
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Route Families</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Family</TableHead>
              <TableHead>Pattern</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Public</TableHead>
              <TableHead>Indexable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.map((r: any) => (
              <TableRow key={r.family_key}>
                <TableCell className="font-mono text-xs">{r.family_key}</TableCell>
                <TableCell className="font-mono text-xs">{r.pattern_template}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{r.entity_type}</Badge></TableCell>
                <TableCell>{r.is_public ? '✅' : '❌'}</TableCell>
                <TableCell>{r.is_indexable_candidate ? '✅' : '❌'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const LaunchProfilesTab = () => {
  const { data: profiles = [] } = useQuery({
    queryKey: ['geo-launch-profiles'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('geo_launch_profiles').select('*').order('profile_key');
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Geo Launch Profiles</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profile</TableHead>
              <TableHead>Min Publish</TableHead>
              <TableHead>Min Index</TableHead>
              <TableHead>Min Itin</TableHead>
              <TableHead>Min Host</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell><Badge className="text-[10px]">{p.profile_key}</Badge></TableCell>
                <TableCell>{p.min_product_readiness_to_publish}</TableCell>
                <TableCell>{p.min_product_readiness_to_index}</TableCell>
                <TableCell>{p.min_itinerary_readiness_to_publish}</TableCell>
                <TableCell>{p.min_host_readiness_to_publish}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

const PrinciplesTab = () => {
  const { data: principles = [] } = useQuery({
    queryKey: ['principles'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('principles').select('*').order('principle_key');
      return data || [];
    },
  });

  const enforcementColors: Record<string, string> = {
    db_constraint: 'bg-red-100 text-red-800',
    validator: 'bg-yellow-100 text-yellow-800',
    scoring_gate: 'bg-blue-100 text-blue-800',
    route_gate: 'bg-purple-100 text-purple-800',
    admin_permission: 'bg-green-100 text-green-800',
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Enforced Principles</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {principles.map((p: any) => (
            <div key={p.principle_key} className="flex items-start gap-3 p-3 rounded-lg border border-border/50">
              <Shield className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-medium">{p.principle_key}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${enforcementColors[p.enforcement_type] || 'bg-muted'}`}>
                    {p.enforcement_type}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
