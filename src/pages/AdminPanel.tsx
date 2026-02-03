import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Upload, Users, DollarSign, AlertCircle } from 'lucide-react';

interface Experience {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  category: string;
  creator: string;
  video_thumbnail: string;
  duration_hours: number;
  max_participants: number;
  status: string;
}

const AdminPanel = () => {
  const { user, isAuthenticated, userProfile } = useAuth();
  const { toast } = useToast();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    price: '',
    category: '',
    creator: '',
    video_thumbnail: '',
    duration_hours: '',
    max_participants: '',
  });

  const categories = [
    'Water Sports', 'Food & Dining', 'Wildlife', 'Beach', 'Adventure', 'Nightlife',
    'Culture', 'Sports', 'Shopping', 'Nature', 'Music', 'Art'
  ];

  // Mock data for now since experiences table doesn't exist
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      // Simulate loading
      setTimeout(() => {
        setExperiences([
          {
            id: '1',
            title: 'Jet Ski Adventure',
            description: 'Thrilling jet ski experience',
            location: 'Coco Beach',
            price: 75,
            category: 'Water Sports',
            creator: 'Beach Adventures',
            video_thumbnail: '',
            duration_hours: 2,
            max_participants: 4,
            status: 'active'
          },
          {
            id: '2',
            title: 'Spice Farm Tour',
            description: 'Explore local spice farms',
            location: 'Zanzibar',
            price: 45,
            category: 'Culture',
            creator: 'Island Tours',
            video_thumbnail: '',
            duration_hours: 4,
            max_participants: 12,
            status: 'active'
          }
        ]);
        setLoading(false);
      }, 500);
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newExperience: Experience = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      location: formData.location,
      price: parseFloat(formData.price),
      category: formData.category,
      creator: formData.creator,
      video_thumbnail: formData.video_thumbnail,
      duration_hours: parseInt(formData.duration_hours) || 0,
      max_participants: parseInt(formData.max_participants) || 0,
      status: 'active'
    };

    if (editingId) {
      setExperiences(prev => prev.map(exp => 
        exp.id === editingId ? { ...newExperience, id: editingId } : exp
      ));
    } else {
      setExperiences(prev => [newExperience, ...prev]);
    }

    toast({
      title: "Success",
      description: `Experience ${editingId ? 'updated' : 'created'} successfully! (Demo mode)`,
    });

    resetForm();
  };

  const handleEdit = (experience: Experience) => {
    setFormData({
      title: experience.title,
      description: experience.description || '',
      location: experience.location,
      price: experience.price.toString(),
      category: experience.category,
      creator: experience.creator,
      video_thumbnail: experience.video_thumbnail || '',
      duration_hours: experience.duration_hours?.toString() || '',
      max_participants: experience.max_participants?.toString() || '',
    });
    setEditingId(experience.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experience?')) return;
    setExperiences(prev => prev.filter(exp => exp.id !== id));
    toast({
      title: "Success",
      description: "Experience deleted successfully! (Demo mode)",
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      price: '',
      category: '',
      creator: '',
      video_thumbnail: '',
      duration_hours: '',
      max_participants: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 px-6">
          <div className="max-w-md mx-auto text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              Please sign in to access the admin panel.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">Manage experiences and view analytics</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Experience
            </Button>
          </div>

          {/* Demo Mode Notice */}
          <Card className="p-4 mb-6 bg-yellow-500/10 border-yellow-500/30">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-600">Demo Mode</p>
                <p className="text-sm text-muted-foreground">
                  Experiences table is not yet set up. Data is stored locally for demonstration.
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Upload className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Experiences</p>
                  <p className="text-2xl font-bold">{experiences.length}</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Experiences</p>
                  <p className="text-2xl font-bold">
                    {experiences.filter(exp => exp.status === 'active').length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Price</p>
                  <p className="text-2xl font-bold">
                    ${experiences.length > 0 ? (experiences.reduce((sum, exp) => sum + exp.price, 0) / experiences.length).toFixed(0) : '0'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Experience Form */}
          {showForm && (
            <Card className="p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">
                {editingId ? 'Edit Experience' : 'Create New Experience'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Experience Title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
                <Input
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required
                />
                <Input
                  placeholder="Price (USD)"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  required
                />
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Creator/Company"
                  value={formData.creator}
                  onChange={(e) => setFormData({...formData, creator: e.target.value})}
                  required
                />
                <Input
                  placeholder="Duration (hours)"
                  type="number"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({...formData, duration_hours: e.target.value})}
                />
                <Input
                  placeholder="Max Participants"
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({...formData, max_participants: e.target.value})}
                />
                <Input
                  placeholder="Image URL"
                  value={formData.video_thumbnail}
                  onChange={(e) => setFormData({...formData, video_thumbnail: e.target.value})}
                />
                <div className="md:col-span-2">
                  <Textarea
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <Button type="submit">
                    {editingId ? 'Update Experience' : 'Create Experience'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Experiences List */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">All Experiences</h2>
            {loading ? (
              <p>Loading experiences...</p>
            ) : experiences.length === 0 ? (
              <p className="text-muted-foreground">No experiences yet. Add your first experience!</p>
            ) : (
              <div className="space-y-4">
                {experiences.map((experience) => (
                  <div key={experience.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{experience.title}</h3>
                        <Badge variant={experience.status === 'active' ? 'default' : 'secondary'}>
                          {experience.status}
                        </Badge>
                        <Badge variant="outline">{experience.category}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {experience.location} • ${experience.price} • {experience.creator}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {experience.duration_hours}h • Max {experience.max_participants} people
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(experience)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(experience.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
