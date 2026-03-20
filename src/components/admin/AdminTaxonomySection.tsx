/**
 * Taxonomy section — Activity Types, Themes, Options, Price Options.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { AdminEntityTable } from './AdminEntityTable';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const toSlug = (v: string) => v.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

export const AdminTaxonomySection = () => {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: activityTypes = [] } = useQuery({
    queryKey: ['admin-at-full'],
    queryFn: async () => { const { data } = await supabase.from('activity_types').select('*').order('display_order'); return data || []; },
  });
  const { data: themes = [] } = useQuery({
    queryKey: ['admin-themes-full'],
    queryFn: async () => { const { data } = await supabase.from('themes').select('*').order('display_order'); return data || []; },
  });
  const { data: options = [] } = useQuery({
    queryKey: ['admin-options-full'],
    queryFn: async () => { const { data } = await supabase.from('options').select('*').order('display_order'); return data || []; },
  });
  const { data: priceOptions = [] } = useQuery({
    queryKey: ['admin-price-options-full'],
    queryFn: async () => { const { data } = await supabase.from('price_options').select('*').order('display_order'); return data || []; },
  });
  const { data: inclusionItems = [] } = useQuery({
    queryKey: ['admin-inclusion-items-full'],
    queryFn: async () => { const { data } = await (supabase as any).from('inclusion_items').select('*').order('name'); return data || []; },
  });
  const { data: transportModes = [] } = useQuery({
    queryKey: ['admin-transport-modes-full'],
    queryFn: async () => { const { data } = await (supabase as any).from('transport_modes').select('*').order('name'); return data || []; },
  });
  const { data: products = [] } = useQuery({
    queryKey: ['admin-products-mini'],
    queryFn: async () => { const { data } = await supabase.from('products').select('id, title').order('title'); return data || []; },
  });

  const invalidate = () => {
    ['admin-at-full', 'admin-themes-full', 'admin-options-full', 'admin-price-options-full', 'admin-inclusion-items-full', 'admin-transport-modes-full', 'admin-overview-counts'].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
  };

  const saveEntity = async (table: string, item: any, isNew: boolean) => {
    const { id, created_at, updated_at, ...rest } = item;
    if (isNew) {
      const { error } = await (supabase as any).from(table).insert(rest);
      if (error) throw error;
    } else {
      const { error } = await (supabase as any).from(table).update(rest).eq('id', id);
      if (error) throw error;
    }
    invalidate();
    toast({ title: isNew ? 'Created' : 'Saved' });
  };

  const deleteEntity = async (table: string, ids: string[]) => {
    for (const id of ids) await (supabase as any).from(table).delete().eq('id', id);
    invalidate();
    toast({ title: `Deleted ${ids.length} item(s)` });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Taxonomy & Pricing</h2>
      <p className="text-sm text-muted-foreground mb-4">Activity types, themes, inclusions, transport modes, product options, price options</p>

      <Tabs defaultValue="activity-types">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="activity-types">Activity Types ({activityTypes.length})</TabsTrigger>
          <TabsTrigger value="themes">Themes ({themes.length})</TabsTrigger>
          <TabsTrigger value="inclusions">Inclusions ({inclusionItems.length})</TabsTrigger>
          <TabsTrigger value="transport">Transport ({transportModes.length})</TabsTrigger>
          <TabsTrigger value="options">Options ({options.length})</TabsTrigger>
          <TabsTrigger value="prices">Price Options ({priceOptions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="activity-types">
          <AdminEntityTable
            items={activityTypes}
            entityName="Activity Type"
            columns={[
              { key: 'name', label: 'Name', width: 'flex-[2]', render: (a: any) => <span>{a.emoji} <span className="font-medium">{a.name}</span></span> },
              { key: 'slug', label: 'Slug', width: 'flex-1', render: (a: any) => <span className="text-xs font-mono text-muted-foreground">{a.slug}</span> },
              { key: 'display_order', label: 'Order', width: 'w-[60px]' },
            ]}
            defaultItem={{ name: '', slug: '', emoji: '', description: '', display_order: 0, is_active: true }}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={item.name || ''} onChange={e => { onChange('name', e.target.value); if (!item.id) onChange('slug', toSlug(e.target.value)); }} /></div>
                  <div><Label className="text-xs text-muted-foreground">Slug</Label><Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} className="font-mono text-xs" /></div>
                  <div><Label className="text-xs text-muted-foreground">Emoji</Label><Input value={item.emoji || ''} onChange={e => onChange('emoji', e.target.value)} /></div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={item.description || ''} onChange={e => onChange('description', e.target.value)} rows={2} /></div>
                <div><Label className="text-xs text-muted-foreground">Display Order</Label><Input type="number" value={item.display_order || 0} onChange={e => onChange('display_order', parseInt(e.target.value) || 0)} /></div>
              </div>
            )}
            onSave={(item, isNew) => saveEntity('activity_types', item, isNew)}
            onDelete={(ids) => deleteEntity('activity_types', ids)}
          />
        </TabsContent>

        <TabsContent value="themes">
          <AdminEntityTable
            items={themes}
            entityName="Theme"
            columns={[
              { key: 'name', label: 'Name', width: 'flex-[2]', render: (t: any) => <span>{t.emoji} <span className="font-medium">{t.name}</span></span> },
              { key: 'slug', label: 'Slug', width: 'flex-1', render: (t: any) => <span className="text-xs font-mono text-muted-foreground">{t.slug}</span> },
              { key: 'is_public_page', label: 'Public', width: 'w-[60px]', render: (t: any) => t.is_public_page ? <Badge variant="outline" className="text-[10px]">Public</Badge> : null },
            ]}
            defaultItem={{ name: '', slug: '', emoji: '', description: '', display_order: 0, is_active: true, is_public_page: false }}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={item.name || ''} onChange={e => { onChange('name', e.target.value); if (!item.id) onChange('slug', toSlug(e.target.value)); }} /></div>
                  <div><Label className="text-xs text-muted-foreground">Slug</Label><Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} className="font-mono text-xs" /></div>
                  <div><Label className="text-xs text-muted-foreground">Emoji</Label><Input value={item.emoji || ''} onChange={e => onChange('emoji', e.target.value)} /></div>
                </div>
                <div><Label className="text-xs text-muted-foreground">Description</Label><Textarea value={item.description || ''} onChange={e => onChange('description', e.target.value)} rows={2} /></div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2"><Switch checked={item.is_public_page ?? false} onCheckedChange={v => onChange('is_public_page', v)} /><span className="text-xs">Public page</span></div>
                </div>
              </div>
            )}
            onSave={(item, isNew) => saveEntity('themes', item, isNew)}
            onDelete={(ids) => deleteEntity('themes', ids)}
          />
        </TabsContent>

        <TabsContent value="inclusions">
          <AdminEntityTable
            items={inclusionItems}
            entityName="Inclusion Item"
            columns={[
              { key: 'name', label: 'Name', width: 'flex-[2]', render: (i: any) => <span>{i.emoji} <span className="font-medium">{i.name}</span></span> },
              { key: 'slug', label: 'Slug', width: 'flex-1', render: (i: any) => <span className="text-xs font-mono text-muted-foreground">{i.slug}</span> },
              { key: 'category', label: 'Category', width: 'w-[100px]', render: (i: any) => <Badge variant="outline" className="text-[10px]">{i.category}</Badge> },
            ]}
            defaultItem={{ name: '', slug: '', emoji: '✓', category: 'general', is_active: true }}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={item.name || ''} onChange={e => { onChange('name', e.target.value); if (!item.id) onChange('slug', toSlug(e.target.value)); }} /></div>
                  <div><Label className="text-xs text-muted-foreground">Slug</Label><Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} className="font-mono text-xs" /></div>
                  <div><Label className="text-xs text-muted-foreground">Emoji</Label><Input value={item.emoji || ''} onChange={e => onChange('emoji', e.target.value)} /></div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <Select value={item.category || 'general'} onValueChange={v => onChange('category', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="food_drink">Food & Drink</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="guide">Guide</SelectItem>
                      <SelectItem value="fee">Fee</SelectItem>
                      <SelectItem value="activity">Activity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={item.is_active ?? true} onCheckedChange={v => onChange('is_active', v)} />
                  <span className="text-xs">Active</span>
                </div>
              </div>
            )}
            onSave={(item, isNew) => saveEntity('inclusion_items', item, isNew)}
            onDelete={(ids) => deleteEntity('inclusion_items', ids)}
          />
        </TabsContent>

        <TabsContent value="transport">
          <AdminEntityTable
            items={transportModes}
            entityName="Transport Mode"
            columns={[
              { key: 'name', label: 'Name', width: 'flex-[2]', render: (t: any) => <span>{t.emoji} <span className="font-medium">{t.name}</span></span> },
              { key: 'slug', label: 'Slug', width: 'flex-1', render: (t: any) => <span className="text-xs font-mono text-muted-foreground">{t.slug}</span> },
            ]}
            defaultItem={{ name: '', slug: '', emoji: '🚗', is_active: true }}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={item.name || ''} onChange={e => { onChange('name', e.target.value); if (!item.id) onChange('slug', toSlug(e.target.value)); }} /></div>
                  <div><Label className="text-xs text-muted-foreground">Slug</Label><Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} className="font-mono text-xs" /></div>
                  <div><Label className="text-xs text-muted-foreground">Emoji</Label><Input value={item.emoji || ''} onChange={e => onChange('emoji', e.target.value)} /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={item.is_active ?? true} onCheckedChange={v => onChange('is_active', v)} />
                  <span className="text-xs">Active</span>
                </div>
              </div>
            )}
            onSave={(item, isNew) => saveEntity('transport_modes', item, isNew)}
            onDelete={(ids) => deleteEntity('transport_modes', ids)}
          />
        </TabsContent>

        <TabsContent value="options">
          <AdminEntityTable
            items={options}
            entityName="Option"
            columns={[
              { key: 'name', label: 'Name', width: 'flex-[2]', render: (o: any) => <span className="font-medium">{o.name}</span> },
              { key: 'product_id', label: 'Product', width: 'flex-1', render: (o: any) => {
                const p = products.find((x: any) => x.id === o.product_id);
                return p ? <span className="text-xs">{p.title}</span> : <span className="text-xs text-muted-foreground">{o.product_id?.slice(0,8)}</span>;
              }},
              { key: 'tier', label: 'Tier', width: 'w-[80px]', render: (o: any) => <Badge variant="outline" className="text-[10px]">{o.tier}</Badge> },
            ]}
            defaultItem={{ name: '', slug: '', product_id: '', tier: 'standard', format_type: 'shared', is_active: true }}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Name</Label><Input value={item.name || ''} onChange={e => { onChange('name', e.target.value); if (!item.id) onChange('slug', toSlug(e.target.value)); }} /></div>
                  <div><Label className="text-xs text-muted-foreground">Slug</Label><Input value={item.slug || ''} onChange={e => onChange('slug', e.target.value)} className="font-mono text-xs" /></div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Product</Label>
                  <Select value={item.product_id || ''} onValueChange={v => onChange('product_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>{products.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Tier</Label>
                    <Select value={item.tier || 'standard'} onValueChange={v => onChange('tier', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="luxury">Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs text-muted-foreground">Duration</Label><Input value={item.duration || ''} onChange={e => onChange('duration', e.target.value)} /></div>
                </div>
              </div>
            )}
            onSave={(item, isNew) => saveEntity('options', item, isNew)}
            onDelete={(ids) => deleteEntity('options', ids)}
          />
        </TabsContent>

        <TabsContent value="prices">
          <AdminEntityTable
            items={priceOptions}
            entityName="Price Option"
            columns={[
              { key: 'label', label: 'Label', width: 'flex-1', render: (p: any) => <span className="font-medium">{p.label}</span> },
              { key: 'amount', label: 'Amount', width: 'w-[100px]', render: (p: any) => <span className="font-mono text-sm">{p.currency} {p.amount}</span> },
              { key: 'option_id', label: 'Option', width: 'flex-1', render: (p: any) => {
                const o = options.find((x: any) => x.id === p.option_id);
                return o ? <span className="text-xs">{o.name}</span> : <span className="text-xs text-muted-foreground">{p.option_id?.slice(0,8)}</span>;
              }},
            ]}
            defaultItem={{ label: 'Adult', currency: 'USD', amount: 0, option_id: '', is_active: true }}
            renderForm={(item: any, onChange) => (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div><Label className="text-xs text-muted-foreground">Label</Label><Input value={item.label || ''} onChange={e => onChange('label', e.target.value)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Amount</Label><Input type="number" step="0.01" value={item.amount || 0} onChange={e => onChange('amount', parseFloat(e.target.value) || 0)} /></div>
                  <div><Label className="text-xs text-muted-foreground">Currency</Label><Input value={item.currency || 'USD'} onChange={e => onChange('currency', e.target.value)} /></div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Option</Label>
                  <Select value={item.option_id || ''} onValueChange={v => onChange('option_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Select option" /></SelectTrigger>
                    <SelectContent>{options.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs text-muted-foreground">Original Amount (strikethrough)</Label><Input type="number" step="0.01" value={item.original_amount || ''} onChange={e => onChange('original_amount', parseFloat(e.target.value) || null)} /></div>
              </div>
            )}
            onSave={(item, isNew) => saveEntity('price_options', item, isNew)}
            onDelete={(ids) => deleteEntity('price_options', ids)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
