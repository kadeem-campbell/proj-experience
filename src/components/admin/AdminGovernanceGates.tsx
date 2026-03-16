/**
 * Admin Governance Gates — deploy gates, defer register, audit log viewer
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminEntityTable } from './AdminEntityTable';
import { Shield, Clock, FileText, CheckCircle, XCircle } from 'lucide-react';

export const AdminGovernanceGates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: gates = [] } = useQuery({
    queryKey: ['admin-deploy-gates'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('deploy_gates').select('*').order('created_at');
      return data || [];
    },
  });

  const { data: deferred = [] } = useQuery({
    queryKey: ['admin-defer-register'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('defer_register').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['admin-audit-log'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(100);
      return data || [];
    },
  });

  const toggleGate = async (gateId: string, currentState: boolean) => {
    await (supabase as any).from('deploy_gates').update({
      is_passed: !currentState,
      last_evaluated_at: new Date().toISOString(),
    }).eq('id', gateId);
    queryClient.invalidateQueries({ queryKey: ['admin-deploy-gates'] });
    toast({ title: "Gate updated" });
  };

  const passedGates = gates.filter((g: any) => g.is_passed);
  const failedGates = gates.filter((g: any) => !g.is_passed);
  const openDeferred = deferred.filter((d: any) => !d.resolved_at);

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Governance & QA Gates</h2>
      <p className="text-sm text-muted-foreground mb-4">Deploy gates, deferred items, and audit trail</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 text-center">
          <CheckCircle className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
          <p className="text-2xl font-bold text-emerald-600">{passedGates.length}</p>
          <p className="text-xs text-muted-foreground">Gates Passed</p>
        </Card>
        <Card className="p-4 text-center">
          <XCircle className="w-6 h-6 mx-auto mb-1 text-destructive" />
          <p className="text-2xl font-bold text-destructive">{failedGates.length}</p>
          <p className="text-xs text-muted-foreground">Gates Failed</p>
        </Card>
        <Card className="p-4 text-center">
          <Clock className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
          <p className="text-2xl font-bold text-yellow-600">{openDeferred.length}</p>
          <p className="text-xs text-muted-foreground">Deferred Items</p>
        </Card>
      </div>

      <Tabs defaultValue="gates">
        <TabsList className="mb-4">
          <TabsTrigger value="gates">Deploy Gates ({gates.length})</TabsTrigger>
          <TabsTrigger value="deferred">Defer Register ({deferred.length})</TabsTrigger>
          <TabsTrigger value="audit">Audit Log ({auditLogs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="gates">
          <AdminEntityTable
            items={gates}
            entityName="Deploy Gate"
            columns={[
              { key: 'gate_name', label: 'Gate', width: 'flex-[2]', render: (g: any) => <span className="font-medium text-sm">{g.gate_name}</span> },
              { key: 'gate_type', label: 'Type', width: 'w-[100px]', render: (g: any) => <Badge variant="outline" className="text-[10px]">{g.gate_type}</Badge> },
              { key: 'is_passed', label: 'Status', width: 'w-[100px]', render: (g: any) => (
                <Button size="sm" variant={g.is_passed ? "default" : "destructive"} className="text-xs h-7"
                  onClick={() => toggleGate(g.id, g.is_passed)}>
                  {g.is_passed ? "Passed" : "Failed"}
                </Button>
              )},
              { key: 'last_evaluated_at', label: 'Last Check', width: 'w-[120px]', render: (g: any) => (
                <span className="text-xs text-muted-foreground">{g.last_evaluated_at ? new Date(g.last_evaluated_at).toLocaleDateString() : '—'}</span>
              )},
            ]}
          />
        </TabsContent>

        <TabsContent value="deferred">
          <AdminEntityTable
            items={deferred}
            entityName="Deferred Item"
            columns={[
              { key: 'item_name', label: 'Item', width: 'flex-[2]', render: (d: any) => <span className="text-sm">{d.item_name}</span> },
              { key: 'category', label: 'Category', width: 'w-[100px]', render: (d: any) => <Badge variant="outline" className="text-[10px]">{d.category}</Badge> },
              { key: 'severity', label: 'Severity', width: 'w-[80px]', render: (d: any) => (
                <Badge variant={d.severity === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">{d.severity}</Badge>
              )},
              { key: 'deferred_to_phase', label: 'Phase', width: 'w-[100px]', render: (d: any) => <span className="text-xs">{d.deferred_to_phase}</span> },
              { key: 'resolved_at', label: 'Resolved', width: 'w-[80px]', render: (d: any) => (
                d.resolved_at ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <span className="text-xs text-muted-foreground">Open</span>
              )},
            ]}
          />
        </TabsContent>

        <TabsContent value="audit">
          <AdminEntityTable
            items={auditLogs}
            entityName="Audit Entry"
            columns={[
              { key: 'action_type', label: 'Action', width: 'w-[120px]', render: (a: any) => <Badge variant="outline" className="text-[10px]">{a.action_type}</Badge> },
              { key: 'entity_type', label: 'Entity', width: 'w-[100px]', render: (a: any) => <span className="text-xs">{a.entity_type || '—'}</span> },
              { key: 'entity_id', label: 'ID', width: 'flex-1', render: (a: any) => <span className="font-mono text-xs">{a.entity_id?.slice(0, 12) || '—'}</span> },
              { key: 'created_at', label: 'Time', width: 'w-[140px]', render: (a: any) => (
                <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
              )},
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
