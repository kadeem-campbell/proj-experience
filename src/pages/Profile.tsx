import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserLikes } from "@/hooks/useUserLikes";
import { useItineraries } from "@/hooks/useItineraries";
import { supabase } from "@/integrations/supabase/client";
import { ExperienceCard } from "@/components/ExperienceCard";
import { MobileShell } from "@/components/MobileShell";
import { 
  Camera, Check, Heart, MapPin, Loader2, User, Mail, AtSign, 
  Layers, Settings, LogOut, ChevronRight, ListMusic
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userProfile, refreshProfile, isAuthenticated } = useAuth();
  const { likedExperiences, likedItineraries, loading: likesLoading } = useUserLikes();
  const { itineraries } = useItineraries();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [username, setUsername] = useState(userProfile?.username || "");
  const [fullName, setFullName] = useState(userProfile?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || "");

  if (!isAuthenticated) {
    if (isMobile) {
      return (
        <MobileShell>
          <div className="flex flex-col items-center justify-center px-6 pt-20">
            <User className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-bold mb-2">Your Profile</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">Sign in to manage your profile and see your liked content</p>
            <Button onClick={() => navigate('/auth')} className="rounded-full px-8">Sign In</Button>
          </div>
        </MobileShell>
      );
    }
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
      toast({ title: "Profile updated" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", variant: "destructive" });
      return;
    }
    if (isMobile && 'vibrate' in navigator) navigator.vibrate(10);

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(publicUrl);
      if (!isEditing) {
        const { error } = await supabase.from('profiles').update({ avatar_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', user.id);
        if (!error) { await refreshProfile?.(); toast({ title: "Photo updated!" }); }
      }
    } catch (error: any) {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const displayName = userProfile?.full_name || userProfile?.username || user?.email?.split('@')[0] || "User";
  const initials = displayName.charAt(0).toUpperCase();

  // Mobile profile
  if (isMobile) {
    return (
      <MobileShell hideAvatar>
        <div className="px-4 pt-2">
          {/* Profile header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative group">
              <Avatar className="w-20 h-20 border-2 border-border shadow-lg">
                <AvatarImage src={avatarUrl || userProfile?.avatar_url} alt={displayName} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
              >
                {uploadingPhoto ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{displayName}</h1>
              {userProfile?.username && <p className="text-sm text-muted-foreground">@{userProfile.username}</p>}
              <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Edit form */}
          {isEditing ? (
            <div className="space-y-4 mb-6 p-4 rounded-xl bg-muted/30 border border-border">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><User className="w-3 h-3" />Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="h-11 rounded-xl" style={{ fontSize: '16px' }} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><AtSign className="w-3 h-3" />Username</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="h-11 rounded-xl" style={{ fontSize: '16px' }} />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1 h-11 rounded-xl">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}Save
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)} className="h-11 rounded-xl">Cancel</Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full mb-6 h-11 rounded-xl"
              onClick={() => {
                setUsername(userProfile?.username || "");
                setFullName(userProfile?.full_name || "");
                setAvatarUrl(userProfile?.avatar_url || "");
                setIsEditing(true);
              }}
            >
              Edit Profile
            </Button>
          )}

          {/* Stats row — tappable */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button onClick={() => navigate('/my-itineraries')} className="text-center p-3 rounded-xl bg-muted/30 border border-border active:scale-[0.97] transition-transform">
              <p className="text-lg font-bold text-foreground">{itineraries.length}</p>
              <p className="text-[10px] text-muted-foreground">Itineraries</p>
            </button>
            <button onClick={() => navigate('/saved')} className="text-center p-3 rounded-xl bg-muted/30 border border-border active:scale-[0.97] transition-transform">
              <p className="text-lg font-bold text-foreground">{likedExperiences.length + likedItineraries.length}</p>
              <p className="text-[10px] text-muted-foreground">Saved</p>
            </button>
            <button className="text-center p-3 rounded-xl bg-muted/30 border border-border">
              <p className="text-lg font-bold text-foreground">0</p>
              <p className="text-[10px] text-muted-foreground">Trips</p>
            </button>
          </div>

          {/* Quick links */}
          <div className="space-y-1 mb-6">
            {[
              { icon: Settings, label: "Settings", action: () => {} },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted/50 active:scale-[0.99] transition-all"
              >
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground flex-1 text-left">{label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl hover:bg-destructive/5 transition-colors text-destructive"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </MobileShell>
    );
  }

  // Desktop profile
  return (
    <MainLayout>
      <div className="min-h-full">
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={() => navigate(-1)}>
              <MapPin className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Profile</h1>
          </div>
        </div>
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
            <div className="relative group">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-xl">
                <AvatarImage src={avatarUrl || userProfile?.avatar_url} alt={displayName} />
                <AvatarFallback className="text-2xl md:text-4xl bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                {uploadingPhoto ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            <div className="flex-1 text-center md:text-left space-y-4">
              {isEditing ? (
                <div className="space-y-4 max-w-sm mx-auto md:mx-0">
                  <div><Label>Full Name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11" style={{ fontSize: '16px' }} /></div>
                  <div><Label>Username</Label><Input value={username} onChange={(e) => setUsername(e.target.value)} className="h-11" style={{ fontSize: '16px' }} /></div>
                  <div><Label>Email</Label><Input value={user?.email || ""} disabled className="h-11 bg-muted/50" style={{ fontSize: '16px' }} /></div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} disabled={saving} className="flex-1">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}Save</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h2 className="text-2xl font-bold">{displayName}</h2>
                    {userProfile?.username && <p className="text-muted-foreground">@{userProfile.username}</p>}
                    <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { setUsername(userProfile?.username || ""); setFullName(userProfile?.full_name || ""); setAvatarUrl(userProfile?.avatar_url || ""); setIsEditing(true); }}>Edit Profile</Button>
                </>
              )}
            </div>
          </div>

          {/* Liked content */}
          <div>
            <h3 className="text-lg font-bold mb-4">Liked Experiences ({likedExperiences.length})</h3>
            {likesLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : likedExperiences.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No liked experiences yet</p>
                <Button variant="link" asChild className="mt-2"><Link to="/">Discover experiences</Link></Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                {likedExperiences.map((like) => (
                  <ExperienceCard 
                    key={like.id}
                    id={like.item_data.id || like.item_id}
                    title={like.item_data.title || "Experience"}
                    creator={like.item_data.creator || ""}
                    views="" videoThumbnail={like.item_data.videoThumbnail || ""}
                    category={like.item_data.category || ""} location={like.item_data.location || ""}
                    price={like.item_data.price || ""} compact
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
