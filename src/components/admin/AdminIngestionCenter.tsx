/**
 * Admin Ingestion Center — CSV/JSON import jobs, row validation, commit workflow
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileSpreadsheet, Code2, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export const AdminIngestionCenter = () => {
  const { data: jobs = [] } = useQuery({
    queryKey: ['ingestion-jobs'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('ingestion_jobs')
        .select('*').order('created_at', { ascending: false }).limit(30);
      return data || [];
    },
  });

  const { data: bulkJobs = [] } = useQuery({
    queryKey: ['bulk-action-jobs'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('bulk_action_jobs')
        .select('*').order('created_at', { ascending: false }).limit(30);
      return data || [];
    },
  });

  const statusColors: Record<string, string> = {
    staged: 'bg-yellow-100 text-yellow-800',
    validating: 'bg-blue-100 text-blue-800',
    committed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-gray-100 text-gray-800',
    completed: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Upload className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Ingestion Center</h2>
      </div>

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs">Import Jobs</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Ingestion Jobs</CardTitle>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                    <FileSpreadsheet className="w-3 h-3" /> CSV Import
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                    <Code2 className="w-3 h-3" /> JSON Import
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No import jobs yet. Use CSV or JSON import to start.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Processed</TableHead>
                      <TableHead>Errors</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((j: any) => (
                      <TableRow key={j.id}>
                        <TableCell className="text-xs">{j.job_type}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{j.target_entity_type}</Badge></TableCell>
                        <TableCell>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColors[j.status] || 'bg-muted'}`}>{j.status}</span>
                        </TableCell>
                        <TableCell className="text-xs">{j.total_rows}</TableCell>
                        <TableCell className="text-xs">{j.processed_rows}</TableCell>
                        <TableCell className="text-xs">{j.error_rows > 0 ? <span className="text-destructive">{j.error_rows}</span> : '0'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{j.created_at?.split('T')[0]}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader><CardTitle className="text-sm">Bulk Action Jobs</CardTitle></CardHeader>
            <CardContent>
              {bulkJobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bulk actions executed yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Dry Run</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bulkJobs.map((j: any) => (
                      <TableRow key={j.id}>
                        <TableCell className="text-xs font-medium">{j.action_type}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{j.target_entity_type}</Badge></TableCell>
                        <TableCell>{j.dry_run_flag ? '🔍 Yes' : '⚡ No'}</TableCell>
                        <TableCell>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusColors[j.status] || 'bg-muted'}`}>{j.status}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{j.created_at?.split('T')[0]}</TableCell>
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
