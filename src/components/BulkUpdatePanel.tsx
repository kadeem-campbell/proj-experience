import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Check, AlertCircle } from 'lucide-react';

export const BulkUpdatePanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [field, setField] = useState('category');
  const [value, setValue] = useState('');
  const [ids, setIds] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);

  const fields = [
    { key: 'category', label: 'Category' },
    { key: 'location', label: 'Location' },
    { key: 'price', label: 'Price' },
    { key: 'duration', label: 'Duration' },
    { key: 'best_time', label: 'Best Time' },
    { key: 'weather', label: 'Weather' },
    { key: 'is_active', label: 'Active (true/false)' },
  ];

  const handleBulkUpdate = async () => {
    const idList = ids.split(/[\n,]+/).map(id => id.trim()).filter(Boolean);
    if (idList.length === 0 || !value.trim()) {
      toast({ title: 'Missing data', description: 'Enter IDs and a value', variant: 'destructive' });
      return;
    }

    setLoading(true);
    let success = 0;
    let failed = 0;

    const updateValue = field === 'is_active' ? value.trim().toLowerCase() === 'true' : value.trim();

    for (const id of idList) {
      const { error } = await supabase
        .from('experiences')
        .update({ [field]: updateValue } as any)
        .eq('id', id);
      if (error) {
        failed++;
      } else {
        success++;
      }
    }

    setResults({ success, failed });
    setLoading(false);
    queryClient.invalidateQueries({ queryKey: ['db-experiences'] });
    queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });
    toast({ title: 'Bulk update complete', description: `${success} updated, ${failed} failed` });
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Bulk Update Experiences</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Paste experience IDs (one per line or comma-separated) and select a field to update all at once.
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
          <Textarea
            value={ids}
            onChange={e => setIds(e.target.value)}
            placeholder="Paste UUIDs, one per line or comma-separated"
            rows={6}
            style={{ fontSize: '14px' }}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {ids.split(/[\n,]+/).filter(s => s.trim()).length} IDs entered
          </p>
        </div>

        <Button onClick={handleBulkUpdate} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Update {ids.split(/[\n,]+/).filter(s => s.trim()).length} experiences
        </Button>

        {results && (
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-[hsl(var(--success))]" />
            <span>{results.success} updated</span>
            {results.failed > 0 && (
              <>
                <AlertCircle className="w-4 h-4 text-destructive ml-2" />
                <span>{results.failed} failed</span>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
