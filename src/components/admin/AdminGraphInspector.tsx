/**
 * Admin Graph Inspector — explainability + graph completeness
 * Shows entity details, parent/child relations, canonical info.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Globe, Link2, MapPin, Users, Package, Layers, ArrowRight } from 'lucide-react';

const INSPECTABLE_TABLES = ['products', 'destinations', 'areas', 'hosts', 'pois', 'collections', 'public_itineraries'] as const;

export const AdminGraphInspector = () => {
  const [entityType, setEntityType] = useState<string>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Search entities
  const { data: searchResults = [] } = useQuery({
    queryKey: ['graph-search', entityType, searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) return [];
      const nameCol = entityType === 'products' ? 'title' : 'name';
      const { data } = await (supabase as any)
        .from(entityType)
        .select('*')
        .ilike(nameCol, `%${searchTerm}%`)
        .limit(20);
      return data || [];
    },
    enabled: searchTerm.length >= 2,
  });

  // Inspect selected entity
  const { data: entityDetail } = useQuery({
    queryKey: ['graph-detail', entityType, selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const { data } = await (supabase as any).from(entityType).select('*').eq('id', selectedId).single();
      return data;
    },
    enabled: !!selectedId,
  });

  // Relations
  const { data: relations = {} } = useQuery({
    queryKey: ['graph-relations', entityType, selectedId],
    queryFn: async () => {
      if (!selectedId) return {};
      const rels: Record<string, any[]> = {};

      if (entityType === 'products') {
        const { data: hosts } = await supabase.from('product_hosts').select('*, hosts(*)').eq('product_id', selectedId);
        rels.hosts = (hosts || []).map((h: any) => h.hosts).filter(Boolean);
        const { data: pois } = await supabase.from('product_pois').select('*, pois(*)').eq('product_id', selectedId);
        rels.pois = (pois || []).map((p: any) => p.pois).filter(Boolean);
        const { data: options } = await supabase.from('options').select('*, price_options(*)').eq('product_id', selectedId);
        rels.options = options || [];
        const { data: themes } = await supabase.from('product_themes').select('*, themes(*)').eq('product_id', selectedId);
        rels.themes = (themes || []).map((t: any) => t.themes).filter(Boolean);
        const { data: media } = await supabase.from('media_assets').select('*').eq('entity_id', selectedId).eq('entity_type', 'product');
        rels.media = media || [];
        const { data: expRels } = await supabase.from('experience_relationships').select('*').or(`source_id.eq.${selectedId},target_id.eq.${selectedId}`);
        rels.relationships = expRels || [];
      }

      if (entityType === 'destinations') {
        const { data: areas } = await supabase.from('areas').select('*').eq('destination_id', selectedId);
        rels.areas = areas || [];
        const { data: products } = await supabase.from('products').select('id, title, slug').eq('destination_id', selectedId).limit(20);
        rels.products = products || [];
      }

      if (entityType === 'hosts') {
        const { data: products } = await supabase.from('product_hosts').select('*, products(id, title, slug)').eq('host_id', selectedId);
        rels.products = (products || []).map((p: any) => p.products).filter(Boolean);
      }

      return rels;
    },
    enabled: !!selectedId,
  });

  // Quality score
  const { data: qualityScore } = useQuery({
    queryKey: ['graph-quality', selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const { data } = await supabase.from('quality_scores').select('*').eq('entity_id', selectedId).maybeSingle();
      return data;
    },
    enabled: !!selectedId,
  });

  const nameField = entityType === 'products' ? 'title' : 'name';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Graph Inspector</h2>
        <p className="text-sm text-muted-foreground">Inspect any entity — relations, canonical info, quality score, graph completeness</p>
      </div>

      {/* Entity type selector + search */}
      <div className="flex gap-2 flex-wrap">
        {INSPECTABLE_TABLES.map(t => (
          <button
            key={t}
            onClick={() => { setEntityType(t); setSelectedId(null); setSearchTerm(''); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              entityType === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Search ${entityType}...`}
          className="pl-9"
        />
      </div>

      {/* Search results */}
      {searchResults.length > 0 && !selectedId && (
        <Card className="divide-y divide-border">
          {searchResults.map((r: any) => (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium">{r[nameField]}</p>
                <p className="text-xs text-muted-foreground font-mono">{r.slug || r.id?.slice(0, 8)}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </Card>
      )}

      {/* Entity detail view */}
      {selectedId && entityDetail && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>← Back</Button>
            <h3 className="text-lg font-bold">{entityDetail[nameField]}</h3>
          </div>

          {/* Meta cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 space-y-2">
              <h4 className="text-sm font-semibold">Identity</h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono">{entityDetail.id}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Slug</span><span className="font-mono">{entityDetail.slug || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Active</span><Badge variant={entityDetail.is_active ? 'default' : 'destructive'} className="text-[10px]">{entityDetail.is_active ? 'Yes' : 'No'}</Badge></div>
                {entityDetail.indexability_state && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Indexability</span><Badge variant="outline" className="text-[10px]">{entityDetail.indexability_state}</Badge></div>
                )}
                {entityDetail.canonical_url && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Canonical</span><span className="font-mono text-primary">{entityDetail.canonical_url}</span></div>
                )}
              </div>
            </Card>

            {qualityScore && (
              <Card className="p-4 space-y-2">
                <h4 className="text-sm font-semibold">Quality Score</h4>
                <div className="text-3xl font-bold">{qualityScore.overall_score}<span className="text-sm text-muted-foreground">/100</span></div>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span>Title: {qualityScore.title_score}</span>
                  <span>Media: {qualityScore.media_score}</span>
                  <span>Meta: {qualityScore.metadata_score}</span>
                  <span>Relations: {qualityScore.relation_score}</span>
                  <span>Schema: {qualityScore.schema_score}</span>
                  <span>Pairing: {qualityScore.pairing_score}</span>
                </div>
              </Card>
            )}
          </div>

          {/* Relations */}
          {Object.entries(relations).filter(([_, v]) => (v as any[]).length > 0).map(([key, items]) => (
            <Card key={key} className="p-4">
              <h4 className="text-sm font-semibold capitalize mb-2">{key} ({(items as any[]).length})</h4>
              <div className="space-y-1">
                {(items as any[]).slice(0, 10).map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50">
                    <span className="font-medium">{item.title || item.name || item.label || item.url || item.relationship_type || 'Item'}</span>
                    {item.slug && <span className="text-muted-foreground font-mono">/{item.slug}</span>}
                    {item.id && <span className="text-muted-foreground font-mono ml-auto">{item.id.slice(0, 8)}</span>}
                  </div>
                ))}
              </div>
            </Card>
          ))}

          {/* Raw JSON */}
          <Card className="p-4">
            <h4 className="text-sm font-semibold mb-2">Raw Data</h4>
            <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-[300px]">
              {JSON.stringify(entityDetail, null, 2)}
            </pre>
          </Card>
        </div>
      )}
    </div>
  );
};
