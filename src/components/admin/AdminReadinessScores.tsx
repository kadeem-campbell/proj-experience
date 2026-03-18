/**
 * Admin Readiness Scores — comprehensive readiness dashboard
 * showing all 11 dimensions per entity
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle } from 'lucide-react';

export const AdminReadinessScores = () => {
  const [entityFilter, setEntityFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');

  const { data: scores = [] } = useQuery({
    queryKey: ['readiness-scores', entityFilter, stateFilter],
    queryFn: async () => {
      let query = (supabase as any).from('readiness_scores').select('*').order('overall_score', { ascending: true });
      if (entityFilter !== 'all') query = query.eq('entity_type', entityFilter);
      if (stateFilter !== 'all') query = query.eq('recommended_state', stateFilter);
      const { data } = await query.limit(100);
      return data || [];
    },
  });

  const stateCounts = scores.reduce((acc: Record<string, number>, s: any) => {
    acc[s.recommended_state] = (acc[s.recommended_state] || 0) + 1;
    return acc;
  }, {});

  const stateColors: Record<string, string> = {
    blocked_low_readiness: 'bg-red-500',
    draft_unpublished: 'bg-orange-500',
    public_noindex: 'bg-yellow-500',
    public_indexed: 'bg-green-500',
  };

  const dimLabel = (dim: string) => dim.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Readiness Scores</h2>
      </div>

      {/* State distribution */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(stateCounts).map(([state, count]) => (
          <Card key={state}>
            <CardContent className="pt-4 text-center">
              <div className={`w-2 h-2 rounded-full ${stateColors[state] || 'bg-muted'} mx-auto mb-1`} />
              <p className="text-2xl font-bold">{count as number}</p>
              <p className="text-[10px] text-muted-foreground">{state.replace(/_/g, ' ')}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="destination">Destination</SelectItem>
            <SelectItem value="host">Host</SelectItem>
            <SelectItem value="itinerary">Itinerary</SelectItem>
          </SelectContent>
        </Select>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-48 h-8 text-xs">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            <SelectItem value="blocked_low_readiness">Blocked</SelectItem>
            <SelectItem value="draft_unpublished">Draft</SelectItem>
            <SelectItem value="public_noindex">Noindex</SelectItem>
            <SelectItem value="public_indexed">Indexed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Scores table */}
      <Card>
        <CardContent className="pt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entity</TableHead>
                <TableHead>Overall</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Media</TableHead>
                <TableHead>Canon</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Comm</TableHead>
                <TableHead>Feed</TableHead>
                <TableHead>Graph</TableHead>
                <TableHead>Geo</TableHead>
                <TableHead>QA</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Blockers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scores.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div>
                      <Badge variant="outline" className="text-[9px]">{s.entity_type}</Badge>
                      <p className="text-[10px] font-mono text-muted-foreground truncate max-w-24">{s.entity_id?.slice(0,8)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Progress value={s.overall_score} className="w-12 h-1.5" />
                      <span className="text-xs font-bold">{s.overall_score}</span>
                    </div>
                  </TableCell>
                  {['content_score', 'media_score', 'canonical_score', 'taxonomy_score', 'commerce_score', 'feed_score', 'graph_score', 'geo_score', 'qa_score'].map(dim => (
                    <TableCell key={dim} className="text-xs text-center">
                      <span className={s[dim] >= 70 ? 'text-green-600' : s[dim] >= 40 ? 'text-yellow-600' : 'text-red-600'}>
                        {s[dim]}
                      </span>
                    </TableCell>
                  ))}
                  <TableCell>
                    <Badge variant={s.is_publishable ? 'default' : 'destructive'} className="text-[9px]">
                      {s.recommended_state?.replace(/_/g, ' ')?.slice(0, 12)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {(s.blockers_json || []).length > 0 ? (
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertTriangle className="w-3 h-3" />
                        {(s.blockers_json || []).length}
                      </div>
                    ) : (
                      <CheckCircle className="w-3 h-3 text-green-600" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
