import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Upload, Users, DollarSign, Search, X, Database, FileSpreadsheet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCategories, useCities, useCreators } from '@/hooks/useAppData';
import { BulkUploader } from '@/components/BulkUploader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const AdminPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    category: '',
    creator: '',
    creator_id: '',
    city_id: '',
    video_thumbnail: '',
    video_url: '',
    instagram_embed: '',
    duration: '',
    group_size: '',
    slug: '',
    best_time: '',
    weather: '',
    rating: '4.7',
  });

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

  const insertMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
      const payload: any = {
        title: data.title,
        description: data.description,
        location: data.location,
        price: data.price,
        category: data.category,
        creator: data.creator,
        creator_id: data.creator_id || null,
        city_id: data.city_id || null,
        video_thumbnail: data.video_thumbnail,
        video_url: data.video_url,
        instagram_embed: data.instagram_embed,
        duration: data.duration,
        group_size: data.group_size,
        slug,
        best_time: data.best_time,
        weather: data.weather,
        rating: parseFloat(data.rating) || 4.7,
      };
      if (editingId) {
        const { error } = await supabase.from('experiences').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('experiences').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });
      queryClient.invalidateQueries({ queryKey: ['db-experiences'] });
      toast({ title: `Experience ${editingId ? 'updated' : 'created'} successfully` });
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('experiences').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-experiences'] });
      queryClient.invalidateQueries({ queryKey: ['db-experiences'] });
      toast({ title: 'Experience deleted' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    insertMutation.mutate(formData);
  };

  const handleEdit = (exp: any) => {
    setFormData({
      title: exp.title || '',
      description: exp.description || '',
      location: exp.location || '',
      price: exp.price || '',
      category: exp.category || '',
      creator: exp.creator || '',
      creator_id: exp.creator_id || '',
      city_id: exp.city_id || '',
      video_thumbnail: exp.video_thumbnail || '',
      video_url: exp.video_url || '',
      instagram_embed: exp.instagram_embed || '',
      duration: exp.duration || '',
      group_size: exp.group_size || '',
      slug: exp.slug || '',
      best_time: exp.best_time || '',
      weather: exp.weather || '',
      rating: exp.rating?.toString() || '4.7',
    });
    setEditingId(exp.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', location: '', price: '', category: '', creator: '', creator_id: '', city_id: '', video_thumbnail: '', video_url: '', instagram_embed: '', duration: '', group_size: '', slug: '', best_time: '', weather: '', rating: '4.7' });
    setEditingId(null);
    setShowForm(false);
  };

  const activeCount = experiences.filter((e: any) => e.is_active).length;

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

            {/* Live status banner */}
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
                <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2 shrink-0"><Plus className="w-4 h-4" /> Add Experience</Button>
              </div>

              {/* Form */}
              {showForm && (
                <Card className="p-6 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'New'} Experience</h2>
                    <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
                  </div>
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="Title *" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                    <Input placeholder="Slug (auto-generated)" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} />

                    <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                      <SelectTrigger><SelectValue placeholder="Category *" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.name}>{c.emoji} {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={formData.creator_id} onValueChange={(v) => {
                      const cr = creators.find(c => c.id === v);
                      setFormData({...formData, creator_id: v, creator: cr?.display_name || cr?.username || ''});
                    }}>
                      <SelectTrigger><SelectValue placeholder="Creator" /></SelectTrigger>
                      <SelectContent>
                        {creators.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.display_name || c.username}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={formData.city_id} onValueChange={(v) => {
                      const city = cities.find(c => c.id === v);
                      setFormData({...formData, city_id: v, location: city?.name || formData.location});
                    }}>
                      <SelectTrigger><SelectValue placeholder="City" /></SelectTrigger>
                      <SelectContent>
                        {cities.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.flag_emoji} {c.name}, {c.country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input placeholder="Location (text)" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                    <Input placeholder="Price e.g. $30 - $80" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
                    <Input placeholder="Duration e.g. 2 hours" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} />
                    <Input placeholder="Group Size e.g. 4-8 people" value={formData.group_size} onChange={(e) => setFormData({...formData, group_size: e.target.value})} />
                    <Input placeholder="Rating" type="number" step="0.1" min="0" max="5" value={formData.rating} onChange={(e) => setFormData({...formData, rating: e.target.value})} />
                    <Input placeholder="Video Thumbnail URL" value={formData.video_thumbnail} onChange={(e) => setFormData({...formData, video_thumbnail: e.target.value})} />
                    <Input placeholder="Video URL" value={formData.video_url} onChange={(e) => setFormData({...formData, video_url: e.target.value})} />
                    <Input placeholder="Instagram Embed URL" value={formData.instagram_embed} onChange={(e) => setFormData({...formData, instagram_embed: e.target.value})} />
                    <Input placeholder="Best Time" value={formData.best_time} onChange={(e) => setFormData({...formData, best_time: e.target.value})} />
                    <Input placeholder="Weather" value={formData.weather} onChange={(e) => setFormData({...formData, weather: e.target.value})} />
                    <div className="md:col-span-2">
                      <Textarea placeholder="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} />
                    </div>
                    <div className="md:col-span-2 flex gap-3">
                      <Button type="submit" disabled={insertMutation.isPending}>{editingId ? 'Update' : 'Create'}</Button>
                      <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                    </div>
                  </form>
                </Card>
              )}

              {/* Experience List */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">All Experiences ({experiences.length})</h3>
                {isLoading ? <p>Loading...</p> : experiences.length === 0 ? <p className="text-muted-foreground">No experiences found.</p> : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {experiences.map((exp: any) => (
                      <div key={exp.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium text-sm truncate">{exp.title}</h3>
                            <Badge variant={exp.is_active ? 'default' : 'secondary'} className="text-xs shrink-0">
                              {exp.is_active ? 'active' : 'inactive'}
                            </Badge>
                            <Badge variant="outline" className="text-xs shrink-0">{exp.category}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{exp.location} • {exp.price} • {exp.creator} • /{exp.slug}</p>
                        </div>
                        <div className="flex gap-1 shrink-0 ml-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(exp)}><Edit className="w-3.5 h-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(exp.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
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
