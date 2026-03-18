/**
 * Generic reusable entity table with search, bulk select, inline expand, CRUD.
 * Now includes built-in bulk field update for selected items.
 */
import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Plus, Trash2, ChevronDown, ChevronUp, CheckSquare,
  Archive, Eye, EyeOff, Download, RotateCcw, Filter, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline';
  action: (ids: string[]) => Promise<void>;
}

/** Define which fields can be bulk-updated and their type */
export interface BulkFieldDef {
  key: string;
  label: string;
  type: 'text' | 'select' | 'boolean' | 'number';
  options?: { value: string; label: string }[];
}

interface AdminEntityTableProps<T extends { id: string }> {
  items: T[];
  columns: ColumnDef<T>[];
  renderForm?: (item: Partial<T>, onChange: (field: string, value: any) => void) => React.ReactNode;
  onSave?: (item: Partial<T>, isNew: boolean) => Promise<void>;
  onDelete?: (ids: string[]) => Promise<void>;
  onBulkUpdate?: (ids: string[], field: string, value: any) => Promise<void>;
  entityName: string;
  defaultItem?: Partial<T>;
  bulkActions?: BulkAction[];
  bulkFields?: BulkFieldDef[];
  searchFields?: string[];
  statusField?: string;
  filterOptions?: { key: string; label: string; options: { value: string; label: string }[] }[];
  isLoading?: boolean;
  renderRowBadges?: (item: T) => React.ReactNode;
}

export function AdminEntityTable<T extends { id: string }>({
  items,
  columns,
  renderForm,
  onSave,
  onDelete,
  onBulkUpdate,
  entityName,
  defaultItem = {} as Partial<T>,
  bulkActions = [],
  bulkFields = [],
  searchFields = ['name', 'title', 'display_name', 'username', 'slug'],
  filterOptions = [],
  isLoading,
  renderRowBadges,
}: AdminEntityTableProps<T>) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<T>>(defaultItem);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  // Bulk update state
  const [bulkField, setBulkField] = useState('');
  const [bulkValue, setBulkValue] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const filtered = useMemo(() => {
    let result = items.filter((item: any) => {
      if (search) {
        const q = search.toLowerCase();
        const match = searchFields.some(f => (item[f] || '').toString().toLowerCase().includes(q));
        if (!match) return false;
      }
      for (const [key, val] of Object.entries(filters)) {
        if (val && val !== '__all__' && (item as any)[key] !== val) return false;
      }
      return true;
    });
    if (sortKey) {
      result = [...result].sort((a: any, b: any) => {
        const av = a[sortKey] ?? '';
        const bv = b[sortKey] ?? '';
        const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [items, search, filters, sortKey, sortDir, searchFields]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const handleChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = async (isNew: boolean) => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(formData, isNew);
      setExpandedId(null);
      setFormData(defaultItem);
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === paged.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paged.map(i => i.id)));
  };

  const handleBulkDelete = async () => {
    if (!onDelete || selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} ${entityName}(s)?`)) return;
    await onDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBulkFieldUpdate = async () => {
    if (!onBulkUpdate || !bulkField || selectedIds.size === 0) return;
    const fieldDef = bulkFields.find(f => f.key === bulkField);
    let parsedValue: any = bulkValue;
    if (fieldDef?.type === 'boolean') parsedValue = bulkValue === 'true';
    else if (fieldDef?.type === 'number') parsedValue = parseFloat(bulkValue) || null;

    setBulkUpdating(true);
    try {
      await onBulkUpdate(Array.from(selectedIds), bulkField, parsedValue);
      setBulkValue('');
    } finally {
      setBulkUpdating(false);
    }
  };

  const exportCSV = () => {
    const headers = columns.map(c => c.key);
    const rows = filtered.map((item: any) => headers.map(h => JSON.stringify(item[h] ?? '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${entityName.toLowerCase().replace(/\s/g, '_')}_export.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const selectedFieldDef = bulkFields.find(f => f.key === bulkField);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={`Search ${entityName}...`} value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} className="pl-9 h-9 text-sm" />
        </div>
        {filterOptions.map(fo => (
          <Select key={fo.key} value={filters[fo.key] || '__all__'} onValueChange={v => setFilters(prev => ({ ...prev, [fo.key]: v }))}>
            <SelectTrigger className="w-[140px] h-9 text-xs"><SelectValue placeholder={fo.label} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All {fo.label}</SelectItem>
              {fo.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        ))}
        <Button size="sm" variant={bulkMode ? 'secondary' : 'outline'} className="gap-1 text-xs h-9" onClick={() => { setBulkMode(!bulkMode); setSelectedIds(new Set()); }}>
          <CheckSquare className="w-3.5 h-3.5" /> Bulk
        </Button>
        <Button size="sm" variant="outline" className="gap-1 text-xs h-9" onClick={exportCSV}>
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
        {renderForm && (
          <Button size="sm" className="gap-1 h-9" onClick={() => { setFormData(defaultItem); setExpandedId('new'); }}>
            <Plus className="w-3.5 h-3.5" /> Add {entityName}
          </Button>
        )}
      </div>

      {/* Bulk bar */}
      {bulkMode && selectedIds.size > 0 && (
        <div className="mb-3 p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium">{selectedIds.size} selected</span>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={selectAll}>
              {selectedIds.size === paged.length ? 'Deselect All' : 'Select All'}
            </Button>
            {bulkActions.map((ba, i) => (
              <Button key={i} size="sm" variant={(ba.variant as any) || 'outline'} className="h-7 text-xs gap-1" onClick={() => ba.action(Array.from(selectedIds))}>
                {ba.icon} {ba.label}
              </Button>
            ))}
            {onDelete && (
              <Button size="sm" variant="destructive" className="h-7 text-xs gap-1 ml-auto" onClick={handleBulkDelete}>
                <Trash2 className="w-3 h-3" /> Delete
              </Button>
            )}
          </div>

          {/* Bulk field update row */}
          {onBulkUpdate && bulkFields.length > 0 && (
            <div className="flex items-end gap-2 pt-1 border-t border-primary/10 flex-wrap">
              <div className="min-w-[140px]">
                <span className="text-[10px] text-muted-foreground block mb-0.5">Field</span>
                <Select value={bulkField} onValueChange={v => { setBulkField(v); setBulkValue(''); }}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pick field..." /></SelectTrigger>
                  <SelectContent>
                    {bulkFields.map(f => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {bulkField && (
                <div className="min-w-[160px] flex-1">
                  <span className="text-[10px] text-muted-foreground block mb-0.5">Value</span>
                  {selectedFieldDef?.type === 'select' && selectedFieldDef.options ? (
                    <Select value={bulkValue} onValueChange={setBulkValue}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {selectedFieldDef.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : selectedFieldDef?.type === 'boolean' ? (
                    <Select value={bulkValue} onValueChange={setBulkValue}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">true</SelectItem>
                        <SelectItem value="false">false</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={bulkValue} onChange={e => setBulkValue(e.target.value)} className="h-8 text-xs" type={selectedFieldDef?.type === 'number' ? 'number' : 'text'} placeholder="Enter value..." />
                  )}
                </div>
              )}
              {bulkField && bulkValue !== '' && (
                <Button size="sm" className="h-8 gap-1 text-xs" disabled={bulkUpdating} onClick={handleBulkFieldUpdate}>
                  <Zap className="w-3 h-3" /> {bulkUpdating ? 'Updating...' : `Apply to ${selectedIds.size}`}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
        <span>{filtered.length} {entityName}(s)</span>
        {filtered.length !== items.length && <span className="text-primary">({items.length} total, {items.length - filtered.length} filtered out)</span>}
        {totalPages > 1 && <span>Page {page + 1}/{totalPages}</span>}
      </div>

      {/* New form */}
      {expandedId === 'new' && renderForm && (
        <div className="p-4 mb-4 border rounded-lg border-primary/30 bg-primary/5">
          <h3 className="font-semibold text-sm mb-3">New {entityName}</h3>
          {renderForm(formData, handleChange)}
          <div className="flex gap-2 mt-3">
            <Button size="sm" disabled={saving} onClick={() => handleSave(true)}>{saving ? 'Saving...' : 'Create'}</Button>
            <Button size="sm" variant="outline" onClick={() => setExpandedId(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
            {bulkMode && <div className="w-6" />}
            {columns.map(col => (
              <div
                key={col.key}
                className={cn('cursor-pointer hover:text-foreground transition-colors', col.width || 'flex-1')}
                onClick={() => {
                  if (sortKey === col.key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                  else { setSortKey(col.key); setSortDir('asc'); }
                }}
              >
                {col.label}
                {sortKey === col.key && <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>}
              </div>
            ))}
            <div className="w-16 shrink-0" />
          </div>

          {/* Rows */}
          <div className="max-h-[600px] overflow-y-auto divide-y">
            {paged.map(item => (
              <div key={item.id}>
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition-colors">
                  {bulkMode && (
                    <Checkbox checked={selectedIds.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} className="shrink-0" />
                  )}
                  {columns.map(col => (
                    <div key={col.key} className={cn('text-sm truncate', col.width || 'flex-1')}>
                      {col.render ? col.render(item) : String((item as any)[col.key] ?? '')}
                    </div>
                  ))}
                  <div className="w-16 shrink-0 flex items-center gap-1 justify-end">
                    {renderRowBadges?.(item)}
                    {renderForm && (
                      <button className="p-1 hover:bg-muted rounded" onClick={() => {
                        if (expandedId === item.id) setExpandedId(null);
                        else { setExpandedId(item.id); setFormData(item); }
                      }}>
                        {expandedId === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>
                {expandedId === item.id && renderForm && (
                  <div className="border-t p-4 bg-muted/10">
                    {renderForm(formData, handleChange)}
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" disabled={saving} onClick={() => handleSave(false)}>{saving ? 'Saving...' : 'Save'}</Button>
                      <Button size="sm" variant="outline" onClick={() => setExpandedId(null)}>Close</Button>
                      {onDelete && (
                        <Button size="sm" variant="destructive" className="ml-auto gap-1" onClick={async () => {
                          if (confirm(`Delete this ${entityName}?`)) { await onDelete([item.id]); setExpandedId(null); }
                        }}>
                          <Trash2 className="w-3 h-3" /> Delete
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {paged.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">No {entityName} found</div>
            )}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
