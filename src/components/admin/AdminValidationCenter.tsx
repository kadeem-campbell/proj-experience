/**
 * Validation Center — view all validation results, grouped by type/severity.
 * Publishing Center — publish state management.
 * Slug/Canonical Center — slug history and route management.
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminEntityTable } from './AdminEntityTable';
import { CheckCircle, XCircle, AlertTriangle, Search, RotateCcw } from 'lucide-react';

export const AdminValidationCenter = () => {
  const { data: validations = [] } = useQuery({
    queryKey: ['admin-validations'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('publish_validation_results').select('*').order('validated_at', { ascending: false });
      return data || [];
    },
  });

  const blocked = validations.filter((v: any) => !v.is_publishable);
  const publishable = validations.filter((v: any) => v.is_publishable);
  const lowScore = validations.filter((v: any) => v.publish_score < 50);

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Validation Center</h2>
      <p className="text-sm text-muted-foreground mb-4">Review publish readiness across all entities</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 text-center">
          <CheckCircle className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
          <p className="text-2xl font-bold text-emerald-600">{publishable.length}</p>
          <p className="text-xs text-muted-foreground">Publishable</p>
        </Card>
        <Card className="p-4 text-center">
          <XCircle className="w-6 h-6 mx-auto mb-1 text-destructive" />
          <p className="text-2xl font-bold text-destructive">{blocked.length}</p>
          <p className="text-xs text-muted-foreground">Blocked</p>
        </Card>
        <Card className="p-4 text-center">
          <AlertTriangle className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
          <p className="text-2xl font-bold text-yellow-600">{lowScore.length}</p>
          <p className="text-xs text-muted-foreground">Low Score (&lt;50)</p>
        </Card>
      </div>

      <AdminEntityTable
        items={validations}
        entityName="Validation Result"
        columns={[
          { key: 'entity_type', label: 'Type', width: 'w-[100px]', render: (v: any) => <Badge variant="outline" className="text-[10px]">{v.entity_type}</Badge> },
          { key: 'entity_id', label: 'Entity ID', width: 'flex-1', render: (v: any) => <span className="font-mono text-xs">{v.entity_id?.slice(0, 12)}...</span> },
          { key: 'publish_score', label: 'Score', width: 'w-[80px]', render: (v: any) => (
            <span className={`font-bold text-sm ${v.publish_score >= 70 ? 'text-emerald-600' : v.publish_score >= 40 ? 'text-yellow-600' : 'text-destructive'}`}>
              {v.publish_score}%
            </span>
          )},
          { key: 'is_publishable', label: 'Status', width: 'w-[100px]', render: (v: any) => (
            <Badge variant={v.is_publishable ? 'default' : 'destructive'} className="text-[10px]">
              {v.is_publishable ? 'Ready' : 'Blocked'}
            </Badge>
          )},
          { key: 'validated_at', label: 'Validated', width: 'w-[120px]', render: (v: any) => <span className="text-xs text-muted-foreground">{v.validated_at ? new Date(v.validated_at).toLocaleDateString() : '—'}</span> },
        ]}
        filterOptions={[
          { key: 'entity_type', label: 'Type', options: [...new Set(validations.map((v: any) => v.entity_type))].map(t => ({ value: t as string, label: t as string })) },
          { key: 'is_publishable', label: 'Status', options: [{ value: 'true', label: 'Publishable' }, { value: 'false', label: 'Blocked' }] },
        ]}
      />
    </div>
  );
};

export const AdminSlugCenter = () => {
  const { data: slugHistory = [] } = useQuery({
    queryKey: ['admin-slug-history'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('entity_slug_history').select('*').order('changed_at', { ascending: false }).limit(200);
      return data || [];
    },
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['admin-routes'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('page_route_registry').select('*').order('updated_at', { ascending: false }).limit(200);
      return data || [];
    },
  });

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Slugs, Canonicals & Routes</h2>
      <p className="text-sm text-muted-foreground mb-4">Manage URL structure and redirects</p>

      <Tabs defaultValue="routes">
        <TabsList className="mb-4">
          <TabsTrigger value="routes">Route Registry ({routes.length})</TabsTrigger>
          <TabsTrigger value="slugs">Slug History ({slugHistory.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="routes">
          <AdminEntityTable
            items={routes}
            entityName="Route"
            columns={[
              { key: 'resolved_path', label: 'Path', width: 'flex-[2]', render: (r: any) => <span className="font-mono text-xs">{r.resolved_path}</span> },
              { key: 'page_type', label: 'Page Type', width: 'w-[100px]', render: (r: any) => <Badge variant="outline" className="text-[10px]">{r.page_type}</Badge> },
              { key: 'indexability_state', label: 'Index', width: 'w-[120px]', render: (r: any) => (
                <Badge variant={r.indexability_state === 'public_indexed' ? 'default' : 'secondary'} className="text-[10px]">{r.indexability_state}</Badge>
              )},
              { key: 'status', label: 'Status', width: 'w-[80px]', render: (r: any) => <Badge variant="outline" className="text-[10px]">{r.status}</Badge> },
            ]}
            filterOptions={[
              { key: 'page_type', label: 'Type', options: [...new Set(routes.map((r: any) => r.page_type))].map(t => ({ value: t as string, label: t as string })) },
              { key: 'indexability_state', label: 'Index State', options: [
                { value: 'public_indexed', label: 'Indexed' },
                { value: 'public_noindex', label: 'No-index' },
                { value: 'internal_only', label: 'Internal' },
              ]},
            ]}
          />
        </TabsContent>

        <TabsContent value="slugs">
          <AdminEntityTable
            items={slugHistory}
            entityName="Slug Change"
            columns={[
              { key: 'entity_type', label: 'Type', width: 'w-[100px]', render: (s: any) => <Badge variant="outline" className="text-[10px]">{s.entity_type}</Badge> },
              { key: 'old_slug', label: 'Old Slug', width: 'flex-1', render: (s: any) => <span className="font-mono text-xs text-destructive line-through">{s.old_slug}</span> },
              { key: 'new_slug', label: 'New Slug', width: 'flex-1', render: (s: any) => <span className="font-mono text-xs text-emerald-600">{s.new_slug}</span> },
              { key: 'changed_at', label: 'Date', width: 'w-[100px]', render: (s: any) => <span className="text-xs">{s.changed_at ? new Date(s.changed_at).toLocaleDateString() : '—'}</span> },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
