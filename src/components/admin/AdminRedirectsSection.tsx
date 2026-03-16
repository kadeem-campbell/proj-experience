/**
 * Admin Redirects & Route Registry — manage legacy redirects,
 * view canonical mappings, create/edit/delete redirects.
 */
import { useState } from 'react';
import { useRedirectRegistry } from '@/hooks/useSocialGraph';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, ExternalLink, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export const AdminRedirectsSection = () => {
  const { redirects, isLoading, addRedirect, removeRedirect, updateRedirect } = useRedirectRegistry();
  const [newSource, setNewSource] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newCode, setNewCode] = useState(301);

  const handleAdd = async () => {
    if (!newSource.trim() || !newTarget.trim()) {
      toast.error('Both source and target paths are required');
      return;
    }
    await addRedirect(newSource.trim(), newTarget.trim(), newCode);
    toast.success('Redirect created');
    setNewSource('');
    setNewTarget('');
  };

  const handleDelete = async (id: string) => {
    await removeRedirect(id);
    toast.success('Redirect removed');
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    await updateRedirect(id, { is_active: !isActive });
    toast.success(isActive ? 'Redirect disabled' : 'Redirect enabled');
  };

  // Pre-defined legacy redirects to seed
  const LEGACY_REDIRECTS = [
    { source: '/saved', target: '/liked', code: 301 },
    { source: '/discover', target: '/', code: 301 },
    { source: '/map', target: '/zanzibar/map', code: 301 },
    { source: '/explore/map', target: '/zanzibar/map', code: 301 },
    { source: '/travelers', target: '/profile', code: 301 },
    { source: '/travellers', target: '/profile', code: 301 },
  ];

  const seedLegacyRedirects = async () => {
    for (const r of LEGACY_REDIRECTS) {
      const exists = redirects.some((x: any) => x.source_path === r.source);
      if (!exists) {
        await addRedirect(r.source, r.target, r.code);
      }
    }
    toast.success('Legacy redirects seeded');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Redirect Registry</h2>
          <p className="text-sm text-muted-foreground">Manage 301/302 redirects for legacy and canonical routes</p>
        </div>
        <Button size="sm" variant="outline" onClick={seedLegacyRedirects}>
          Seed Legacy Redirects
        </Button>
      </div>

      {/* Add new redirect */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3">Add Redirect</h3>
        <div className="flex items-end gap-2 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground mb-1 block">Source Path</label>
            <Input
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder="/old-path"
              className="h-9"
            />
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mb-2" />
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground mb-1 block">Target Path</label>
            <Input
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              placeholder="/new-path"
              className="h-9"
            />
          </div>
          <div className="w-20">
            <label className="text-xs text-muted-foreground mb-1 block">Code</label>
            <select
              value={newCode}
              onChange={(e) => setNewCode(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value={301}>301</option>
              <option value={302}>302</option>
            </select>
          </div>
          <Button size="sm" className="h-9" onClick={handleAdd}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add
          </Button>
        </div>
      </Card>

      {/* Redirect table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Source</TableHead>
              <TableHead>Target</TableHead>
              <TableHead className="w-16">Code</TableHead>
              <TableHead className="w-20">Status</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
            ) : redirects.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No redirects configured</TableCell></TableRow>
            ) : (
              redirects.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.source_path}</TableCell>
                  <TableCell className="font-mono text-xs">{r.target_path}</TableCell>
                  <TableCell>
                    <Badge variant={r.status_code === 301 ? 'default' : 'secondary'}>{r.status_code}</Badge>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => handleToggle(r.id, r.is_active)}>
                      <Badge variant={r.is_active ? 'default' : 'outline'}>
                        {r.is_active ? 'Active' : 'Off'}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
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
