import { useState, useEffect, useCallback, useRef } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Search, X, Database, FileSpreadsheet, Users, DollarSign, Upload, Archive, Eye, EyeOff, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCategories, useCities, useCreators } from '@/hooks/useAppData';
import { BulkUploader } from '@/components/BulkUploader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface TikTokVideo {
  videoId: string;
  url: string;
  author: string;
}

const AdminPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const defaultForm = {
    title: '',
    description: '',
    location: '',
    price_min: 0,
    price_max: 100,
    category: '',
    creator: '',
    creator_ids: [] as string[],
    city_id: '',
    video_thumbnail: '',
    video_url: '',
    instagram_embed: '',
    tiktok_videos: [] as TikTokVideo[],
    duration_min: 1,
    duration_max: 4,
    group_min: 1,
    group_max: 10,
    slug: '',
    best_time: '',
    weather: '',
    rating: '4.7',
    is_active: true,
  };

  const [formData, setFormData] = useState(defaultForm);
  const [newTikTok, setNewTikTok] = useState({ url: '', author: '' });

  const { data: categories = [] } = useCategories();
  const { data: cities = [] } = useCities();
  const { data: creators = [] } = useCreators();

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ['admin-experiences', searchQuery],
    queryFn: async () => {
      let q = supabase.from('experiences').select('*').order('created_at', { ascending: false });
      if (searchQuery) {
        q = q.or(`title.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
      }
      const { data, error } = await q.limit(500);
      if (error) { console.error(error); return []; }
      return data || [];
    },
  });

  // Parse stored values into range format
  const parsePrice = (p: string) => {
    const nums = p.match(/\d+/g);
    if (nums && nums.length >= 2) return [parseInt(nums[0]), parseInt(nums[1])];
    if (nums && nums.length === 1) return [parseInt(nums[0]), parseInt(nums[0])];
    return [0, 100];
  };

  const parseDuration = (d: string) => {
    const nums = d.match(/\d+/g);
    if (nums && nums.length >= 2) return [parseInt(nums[0]), parseInt(nums[1])];
    if (nums && nums.length === 1) return [parseInt(nums[0]), parseInt(nums[0])];
    return [1, 4];
  };

  const parseGroupSize = (g: string) => {
    const nums = g.match(/\d+/g);
    if (nums && nums.length >= 2) return [parseInt(nums[0]), parseInt(nums[1])];
    if (nums && nums.length === 1) return [parseInt(nums[0]), parseInt(nums[0])];
    return [1, 10];
  };

  const buildPayload = (data: typeof formData) => {
    const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
    const creatorNames = data.creator_ids.map(id => {
      const c = creators.find(cr => cr.id === id);
      return c?.display_name || c?.username || '';
    }).filter(Boolean);

    return {
      title: data.title,
      description: data.description,
      location: data.location,
      price: data.price_min === data.price_max ? `$${data.price_min}` : `$${data.price_min} - $${data.price_max}`,
      category: data.category,
      creator: creatorNames.join(', '),
      creator_id: data.creator_ids[0] || null,
      city_id: data.city_id || null,
      video_thumbnail: data.video_thumbnail,
      video_url: data.video_url,
      instagram_embed: data.instagram_embed,
      tiktok_videos: data.tiktok_videos as any,
      duration: data.duration_min === data.duration_max ? `${data.duration_min} hours` : `${data.duration_min}-${data.duration_max} hours`,
      group_size: data.group_min === data.group_max ? `${data.group_min} people` : `${data.group_min}-${data.group_max} people`,
      slug,
      best_time: data.best_time,
      weather: data.weather,
      rating: parseFloat(data.rating) || 4.7,
      is_active: data.is_active,
    };
  };

  const saveMutation = useMutation({
    mutationFn: async ({ data, id }: { data: typeof formData; id: string | null }) => {
      const payload = buildPayload(data);
      if (id) {
        const { error } = await supabase.from('experiences').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('experiences').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });
      queryClient.invalidateQueries({ queryKey: ['db-experiences'] });
      if (!vars.id) {
        toast({ title: 'Experience created successfully' });
        resetForm();
      } else {
        toast({ title: 'Auto-saved ✓' });
      }
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('experiences').update({ is_active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });
      queryClient.invalidateQueries({ queryKey: ['db-experiences'] });
      toast({ title: 'Experience archived' });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('experiences').update({ is_active: active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });
      queryClient.invalidateQueries({ queryKey: ['db-experiences'] });
    },
  });

  // Auto-save for inline edits (debounced)
  const triggerAutoSave = useCallback((data: typeof formData, id: string) => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveMutation.mutate({ data, id });
    }, 1500);
  }, [saveMutation]);

  const updateField = (field: string, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    if (editingId) {
      triggerAutoSave(updated, editingId);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ data: formData, id: null });
  };

  const handleEdit = (exp: any) => {
    const [priceMin, priceMax] = parsePrice(exp.price || '');
    const [durMin, durMax] = parseDuration(exp.duration || '');
    const [grpMin, grpMax] = parseGroupSize(exp.group_size || '');

    // Try to find creator IDs from the creator string
    const creatorNames = (exp.creator || '').split(',').map((n: string) => n.trim()).filter(Boolean);
    const creatorIds = creatorNames.map((name: string) => {
      const c = creators.find(cr => (cr.display_name || cr.username) === name);
      return c?.id;
    }).filter(Boolean) as string[];

    // If creator_id exists but not in the list, add it
    if (exp.creator_id && !creatorIds.includes(exp.creator_id)) {
      creatorIds.push(exp.creator_id);
    }

    setFormData({
      title: exp.title || '',
      description: exp.description || '',
      location: exp.location || '',
      price_min: priceMin,
      price_max: priceMax,
      category: exp.category || '',
      creator: exp.creator || '',
      creator_ids: creatorIds,
      city_id: exp.city_id || '',
      video_thumbnail: exp.video_thumbnail || '',
      video_url: exp.video_url || '',
      instagram_embed: exp.instagram_embed || '',
      tiktok_videos: Array.isArray(exp.tiktok_videos) ? exp.tiktok_videos : [],
      duration_min: durMin,
      duration_max: durMax,
      group_min: grpMin,
      group_max: grpMax,
      slug: exp.slug || '',
      best_time: exp.best_time || '',
      weather: exp.weather || '',
      rating: exp.rating?.toString() || '4.7',
      is_active: exp.is_active ?? true,
    });
    setEditingId(exp.id);
    setExpandedId(exp.id);
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setEditingId(null);
    setExpandedId(null);
    setNewTikTok({ url: '', author: '' });
  };

  const addTikTok = () => {
    if (!newTikTok.url) return;
    const videoId = newTikTok.url.match(/video\/(\d+)/)?.[1] || `tt-${Date.now()}`;
    const updated = {
      ...formData,
      tiktok_videos: [...formData.tiktok_videos, { videoId, url: newTikTok.url, author: newTikTok.author }],
    };
    setFormData(updated);
    setNewTikTok({ url: '', author: '' });
    if (editingId) triggerAutoSave(updated, editingId);
  };

  const removeTikTok = (idx: number) => {
    const updated = { ...formData, tiktok_videos: formData.tiktok_videos.filter((_, i) => i !== idx) };
    setFormData(updated);
    if (editingId) triggerAutoSave(updated, editingId);
  };

  const toggleCreator = (id: string) => {
    const ids = formData.creator_ids.includes(id)
      ? formData.creator_ids.filter(i => i !== id)
      : [...formData.creator_ids, id];
    updateField('creator_ids', ids);
  };

  const activeCount = experiences.filter((e: any) => e.is_active).length;

  // Shared form fields component
  const renderForm = (isInline: boolean) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label className="text-xs text-muted-foreground mb-1">Title *</Label>
        <Input placeholder="Title" value={formData.title} onChange={(e) => updateField('title', e.target.value)} required />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1">Slug (auto-generated)</Label>
        <Input placeholder="Slug" value={formData.slug} onChange={(e) => updateField('slug', e.target.value)} />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1">Category *</Label>
        <Select value={formData.category} onValueChange={(v) => updateField('category', v)}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.name}>{c.emoji} {c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1">City</Label>
        <Select value={formData.city_id} onValueChange={(v) => {
          const city = cities.find(c => c.id === v);
          setFormData(prev => ({ ...prev, city_id: v, location: city?.name || prev.location }));
          if (editingId) {
            const updated = { ...formData, city_id: v, location: city?.name || formData.location };
            triggerAutoSave(updated, editingId);
          }
        }}>
          <SelectTrigger><SelectValue placeholder="City" /></SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.flag_emoji} {c.name}, {c.country}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1">Location (text)</Label>
        <Input placeholder="Location" value={formData.location} onChange={(e) => updateField('location', e.target.value)} />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1">Rating</Label>
        <Input placeholder="Rating" type="number" step="0.1" min="0" max="5" value={formData.rating} onChange={(e) => updateField('rating', e.target.value)} />
      </div>

      {/* Creators multi-select */}
      <div className="md:col-span-2">
        <Label className="text-xs text-muted-foreground mb-1">Creators (multi-select)</Label>
        <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30 max-h-32 overflow-y-auto">
          {creators.map(c => (
            <label key={c.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <Checkbox
                checked={formData.creator_ids.includes(c.id)}
                onCheckedChange={() => toggleCreator(c.id)}
              />
              <span>{c.display_name || c.username}</span>
            </label>
          ))}
          {creators.length === 0 && <span className="text-xs text-muted-foreground">No creators yet</span>}
        </div>
      </div>

      {/* Price range */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1">Price Range: ${formData.price_min} - ${formData.price_max}</Label>
        <div className="px-2 pt-2">
          <Slider
            min={0} max={500} step={5}
            value={[formData.price_min, formData.price_max]}
            onValueChange={([min, max]) => {
              const updated = { ...formData, price_min: min, price_max: max };
              setFormData(updated);
              if (editingId) triggerAutoSave(updated, editingId);
            }}
          />
        </div>
      </div>

      {/* Duration range */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1">Duration: {formData.duration_min}-{formData.duration_max} hours</Label>
        <div className="px-2 pt-2">
          <Slider
            min={1} max={24} step={1}
            value={[formData.duration_min, formData.duration_max]}
            onValueChange={([min, max]) => {
              const updated = { ...formData, duration_min: min, duration_max: max };
              setFormData(updated);
              if (editingId) triggerAutoSave(updated, editingId);
            }}
          />
        </div>
      </div>

      {/* Group size range */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1">Group Size: {formData.group_min}-{formData.group_max} people</Label>
        <div className="px-2 pt-2">
          <Slider
            min={1} max={50} step={1}
            value={[formData.group_min, formData.group_max]}
            onValueChange={([min, max]) => {
              const updated = { ...formData, group_min: min, group_max: max };
              setFormData(updated);
              if (editingId) triggerAutoSave(updated, editingId);
            }}
          />
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-3">
        <Label className="text-xs text-muted-foreground">Active</Label>
        <Switch checked={formData.is_active} onCheckedChange={(v) => updateField('is_active', v)} />
        <span className="text-xs">{formData.is_active ? 'Live' : 'Inactive'}</span>
      </div>

      {/* Media */}
      <div>
        <Label className="text-xs text-muted-foreground mb-1">Video Thumbnail URL</Label>
        <Input placeholder="https://..." value={formData.video_thumbnail} onChange={(e) => updateField('video_thumbnail', e.target.value)} />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1">Video URL</Label>
        <Input placeholder="https://..." value={formData.video_url} onChange={(e) => updateField('video_url', e.target.value)} />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1">Instagram Embed URL</Label>
        <Input placeholder="https://instagram.com/reel/..." value={formData.instagram_embed} onChange={(e) => updateField('instagram_embed', e.target.value)} />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground mb-1">Best Time</Label>
        <Input placeholder="Morning, Afternoon..." value={formData.best_time} onChange={(e) => updateField('best_time', e.target.value)} />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground mb-1">Weather</Label>
        <Input placeholder="Sunny 30°C" value={formData.weather} onChange={(e) => updateField('weather', e.target.value)} />
      </div>

      {/* TikTok Videos */}
      <div className="md:col-span-2">
        <Label className="text-xs text-muted-foreground mb-1">TikTok Videos</Label>
        <div className="space-y-2">
          {formData.tiktok_videos.map((tt, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-xs">
              <span className="truncate flex-1">{tt.url}</span>
              <span className="text-muted-foreground">{tt.author}</span>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeTikTok(idx)}><X className="w-3 h-3" /></Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input placeholder="TikTok URL" value={newTikTok.url} onChange={(e) => setNewTikTok({ ...newTikTok, url: e.target.value })} className="text-xs" />
            <Input placeholder="Author" value={newTikTok.author} onChange={(e) => setNewTikTok({ ...newTikTok, author: e.target.value })} className="text-xs w-32" />
            <Button type="button" variant="outline" size="sm" onClick={addTikTok}>Add</Button>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="md:col-span-2">
        <Label className="text-xs text-muted-foreground mb-1">Description</Label>
        <Textarea placeholder="Description" value={formData.description} onChange={(e) => updateField('description', e.target.value)} rows={3} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="manage">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold">Admin Panel</h1>
                <p className="text-muted-foreground">Manage experiences and content — Live database</p>
              </div>
              <TabsList>
                <TabsTrigger value="manage" className="gap-2"><Database className="w-4 h-4" /> Manage</TabsTrigger>
                <TabsTrigger value="bulk" className="gap-2"><FileSpreadsheet className="w-4 h-4" /> Bulk Upload</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">Live — Connected to database</span>
              <span className="text-xs text-muted-foreground ml-auto">{experiences.length} experiences loaded</span>
            </div>

            <TabsContent value="manage">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><Upload className="w-5 h-5 text-primary" /></div>
                  <div><p className="text-xs text-muted-foreground">Total Experiences</p><p className="text-xl font-bold">{experiences.length}</p></div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg"><Users className="w-5 h-5 text-green-600" /></div>
                  <div><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold">{activeCount}</p></div>
                </Card>
                <Card className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg"><DollarSign className="w-5 h-5 text-yellow-600" /></div>
                  <div><p className="text-xs text-muted-foreground">Categories / Cities</p><p className="text-xl font-bold">{categories.length} / {cities.length}</p></div>
                </Card>
              </div>

              {/* Search + Add */}
              <div className="flex gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search experiences..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
                </div>
                <Button onClick={() => { resetForm(); setExpandedId('new'); }} className="gap-2 shrink-0"><Plus className="w-4 h-4" /> Add Experience</Button>
              </div>

              {/* New Experience Form */}
              {expandedId === 'new' && !editingId && (
                <Card className="p-6 mb-6 border-primary/30">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">New Experience</h2>
                    <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
                  </div>
                  <form onSubmit={handleCreate}>
                    {renderForm(false)}
                    <div className="flex gap-3 mt-4">
                      <Button type="submit" disabled={saveMutation.isPending}>Create</Button>
                      <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Experience List with Inline Editing */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">All Experiences ({experiences.length})</h3>
                {isLoading ? <p>Loading...</p> : experiences.length === 0 ? <p className="text-muted-foreground">No experiences found.</p> : (
                  <div className="space-y-2 max-h-[800px] overflow-y-auto">
                    {experiences.map((exp: any) => (
                      <div key={exp.id} className="border rounded-lg overflow-hidden">
                        {/* Row header */}
                        <div className="flex items-center justify-between p-3">
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => {
                            if (expandedId === exp.id) {
                              resetForm();
                            } else {
                              handleEdit(exp);
                            }
                          }}>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-medium text-sm truncate">{exp.title}</h3>
                              <Badge variant={exp.is_active ? 'default' : 'secondary'} className="text-xs shrink-0">
                                {exp.is_active ? 'active' : 'archived'}
                              </Badge>
                              <Badge variant="outline" className="text-xs shrink-0">{exp.category}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{exp.location} • {exp.price} • {exp.creator} • /{exp.slug}</p>
                          </div>
                          <div className="flex gap-1 shrink-0 ml-2 items-center">
                            <Switch
                              checked={exp.is_active}
                              onCheckedChange={(checked) => toggleActiveMutation.mutate({ id: exp.id, active: checked })}
                              className="scale-75"
                            />
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                              if (expandedId === exp.id) { resetForm(); } else { handleEdit(exp); }
                            }}>
                              {expandedId === exp.id ? <ChevronUp className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"
                              onClick={() => archiveMutation.mutate(exp.id)}
                              title="Archive"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </Button>
                            {exp.slug && (
                              <a href={`/experience/${exp.slug}`} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink className="w-3.5 h-3.5" /></Button>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Inline edit panel */}
                        {expandedId === exp.id && editingId === exp.id && (
                          <div className="border-t p-4 bg-muted/20">
                            <div className="flex items-center gap-2 mb-3">
                              <h4 className="text-sm font-semibold text-primary">Editing: {exp.title}</h4>
                              {saveMutation.isPending && <span className="text-xs text-muted-foreground animate-pulse">Saving...</span>}
                            </div>
                            {renderForm(true)}
                            <div className="flex gap-3 mt-4">
                              <Button variant="outline" size="sm" onClick={resetForm}>Close</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="bulk">
              <BulkUploader />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
