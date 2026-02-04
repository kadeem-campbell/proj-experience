import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserLikes } from "@/hooks/useUserLikes";
import { supabase } from "@/integrations/supabase/client";
import { ExperienceCard } from "@/components/ExperienceCard";
import { PublicItineraryCard } from "@/components/PublicItineraryCard";
import { 
  ArrowLeft, 
  Camera, 
  Check, 
  Heart, 
  MapPin, 
  Loader2,
  User,
  Mail,
  AtSign
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userProfile, refreshProfile, isAuthenticated } = useAuth();
  const { likedExperiences, likedItineraries, loading: likesLoading } = useUserLikes();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Form state
  const [username, setUsername] = useState(userProfile?.username || "");
  const [fullName, setFullName] = useState(userProfile?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || "");

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-full p-6">
          <User className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sign in to view your profile</h1>
          <p className="text-muted-foreground mb-6">Access your liked experiences and itineraries</p>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </MainLayout>
    );
  }

  const handleSave = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim() || null,
          full_name: fullName.trim() || null,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile?.();
      setIsEditing(false);
      toast({ title: "Profile updated", description: "Your changes have been saved." });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({ 
        title: "Error updating profile", 
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please select an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 5MB.", variant: "destructive" });
      return;
    }

    // Haptic feedback
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }

    setUploadingPhoto(true);
    try {
      // Upload to Supabase storage with user ID folder structure for RLS
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      
      // Auto-save if not in edit mode
      if (!isEditing) {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        
        if (!error) {
          await refreshProfile?.();
          toast({ title: "Photo updated!" });
        }
      }
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({ 
        title: "Upload failed", 
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const displayName = userProfile?.full_name || userProfile?.username || user?.email?.split('@')[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <MainLayout>
      <div className={cn(
        "min-h-full",
        isMobile ? "pb-20" : ""
      )}>
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full h-9 w-9"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Profile</h1>
          </div>
        </div>

        {/* Profile Card */}
        <div className="p-4 md:p-6">
          <Card className="p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative group">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-xl">
                  <AvatarImage src={avatarUrl || userProfile?.avatar_url} alt={displayName} />
                  <AvatarFallback className="text-2xl md:text-4xl bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left space-y-4">
                {isEditing ? (
                  <div className="space-y-4 max-w-sm mx-auto md:mx-0">
                    <div>
                      <Label htmlFor="fullName" className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                        <User className="w-3 h-3" /> Full Name
                      </Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your name"
                        className="h-11"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                    <div>
                      <Label htmlFor="username" className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                        <AtSign className="w-3 h-3" /> Username
                      </Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username"
                        className="h-11"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
                        <Mail className="w-3 h-3" /> Email
                      </Label>
                      <Input
                        value={user?.email || ""}
                        disabled
                        className="h-11 bg-muted/50"
                        style={{ fontSize: '16px' }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleSave} disabled={saving} className="flex-1">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h2 className="text-2xl font-bold">{displayName}</h2>
                      {userProfile?.username && (
                        <p className="text-muted-foreground">@{userProfile.username}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setUsername(userProfile?.username || "");
                        setFullName(userProfile?.full_name || "");
                        setAvatarUrl(userProfile?.avatar_url || "");
                        setIsEditing(true);
                      }}
                    >
                      Edit Profile
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* Liked Content Tabs */}
          <Tabs defaultValue="experiences" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="experiences" className="gap-2">
                <Heart className="w-4 h-4" />
                Experiences ({likedExperiences.length})
              </TabsTrigger>
              <TabsTrigger value="itineraries" className="gap-2">
                <MapPin className="w-4 h-4" />
                Itineraries ({likedItineraries.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="experiences">
              {likesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : likedExperiences.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No liked experiences yet</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link to="/">Discover experiences</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {likedExperiences.map((like) => (
                    <ExperienceCard 
                      key={like.id}
                      id={like.item_data.id || like.item_id}
                      title={like.item_data.title || "Experience"}
                      creator={like.item_data.creator || ""}
                      views=""
                      videoThumbnail={like.item_data.videoThumbnail || ""}
                      category={like.item_data.category || ""}
                      location={like.item_data.location || ""}
                      price={like.item_data.price || ""}
                      compact
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="itineraries">
              {likesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : likedItineraries.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No liked itineraries yet</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link to="/itineraries">Browse itineraries</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {likedItineraries.map((like) => (
                    <PublicItineraryCard 
                      key={like.id}
                      itinerary={{
                        id: like.item_data.id || like.item_id,
                        name: like.item_data.name || "Itinerary",
                        experiences: like.item_data.experiences || [],
                        createdAt: like.created_at,
                        updatedAt: like.created_at,
                        isPublic: true,
                        collaborators: [],
                        coverImage: like.item_data.coverImage,
                        creatorName: like.item_data.creatorName
                      }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
