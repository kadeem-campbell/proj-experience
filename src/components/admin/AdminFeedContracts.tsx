/**
 * Admin Feed Contracts — manage export contracts, field exposure, partner versioning
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AdminEntityTable } from './AdminEntityTable';
import { Rss, Plus, ExternalLink } from 'lucide-react';

export const AdminFeedContracts = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newPartner, setNewPartner] = useState('');
  const [newFeedType, setNewFeedType] = useState('google_ttd');

  const { data: contracts = [] } = useQuery({
    queryKey: ['admin-export-contracts'],
    queryFn: async () => {
      const { data } = await (supabase as any).from('export_contracts').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const createContract = async () => {
    if (!newPartner.trim()) return;
    await (supabase as any).from('export_contracts').insert({
      partner: newPartner.trim(),
      feed_type: newFeedType,
      contract_version: 1,
      field_exposure: { description: true, image: true, destination: true, area: true, options: true, host: true, rating: true, geo: true, activity_type: true },
      deep_link_template: 'https://swam.app/things-to-do/{destination_slug}/{product_slug}',
    });
    queryClient.invalidateQueries({ queryKey: ['admin-export-contracts'] });
    setNewPartner('');
    setShowCreate(false);
    toast({ title: "Contract created" });
  };

  const toggleActive = async (id: string, current: boolean) => {
    await (supabase as any).from('export_contracts').update({ is_active: !current }).eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['admin-export-contracts'] });
  };

  const activeCount = contracts.filter((c: any) => c.is_active).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold mb-1">Feed Export Contracts</h2>
          <p className="text-sm text-muted-foreground">Manage partner feed contracts, field exposure, and deep-link enforcement</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="w-4 h-4 mr-1" /> New Contract
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4 text-center">
          <Rss className="w-6 h-6 mx-auto mb-1 text-primary" />
          <p className="text-2xl font-bold">{contracts.length}</p>
          <p className="text-xs text-muted-foreground">Total Contracts</p>
        </Card>
        <Card className="p-4 text-center">
          <ExternalLink className="w-6 h-6 mx-auto mb-1 text-emerald-500" />
          <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
          <p className="text-xs text-muted-foreground">Active</p>
        </Card>
      </div>

      {showCreate && (
        <Card className="p-4 mb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Partner Name</Label>
              <Input value={newPartner} onChange={e => setNewPartner(e.target.value)} placeholder="e.g., Google" className="mt-1" />
            </div>
            <div>
              <Label>Feed Type</Label>
              <Input value={newFeedType} onChange={e => setNewFeedType(e.target.value)} placeholder="google_ttd" className="mt-1" />
            </div>
          </div>
          <Button size="sm" onClick={createContract}>Create Contract</Button>
        </Card>
      )}

      <AdminEntityTable
        items={contracts}
        entityName="Export Contract"
        columns={[
          { key: 'partner', label: 'Partner', width: 'flex-1', render: (c: any) => <span className="font-medium">{c.partner}</span> },
          { key: 'feed_type', label: 'Feed', width: 'w-[120px]', render: (c: any) => <Badge variant="outline" className="text-[10px]">{c.feed_type}</Badge> },
          { key: 'contract_version', label: 'Version', width: 'w-[80px]', render: (c: any) => <span className="text-sm">v{c.contract_version}</span> },
          { key: 'requires_pricing', label: 'Pricing', width: 'w-[80px]', render: (c: any) => c.requires_pricing ? <Badge className="text-[10px]">Yes</Badge> : <span className="text-xs text-muted-foreground">No</span> },
          { key: 'requires_geo', label: 'Geo', width: 'w-[60px]', render: (c: any) => c.requires_geo ? <Badge className="text-[10px]">Yes</Badge> : <span className="text-xs text-muted-foreground">No</span> },
          { key: 'is_active', label: 'Active', width: 'w-[80px]', render: (c: any) => (
            <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c.id, c.is_active)} />
          )},
        ]}
      />
    </div>
  );
};
