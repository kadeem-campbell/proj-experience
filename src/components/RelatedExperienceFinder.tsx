import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Star, Clock, Users, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { generateProductPageUrl } from '@/utils/slugUtils';

interface Experience {
  id: string;
  title: string;
  location: string;
  category: string;
  rating: number;
  duration: string;
  group_size: string;
  price: string;
  video_thumbnail: string;
  slug: string;
  matchScore: number;
}

export const RelatedExperienceFinder = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);

    try {
      const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);
      const orFilter = keywords.map(k => `title.ilike.%${k}%,category.ilike.%${k}%,location.ilike.%${k}%`).join(',');
      const { data } = await supabase.from('experiences').select('*').or(orFilter).limit(10);

      const experiences: Experience[] = (data || []).map(e => ({
        id: e.id, title: e.title, location: e.location, category: e.category,
        rating: e.rating || 4.7, duration: e.duration || '', group_size: e.group_size || '',
        price: e.price || '', video_thumbnail: e.video_thumbnail || '', slug: e.slug || '',
        matchScore: 0,
      }));

      setResults(experiences);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Find Related Experiences</h3>
      <div className="flex gap-2 mb-4">
        <Input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search by keyword, category, or location..." />
        <Button onClick={handleSearch} disabled={loading} className="shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {searched && results.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-4">No matching experiences found.</p>
      )}

      <div className="space-y-3">
        {results.map(exp => (
          <a key={exp.id} href={generateExperienceUrl(exp.location || '', exp.title, exp.slug)} className="block p-3 border rounded-lg hover:bg-accent transition-colors">
            <div className="flex items-start gap-3">
              {exp.video_thumbnail && <img src={exp.video_thumbnail} alt={exp.title} className="w-16 h-16 rounded-lg object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{exp.title}</h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{exp.location}</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" />{exp.rating}</span>
                  {exp.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exp.duration}</span>}
                </div>
                <Badge variant="outline" className="text-xs mt-1">{exp.category}</Badge>
              </div>
              {exp.price && <span className="text-sm font-medium shrink-0">{exp.price}</span>}
            </div>
          </a>
        ))}
      </div>
    </Card>
  );
};
