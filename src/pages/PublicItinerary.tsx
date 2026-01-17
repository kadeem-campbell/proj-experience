import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useItineraries } from "@/hooks/useItineraries";
import { publicItinerariesData } from "@/data/itinerariesData";
import { CopyItineraryDialog } from "@/components/CopyItineraryDialog";
import { LikedExperience } from "@/hooks/useLikedExperiences";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, 
  Copy, 
  Share2, 
  Search,
  Check,
  Plus,
  MoreHorizontal,
  ListPlus,
  MessageCircle,
  Minus
} from "lucide-react";

const PublicItinerary = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedExperience, setDraggedExperience] = useState<LikedExperience | null>(null);
  const [newItineraryName, setNewItineraryName] = useState("");
  const [showNewItineraryInput, setShowNewItineraryInput] = useState<string | null>(null);
  const { addExperience, removeExperience, addExperienceToItinerary, createItinerary, itineraries, isInItinerary } = useItineraries();

  // Find the public itinerary
  const itinerary = publicItinerariesData.find(i => i.id === id);

  if (!itinerary) {
    return (
      <MainLayout>
        <div className="p-6 max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Itinerary Not Found</h1>
          <p className="text-muted-foreground mb-6">This itinerary doesn't exist or has been removed.</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Discover
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: itinerary.name,
          text: `Check out this itinerary: ${itinerary.name}`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled - fall back to copy
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast({
          title: "Link copied!",
          description: "Share this link with your friends.",
        });
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with your friends.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    const shareUrl = window.location.href;
    const text = `Check out this itinerary: ${itinerary.name}\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyComplete = () => {
    toast({
      title: "Itinerary copied!",
      description: `The experiences have been added to your itinerary.`,
    });
  };

  const handleDragStart = (e: React.DragEvent, experience: LikedExperience) => {
    setDraggedExperience(experience);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', JSON.stringify(experience));
  };

  const handleDragEnd = () => {
    setDraggedExperience(null);
  };

  // Toggle add/remove from default itinerary
  const handleToggleItinerary = (experience: LikedExperience, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInItinerary(experience.id)) {
      removeExperience(experience.id);
      toast({
        title: "Removed from itinerary",
        description: `${experience.title} has been removed.`,
      });
    } else {
      addExperience({
        id: experience.id,
        title: experience.title,
        creator: experience.creator,
        videoThumbnail: experience.videoThumbnail,
        category: experience.category,
        location: experience.location,
        price: experience.price,
      });
      
      toast({
        title: "Added to itinerary",
        description: `${experience.title} has been added to your trip.`,
      });
    }
  };

  // Add to specific itinerary
  const handleAddToSpecificItinerary = (experience: LikedExperience, itineraryId: string, itineraryName: string) => {
    const targetItinerary = itineraries.find(i => i.id === itineraryId);
    if (targetItinerary?.experiences.some(e => e.id === experience.id)) {
      toast({
        title: "Already in itinerary",
        description: `${experience.title} is already in ${itineraryName}.`,
      });
      return;
    }

    addExperienceToItinerary(itineraryId, {
      id: experience.id,
      title: experience.title,
      creator: experience.creator,
      videoThumbnail: experience.videoThumbnail,
      category: experience.category,
      location: experience.location,
      price: experience.price,
    });
    
    toast({
      title: "Added to itinerary",
      description: `${experience.title} added to ${itineraryName}.`,
    });
  };

  // Create new itinerary and add experience
  const handleCreateAndAdd = (experience: LikedExperience) => {
    if (!newItineraryName.trim()) return;
    
    const newItinerary = createItinerary(newItineraryName.trim());
    addExperienceToItinerary(newItinerary.id, {
      id: experience.id,
      title: experience.title,
      creator: experience.creator,
      videoThumbnail: experience.videoThumbnail,
      category: experience.category,
      location: experience.location,
      price: experience.price,
    });
    
    toast({
      title: "Created & added",
      description: `${experience.title} added to new itinerary "${newItineraryName}".`,
    });
    
    setNewItineraryName("");
    setShowNewItineraryInput(null);
  };

  // Filter experiences by search query
  const filteredExperiences = itinerary.experiences.filter((experience) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      experience.title?.toLowerCase().includes(q) ||
      experience.location?.toLowerCase().includes(q) ||
      experience.category?.toLowerCase().includes(q)
    );
  });

  // Group experiences by category for sections
  const getExperiencesByCategory = (category: string) => 
    filteredExperiences.filter(exp => exp.category?.toLowerCase() === category.toLowerCase());
  
  const categories = [...new Set(filteredExperiences.map(exp => exp.category))].filter(Boolean);
  
  // Get popular experiences (first 4)
  const popularExperiences = filteredExperiences.slice(0, 4);

  // Render experience card component for reuse
  const renderExperienceCard = (experience: LikedExperience) => {
    const inItinerary = isInItinerary(experience.id);
    
    return (
      <Link 
        key={experience.id}
        to={`/experience/${experience.id}`}
        draggable
        onDragStart={(e) => handleDragStart(e, experience)}
        onDragEnd={handleDragEnd}
      >
        <Card 
          className={`group overflow-hidden border-0 bg-card hover:bg-accent/10 transition-colors duration-150 cursor-pointer rounded-lg p-2 ${
            draggedExperience?.id === experience.id ? 'opacity-50 cursor-grabbing' : ''
          }`}
        >
          {/* Cover Image */}
          <div className="relative aspect-square overflow-hidden rounded-md mb-2">
            {experience.videoThumbnail ? (
              <img 
                src={experience.videoThumbnail} 
                alt={experience.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-150"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                <span className="text-2xl">📍</span>
              </div>
            )}
            
            {/* 3-dot menu for itinerary selection */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="absolute bottom-2 left-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg bg-background/90 hover:bg-background text-foreground opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" onClick={(e) => e.stopPropagation()}>
                <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                  Add to Itinerary
                </div>
                {itineraries.map((itin) => {
                  const isInThis = itin.experiences.some(e => e.id === experience.id);
                  return (
                    <DropdownMenuItem
                      key={itin.id}
                      onClick={(e) => {
                        e.preventDefault();
                        handleAddToSpecificItinerary(experience, itin.id, itin.name);
                      }}
                      className="flex items-center justify-between"
                    >
                      <span className="truncate">{itin.name}</span>
                      {isInThis && <Check className="w-4 h-4 text-primary ml-2" />}
                    </DropdownMenuItem>
                  );
                })}
                <DropdownMenuSeparator />
                {showNewItineraryInput === experience.id ? (
                  <div className="p-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Input
                      placeholder="Itinerary name..."
                      value={newItineraryName}
                      onChange={(e) => setNewItineraryName(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateAndAdd(experience);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      className="h-8"
                      onClick={() => handleCreateAndAdd(experience)}
                      disabled={!newItineraryName.trim()}
                    >
                      Add
                    </Button>
                  </div>
                ) : (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      setShowNewItineraryInput(experience.id);
                    }}
                    className="flex items-center gap-2"
                  >
                    <ListPlus className="w-4 h-4" />
                    Create New Itinerary
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Toggle Add/Remove Button - on the right of 3-dot menu */}
            <button
              onClick={(e) => handleToggleItinerary(experience, e)}
              className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                inItinerary 
                  ? 'bg-primary text-primary-foreground opacity-100' 
                  : 'bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'
              }`}
            >
              {inItinerary ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>

          {/* Content - Just title, Spotify style */}
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {experience.title}
          </h3>
        </Card>
      </Link>
    );
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        {/* Spotify-style Header */}
        <div 
          className="relative bg-gradient-to-b from-primary/30 to-background p-4 md:p-6 pb-6 md:pb-8"
          style={{
            background: `linear-gradient(180deg, hsl(var(--primary) / 0.3) 0%, hsl(var(--background)) 100%)`
          }}
        >
          {/* Back Button */}
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 md:mb-6 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Discover
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end gap-4 md:gap-6">
            {/* Cover Image */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 flex-shrink-0 rounded-lg overflow-hidden shadow-2xl">
              {itinerary.coverImage ? (
                <img 
                  src={itinerary.coverImage} 
                  alt={itinerary.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center">
                  <span className="text-3xl md:text-4xl">🗺️</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                Itinerary
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 line-clamp-2">
                {itinerary.name}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                {itinerary.experiences.length} experiences
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 md:gap-3 mt-4 md:mt-6">
            <Button onClick={() => setCopyDialogOpen(true)} size="sm" className="gap-2 rounded-full md:hidden">
              <Copy className="w-4 h-4" />
              Copy
            </Button>
            <Button onClick={() => setCopyDialogOpen(true)} size="lg" className="gap-2 rounded-full hidden md:flex">
              <Copy className="w-4 h-4" />
              Copy Itinerary
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full w-8 h-8 md:w-10 md:h-10">
                  {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleShare}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareWhatsApp}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Share via WhatsApp
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-3 md:px-6 py-3 md:py-4 border-b border-border">
          <div className="flex items-center bg-muted rounded-full px-3 md:px-4 py-2 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground mr-2 md:mr-3" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in this itinerary..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Experiences Content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
            {filteredExperiences.map(renderExperienceCard)}
          </div>

          {/* Empty State */}
          {filteredExperiences.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No experiences found matching "{searchQuery}"
              </p>
            </div>
          )}
        </div>

        {/* Copy Dialog */}
        <CopyItineraryDialog
          open={copyDialogOpen}
          onOpenChange={setCopyDialogOpen}
          sourceItinerary={itinerary}
          onCopyComplete={handleCopyComplete}
        />
      </div>
    </MainLayout>
  );
};

export default PublicItinerary;
