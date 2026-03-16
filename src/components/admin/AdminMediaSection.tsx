/**
 * Media Center — manage media assets, review coverage, detect missing media.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { AdminEntityTable } from './AdminEntityTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Image, AlertTriangle } from 'lucide-react';

export const AdminMediaSection = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: mediaAssets = [], isLoading } = useQuery({
    queryKey: ['admin-media-full'],
    queryFn: async () => { const { data } = await (supabase as any).from('media_assets').select('*').order('created_at', { ascending: false }); return data || []; },
  });

  const { data: productsMissingMedia = [] } = useQuery({
    queryKey: ['admin-products-missing-media'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('id, title, cover_image').eq('is_active', true);
      return (data || []).filter(p => !p.cover_image);
    },
  });

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['admin-media-full'] }); };

  const saveMedia = async (item: any, isNew: boolean) => {
    const { id, created_at, ...rest } = item;
    if (isNew) {
      const { error } = await (supabase as any).from('media_assets').insert(rest);
      if (error) throw error;
    } else {
      const { error } = await (supabase as any).from('media_assets').update(rest).eq('id', id);
      if (error) throw error;
    }
    invalidate();
    toast({ title: isNew ? 'Media added' : 'Media updated' });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Media Center</h2>
      <p className="text-sm text-muted-foreground mb-4">Manage all media assets and detect coverage gaps</p>

      {productsMissingMedia.length > 0 && (
        <Card className="p-4 mb-4 border-yellow-500/30 bg-yellow-500/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">{productsMissingMedia.length} products missing cover image</span>
          </div>
          <div className="space-y-1 max-h-[120px] overflow-y-auto">
            {productsMissingMedia.map((p: any) => (
              <p key={p.id} className="text-xs text-muted-foreground">{p.title} — <span className="font-mono">{p.id.slice(0, 8)}</span></p>
            ))}
          </div>
        </Card>
      )}

      <AdminEntityTable
        items={mediaAssets}
        entityName="Media Asset"
        isLoading={isLoading}
        columns={[
          { key: 'url', label: 'URL', width: 'flex-[2]', render: (m: any) => (
            <div className="flex items-center gap-2">
              {m.url && <img src={m.url} className="w-8 h-8 rounded object-cover" alt="" onError={e => { (e.target as any).style.display = 'none'; }} />}
              <span className="text-xs truncate">{m.url}</span>
            </div>
          )},
          { key: 'entity_type', label: 'Type', width: 'w-[100px]', render: (m: any) => <Badge variant="outline" className="text-[10px]">{m.entity_type}</Badge> },
          { key: 'media_type', label: 'Media', width: 'w-[80px]', render: (m: any) => <span className="text-xs">{m.media_type}</span> },
          { key: 'alt_text', label: 'Alt', width: 'flex-1', render: (m: any) => m.alt_text ? <span className="text-xs text-muted-foreground">{m.alt_text}</span> : <Badge variant="destructive" className="text-[10px]">Missing</Badge> },
        ]}
        defaultItem={{ url: '', entity_id: '', entity_type: 'product', media_type: 'image', alt_text: '', caption: '' }}
        renderForm={(item: any, onChange) => (
          <div className="space-y-3">
            <div><Label className="text-xs text-muted-foreground">URL</Label><Input value={item.url || ''} onChange={e => onChange('url', e.target.value)} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs text-muted-foreground">Entity ID</Label><Input value={item.entity_id || ''} onChange={e => onChange('entity_id', e.target.value)} className="font-mono text-xs" /></div>
              <div>
                <Label className="text-xs text-muted-foreground">Entity Type</Label>
                <Select value={item.entity_type || 'product'} onValueChange={v => onChange('entity_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['product', 'host', 'destination', 'area', 'poi', 'collection', 'itinerary'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Media Type</Label>
                <Select value={item.media_type || 'image'} onValueChange={v => onChange('media_type', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['image', 'video', 'thumbnail', 'hero', 'gallery'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-muted-foreground">Alt Text</Label><Input value={item.alt_text || ''} onChange={e => onChange('alt_text', e.target.value)} /></div>
              <div><Label className="text-xs text-muted-foreground">Caption</Label><Input value={item.caption || ''} onChange={e => onChange('caption', e.target.value)} /></div>
            </div>
          </div>
        )}
        onSave={saveMedia}
        onDelete={async (ids) => {
          for (const id of ids) await (supabase as any).from('media_assets').delete().eq('id', id);
          invalidate();
        }}
      />
    </div>
  );
};
