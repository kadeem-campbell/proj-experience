import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useItineraries } from "@/hooks/useItineraries";
import { useUserLikes } from "@/hooks/useUserLikes";
import { supabase } from "@/integrations/supabase/client";
import { MobileShell } from "@/components/MobileShell";
import { AuthModal } from "@/components/AuthModal";
import { 
  Camera, Check, Heart, MapPin, Loader2, User, Mail, AtSign, 
  Layers, Settings, LogOut, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, userProfile, refreshProfile, isAuthenticated } = useAuth();
  const { likedExperiences, likedItineraries } = useUserLikes();
  const { itineraries } = useItineraries();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [username, setUsername] = useState(userProfile?.username || "");
  const [fullName, setFullName] = useState(userProfile?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url || "");

  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!isAuthenticated) {
    
    if (isMobile) {
      return (
        <MobileShell>
          <div className="px-5 pt-6">
            {/* Enticing guest profile */}
            <div className="text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-primary/40" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Your Profile</h1>
              <p className="text-sm text-muted-foreground">Sign in to save your adventures</p>
            </div>

            {/* Feature preview cards */}
            <div className="space-y-3 mb-8">
              {[
                { icon: Heart, label: "Saved Experiences", desc: "Keep track of places you love", count: "0" },
                { icon: Layers, label: "Your Itineraries", desc: "Build and share travel plans", count: "0" },
                { icon: MapPin, label: "Places Visited", desc: "Map your travel journey", count: "0" },
              ].map(({ icon: Icon, label, desc, count }) => (
                <div key={label} className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/60">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <span className="text-lg font-bold text-muted-foreground/30">{count}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Button 
              onClick={() => setShowAuthModal(true)} 
              className="w-full h-14 rounded-2xl text-base font-semibold"
            >
              Get Started
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Sign in with Google, Apple, or email
            </p>

            <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
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
          <Button onClick={() => setShowAuthModal(true)}>Sign In</Button>
          <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
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
            <button onClick={() => navigate('/liked')} className="text-center p-3 rounded-xl bg-muted/30 border border-border active:scale-[0.97] transition-transform">
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

  // Desktop profile - clean, no likes (they have their own page)
  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
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
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => { setUsername(userProfile?.username || ""); setFullName(userProfile?.full_name || ""); setAvatarUrl(userProfile?.avatar_url || ""); setIsEditing(true); }}>Edit Profile</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />Sign Out
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-md">
          <button onClick={() => navigate('/my-itineraries')} className="text-center p-4 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
            <p className="text-2xl font-bold text-foreground">{itineraries.length}</p>
            <p className="text-xs text-muted-foreground">Itineraries</p>
          </button>
          <button onClick={() => navigate('/liked')} className="text-center p-4 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
            <p className="text-2xl font-bold text-foreground">{likedExperiences.length + likedItineraries.length}</p>
            <p className="text-xs text-muted-foreground">Liked</p>
          </button>
          <button className="text-center p-4 rounded-xl bg-muted/30 border border-border">
            <p className="text-2xl font-bold text-foreground">0</p>
            <p className="text-xs text-muted-foreground">Trips</p>
          </button>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
