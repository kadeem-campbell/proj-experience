/**
 * Reusable Draft / Published / Public-in-app / Indexed pill controls.
 * Used by every admin entity editor (products, destinations, areas, pois, itineraries, categories, countries, hosts, collections).
 */
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Props {
  item: any;
  onChange: (field: string, value: any) => void;
  /** entity_type for the improve-entity-seo function (omit to hide AI button) */
  entityType?: 'destination' | 'country' | 'area' | 'poi' | 'itinerary' | 'category' | 'host' | 'collection';
  /** path label e.g. '/zanzibar' for context message */
  pathHint?: string;
}

export function EntityVisibilityControls({ item, onChange, entityType, pathHint }: Props) {
  const ps = item.publish_state || 'draft';
  const vis = item.visibility_output_state || 'internal_only';
  const idx = item.indexability_state || 'public_noindex';
  const isPublished = ps === 'published';
  const isPublic = vis === 'public' || vis === 'public_indexed' || vis === 'marketplace_active';
  const isIndexed = idx === 'public_indexed';

  const Pill = ({ active, label, onClick, color }: any) => (
    <button type="button" onClick={onClick}
      className={`flex-1 rounded-md px-2 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${active ? color : 'bg-muted text-muted-foreground'}`}>
      {label}
    </button>
  );

  const [improving, setImproving] = useState(false);
  const { toast } = useToast();

  const improveSeo = async () => {
    if (!entityType || !item.id) return;
    setImproving(true);
    try {
      const { data, error } = await supabase.functions.invoke('improve-entity-seo', {
        body: { entity_type: entityType, entity_id: item.id, apply: true },
      });
      if (error) throw error;
      if (data?.suggestion) {
        onChange('seo_title', data.suggestion.seo_title);
        onChange('seo_description', data.suggestion.seo_description);
        if (data.suggestion.short_description) onChange('short_description', data.suggestion.short_description);
        if (data.suggestion.long_description) onChange('long_description', data.suggestion.long_description);
        toast({ title: 'SEO improved', description: 'Title, description and copy refreshed by AI.' });
      }
    } catch (e: any) {
      toast({ title: 'AI improve failed', description: e.message || String(e), variant: 'destructive' });
    } finally {
      setImproving(false);
    }
  };

  return (
    <div className="rounded-lg border-2 border-border p-3 space-y-3">
      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Publish state</Label>
        <div className="flex gap-1.5">
          <Pill active={!isPublished} color="bg-muted-foreground/20 text-foreground" label="Draft"
            onClick={() => onChange('publish_state', 'draft')} />
          <Pill active={isPublished} color="bg-blue-500 text-white" label="Published"
            onClick={() => onChange('publish_state', 'published')} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Draft hides everywhere. Published makes it eligible.</p>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">In-app visibility</Label>
        <div className="flex gap-1.5">
          <Pill active={!isPublic} color="bg-amber-500 text-white" label="Internal only"
            onClick={() => onChange('visibility_output_state', 'internal_only')} />
          <Pill active={isPublic} color="bg-green-500 text-white" label="Public in app"
            onClick={() => onChange('visibility_output_state', 'public')} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Public = appears in app search, listings & carousels (requires Published).</p>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">Search engine + LLM indexing</Label>
        <div className="flex gap-1.5">
          <Pill active={!isIndexed} color="bg-muted-foreground/30 text-foreground" label="Noindex"
            onClick={() => onChange('indexability_state', 'public_noindex')} />
          <Pill active={isIndexed} color="bg-purple-500 text-white" label="Indexed"
            onClick={() => onChange('indexability_state', 'public_indexed')} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          Indexed = in sitemap.xml, served to Google + GPTBot/Claude/Google-Extended (requires Published + Public).
          {pathHint && <> Path: <span className="font-mono">{pathHint}</span></>}
        </p>
      </div>

      {isIndexed && (!isPublished || !isPublic) && (
        <div className="rounded-md bg-amber-500/10 border border-amber-500/40 p-2 text-[11px] text-amber-700 dark:text-amber-300">
          Indexed is set but item is not Published + Public — it will NOT appear in the sitemap until both are on.
        </div>
      )}

      {entityType && item.id && (
        <Button type="button" size="sm" variant="outline" className="w-full" disabled={improving} onClick={improveSeo}>
          <Sparkles className="w-3 h-3 mr-1" />
          {improving ? 'Improving…' : 'Improve SEO + description with AI'}
        </Button>
      )}
    </div>
  );
}
