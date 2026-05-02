import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generateProductPageUrl } from '@/utils/slugUtils';

interface ProductResult {
  id: string;
  title: string;
  cover_image_url: string | null;
  slug: string;
}

export const RelatedExperienceFinder = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
      const orFilter = keywords.map(k => `title.ilike.%${k}%`).join(',');
      const { data } = await supabase
        .from('products')
        .select('id, title, cover_image_url, slug')
        .or(orFilter)
        .limit(10);

      setResults((data || []).map(p => ({
        id: p.id,
        title: p.title,
        cover_image_url: p.cover_image_url,
        slug: p.slug || '',
      })));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Find Related Things to Do</h3>
      <div className="flex gap-2 mb-4">
        <Input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search by keyword..." />
        <Button onClick={handleSearch} disabled={loading} className="shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {searched && results.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-4">No matching things to do found.</p>
      )}

      <div className="space-y-3">
        {results.map(p => (
          <a key={p.id} href={generateProductPageUrl('', p.title, p.slug)} className="block p-3 border rounded-lg hover:bg-accent transition-colors">
            <div className="flex items-start gap-3">
              {p.cover_image_url && <img src={p.cover_image_url} alt={p.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{p.title}</h4>
              </div>
            </div>
          </a>
        ))}
      </div>
    </Card>
  );
};
