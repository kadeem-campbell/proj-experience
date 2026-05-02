/**
 * AdminEntityEditor — the SHARED PRIMITIVE for every admin section.
 *
 * Declaratively turns a Supabase table into a fully editable admin surface:
 *   - list + search + sort
 *   - bulk select + bulk delete + bulk activate/deactivate
 *   - create / inline edit / delete (one or many)
 *   - friendly error toasts (no raw SQL leaks)
 *   - live React-Query cache invalidation so the public UI updates instantly
 *   - field types: text, textarea, number, slug, switch, select, image (storage), tags, m2m relations
 *
 * Every entity admin (carousels, products, collections, itineraries, hosts, pois, …)
 * should be expressed as a config passed into this component. No bespoke CRUD code.
 */
import { useMemo, useState, useEffect, useRef, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Trash2, ChevronDown, ChevronUp, CheckSquare, Power, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { friendlyError } from './friendlyError';

const slugify = (v: string) =>
  v.toLowerCase().replace(/\{\{[^}]+\}\}/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

// ─────────────────────────── field types ───────────────────────────
export type FieldType =
  | 'text' | 'textarea' | 'number' | 'slug' | 'switch'
  | 'select' | 'image' | 'tags';

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
  required?: boolean;
  options?: { value: string; label: string }[]; // for select
  storageBucket?: string;                        // for image
  rows?: number;                                  // for textarea
  defaultValue?: any;
  /** auto-derive from another field on create (e.g. slug from name) */
  deriveFrom?: string;
  /** hide in list summary, only show in edit form */
  formOnly?: boolean;
  /** width: 1 = full row, 0.5 = half, 0.33 = third, 0.25 = quarter */
  width?: 1 | 0.5 | 0.33 | 0.25;
}

export interface RelationConfig {
  key: string;                 // unique ID for this relation
  label: string;
  /** join table that links this entity to another */
  joinTable: string;
  /** column on join table referencing this entity */
  selfColumn: string;
  /** column on join table referencing the related entity */
  refColumn: string;
  /** the related entity table to read options from */
  refTable: string;
  refLabelColumn: string;       // e.g. 'name'
  refExtraColumns?: string[];   // e.g. ['flag_svg_url']
  refFilter?: { column: string; value: any };
  emptyHint?: string;
  badgeStyle?: 'primary' | 'accent';
}

export interface AdminEntityConfig<_T = any> {
  /** label shown in headings, e.g. 'Carousel' */
  entityName: string;
  /** plural label, e.g. 'Carousels' */
  entityNamePlural: string;
  /** Supabase table name */
  table: string;
  /** column used in list rows */
  primaryLabelColumn?: string; // default: 'name'
  /** column used in search */
  searchColumns?: string[];     // default: ['name','slug']
  /** sort column + direction for the list */
  orderBy?: { column: string; ascending?: boolean };
  /** all editable fields */
  fields: FieldConfig[];
  /** group fields shown collapsed by default in list row (chips/badges) */
  rowBadges?: { key: string; label?: (v: any) => string }[];
  /** M2M relations editable in the expand panel */
  relations?: RelationConfig[];
  /** custom render slot at bottom of edit panel (for items editor, etc.) */
  customExpandSlot?: (item: any) => ReactNode;
  /** React-Query keys to invalidate after every mutation (so public UI updates live) */
  invalidateKeys?: string[][];
  /** group rows by this column (e.g. page_location) */
  groupBy?: { key: string; labels?: Record<string, string> };
}

// ─────────────────────────── component ───────────────────────────
export const AdminEntityEditor = ({ config }: { config: AdminEntityConfig }) => {
  const qc = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [creatingDraft, setCreatingDraft] = useState<Record<string, any> | null>(null);

  const primary = config.primaryLabelColumn || 'name';
  const searchCols = config.searchColumns || [primary, 'slug'];

  const queryKey = ['admin-entity', config.table];
  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let q: any = (supabase as any).from(config.table).select('*');
      if (config.orderBy) q = q.order(config.orderBy.column, { ascending: config.orderBy.ascending ?? true });
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey });
    config.invalidateKeys?.forEach(k => qc.invalidateQueries({ queryKey: k }));
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((it: any) =>
      searchCols.some(c => String(it[c] ?? '').toLowerCase().includes(q))
    );
  }, [items, search, searchCols]);

  const grouped = useMemo(() => {
    if (!config.groupBy) return { __all: filtered };
    const g: Record<string, any[]> = {};
    filtered.forEach((it: any) => {
      const k = it[config.groupBy!.key] || '—';
      (g[k] ||= []).push(it);
    });
    return g;
  }, [filtered, config.groupBy]);

  // ── mutations ──
  const handleCreate = async () => {
    if (!creatingDraft) return;
    const payload: Record<string, any> = {};
    for (const f of config.fields) {
      let v = creatingDraft[f.key] ?? f.defaultValue;
      if (f.type === 'slug' && (!v || !String(v).trim()) && f.deriveFrom) {
        v = slugify(creatingDraft[f.deriveFrom] || '') || `${config.table}-${Date.now()}`;
      }
      if (f.required && (v === undefined || v === null || v === '')) {
        toast.error(`${f.label} is required`);
        return;
      }
      if (v !== undefined) payload[f.key] = v;
    }
    const { error } = await (supabase as any).from(config.table).insert(payload);
    if (error) {
      toast.error(friendlyError(error));
      return;
    }
    toast.success(`${config.entityName} created`);
    setCreatingDraft(null);
    invalidateAll();
  };

  const handleUpdate = async (id: string, updates: Record<string, any>) => {
    const { error } = await (supabase as any).from(config.table).update(updates).eq('id', id);
    if (error) { toast.error(friendlyError(error)); return; }
    invalidateAll();
  };

  const handleDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} ${ids.length === 1 ? config.entityName : config.entityNamePlural}? This cannot be undone.`)) return;
    const { error } = await (supabase as any).from(config.table).delete().in('id', ids);
    if (error) { toast.error(friendlyError(error)); return; }
    toast.success(`Deleted ${ids.length}`);
    setSelected(new Set());
    setBulkMode(false);
    invalidateAll();
  };

  const handleBulkActive = async (active: boolean) => {
    if (selected.size === 0) return;
    const { error } = await (supabase as any).from(config.table).update({ is_active: active }).in('id', Array.from(selected));
    if (error) { toast.error(friendlyError(error)); return; }
    toast.success(`${active ? 'Activated' : 'Deactivated'} ${selected.size}`);
    setSelected(new Set()); setBulkMode(false);
    invalidateAll();
  };

  const toggleSel = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  if (isLoading) return <div className="text-center py-10 text-sm text-muted-foreground">Loading {config.entityNamePlural.toLowerCase()}…</div>;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={`Search ${config.entityNamePlural.toLowerCase()}…`} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button size="sm" variant={bulkMode ? 'secondary' : 'outline'} className="gap-1" onClick={() => { setBulkMode(!bulkMode); setSelected(new Set()); }}>
          <CheckSquare className="w-3.5 h-3.5" /> Bulk
        </Button>
        <Button size="sm" className="gap-1" onClick={() => setCreatingDraft({})}>
          <Plus className="w-3.5 h-3.5" /> New {config.entityName.toLowerCase()}
        </Button>
      </div>

      {bulkMode && selected.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border">
          <span className="text-xs font-medium">{selected.size} selected</span>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleBulkActive(true)}>
            <Power className="w-3 h-3" /> Activate
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleBulkActive(false)}>
            <Power className="w-3 h-3" /> Deactivate
          </Button>
          <Button size="sm" variant="destructive" className="h-7 text-xs gap-1 ml-auto" onClick={() => handleDelete(Array.from(selected))}>
            <Trash2 className="w-3 h-3" /> Delete
          </Button>
        </div>
      )}

      {/* Create form */}
      {creatingDraft && (
        <Card className="p-4 border-primary/40">
          <h3 className="font-semibold text-sm mb-3">New {config.entityName.toLowerCase()}</h3>
          <FieldGrid fields={config.fields.filter(f => !f.formOnly || true)} value={creatingDraft} onChange={(k, v) => setCreatingDraft(p => ({ ...p, [k]: v }))} />
          <div className="flex gap-2 mt-4 justify-end">
            <Button size="sm" variant="outline" onClick={() => setCreatingDraft(null)}>Cancel</Button>
            <Button size="sm" onClick={handleCreate}>Create</Button>
          </div>
        </Card>
      )}

      {/* Grouped list */}
      {Object.entries(grouped).map(([groupKey, list]) => (
        <div key={groupKey}>
          {config.groupBy && (
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
              {config.groupBy.labels?.[groupKey] || groupKey} <span className="text-muted-foreground/60">({list.length})</span>
            </h4>
          )}
          <div className="space-y-1.5">
            {list.map((item: any) => (
              <EntityRow
                key={item.id}
                item={item}
                config={config}
                expanded={expandedId === item.id}
                onExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                bulkMode={bulkMode}
                selected={selected.has(item.id)}
                onToggleSelect={() => toggleSel(item.id)}
                onUpdate={(u) => handleUpdate(item.id, u)}
                onDelete={() => handleDelete([item.id])}
              />
            ))}
            {list.length === 0 && (
              <p className="text-xs text-muted-foreground italic py-4 text-center">No {config.entityNamePlural.toLowerCase()}.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─────────────────────────── EntityRow ───────────────────────────
const EntityRow = ({ item, config, expanded, onExpand, bulkMode, selected, onToggleSelect, onUpdate, onDelete }: any) => {
  const primary = config.primaryLabelColumn || 'name';
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 p-3">
        {bulkMode && <Checkbox checked={selected} onCheckedChange={onToggleSelect} className="shrink-0" />}
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onExpand}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">{item[primary] || <em className="text-muted-foreground">(unnamed)</em>}</span>
            {config.rowBadges?.map((b: any) => {
              const v = item[b.key];
              if (v === undefined || v === null || v === '') return null;
              return <Badge key={b.key} variant="outline" className="text-[10px]">{b.label ? b.label(v) : String(v)}</Badge>;
            })}
          </div>
          {item.slug && <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{item.slug}</p>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {'is_active' in item && (
            <>
              <Switch checked={!!item.is_active} onCheckedChange={v => onUpdate({ is_active: v })} className="scale-75" />
              <span className="text-[10px] text-muted-foreground w-6">{item.is_active ? 'On' : 'Off'}</span>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
          <button onClick={onExpand} className="p-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t p-4 bg-muted/20 space-y-4">
          <FieldGrid fields={config.fields} value={item} onChange={(k, v) => onUpdate({ [k]: v })} useBlur />
          {config.relations?.map((r: RelationConfig) => (
            <RelationEditor key={r.key} relation={r} entityId={item.id} />
          ))}
          {config.customExpandSlot?.(item)}
        </div>
      )}
    </Card>
  );
};

// ─────────────────────────── FieldGrid + Field ───────────────────────────
const FieldGrid = ({ fields, value, onChange, useBlur = false }: any) => (
  <div className="grid grid-cols-12 gap-3">
    {fields.map((f: FieldConfig) => {
      const span = f.width === 0.25 ? 'col-span-3' : f.width === 0.33 ? 'col-span-4' : f.width === 0.5 ? 'col-span-6' : 'col-span-12';
      return (
        <div key={f.key} className={span}>
          <Field field={f} value={value[f.key]} contextValue={value} onChange={(v) => onChange(f.key, v)} useBlur={useBlur} />
        </div>
      );
    })}
  </div>
);

const Field = ({ field, value, contextValue, onChange, useBlur }: any) => {
  const [local, setLocal] = useState<any>(value ?? '');
  const focusedRef = useRef(false);
  // Sync external value into local state when the server returns a fresh value
  // (e.g. after another field saves and the row re-renders). Don't clobber while user is editing.
  useEffect(() => {
    if (!focusedRef.current) setLocal(value ?? '');
  }, [value]);
  const commit = (v: any) => onChange(v);
  const change = useBlur ? setLocal : (v: any) => { setLocal(v); onChange(v); };
  const blurCommit = () => { focusedRef.current = false; if (useBlur && local !== value) commit(local); };
  const onFocus = () => { focusedRef.current = true; };

  const labelEl = (
    <Label className="text-xs font-medium flex items-center gap-1.5 mb-1">
      {field.label}{field.required && <span className="text-destructive">*</span>}
      {field.help && <span className="text-[10px] text-muted-foreground font-normal">— {field.help}</span>}
    </Label>
  );

  switch (field.type) {
    case 'textarea':
      return <div>{labelEl}<Textarea value={local} rows={field.rows || 3} placeholder={field.placeholder} onFocus={onFocus} onChange={e => change(e.target.value)} onBlur={blurCommit} /></div>;
    case 'number':
      return <div>{labelEl}<Input type="number" value={local ?? ''} placeholder={field.placeholder} onFocus={onFocus} onChange={e => change(e.target.value === '' ? null : Number(e.target.value))} onBlur={blurCommit} /></div>;
    case 'slug':
      return <div>{labelEl}<Input value={local} placeholder={field.placeholder || (field.deriveFrom ? `auto from ${field.deriveFrom}` : '')} className="font-mono text-xs" onFocus={onFocus} onChange={e => change(e.target.value)} onBlur={blurCommit} /></div>;
    case 'switch':
      return <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2"><div><div className="text-xs font-medium">{field.label}</div>{field.help && <div className="text-[10px] text-muted-foreground">{field.help}</div>}</div><Switch checked={!!local} onCheckedChange={v => { setLocal(v); commit(v); }} /></div>;
    case 'select':
      return <div>{labelEl}<Select value={local || ''} onValueChange={v => { setLocal(v); commit(v); }}><SelectTrigger><SelectValue placeholder={field.placeholder} /></SelectTrigger><SelectContent>{field.options?.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>;
    case 'image':
      return <div>{labelEl}<ImageField value={local} bucket={field.storageBucket || 'product-images'} onChange={(v: string) => { setLocal(v); commit(v); }} /></div>;
    case 'tags':
      return <div>{labelEl}<Input value={Array.isArray(local) ? local.join(', ') : (local || '')} placeholder="comma, separated" onFocus={onFocus} onChange={e => change(e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} onBlur={blurCommit} /></div>;
    case 'text':
    default:
      return <div>{labelEl}<Input value={local ?? ''} placeholder={field.placeholder} onFocus={onFocus} onChange={e => change(e.target.value)} onBlur={blurCommit} /></div>;
  }
};

// ─────────────────────────── ImageField ───────────────────────────
const ImageField = ({ value, bucket, onChange }: { value: string; bucket: string; onChange: (v: string) => void }) => {
  const [uploading, setUploading] = useState(false);
  const onFile = async (file: File) => {
    setUploading(true);
    try {
      const path = `${Date.now()}-${file.name.replace(/[^a-z0-9.-]/gi, '_')}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
      if (upErr) { toast.error(friendlyError(upErr)); return; }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success('Uploaded');
    } finally { setUploading(false); }
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={value || ''} placeholder="Paste image URL or upload" onChange={e => onChange(e.target.value)} />
        <label className={cn("inline-flex items-center gap-1 px-3 rounded-md border bg-background cursor-pointer text-xs hover:bg-muted", uploading && 'opacity-50 pointer-events-none')}>
          <Upload className="w-3.5 h-3.5" /> {uploading ? 'Up…' : 'Upload'}
          <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onFile(f); e.currentTarget.value = ''; }} />
        </label>
        {value && <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => onChange('')}><X className="w-3.5 h-3.5" /></Button>}
      </div>
      {value && <img src={value} alt="" className="h-20 w-32 object-cover rounded-md border" onError={(e) => (e.currentTarget.style.display = 'none')} />}
    </div>
  );
};

// ─────────────────────────── RelationEditor ───────────────────────────
const RelationEditor = ({ relation, entityId }: { relation: RelationConfig; entityId: string }) => {
  const qc = useQueryClient();
  const linksKey = ['admin-relation', relation.joinTable, entityId];
  const optsKey = ['admin-relation-opts', relation.refTable];

  const { data: links = [] } = useQuery({
    queryKey: linksKey,
    queryFn: async () => {
      const { data } = await (supabase as any).from(relation.joinTable).select('*').eq(relation.selfColumn, entityId);
      return data || [];
    },
  });

  const { data: options = [] } = useQuery({
    queryKey: optsKey,
    queryFn: async () => {
      const cols = ['id', relation.refLabelColumn, ...(relation.refExtraColumns || [])].join(', ');
      let q: any = (supabase as any).from(relation.refTable).select(cols);
      if (relation.refFilter) q = q.eq(relation.refFilter.column, relation.refFilter.value);
      const { data } = await q.order(relation.refLabelColumn);
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const linkedIds = new Set(links.map((l: any) => l[relation.refColumn]));

  const toggle = async (refId: string, isLinked: boolean) => {
    if (isLinked) {
      const link = links.find((l: any) => l[relation.refColumn] === refId);
      if (link) {
        const { error } = await (supabase as any).from(relation.joinTable).delete().eq('id', link.id);
        if (error) { toast.error(friendlyError(error)); return; }
      }
    } else {
      const { error } = await (supabase as any).from(relation.joinTable).insert({ [relation.selfColumn]: entityId, [relation.refColumn]: refId });
      if (error) { toast.error(friendlyError(error)); return; }
    }
    qc.invalidateQueries({ queryKey: linksKey });
    qc.invalidateQueries({ queryKey: ['home-carousels'] });
  };

  return (
    <div>
      <Label className="text-xs font-semibold">{relation.label}</Label>
      {relation.emptyHint && <p className="text-[11px] text-muted-foreground mb-2">{relation.emptyHint}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((o: any) => {
          const linked = linkedIds.has(o.id);
          const flag = o.flag_svg_url;
          return (
            <label key={o.id} className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-colors",
              linked
                ? (relation.badgeStyle === 'accent' ? "bg-accent/30 border-accent text-foreground font-medium" : "bg-primary/10 border-primary/30 text-primary font-medium")
                : "bg-background border-border text-muted-foreground hover:bg-muted"
            )}>
              <Checkbox checked={linked} onCheckedChange={() => toggle(o.id, linked)} className="h-3.5 w-3.5" />
              {flag && <img src={flag} className="w-3.5 h-3.5 rounded-full" alt="" />}
              {o[relation.refLabelColumn]}
            </label>
          );
        })}
        {options.length === 0 && <p className="text-xs text-muted-foreground italic">Nothing to link.</p>}
      </div>
    </div>
  );
};
