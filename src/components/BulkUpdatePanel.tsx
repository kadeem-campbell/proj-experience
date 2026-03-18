import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Check, AlertCircle } from 'lucide-react';

export const BulkUpdatePanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'field' | 'json'>('field');

  // --- Field mode state ---
  const [field, setField] = useState('category');
  const [value, setValue] = useState('');
  const [ids, setIds] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

  // --- JSON mode state ---
  const [jsonInput, setJsonInput] = useState('');
  const [jsonLoading, setJsonLoading] = useState(false);
  const [jsonResults, setJsonResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const fields = [
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'category', label: 'Category' },
    { key: 'location', label: 'Location' },
    { key: 'price', label: 'Price' },
    { key: 'duration', label: 'Duration' },
    { key: 'group_size', label: 'Group Size' },
    { key: 'best_time', label: 'Best Time' },
    { key: 'weather', label: 'Weather' },
    { key: 'creator', label: 'Creator' },
    { key: 'video_thumbnail', label: 'Video Thumbnail URL' },
    { key: 'video_url', label: 'Video URL' },
    { key: 'instagram_embed', label: 'Instagram Embed' },
    { key: 'slug', label: 'Slug' },
    { key: 'rating', label: 'Rating' },
    { key: 'is_active', label: 'Active (true/false)' },
    { key: 'destination_id', label: 'Destination ID (UUID)' },
    { key: 'creator_id', label: 'Creator ID (UUID)' },
  ];

  const handleFieldUpdate = async () => {
    const idList = ids.split(/[\n,]+/).map(id => id.trim()).filter(Boolean);
    if (idList.length === 0 || !value.trim()) {
      toast({ title: 'Missing data', description: 'Enter IDs and a value', variant: 'destructive' });
      return;
    }

    setLoading(true);
    let success = 0;
    let failed = 0;

    let updateValue: any = value.trim();
    if (field === 'is_active') updateValue = updateValue.toLowerCase() === 'true';
    else if (field === 'rating') updateValue = parseFloat(updateValue) || 4.7;

    for (const id of idList) {
      const { error } = await supabase
        .from('experiences')
        .update({ [field]: updateValue } as any)
        .eq('id', id);
      if (error) failed++;
      else success++;
    }

    setResults({ success, failed });
    setLoading(false);
    queryClient.invalidateQueries({ queryKey: ['db-experiences'] });
    queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });
    toast({ title: 'Bulk update complete', description: `${success} updated, ${failed} failed` });
  };

  const handleJsonUpdate = async () => {
    let records: any[];
    try {
      const parsed = JSON.parse(jsonInput);
      records = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      toast({ title: 'Invalid JSON', description: 'Paste a valid JSON array of objects with "id" field', variant: 'destructive' });
      return;
    }

    if (records.length === 0 || !records[0]?.id) {
      toast({ title: 'No records', description: 'Each object must have an "id" field (UUID)', variant: 'destructive' });
      return;
    }

    setJsonLoading(true);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // Allowed columns on experiences table
    const allowedCols = new Set([
      'title', 'description', 'category', 'location', 'price', 'duration',
      'group_size', 'rating', 'weather', 'best_time', 'video_thumbnail',
      'video_url', 'gallery', 'highlights', 'meeting_points', 'faqs',
      'tiktok_videos', 'instagram_embed', 'social_links', 'views',
      'is_active', 'destination_id', 'creator_id', 'creator', 'slug',
      'like_count', 'view_count',
    ]);

    for (const record of records) {
      const { id, ...rest } = record;
      if (!id) { failed++; errors.push('Missing id'); continue; }

      // Filter to allowed columns only
      const payload: Record<string, any> = {};
      for (const [k, v] of Object.entries(rest)) {
        if (allowedCols.has(k)) payload[k] = v;
      }

      if (Object.keys(payload).length === 0) {
        failed++;
        errors.push(`${id}: no valid columns`);
        continue;
      }

      const { error } = await supabase
        .from('experiences')
        .update(payload as any)
        .eq('id', id);

      if (error) {
        failed++;
        errors.push(`${id}: ${error.message}`);
      } else {
        success++;
      }
    }

    setJsonResults({ success, failed, errors });
    setJsonLoading(false);
    queryClient.invalidateQueries({ queryKey: ['db-experiences'] });
    queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });
    toast({ title: 'JSON bulk update complete', description: `${success} updated, ${failed} failed` });
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Bulk Update Experiences</h2>

      <Tabs value={mode} onValueChange={(v) => setMode(v as 'field' | 'json')}>
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="field">Single Field</TabsTrigger>
          <TabsTrigger value="json">Full JSON</TabsTrigger>
        </TabsList>

        <TabsContent value="field">
          <p className="text-sm text-muted-foreground mb-4">
            Update one field across multiple experiences by pasting UUIDs.
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Field to update</label>
              <Select value={field} onValueChange={setField}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {fields.map(f => (
                    <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">New value</label>
              <Input value={value} onChange={e => setValue(e.target.value)} placeholder="e.g. Adventure" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Experience IDs</label>
              <Textarea value={ids} onChange={e => setIds(e.target.value)} placeholder="Paste UUIDs, one per line or comma-separated" rows={6} style={{ fontSize: '14px' }} />
              <p className="text-xs text-muted-foreground mt-1">{ids.split(/[\n,]+/).filter(s => s.trim()).length} IDs entered</p>
            </div>
            <Button onClick={handleFieldUpdate} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update {ids.split(/[\n,]+/).filter(s => s.trim()).length} experiences
            </Button>
            {results && (
              <div className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary" />
                <span>{results.success} updated</span>
                {results.failed > 0 && (<><AlertCircle className="w-4 h-4 text-destructive ml-2" /><span>{results.failed} failed</span></>)}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="json">
          <p className="text-sm text-muted-foreground mb-2">
            Paste a JSON array of experience objects. Each must have an <code className="bg-muted px-1 rounded">"id"</code> (UUID). All other valid columns will be updated.
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Valid columns: title, description, category, location, price, duration, group_size, rating, weather, best_time, 
            video_thumbnail, video_url, gallery, highlights, meeting_points, faqs, tiktok_videos, instagram_embed, 
            social_links, views, is_active, city_id, creator_id, creator, slug, like_count, view_count
          </p>
          <div className="space-y-4">
            <Textarea
              value={jsonInput}
              onChange={e => setJsonInput(e.target.value)}
              placeholder={`[\n  {\n    "id": "uuid-here",\n    "title": "New Title",\n    "price": "$50",\n    "category": "Adventure",\n    "highlights": ["highlight 1", "highlight 2"]\n  }\n]`}
              rows={12}
              className="font-mono text-xs"
            />
            <Button onClick={handleJsonUpdate} disabled={jsonLoading} className="w-full">
              {jsonLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Bulk Update via JSON
            </Button>
            {jsonResults && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary" />
                  <span>{jsonResults.success} updated</span>
                  {jsonResults.failed > 0 && (<><AlertCircle className="w-4 h-4 text-destructive ml-2" /><span>{jsonResults.failed} failed</span></>)}
                </div>
                {jsonResults.errors.length > 0 && (
                  <div className="bg-destructive/10 p-2 rounded text-xs space-y-0.5 max-h-32 overflow-y-auto">
                    {jsonResults.errors.map((e, i) => <p key={i} className="text-destructive">{e}</p>)}
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
