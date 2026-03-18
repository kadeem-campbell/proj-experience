/**
 * Admin Partner Exports — export jobs, freshness tracking, contract validation
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Rss, AlertTriangle, CheckCircle, Clock, Download } from 'lucide-react';
import { toast } from 'sonner';
import { fetchExportContracts, runPartnerExport, type ExportContract, type PartnerExportResult } from '@/services/feedExporter';

export const AdminPartnerExports = () => {
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<PartnerExportResult | null>(null);

  const { data: contracts = [] } = useQuery({
    queryKey: ['export-contracts'],
    queryFn: fetchExportContracts,
  });

  const { data: exports = [] } = useQuery({
    queryKey: ['partner-exports'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('partner_exports')
        .select('*').order('created_at', { ascending: false }).limit(20);
      return data || [];
    },
  });

  const handleRunExport = async (contract: ExportContract) => {
    setRunning(true);
    try {
      const result = await runPartnerExport(contract);
      setLastResult(result);
      toast.success(`Export complete: ${result.eligible_products} products exported`);
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Rss className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Partner Exports</h2>
      </div>

      <Tabs defaultValue="contracts">
        <TabsList>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="history">Export History</TabsTrigger>
          {lastResult && <TabsTrigger value="result">Last Result</TabsTrigger>}
        </TabsList>

        <TabsContent value="contracts">
          <Card>
            <CardHeader><CardTitle className="text-sm">Active Export Contracts</CardTitle></CardHeader>
            <CardContent>
              {contracts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active contracts. Add via Feed Contracts section.</p>
              ) : (
                <div className="space-y-3">
                  {contracts.map((c: ExportContract) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{c.partner}</span>
                          <Badge variant="outline" className="text-[10px]">v{c.contract_version}</Badge>
                          <Badge variant="secondary" className="text-[10px]">{c.feed_type}</Badge>
                        </div>
                        <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground">
                          {c.requires_pricing && <span>💰 Pricing</span>}
                          {c.requires_geo && <span>📍 Geo</span>}
                          {c.requires_image && <span>🖼️ Image</span>}
                          {c.min_description_length > 0 && <span>📝 {c.min_description_length}+ chars</span>}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" disabled={running} onClick={() => handleRunExport(c)}>
                        <Download className="w-3 h-3 mr-1" /> Run Export
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle className="text-sm">Export History</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exports.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs font-medium">{e.partner_key}</TableCell>
                      <TableCell className="text-xs">{e.export_type}</TableCell>
                      <TableCell>
                        <Badge variant={e.status === 'completed' ? 'default' : 'destructive'} className="text-[10px]">
                          {e.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{e.record_count}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.created_at?.split('T')[0]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {lastResult && (
          <TabsContent value="result">
            <Card>
              <CardHeader><CardTitle className="text-sm">Last Export Result</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold">{lastResult.total_products}</p>
                    <p className="text-[10px] text-muted-foreground">Total Products</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold text-green-600">{lastResult.eligible_products}</p>
                    <p className="text-[10px] text-muted-foreground">Eligible</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold text-orange-600">{lastResult.excluded_products}</p>
                    <p className="text-[10px] text-muted-foreground">Excluded</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold">{lastResult.validation_issues.length}</p>
                    <p className="text-[10px] text-muted-foreground">Issues</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {lastResult.freshness_ok ? (
                    <Badge variant="default" className="text-[10px]"><CheckCircle className="w-3 h-3 mr-1" /> Freshness OK</Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]"><AlertTriangle className="w-3 h-3 mr-1" /> Stale ({lastResult.days_since_last_export ?? '∞'} days)</Badge>
                  )}
                </div>
                {lastResult.validation_issues.length > 0 && (
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {lastResult.validation_issues.slice(0, 20).map((issue, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs p-1.5 rounded bg-muted/30">
                        <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'} className="text-[9px]">{issue.severity}</Badge>
                        <span className="truncate">{issue.product_title}</span>
                        <span className="text-muted-foreground">{issue.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
