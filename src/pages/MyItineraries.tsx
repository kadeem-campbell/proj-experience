import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Layers, Calendar, MapPin, Play, MoreHorizontal, Trash2, Edit2, Loader2 } from "lucide-react";
import { useItineraries } from "@/hooks/useItineraries";
import { useAuth } from "@/hooks/useAuth";
import { MobileShell } from "@/components/MobileShell";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent } from "@/components/ui/drawer";

// Spotify-style itinerary card — like a playlist
const ItineraryPlaylistCard = ({ 
  itinerary, 
  onTap, 
  onOptions 
}: { 
  itinerary: any; 
  onTap: () => void;
  onOptions: (e: React.MouseEvent) => void;
}) => {
  const experienceCount = itinerary.experiences?.length || 0;
  const coverImage = itinerary.coverImage || itinerary.experiences?.[0]?.videoThumbnail;
  const location = itinerary.experiences?.[0]?.location || "";
  const date = itinerary.startDate 
    ? new Date(itinerary.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;

  return (
    <button
      onClick={onTap}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 active:scale-[0.98] transition-all text-left group"
    >
      {/* Album art / cover */}
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted shadow-sm">
        {coverImage ? (
          <img src={coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary/40" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm text-foreground line-clamp-1">{itinerary.name}</h3>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{experienceCount} experience{experienceCount !== 1 ? 's' : ''}</span>
          {location && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />
                {location}
              </span>
            </>
          )}
        </div>
        {date && (
          <div className="flex items-center gap-1 mt-0.5">
            <Calendar className="w-2.5 h-2.5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{date}</span>
          </div>
        )}
      </div>

      {/* Quick play / options */}
      <div className="flex items-center gap-1">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
          <Play className="w-3.5 h-3.5 text-primary-foreground fill-primary-foreground ml-0.5" />
        </div>
        <button
          onClick={onOptions}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </button>
  );
};

const MyItinerariesPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { itineraries, isLoading, createItinerary, deleteItinerary, renameItinerary, setActiveItinerary } = useItineraries();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [optionsItinerary, setOptionsItinerary] = useState<any>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const created = await createItinerary(newName.trim());
    setCreating(false);
    setNewName("");
    setShowCreate(false);
    // Navigate to experiences so user can start adding
    navigate(`/experiences?addTo=${created.id}`);
  };

  const handleTap = (itinerary: any) => {
    setActiveItinerary(itinerary.id);
    navigate(`/itineraries/${itinerary.id}`);
  };

  const handleDelete = async () => {
    if (!optionsItinerary) return;
    await deleteItinerary(optionsItinerary.id);
    setOptionsItinerary(null);
  };

  const handleRename = () => {
    if (!optionsItinerary || !renameValue.trim()) return;
    renameItinerary(optionsItinerary.id, renameValue.trim());
    setRenaming(false);
    setOptionsItinerary(null);
  };

  if (!isAuthenticated) {
    return (
      <MobileShell>
        <div className="flex flex-col items-center justify-center px-6 pt-20">
          <Layers className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold mb-2">Your Itineraries</h2>
          <p className="text-sm text-muted-foreground text-center mb-6">Sign in to create and manage your travel itineraries</p>
          <Button onClick={() => navigate('/auth')} className="rounded-full px-8">Sign In</Button>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell hideAvatar>
      <div className="px-4 pt-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Itineraries</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{itineraries.length} playlist{itineraries.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : itineraries.length === 0 ? (
          <div className="text-center py-16">
            <Layers className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No itineraries yet</p>
            <Button onClick={() => setShowCreate(true)} variant="outline" className="rounded-full">
              <Plus className="w-4 h-4 mr-2" /> Create your first
            </Button>
          </div>
        ) : (
          /* Playlist list */
          <div className="space-y-1">
            {itineraries.map(itinerary => (
              <ItineraryPlaylistCard
                key={itinerary.id}
                itinerary={itinerary}
                onTap={() => handleTap(itinerary)}
                onOptions={(e) => {
                  e.stopPropagation();
                  setOptionsItinerary(itinerary);
                  setRenameValue(itinerary.name);
                  if ('vibrate' in navigator) navigator.vibrate(10);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create drawer */}
      <Drawer open={showCreate} onOpenChange={setShowCreate}>
        <DrawerContent className="overflow-hidden">
          <div className="px-6 py-5">
            <h3 className="text-lg font-bold mb-4">New Itinerary</h3>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Zanzibar Weekend"
              className="h-12 rounded-xl mb-4"
              style={{ fontSize: '16px' }}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
            <Button 
              onClick={handleCreate} 
              disabled={!newName.trim() || creating}
              className="w-full h-12 rounded-xl"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create & Add Experiences
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Options drawer */}
      <Drawer open={!!optionsItinerary && !renaming} onOpenChange={(open) => !open && setOptionsItinerary(null)}>
        <DrawerContent className="overflow-hidden">
          <div className="px-6 py-5 space-y-2">
            <h3 className="text-lg font-bold mb-3 truncate">{optionsItinerary?.name}</h3>
            <button
              onClick={() => setRenaming(true)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <Edit2 className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Rename</span>
            </button>
            <button
              onClick={() => {
                if (optionsItinerary) {
                  navigate(`/experiences?addTo=${optionsItinerary.id}`);
                  setOptionsItinerary(null);
                }
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <Plus className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Add Experiences</span>
            </button>
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 transition-colors text-destructive"
            >
              <Trash2 className="w-5 h-5" />
              <span className="font-medium">Delete</span>
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Rename drawer */}
      <Drawer open={renaming} onOpenChange={(open) => { if (!open) setRenaming(false); }}>
        <DrawerContent className="overflow-hidden">
          <div className="px-6 py-5">
            <h3 className="text-lg font-bold mb-4">Rename Itinerary</h3>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="h-12 rounded-xl mb-4"
              style={{ fontSize: '16px' }}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
            <Button onClick={handleRename} disabled={!renameValue.trim()} className="w-full h-12 rounded-xl">
              Save
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </MobileShell>
  );
};

export default MyItinerariesPage;
