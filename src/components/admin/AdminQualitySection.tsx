/**
 * Admin Quality Scores — view entity quality scores, block low-quality publishing.
 */
import { useQualityScores } from '@/hooks/useSocialGraph';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';

const ENTITY_TYPES = ['product', 'itinerary', 'host', 'destination', 'collection'];

export const AdminQualitySection = () => {
  const [filter, setFilter] = useState('');
  const { data: scores = [], isLoading } = useQualityScores(filter || undefined);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-destructive';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 50) return 'secondary';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Quality Scores</h2>
        <p className="text-sm text-muted-foreground">Content quality scoring — entities below 50 are blocked from publishing</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !filter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          All
        </button>
        {ENTITY_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t}s
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total Scored</p>
          <p className="text-2xl font-bold">{scores.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Publishable (80+)</p>
          <p className="text-2xl font-bold text-green-600">
            {scores.filter((s: any) => s.overall_score >= 80).length}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Needs Work (50-79)</p>
          <p className="text-2xl font-bold text-yellow-600">
            {scores.filter((s: any) => s.overall_score >= 50 && s.overall_score < 80).length}
          </p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Blocked (&lt;50)</p>
          <p className="text-2xl font-bold text-destructive">
            {scores.filter((s: any) => s.overall_score < 50).length}
          </p>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Entity ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Overall</TableHead>
              <TableHead className="hidden md:table-cell">Title</TableHead>
              <TableHead className="hidden md:table-cell">Media</TableHead>
              <TableHead className="hidden md:table-cell">Metadata</TableHead>
              <TableHead className="hidden md:table-cell">Relations</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : scores.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No quality scores computed yet</TableCell></TableRow>
            ) : (
              scores.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs truncate max-w-[120px]">{s.entity_id?.slice(0, 8)}...</TableCell>
                  <TableCell><Badge variant="outline" className="capitalize text-[10px]">{s.entity_type}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${getScoreColor(s.overall_score)}`}>{s.overall_score}</span>
                      <Progress value={s.overall_score} className="w-16 h-1.5" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs">{s.title_score}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs">{s.media_score}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs">{s.metadata_score}</TableCell>
                  <TableCell className="hidden md:table-cell text-xs">{s.relation_score}</TableCell>
                  <TableCell>
                    <Badge variant={getScoreBadge(s.overall_score) as any}>
                      {s.overall_score >= 80 ? 'Publishable' : s.overall_score >= 50 ? 'Draft' : 'Blocked'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
