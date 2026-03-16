/**
 * JSON Inspector — raw entity viewing, schema validation, payload comparison.
 */
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Copy, Download, Check, AlertTriangle } from 'lucide-react';

const TABLES = ['products', 'destinations', 'areas', 'hosts', 'pois', 'themes', 'activity_types', 'collections', 'public_itineraries', 'options', 'price_options', 'experiences', 'creators', 'media_assets', 'reviews'];

export const AdminJsonTools = () => {
  const { toast } = useToast();
  const [table, setTable] = useState('products');
  const [entityId, setEntityId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [validationInput, setValidationInput] = useState('');
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);

  const fetchEntity = async () => {
    if (!entityId.trim()) return;
    const { data, error } = await (supabase as any).from(table).select('*').eq('id', entityId.trim()).maybeSingle();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    if (!data) { toast({ title: 'Not found', variant: 'destructive' }); return; }
    setResult(data);
  };

  const searchEntities = async () => {
    if (!searchTerm.trim()) return;
    const q = searchTerm.trim().toLowerCase();
    // Try by name/title first
    const { data } = await (supabase as any).from(table).select('*')
      .or(`title.ilike.%${q}%,name.ilike.%${q}%,slug.ilike.%${q}%,display_name.ilike.%${q}%,username.ilike.%${q}%`)
      .limit(5);
    if (data && data.length > 0) {
      setResult(data.length === 1 ? data[0] : data);
    } else {
      toast({ title: 'No matches found' });
    }
  };

  const validateJson = () => {
    try {
      const parsed = JSON.parse(validationInput);
      const errors: string[] = [];

      if (Array.isArray(parsed)) {
        parsed.forEach((item, i) => {
          if (typeof item !== 'object') errors.push(`Item ${i}: not an object`);
          if (item && !item.id && table !== 'new') errors.push(`Item ${i}: missing 'id' field`);
        });
      } else if (typeof parsed === 'object') {
        if (!parsed.id && table !== 'new') errors.push(`Missing 'id' field`);
        // Check for known field types
        if (parsed.is_active !== undefined && typeof parsed.is_active !== 'boolean') errors.push(`'is_active' should be boolean`);
        if (parsed.display_order !== undefined && typeof parsed.display_order !== 'number') errors.push(`'display_order' should be number`);
        if (parsed.latitude !== undefined && typeof parsed.latitude !== 'number') errors.push(`'latitude' should be number`);
        if (parsed.longitude !== undefined && typeof parsed.longitude !== 'number') errors.push(`'longitude' should be number`);
      } else {
        errors.push('Must be an object or array');
      }

      setValidationResult({ valid: errors.length === 0, errors });
    } catch (e: any) {
      setValidationResult({ valid: false, errors: [`Parse error: ${e.message}`] });
    }
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    toast({ title: 'Copied to clipboard' });
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${table}_${entityId || 'export'}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">JSON Inspector</h2>
      <p className="text-sm text-muted-foreground mb-4">View raw entity data, validate payloads, compare structures</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entity Lookup */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3">Entity Lookup</h3>
          <div className="space-y-3">
            <Select value={table} onValueChange={setTable}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TABLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input placeholder="Entity UUID" value={entityId} onChange={e => setEntityId(e.target.value)} className="font-mono text-xs" />
              <Button size="sm" onClick={fetchEntity}>Fetch</Button>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Search by name/title/slug..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <Button size="sm" variant="outline" onClick={searchEntities}><Search className="w-4 h-4" /></Button>
            </div>

            {result && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">{table}</Badge>
                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={copyJson}><Copy className="w-3 h-3 mr-1" /> Copy</Button>
                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={downloadJson}><Download className="w-3 h-3 mr-1" /> Download</Button>
                </div>
                <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-auto max-h-[400px] whitespace-pre-wrap">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Card>

        {/* JSON Validator */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3">JSON Validator</h3>
          <div className="space-y-3">
            <Textarea
              value={validationInput}
              onChange={e => setValidationInput(e.target.value)}
              placeholder={`Paste JSON to validate...\n{\n  "id": "uuid",\n  "title": "My Product"\n}`}
              rows={12}
              className="font-mono text-xs"
            />
            <Button onClick={validateJson} className="w-full">Validate JSON</Button>
            {validationResult && (
              <div className={`p-3 rounded-lg border ${validationResult.valid ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
                <div className="flex items-center gap-2 text-sm font-medium">
                  {validationResult.valid ? <><Check className="w-4 h-4 text-emerald-500" /> Valid JSON</> : <><AlertTriangle className="w-4 h-4 text-destructive" /> Invalid</>}
                </div>
                {validationResult.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {validationResult.errors.map((e, i) => <p key={i} className="text-xs text-destructive">{e}</p>)}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
