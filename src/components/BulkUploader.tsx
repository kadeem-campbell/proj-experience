import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, AlertCircle, Check, Loader2, Download, Link2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type UploadType = 'experiences' | 'categories' | 'cities' | 'creators' | 'itineraries' | 'collections' | 'itinerary_experiences' | 'collection_experiences';

interface UploadResult {
  total: number;
  success: number;
  errors: string[];
}

const TEMPLATES: Record<UploadType, { headers: string[]; example: string[] }> = {
  experiences: {
    headers: ['title', 'category', 'location', 'creator', 'description', 'price', 'duration', 'group_size', 'rating', 'video_thumbnail', 'video_url', 'instagram_embed', 'best_time', 'weather', 'slug'],
    example: ['Jet Ski Adventure', 'Water Sports', 'Zanzibar', 'JohnDoe', 'Amazing jet ski experience', '$30 - $80', '2 hours', '4-8 people', '4.8', 'https://example.com/photo.jpg', '', '', 'Morning', 'Sunny 30°C', 'jet-ski-adventure'],
  },
  categories: {
    headers: ['name', 'emoji', 'description', 'display_order'],
    example: ['Water Sports', '🏄', 'All water activities', '1'],
  },
  cities: {
    headers: ['name', 'country', 'airport_code', 'flag_emoji', 'latitude', 'longitude', 'cover_image'],
    example: ['Zanzibar', 'Tanzania', 'ZNZ', '🇹🇿', '-6.1659', '39.2026', 'https://example.com/znz.jpg'],
  },
  creators: {
    headers: ['username', 'display_name', 'bio', 'avatar_url', 'is_verified'],
    example: ['johndoe', 'John Doe', 'Adventure creator', 'https://example.com/avatar.jpg', 'false'],
  },
  itineraries: {
    headers: ['name', 'slug', 'description', 'cover_image', 'tag'],
    example: ['Zanzibar Weekend', 'zanzibar-weekend', 'Perfect weekend getaway', 'https://example.com/cover.jpg', 'popular'],
  },
  collections: {
    headers: ['name', 'slug', 'description', 'cover_image', 'collection_type', 'tag'],
    example: ['Beach Vibes', 'beach-vibes', 'Best beaches', 'https://example.com/beach.jpg', 'experiences', 'featured'],
  },
  itinerary_experiences: {
    headers: ['itinerary_slug', 'experience_slug', 'display_order', 'notes'],
    example: ['zanzibar-weekend', 'jet-ski-adventure', '1', 'Must do!'],
  },
  collection_experiences: {
    headers: ['collection_slug', 'experience_slug', 'display_order'],
    example: ['beach-vibes', 'tropical-beach-paradise', '1'],
  },
};

const parseCSV = (text: string): string[][] => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (line[i] === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += line[i];
      }
    }
    result.push(current.trim());
    return result;
  });
};

// Normalize header names to match DB columns
const normalizeHeader = (h: string): string => {
  return h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
};

export const BulkUploader = () => {
  const [activeTab, setActiveTab] = useState<UploadType>('experiences');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const downloadTemplate = (type: UploadType) => {
    const tmpl = TEMPLATES[type];
    const csv = [tmpl.headers.join(','), tmpl.example.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${type}_template.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });
    queryClient.invalidateQueries({ queryKey: ['db-experiences'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['cities'] });
    queryClient.invalidateQueries({ queryKey: ['creators'] });
    queryClient.invalidateQueries({ queryKey: ['collections'] });
    queryClient.invalidateQueries({ queryKey: ['public-itineraries'] });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check auth first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({ title: 'Please log in first', description: 'You need to be signed in to upload data.', variant: 'destructive' });
      if (fileRef.current) fileRef.current.value = '';
      return;
    }

    setUploading(true);
    setResult(null);
    setProgress({ current: 0, total: 0 });

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) {
        toast({ title: 'Invalid CSV', description: 'Need at least a header row and one data row.', variant: 'destructive' });
        setUploading(false);
        return;
      }

      const headers = rows[0].map(normalizeHeader);
      const dataRows = rows.slice(1).filter(row => row.some(cell => cell.length > 0)); // skip empty rows
      const errors: string[] = [];
      let success = 0;
      setProgress({ current: 0, total: dataRows.length });

      const currentTab = activeTab; // capture for async

      // Direct table inserts
      if (['experiences', 'categories', 'cities', 'creators', 'itineraries', 'collections'].includes(currentTab)) {
        // Process in batches of 10
        const BATCH_SIZE = 10;
        for (let batchStart = 0; batchStart < dataRows.length; batchStart += BATCH_SIZE) {
          const batch = dataRows.slice(batchStart, batchStart + BATCH_SIZE);
          const records: Record<string, any>[] = [];

          for (let i = 0; i < batch.length; i++) {
            const rowNum = batchStart + i + 2;
            const obj: Record<string, any> = {};
            headers.forEach((h, idx) => { obj[h] = batch[i][idx] || ''; });

            try {
              if (currentTab === 'experiences') {
                const slug = obj.slug || obj.title?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') || `exp-${rowNum}`;
                records.push({
                  title: obj.title || `Experience ${rowNum}`,
                  category: obj.category || 'Adventure',
                  location: obj.location || '',
                  creator: obj.creator || '',
                  description: obj.description || '',
                  price: obj.price || '',
                  duration: obj.duration || '',
                  group_size: obj.group_size || '',
                  rating: obj.rating ? parseFloat(obj.rating) : 4.7,
                  video_thumbnail: obj.video_thumbnail || '',
                  video_url: obj.video_url || '',
                  instagram_embed: obj.instagram_embed || '',
                  best_time: obj.best_time || '',
                  weather: obj.weather || '',
                  slug,
                });
              } else if (currentTab === 'categories') {
                records.push({
                  name: obj.name || `Category ${rowNum}`,
                  emoji: obj.emoji || '',
                  description: obj.description || '',
                  display_order: parseInt(obj.display_order) || 0,
                });
              } else if (currentTab === 'cities') {
                records.push({
                  name: obj.name || `City ${rowNum}`,
                  country: obj.country || '',
                  airport_code: obj.airport_code || '',
                  flag_emoji: obj.flag_emoji || '',
                  latitude: obj.latitude ? parseFloat(obj.latitude) : 0,
                  longitude: obj.longitude ? parseFloat(obj.longitude) : 0,
                  cover_image: obj.cover_image || '',
                });
              } else if (currentTab === 'creators') {
                records.push({
                  username: obj.username || `creator-${rowNum}`,
                  display_name: obj.display_name || '',
                  bio: obj.bio || '',
                  avatar_url: obj.avatar_url || '',
                  is_verified: obj.is_verified === 'true',
                });
              } else if (currentTab === 'itineraries') {
                records.push({
                  name: obj.name || `Itinerary ${rowNum}`,
                  slug: obj.slug || obj.name?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') || `itin-${rowNum}`,
                  description: obj.description || '',
                  cover_image: obj.cover_image || '',
                  tag: obj.tag || 'popular',
                });
              } else if (currentTab === 'collections') {
                records.push({
                  name: obj.name || `Collection ${rowNum}`,
                  slug: obj.slug || obj.name?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') || `coll-${rowNum}`,
                  description: obj.description || '',
                  cover_image: obj.cover_image || '',
                  collection_type: obj.collection_type || 'experiences',
                  tag: obj.tag || '',
                });
              }
            } catch (parseErr: any) {
              errors.push(`Row ${rowNum}: Parse error - ${parseErr.message}`);
            }
          }

          if (records.length > 0) {
            const tableName = currentTab === 'itineraries' ? 'public_itineraries' : currentTab;
            const { error } = await (supabase as any).from(tableName).insert(records);
            if (error) {
              // If batch fails, try one by one
              for (let i = 0; i < records.length; i++) {
                const rowNum = batchStart + i + 2;
                const { error: singleErr } = await (supabase as any).from(tableName).insert(records[i]);
                if (singleErr) {
                  errors.push(`Row ${rowNum}: ${singleErr.message}`);
                } else {
                  success++;
                }
              }
            } else {
              success += records.length;
            }
          }

          setProgress({ current: Math.min(batchStart + BATCH_SIZE, dataRows.length), total: dataRows.length });
        }
      } else if (currentTab === 'itinerary_experiences') {
        // Link by slug
        for (let i = 0; i < dataRows.length; i++) {
          const rowNum = i + 2;
          const obj: Record<string, any> = {};
          headers.forEach((h, idx) => { obj[h] = dataRows[i][idx] || ''; });

          const itinSlug = obj.itinerary_slug?.trim();
          const expSlug = obj.experience_slug?.trim();

          if (!itinSlug || !expSlug) {
            errors.push(`Row ${rowNum}: Missing itinerary_slug or experience_slug`);
            continue;
          }

          const { data: itin } = await supabase.from('public_itineraries').select('id').eq('slug', itinSlug).maybeSingle();
          const { data: exp } = await supabase.from('experiences').select('id').eq('slug', expSlug).maybeSingle();

          if (!itin) { errors.push(`Row ${rowNum}: Itinerary slug "${itinSlug}" not found`); continue; }
          if (!exp) { errors.push(`Row ${rowNum}: Experience slug "${expSlug}" not found`); continue; }

          const { error } = await (supabase as any).from('itinerary_experiences').insert({
            itinerary_id: itin.id,
            experience_id: exp.id,
            display_order: parseInt(obj.display_order) || 0,
            notes: obj.notes || '',
          });
          if (error) errors.push(`Row ${rowNum}: ${error.message}`); else success++;
          setProgress({ current: i + 1, total: dataRows.length });
        }
      } else if (currentTab === 'collection_experiences') {
        for (let i = 0; i < dataRows.length; i++) {
          const rowNum = i + 2;
          const obj: Record<string, any> = {};
          headers.forEach((h, idx) => { obj[h] = dataRows[i][idx] || ''; });

          const collSlug = obj.collection_slug?.trim();
          const expSlug = obj.experience_slug?.trim();

          if (!collSlug || !expSlug) {
            errors.push(`Row ${rowNum}: Missing collection_slug or experience_slug`);
            continue;
          }

          const { data: coll } = await supabase.from('collections').select('id').eq('slug', collSlug).maybeSingle();
          const { data: exp } = await supabase.from('experiences').select('id').eq('slug', expSlug).maybeSingle();

          if (!coll) { errors.push(`Row ${rowNum}: Collection slug "${collSlug}" not found`); continue; }
          if (!exp) { errors.push(`Row ${rowNum}: Experience slug "${expSlug}" not found`); continue; }

          const { error } = await (supabase as any).from('collection_experiences').insert({
            collection_id: coll.id,
            experience_id: exp.id,
            display_order: parseInt(obj.display_order) || 0,
          });
          if (error) errors.push(`Row ${rowNum}: ${error.message}`); else success++;
          setProgress({ current: i + 1, total: dataRows.length });
        }
      }

      setResult({ total: dataRows.length, success, errors });
      invalidateAll();

      if (errors.length === 0) {
        toast({ title: '✅ Upload complete', description: `${success} rows imported successfully` });
      } else {
        toast({ title: `Upload done with ${errors.length} errors`, description: `${success}/${dataRows.length} rows imported`, variant: errors.length > success ? 'destructive' : 'default' });
      }
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      setProgress({ current: 0, total: 0 });
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const tabLabel: Record<UploadType, string> = {
    experiences: 'Experiences',
    categories: 'Categories',
    cities: 'Cities',
    creators: 'Creators',
    itineraries: 'Itineraries',
    collections: 'Collections',
    itinerary_experiences: 'Link → Itinerary',
    collection_experiences: 'Link → Collection',
  };

  const isLinkTab = (key: string) => key === 'itinerary_experiences' || key === 'collection_experiences';

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="text-center mb-6">
          <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-semibold mb-2">Bulk Upload</h3>
          <p className="text-sm text-muted-foreground">Upload CSV files to create content across all tables. Download a template first, fill it out, then upload.</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as UploadType); setResult(null); }}>
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 mb-4">
            {Object.entries(tabLabel).map(([key, label]) => (
              <TabsTrigger key={key} value={key} className="text-xs px-2">
                {isLinkTab(key) ? <Link2 className="w-3 h-3 mr-1" /> : <FileSpreadsheet className="w-3 h-3 mr-1" />}
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(tabLabel).map(key => (
            <TabsContent key={key} value={key}>
              <div className="space-y-4">
                {/* Template info */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">CSV Template — {tabLabel[key as UploadType]}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Required columns: <code className="bg-muted px-1 rounded">{TEMPLATES[key as UploadType].headers.join(', ')}</code>
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => downloadTemplate(key as UploadType)} className="shrink-0">
                    <Download className="w-4 h-4 mr-1" /> Template
                  </Button>
                </div>

                {/* Upload area */}
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={handleUpload}
                    key={`${activeTab}-${Date.now()}`}
                  />
                  <Button onClick={() => fileRef.current?.click()} disabled={uploading} size="lg" className="mx-auto">
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading {progress.current}/{progress.total}...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" /> Choose CSV File & Upload
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    {isLinkTab(key)
                      ? '💡 Use slugs to link existing items. Make sure the referenced items exist first.'
                      : '💡 Each row creates a new record. Download the template above for correct format.'}
                  </p>
                </div>

                {/* Progress bar */}
                {uploading && progress.total > 0 && (
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                )}

                {/* Results */}
                {result && (
                  <div className="p-4 rounded-lg border space-y-2">
                    <div className="flex items-center gap-2">
                      {result.errors.length === 0 ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                      )}
                      <span className="text-sm font-semibold">
                        {result.success}/{result.total} rows imported successfully
                      </span>
                    </div>
                    {result.errors.length > 0 && (
                      <div className="space-y-1 max-h-48 overflow-y-auto mt-2 p-2 bg-muted/50 rounded">
                        {result.errors.map((err, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-destructive">
                            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /><span>{err}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
};
