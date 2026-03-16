/**
 * Admin Overview Dashboard — live entity counts, status breakdowns,
 * validation failures, recent changes, missing-field alerts.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Globe, Package, MapPin, Users, Layers, Tag, Mountain,
  AlertTriangle, CheckCircle, XCircle, Clock, TrendingUp,
  FileWarning, Image, Link2,
} from 'lucide-react';

interface CountResult { count: number }

const useEntityCounts = () => {
  return useQuery({
    queryKey: ['admin-overview-counts'],
    queryFn: async () => {
      const tables = [
        'destinations', 'areas', 'products', 'hosts', 'pois', 'themes',
        'activity_types', 'collections', 'public_itineraries', 'options',
        'price_options', 'media_assets', 'experiences', 'creators',
        'reviews', 'events',
      ] as const;

      const counts: Record<string, { total: number; active: number; inactive: number }> = {};

      await Promise.all(tables.map(async (table) => {
        const { count: total } = await (supabase as any).from(table).select('*', { count: 'exact', head: true });
        const { count: active } = await (supabase as any).from(table).select('*', { count: 'exact', head: true }).eq('is_active', true);
        counts[table] = { total: total || 0, active: active || 0, inactive: (total || 0) - (active || 0) };
      }));

      return counts;
    },
    staleTime: 30 * 1000,
  });
};

const useValidationStats = () => {
  return useQuery({
    queryKey: ['admin-overview-validation'],
    queryFn: async () => {
      const { data: results } = await (supabase as any).from('publish_validation_results').select('entity_type, is_publishable, publish_score');
      const stats = { total: 0, publishable: 0, blocked: 0, lowScore: 0, byType: {} as Record<string, { total: number; publishable: number }> };
      (results || []).forEach((r: any) => {
        stats.total++;
        if (r.is_publishable) stats.publishable++;
        else stats.blocked++;
        if (r.publish_score < 50) stats.lowScore++;
        if (!stats.byType[r.entity_type]) stats.byType[r.entity_type] = { total: 0, publishable: 0 };
        stats.byType[r.entity_type].total++;
        if (r.is_publishable) stats.byType[r.entity_type].publishable++;
      });
      return stats;
    },
    staleTime: 30 * 1000,
  });
};

const useDataQuality = () => {
  return useQuery({
    queryKey: ['admin-overview-quality'],
    queryFn: async () => {
      // Products missing key fields
      const { data: products } = await supabase.from('products').select('id, title, cover_image, destination_id, description, activity_type_id').eq('is_active', true);
      const prods = products || [];
      const missingImage = prods.filter(p => !p.cover_image);
      const missingDest = prods.filter(p => !p.destination_id);
      const missingDesc = prods.filter(p => !p.description || p.description.length < 20);
      const missingActivity = prods.filter(p => !p.activity_type_id);

      // Hosts missing key fields
      const { data: hosts } = await supabase.from('hosts').select('id, avatar_url, bio, destination_id').eq('is_active', true);
      const hostList = hosts || [];
      const hostsMissingAvatar = hostList.filter(h => !h.avatar_url);
      const hostsMissingBio = hostList.filter(h => !h.bio || h.bio.length < 10);

      // Slug conflicts
      const { data: slugHistory } = await (supabase as any).from('entity_slug_history').select('id').limit(1);

      return {
        products: {
          total: prods.length,
          missingImage: missingImage.length,
          missingDest: missingDest.length,
          missingDesc: missingDesc.length,
          missingActivity: missingActivity.length,
        },
        hosts: {
          total: hostList.length,
          missingAvatar: hostsMissingAvatar.length,
          missingBio: hostsMissingBio.length,
        },
        slugChanges: (slugHistory || []).length,
      };
    },
    staleTime: 60 * 1000,
  });
};

const useRecentActivity = () => {
  return useQuery({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      const [{ data: recentProducts }, { data: recentHosts }, { data: recentCollections }] = await Promise.all([
        supabase.from('products').select('id, title, updated_at').order('updated_at', { ascending: false }).limit(5),
        supabase.from('hosts').select('id, display_name, updated_at').order('updated_at', { ascending: false }).limit(5),
        (supabase as any).from('collections').select('id, name, updated_at').order('updated_at', { ascending: false }).limit(5),
      ]);
      return {
        products: recentProducts || [],
        hosts: recentHosts || [],
        collections: recentCollections || [],
      };
    },
    staleTime: 30 * 1000,
  });
};

const StatCard = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: number | string; sub?: string; color?: string }) => (
  <Card className="p-4">
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${color || 'bg-primary/10'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </div>
  </Card>
);

const AlertRow = ({ icon: Icon, label, count, severity }: { icon: any; label: string; count: number; severity: 'error' | 'warning' | 'info' }) => {
  if (count === 0) return null;
  const colors = { error: 'text-destructive bg-destructive/10', warning: 'text-yellow-600 bg-yellow-500/10', info: 'text-blue-600 bg-blue-500/10' };
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border text-sm">
      <div className={`p-1.5 rounded ${colors[severity]}`}><Icon className="w-3.5 h-3.5" /></div>
      <span className="flex-1">{label}</span>
      <Badge variant={severity === 'error' ? 'destructive' : 'secondary'} className="text-xs">{count}</Badge>
    </div>
  );
};

export const AdminOverview = ({ onNavigate }: { onNavigate: (section: string) => void }) => {
  const { data: counts } = useEntityCounts();
  const { data: validation } = useValidationStats();
  const { data: quality } = useDataQuality();
  const { data: recent } = useRecentActivity();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">Overview</h2>
        <p className="text-sm text-muted-foreground">System health and entity statistics</p>
      </div>

      {/* Entity counts */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Entity Counts</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <button onClick={() => onNavigate('products')} className="text-left"><StatCard icon={Package} label="Products" value={counts?.products?.total || 0} sub={`${counts?.products?.active || 0} active`} /></button>
          <button onClick={() => onNavigate('locations')} className="text-left"><StatCard icon={Globe} label="Destinations" value={counts?.destinations?.total || 0} sub={`${counts?.areas?.total || 0} areas`} color="bg-emerald-500/10" /></button>
          <button onClick={() => onNavigate('hosts')} className="text-left"><StatCard icon={Users} label="Hosts" value={counts?.hosts?.total || 0} sub={`${counts?.creators?.total || 0} legacy creators`} color="bg-purple-500/10" /></button>
          <button onClick={() => onNavigate('collections')} className="text-left"><StatCard icon={Layers} label="Collections" value={counts?.collections?.total || 0} color="bg-amber-500/10" /></button>
          <button onClick={() => onNavigate('itineraries')} className="text-left"><StatCard icon={MapPin} label="Itineraries" value={counts?.public_itineraries?.total || 0} color="bg-blue-500/10" /></button>
          <StatCard icon={MapPin} label="POIs" value={counts?.pois?.total || 0} color="bg-teal-500/10" />
          <StatCard icon={Tag} label="Activity Types" value={counts?.activity_types?.total || 0} color="bg-rose-500/10" />
          <StatCard icon={Tag} label="Themes" value={counts?.themes?.total || 0} color="bg-indigo-500/10" />
          <StatCard icon={Package} label="Options" value={counts?.options?.total || 0} sub={`${counts?.price_options?.total || 0} prices`} color="bg-orange-500/10" />
          <StatCard icon={Image} label="Media Assets" value={counts?.media_assets?.total || 0} color="bg-cyan-500/10" />
        </div>
      </div>

      {/* Legacy vs New */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Legacy Migration</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Legacy Experiences</p>
            <p className="text-2xl font-bold text-amber-600">{counts?.experiences?.total || 0}</p>
            <p className="text-[11px] text-muted-foreground">To be migrated into Products</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">New Products</p>
            <p className="text-2xl font-bold text-emerald-600">{counts?.products?.total || 0}</p>
            <p className="text-[11px] text-muted-foreground">Normalized model</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Legacy Creators → Hosts</p>
            <p className="text-2xl font-bold">{counts?.creators?.total || 0} → {counts?.hosts?.total || 0}</p>
          </Card>
        </div>
      </div>

      {/* Validation */}
      {validation && (
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Validation & Readiness</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={CheckCircle} label="Publishable" value={validation.publishable} color="bg-emerald-500/10" />
            <StatCard icon={XCircle} label="Blocked" value={validation.blocked} color="bg-destructive/10" />
            <StatCard icon={AlertTriangle} label="Low Score (<50)" value={validation.lowScore} color="bg-yellow-500/10" />
            <StatCard icon={TrendingUp} label="Total Validated" value={validation.total} />
          </div>
        </div>
      )}

      {/* Data Quality Alerts */}
      {quality && (
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Data Quality Alerts</h3>
          <div className="space-y-2">
            <AlertRow icon={Image} label="Products missing cover image" count={quality.products.missingImage} severity="error" />
            <AlertRow icon={Globe} label="Products missing destination" count={quality.products.missingDest} severity="error" />
            <AlertRow icon={FileWarning} label="Products with thin description (<20 chars)" count={quality.products.missingDesc} severity="warning" />
            <AlertRow icon={Tag} label="Products missing activity type" count={quality.products.missingActivity} severity="warning" />
            <AlertRow icon={Image} label="Hosts missing avatar" count={quality.hosts.missingAvatar} severity="warning" />
            <AlertRow icon={FileWarning} label="Hosts with thin bio" count={quality.hosts.missingBio} severity="info" />
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {recent && (
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Recent Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Recently Updated Products</h4>
              <div className="space-y-1.5">
                {recent.products.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-2 text-xs">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate flex-1">{p.title}</span>
                    <span className="text-muted-foreground">{new Date(p.updated_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Recently Updated Hosts</h4>
              <div className="space-y-1.5">
                {recent.hosts.map((h: any) => (
                  <div key={h.id} className="flex items-center gap-2 text-xs">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate flex-1">{h.display_name}</span>
                    <span className="text-muted-foreground">{new Date(h.updated_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2">Recently Updated Collections</h4>
              <div className="space-y-1.5">
                {recent.collections.map((c: any) => (
                  <div key={c.id} className="flex items-center gap-2 text-xs">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate flex-1">{c.name}</span>
                    <span className="text-muted-foreground">{new Date(c.updated_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
