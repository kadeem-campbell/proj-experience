/**
 * Admin Search Trends — query logs, zero-result terms, trending
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, TrendingUp, AlertCircle } from 'lucide-react';

export const AdminSearchTrends = () => {
  const { data: recentQueries = [] } = useQuery({
    queryKey: ['admin-search-queries'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('search_queries')
        .select('*').order('created_at', { ascending: false }).limit(50);
      return data || [];
    },
  });

  const { data: termMetrics = [] } = useQuery({
    queryKey: ['admin-search-term-metrics'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('search_term_metrics')
        .select('*').order('trend_score', { ascending: false }).limit(30);
      return data || [];
    },
  });

  const zeroResults = recentQueries.filter((q: any) => q.result_count === 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Search Intelligence</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{recentQueries.length}</p>
            <p className="text-xs text-muted-foreground">Recent Queries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-orange-600">{zeroResults.length}</p>
            <p className="text-xs text-muted-foreground">Zero Results</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{termMetrics.length}</p>
            <p className="text-xs text-muted-foreground">Tracked Terms</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent">Recent Queries</TabsTrigger>
          <TabsTrigger value="zero">Zero Results</TabsTrigger>
          <TabsTrigger value="trending">Trending Terms</TabsTrigger>
        </TabsList>

        <TabsContent value="recent">
          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <TableHead>Results</TableHead>
                    <TableHead>Clicked</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentQueries.slice(0, 20).map((q: any) => (
                    <TableRow key={q.id}>
                      <TableCell className="text-xs font-medium">{q.raw_query}</TableCell>
                      <TableCell>
                        <Badge variant={q.result_count === 0 ? 'destructive' : 'secondary'} className="text-[10px]">
                          {q.result_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{q.clicked_entity_type || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{q.created_at?.split('T')[1]?.slice(0,5)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zero">
          <Card>
            <CardContent className="pt-4">
              {zeroResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">No zero-result queries yet.</p>
              ) : (
                <div className="space-y-1">
                  {zeroResults.map((q: any) => (
                    <div key={q.id} className="flex items-center gap-2 p-2 rounded bg-destructive/5">
                      <AlertCircle className="w-3 h-3 text-destructive" />
                      <span className="text-xs font-medium">{q.raw_query}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{q.created_at?.split('T')[0]}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trending">
          <Card>
            <CardContent className="pt-4">
              {termMetrics.length === 0 ? (
                <p className="text-sm text-muted-foreground">No trending data yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Term</TableHead>
                      <TableHead>Queries</TableHead>
                      <TableHead>Zero %</TableHead>
                      <TableHead>Save Rate</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {termMetrics.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs font-medium">{t.term}</TableCell>
                        <TableCell className="text-xs">{t.query_count}</TableCell>
                        <TableCell className="text-xs">{t.query_count > 0 ? Math.round((t.zero_result_count / t.query_count) * 100) : 0}%</TableCell>
                        <TableCell className="text-xs">{(t.save_rate * 100).toFixed(1)}%</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-green-600" />
                            <span className="text-xs">{t.trend_score?.toFixed(1)}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
