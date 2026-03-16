/**
 * Bulk Operations — direct bulk actions, CSV import, JSON update tools.
 * Consolidated from BulkUploader and BulkUpdatePanel.
 */
import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, Download, Loader2, Check, AlertCircle, FileSpreadsheet, Code2 } from 'lucide-react';

type TableName = 'products' | 'destinations' | 'areas' | 'hosts' | 'activity_types' | 'themes' | 'pois' | 'collections' | 'public_itineraries' | 'options' | 'price_options';

const TABLES: { value: TableName; label: string }[] = [
  { value: 'products', label: 'Products' },
  { value: 'destinations', label: 'Destinations' },
  { value: 'areas', label: 'Areas' },
  { value: 'hosts', label: 'Hosts' },
  { value: 'activity_types', label: 'Activity Types' },
  { value: 'themes', label: 'Themes' },
  { value: 'pois', label: 'POIs' },
  { value: 'collections', label: 'Collections' },
  { value: 'public_itineraries', label: 'Itineraries' },
  { value: 'options', label: 'Options' },
  { value: 'price_options', label: 'Price Options' },
];

const parseCSV = (text: string): string[][] => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (line[i] === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
      else current += line[i];
    }
    result.push(current.trim());
    return result;
  });
};

export const AdminBulkOps = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Bulk Operations</h2>
      <p className="text-sm text-muted-foreground mb-4">Import, export, and bulk-update any entity table</p>

      <Tabs defaultValue="csv-import">
        <TabsList className="mb-4">
          <TabsTrigger value="csv-import" className="gap-1"><Upload className="w-3 h-3" /> CSV Import</TabsTrigger>
          <TabsTrigger value="json-update" className="gap-1"><Code2 className="w-3 h-3" /> JSON Update</TabsTrigger>
          <TabsTrigger value="field-update" className="gap-1"><FileSpreadsheet className="w-3 h-3" /> Field Update</TabsTrigger>
        </TabsList>

        <TabsContent value="csv-import"><CSVImportPanel /></TabsContent>
        <TabsContent value="json-update"><JSONUpdatePanel /></TabsContent>
        <TabsContent value="field-update"><FieldUpdatePanel /></TabsContent>
      </Tabs>
    </div>
  );
};

// ============ CSV IMPORT ============
const CSVImportPanel = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [table, setTable] = useState<TableName>('products');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast({ title: 'Please log in', variant: 'destructive' }); return; }

    setUploading(true);
    setResult(null);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) { toast({ title: 'Invalid CSV', variant: 'destructive' }); setUploading(false); return; }

      const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
      const dataRows = rows.slice(1).filter(r => r.some(c => c.length > 0));
      let success = 0, failed = 0;
      const errors: string[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        const obj: Record<string, any> = {};
        headers.forEach((h, idx) => {
          const val = dataRows[i][idx] || '';
          // Auto-convert numbers and booleans
          if (val === 'true') obj[h] = true;
          else if (val === 'false') obj[h] = false;
          else if (/^-?\d+\.?\d*$/.test(val) && !['name', 'title', 'slug', 'description'].includes(h)) obj[h] = parseFloat(val);
          else obj[h] = val;
        });

        // Remove empty strings for non-required fields
        Object.keys(obj).forEach(k => { if (obj[k] === '') delete obj[k]; });

        const { error } = await (supabase as any).from(table).insert(obj);
        if (error) { failed++; errors.push(`Row ${i + 2}: ${error.message}`); }
        else success++;
      }

      setResult({ success, failed, errors });
      qc.invalidateQueries();
      toast({ title: `Import complete: ${success} created, ${failed} failed` });
    } catch (err: any) {
      toast({ title: 'Import failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium">Target Table</p>
            <Select value={table} onValueChange={v => setTable(v as TableName)}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>{TABLES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <div className="border-2 border-dashed rounded-xl p-8 text-center">
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleUpload} />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading} size="lg">
            {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</> : <><Upload className="w-4 h-4 mr-2" /> Choose CSV & Import</>}
          </Button>
          <p className="text-xs text-muted-foreground mt-3">CSV headers must match database column names. UUIDs auto-generated.</p>
        </div>

        {result && (
          <div className="p-4 rounded-lg border space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-emerald-500" /> {result.success} created
              {result.failed > 0 && <><AlertCircle className="w-4 h-4 text-destructive ml-2" /> {result.failed} failed</>}
            </div>
            {result.errors.length > 0 && (
              <div className="bg-destructive/10 p-2 rounded text-xs max-h-32 overflow-y-auto space-y-0.5">
                {result.errors.map((e, i) => <p key={i} className="text-destructive">{e}</p>)}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

// ============ JSON UPDATE ============
const JSONUpdatePanel = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [table, setTable] = useState<TableName>('products');
  const [jsonInput, setJsonInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const handleUpdate = async () => {
    let records: any[];
    try { records = JSON.parse(jsonInput); if (!Array.isArray(records)) records = [records]; }
    catch { toast({ title: 'Invalid JSON', variant: 'destructive' }); return; }

    if (!records.length || !records[0]?.id) { toast({ title: 'Each object must have "id"', variant: 'destructive' }); return; }

    setLoading(true);
    let success = 0, failed = 0;
    const errors: string[] = [];

    for (const record of records) {
      const { id, created_at, updated_at, ...rest } = record;
      const { error } = await (supabase as any).from(table).update(rest).eq('id', id);
      if (error) { failed++; errors.push(`${id}: ${error.message}`); } else success++;
    }

    setResult({ success, failed, errors });
    setLoading(false);
    qc.invalidateQueries();
    toast({ title: `${success} updated, ${failed} failed` });
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Target Table</p>
          <Select value={table} onValueChange={v => setTable(v as TableName)}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>{TABLES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Textarea value={jsonInput} onChange={e => setJsonInput(e.target.value)} placeholder={`[\n  { "id": "uuid", "title": "New Title" }\n]`} rows={12} className="font-mono text-xs" />
        <Button onClick={handleUpdate} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Update via JSON
        </Button>
        {result && (
          <div className="text-sm">
            <Check className="inline w-4 h-4 text-emerald-500 mr-1" />{result.success} updated
            {result.failed > 0 && <span className="ml-2 text-destructive">{result.failed} failed</span>}
          </div>
        )}
      </div>
    </Card>
  );
};

// ============ FIELD UPDATE ============
const FieldUpdatePanel = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [table, setTable] = useState<TableName>('products');
  const [field, setField] = useState('');
  const [value, setValue] = useState('');
  const [ids, setIds] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    const idList = ids.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (!idList.length || !field || !value) { toast({ title: 'Fill all fields', variant: 'destructive' }); return; }

    setLoading(true);
    let success = 0, failed = 0;
    let updateValue: any = value;
    if (value === 'true') updateValue = true;
    else if (value === 'false') updateValue = false;
    else if (/^-?\d+\.?\d*$/.test(value)) updateValue = parseFloat(value);

    for (const id of idList) {
      const { error } = await (supabase as any).from(table).update({ [field]: updateValue }).eq('id', id);
      if (error) failed++; else success++;
    }

    setLoading(false);
    qc.invalidateQueries();
    toast({ title: `${success} updated, ${failed} failed` });
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm font-medium mb-1">Table</p>
            <Select value={table} onValueChange={v => setTable(v as TableName)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TABLES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Field name</p>
            <Input value={field} onChange={e => setField(e.target.value)} placeholder="e.g. is_active" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium mb-1">New value</p>
          <Input value={value} onChange={e => setValue(e.target.value)} placeholder="e.g. true" />
        </div>
        <div>
          <p className="text-sm font-medium mb-1">IDs (one per line or comma-separated)</p>
          <Textarea value={ids} onChange={e => setIds(e.target.value)} rows={6} className="font-mono text-xs" />
          <p className="text-xs text-muted-foreground mt-1">{ids.split(/[\n,]+/).filter(Boolean).length} IDs</p>
        </div>
        <Button onClick={handleUpdate} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Update Field
        </Button>
      </div>
    </Card>
  );
};
