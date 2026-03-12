import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, AlertCircle, Check, Loader2, Download, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type UploadType = 'experiences' | 'itineraries' | 'collections' | 'itinerary_experiences' | 'collection_experiences';

interface UploadResult {
  total: number;
  success: number;
  errors: string[];
}

const TEMPLATES: Record<UploadType, { headers: string[]; example: string[] }> = {
  experiences: {
    headers: ['title', 'category', 'location', 'creator', 'description', 'price', 'duration', 'group_size', 'rating', 'video_thumbnail', 'video_url', 'instagram_embed', 'best_time', 'weather'],
    example: ['Jet Ski Adventure', 'Water Sports', 'Zanzibar', 'JohnDoe', 'Amazing jet ski experience', '$30 - $80', '2 hours', '4-8 people', '4.8', 'https://example.com/photo.jpg', '', '', 'Morning', 'Sunny 30°C'],
  },
  itineraries: {
    headers: ['name', 'slug', 'description', 'cover_image', 'tag'],
    example: ['Zanzibar Weekend', 'zanzibar-weekend', 'Perfect weekend getaway', 'https://example.com/cover.jpg', 'popular'],
  },
  collections: {
    headers: ['name', 'slug', 'description', 'cover_image', 'collection_type', 'tag'],
    example: ['Beach Vibes', 'beach-vibes', 'Best beaches in Zanzibar', 'https://example.com/beach.jpg', 'experiences', 'featured'],
  },
  itinerary_experiences: {
    headers: ['itinerary_slug', 'experience_slug', 'display_order', 'notes'],
    example: ['zanzibar-weekend', 'jet-ski-adventure', '1', 'Must do first!'],
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
        inQuotes = !inQuotes;
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

export const BulkUploader = () => {
  const [activeTab, setActiveTab] = useState<UploadType>('experiences');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const downloadTemplate = (type: UploadType) => {
    const tmpl = TEMPLATES[type];
    const csv = [tmpl.headers.join(','), tmpl.example.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) {
        toast({ title: 'File must have at least a header row and one data row', variant: 'destructive' });
        setUploading(false);
        return;
      }

      const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
      const dataRows = rows.slice(1);
      const errors: string[] = [];
      let success = 0;

      if (activeTab === 'experiences') {
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const obj: Record<string, any> = {};
          headers.forEach((h, idx) => { obj[h] = row[idx] || ''; });
          
          const slug = obj.title?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') || '';
          const { error } = await supabase.from('experiences').insert({
            title: obj.title || `Experience ${i + 1}`,
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
          if (error) errors.push(`Row ${i + 2}: ${error.message}`);
          else success++;
        }
      } else if (activeTab === 'itineraries') {
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const obj: Record<string, any> = {};
          headers.forEach((h, idx) => { obj[h] = row[idx] || ''; });
          
          const { error } = await supabase.from('public_itineraries').insert({
            name: obj.name || `Itinerary ${i + 1}`,
            slug: obj.slug || obj.name?.toLowerCase().replace(/\s+/g, '-') || `itinerary-${i}`,
            description: obj.description || '',
            cover_image: obj.cover_image || '',
            tag: obj.tag || 'popular',
          });
          if (error) errors.push(`Row ${i + 2}: ${error.message}`);
          else success++;
        }
      } else if (activeTab === 'collections') {
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const obj: Record<string, any> = {};
          headers.forEach((h, idx) => { obj[h] = row[idx] || ''; });
          
          const { error } = await supabase.from('collections').insert({
            name: obj.name || `Collection ${i + 1}`,
            slug: obj.slug || obj.name?.toLowerCase().replace(/\s+/g, '-') || `collection-${i}`,
            description: obj.description || '',
            cover_image: obj.cover_image || '',
            collection_type: obj.collection_type || 'experiences',
            tag: obj.tag || '',
          });
          if (error) errors.push(`Row ${i + 2}: ${error.message}`);
          else success++;
        }
      } else if (activeTab === 'itinerary_experiences') {
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const obj: Record<string, any> = {};
          headers.forEach((h, idx) => { obj[h] = row[idx] || ''; });

          // Resolve slugs to IDs
          const { data: itin } = await supabase.from('public_itineraries').select('id').eq('slug', obj.itinerary_slug).maybeSingle();
          const { data: exp } = await supabase.from('experiences').select('id').eq('slug', obj.experience_slug).maybeSingle();

          if (!itin) { errors.push(`Row ${i + 2}: Itinerary "${obj.itinerary_slug}" not found`); continue; }
          if (!exp) { errors.push(`Row ${i + 2}: Experience "${obj.experience_slug}" not found`); continue; }

          const { error } = await (supabase as any).from('itinerary_experiences').insert({
            itinerary_id: itin.id,
            experience_id: exp.id,
            display_order: parseInt(obj.display_order) || 0,
            notes: obj.notes || '',
          });
          if (error) {
            if (error.message.includes('duplicate')) {
              errors.push(`Row ${i + 2}: Already linked`);
            } else {
              errors.push(`Row ${i + 2}: ${error.message}`);
            }
          } else success++;
        }
      } else if (activeTab === 'collection_experiences') {
        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const obj: Record<string, any> = {};
          headers.forEach((h, idx) => { obj[h] = row[idx] || ''; });

          const { data: coll } = await supabase.from('collections').select('id').eq('slug', obj.collection_slug).maybeSingle();
          const { data: exp } = await supabase.from('experiences').select('id').eq('slug', obj.experience_slug).maybeSingle();

          if (!coll) { errors.push(`Row ${i + 2}: Collection "${obj.collection_slug}" not found`); continue; }
          if (!exp) { errors.push(`Row ${i + 2}: Experience "${obj.experience_slug}" not found`); continue; }

          const { error } = await (supabase as any).from('collection_experiences').insert({
            collection_id: coll.id,
            experience_id: exp.id,
            display_order: parseInt(obj.display_order) || 0,
          });
          if (error) {
            if (error.message.includes('duplicate')) {
              errors.push(`Row ${i + 2}: Already linked`);
            } else {
              errors.push(`Row ${i + 2}: ${error.message}`);
            }
          } else success++;
        }
      }

      setResult({ total: dataRows.length, success, errors });
      toast({ title: `Upload complete: ${success}/${dataRows.length} rows imported` });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const tabLabel: Record<UploadType, string> = {
    experiences: 'Experiences',
    itineraries: 'Itineraries',
    collections: 'Collections',
    itinerary_experiences: 'Link to Itinerary',
    collection_experiences: 'Link to Collection',
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="text-center mb-6">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Bulk Upload</h3>
          <p className="text-sm text-muted-foreground">Upload CSV files to create content and link experiences to itineraries/collections</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as UploadType); setResult(null); }}>
          <TabsList className="grid grid-cols-3 lg:grid-cols-5 mb-4">
            {Object.entries(tabLabel).map(([key, label]) => (
              <TabsTrigger key={key} value={key} className="text-xs">
                {key.includes('_') ? <Link2 className="w-3 h-3 mr-1" /> : <FileSpreadsheet className="w-3 h-3 mr-1" />}
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(tabLabel).map(key => (
            <TabsContent key={key} value={key}>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">CSV Template</p>
                    <p className="text-xs text-muted-foreground">Download the template with required columns</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => downloadTemplate(key as UploadType)}>
                    <Download className="w-4 h-4 mr-1" /> Template
                  </Button>
                </div>

                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleUpload}
                  />
                  <Button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="mx-auto"
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" /> Upload CSV</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    {key.includes('_') 
                      ? 'Use slugs to link existing items — duplicates are prevented automatically'
                      : 'Each row creates a new record'}
                  </p>
                </div>

                {result && (
                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">{result.success}/{result.total} rows imported successfully</span>
                    </div>
                    {result.errors.length > 0 && (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {result.errors.map((err, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-destructive">
                            <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                            <span>{err}</span>
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
