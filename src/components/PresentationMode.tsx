import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { 
  ChevronLeft, ChevronRight, X, MapPin, Clock, Maximize2, Minimize2,
  Plus, Type, Image, Video, Grid3X3, Trash2, Edit2, Move, GripVertical,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Itinerary, Trip } from "@/hooks/useItineraries";
import { LikedExperience } from "@/hooks/useLikedExperiences";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface TextOverlay {
  id: string;
  text: string;
  x: number; // percentage
  y: number; // percentage
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  align: 'left' | 'center' | 'right';
  color: string;
}

interface MediaEmbed {
  id: string;
  type: 'image' | 'video' | 'tiktok' | 'instagram';
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SlideCustomization {
  textOverlays: TextOverlay[];
  mediaEmbeds: MediaEmbed[];
  layout: 'default' | 'fullImage' | 'collage' | 'textOnly';
  backgroundColor?: string;
  note?: string;
}

interface PresentationModeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itinerary: Itinerary;
  selectedTrip?: Trip | null;
  isOwner?: boolean;
}

const fontSizeClasses = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
  xl: 'text-4xl'
};

const colorOptions = [
  { name: 'White', value: '#ffffff' },
  { name: 'Black', value: '#000000' },
  { name: 'Primary', value: 'hsl(var(--primary))' },
  { name: 'Yellow', value: '#fbbf24' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cyan', value: '#22d3ee' },
];

export function PresentationMode({ open, onOpenChange, itinerary, selectedTrip, isOwner = false }: PresentationModeProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customizations, setCustomizations] = useState<Record<number, SlideCustomization>>({});
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<{ type: 'text' | 'media'; id: string } | null>(null);
  const { toast } = useToast();

  // Build slides from experiences
  const slides = [
    { type: 'title' as const, itinerary },
    ...itinerary.experiences.map(exp => ({ type: 'experience' as const, experience: exp })),
    { type: 'end' as const, itinerary }
  ];

  const currentCustomization = customizations[currentSlide] || {
    textOverlays: [],
    mediaEmbeds: [],
    layout: 'default'
  };

  const updateCustomization = (updates: Partial<SlideCustomization>) => {
    setCustomizations(prev => ({
      ...prev,
      [currentSlide]: { ...currentCustomization, ...updates }
    }));
  };

  // Add text overlay
  const addTextOverlay = () => {
    const newText: TextOverlay = {
      id: `text-${Date.now()}`,
      text: 'Double-click to edit',
      x: 50,
      y: 50,
      fontSize: 'lg',
      fontWeight: 'normal',
      fontStyle: 'normal',
      align: 'center',
      color: '#ffffff'
    };
    updateCustomization({
      textOverlays: [...currentCustomization.textOverlays, newText]
    });
    setEditingTextId(newText.id);
  };

  // Add media embed
  const addMediaEmbed = (type: 'image' | 'video' | 'tiktok' | 'instagram') => {
    const url = prompt(
      type === 'image' ? 'Enter image URL:' :
      type === 'tiktok' ? 'Enter TikTok video URL:' :
      type === 'instagram' ? 'Enter Instagram post URL:' :
      'Enter video URL:'
    );
    
    if (!url) return;

    const newMedia: MediaEmbed = {
      id: `media-${Date.now()}`,
      type,
      url,
      x: 10,
      y: 10,
      width: 40,
      height: 40
    };
    updateCustomization({
      mediaEmbeds: [...currentCustomization.mediaEmbeds, newMedia]
    });
    toast({ title: `${type} added!` });
  };

  // Update text overlay
  const updateTextOverlay = (id: string, updates: Partial<TextOverlay>) => {
    updateCustomization({
      textOverlays: currentCustomization.textOverlays.map(t =>
        t.id === id ? { ...t, ...updates } : t
      )
    });
  };

  // Delete text overlay
  const deleteTextOverlay = (id: string) => {
    updateCustomization({
      textOverlays: currentCustomization.textOverlays.filter(t => t.id !== id)
    });
    setEditingTextId(null);
  };

  // Delete media embed
  const deleteMediaEmbed = (id: string) => {
    updateCustomization({
      mediaEmbeds: currentCustomization.mediaEmbeds.filter(m => m.id !== id)
    });
  };

  // Handle drag for positioning
  const handleDrag = (e: React.MouseEvent, type: 'text' | 'media', id: string) => {
    if (!isEditing) return;
    
    const container = e.currentTarget.closest('.slide-container') as HTMLElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (type === 'text') {
      updateTextOverlay(id, { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    }
  };

  const goNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
      setEditingTextId(null);
    }
  }, [currentSlide, slides.length]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
      setEditingTextId(null);
    }
  }, [currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingTextId) return; // Don't navigate while editing text
      
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        if (isEditing) {
          setIsEditing(false);
          setEditingTextId(null);
        } else {
          onOpenChange(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, goNext, goPrev, onOpenChange, editingTextId, isEditing]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setCurrentSlide(0);
      setIsEditing(false);
      setEditingTextId(null);
    }
  }, [open]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const currentSlideData = slides[currentSlide];

  // Render text overlays
  const renderTextOverlays = () => (
    <>
      {currentCustomization.textOverlays.map(overlay => (
        <div
          key={overlay.id}
          className={cn(
            "absolute cursor-move select-none transition-all",
            isEditing && "ring-2 ring-primary/50 ring-offset-2",
            fontSizeClasses[overlay.fontSize]
          )}
          style={{
            left: `${overlay.x}%`,
            top: `${overlay.y}%`,
            transform: 'translate(-50%, -50%)',
            color: overlay.color,
            fontWeight: overlay.fontWeight,
            fontStyle: overlay.fontStyle,
            textAlign: overlay.align,
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}
          onClick={(e) => {
            if (isEditing) {
              e.stopPropagation();
              setEditingTextId(overlay.id);
            }
          }}
          draggable={isEditing}
          onDragEnd={(e) => {
            const container = document.querySelector('.slide-container') as HTMLElement;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            updateTextOverlay(overlay.id, { 
              x: Math.max(5, Math.min(95, x)), 
              y: Math.max(5, Math.min(95, y)) 
            });
          }}
        >
          {editingTextId === overlay.id && isEditing ? (
            <div className="flex flex-col items-center gap-2">
              <Input
                value={overlay.text}
                onChange={(e) => updateTextOverlay(overlay.id, { text: e.target.value })}
                className="bg-background/80 text-foreground min-w-[200px]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setEditingTextId(null);
                }}
              />
              <div className="flex items-center gap-1 bg-background/90 rounded-lg p-1">
                <Button
                  size="icon"
                  variant={overlay.fontWeight === 'bold' ? 'default' : 'ghost'}
                  className="h-7 w-7"
                  onClick={() => updateTextOverlay(overlay.id, { 
                    fontWeight: overlay.fontWeight === 'bold' ? 'normal' : 'bold' 
                  })}
                >
                  <Bold className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant={overlay.fontStyle === 'italic' ? 'default' : 'ghost'}
                  className="h-7 w-7"
                  onClick={() => updateTextOverlay(overlay.id, { 
                    fontStyle: overlay.fontStyle === 'italic' ? 'normal' : 'italic' 
                  })}
                >
                  <Italic className="w-3 h-3" />
                </Button>
                <div className="w-px h-5 bg-border mx-1" />
                {colorOptions.map(color => (
                  <button
                    key={color.value}
                    className={cn(
                      "w-5 h-5 rounded-full border-2",
                      overlay.color === color.value ? "border-primary" : "border-transparent"
                    )}
                    style={{ backgroundColor: color.value }}
                    onClick={() => updateTextOverlay(overlay.id, { color: color.value })}
                  />
                ))}
                <div className="w-px h-5 bg-border mx-1" />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive"
                  onClick={() => deleteTextOverlay(overlay.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <span className="whitespace-pre-wrap">{overlay.text}</span>
          )}
        </div>
      ))}
    </>
  );

  // Render media embeds
  const renderMediaEmbeds = () => (
    <>
      {currentCustomization.mediaEmbeds.map(media => (
        <div
          key={media.id}
          className={cn(
            "absolute overflow-hidden rounded-lg shadow-xl",
            isEditing && "ring-2 ring-primary/50"
          )}
          style={{
            left: `${media.x}%`,
            top: `${media.y}%`,
            width: `${media.width}%`,
            height: `${media.height}%`
          }}
        >
          {media.type === 'image' && (
            <img src={media.url} alt="" className="w-full h-full object-cover" />
          )}
          {media.type === 'video' && (
            <video src={media.url} controls className="w-full h-full object-cover" />
          )}
          {media.type === 'tiktok' && (
            <iframe
              src={`https://www.tiktok.com/embed/v2/${extractTikTokId(media.url)}`}
              className="w-full h-full"
              allowFullScreen
            />
          )}
          {media.type === 'instagram' && (
            <iframe
              src={`${media.url}embed`}
              className="w-full h-full"
              allowFullScreen
            />
          )}
          {isEditing && (
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2 h-6 w-6"
              onClick={() => deleteMediaEmbed(media.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      ))}
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 bg-background border-0 rounded-none">
        {/* Top Controls */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          {isOwner && (
            <Button 
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setIsEditing(!isEditing);
                setEditingTextId(null);
              }}
              className="gap-2"
            >
              <Edit2 className="w-4 h-4" />
              {isEditing ? "Done" : "Edit"}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="bg-background/50 backdrop-blur-sm">
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="bg-background/50 backdrop-blur-sm">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Edit Toolbar */}
        {isEditing && isOwner && (
          <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
            <Button variant="outline" size="sm" onClick={addTextOverlay} className="gap-2">
              <Type className="w-4 h-4" />
              Add Text
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Image className="w-4 h-4" />
                  Add Media
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => addMediaEmbed('image')}>
                  <Image className="w-4 h-4 mr-2" />
                  Image URL
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addMediaEmbed('video')}>
                  <Video className="w-4 h-4 mr-2" />
                  Video URL
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => addMediaEmbed('tiktok')}>
                  TikTok Video
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addMediaEmbed('instagram')}>
                  Instagram Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Grid3X3 className="w-4 h-4" />
                  Layout
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => updateCustomization({ layout: 'default' })}>
                  Default
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateCustomization({ layout: 'fullImage' })}>
                  Full Image
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateCustomization({ layout: 'collage' })}>
                  Collage
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateCustomization({ layout: 'textOnly' })}>
                  Text Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Slide Content */}
        <div 
          className="slide-container w-full h-full flex items-center justify-center p-8 md:p-16 relative"
          onClick={() => setEditingTextId(null)}
        >
          {/* Custom overlays */}
          {renderTextOverlays()}
          {renderMediaEmbeds()}

          {/* Default slide content */}
          {currentSlideData.type === 'title' && currentCustomization.layout !== 'textOnly' && (
            <div className="text-center max-w-4xl z-0">
              <div className="w-32 h-32 mx-auto mb-8 rounded-2xl overflow-hidden shadow-2xl">
                {itinerary.coverImage ? (
                  <img src={itinerary.coverImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center">
                    <span className="text-5xl">🗺️</span>
                  </div>
                )}
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
                {itinerary.name}
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground">
                {itinerary.experiences.length} experiences to explore
              </p>
              {selectedTrip && (
                <p className="text-lg text-primary mt-4">
                  {format(parseISO(selectedTrip.startDate), "MMMM d")}
                  {selectedTrip.endDate && ` - ${format(parseISO(selectedTrip.endDate), "MMMM d, yyyy")}`}
                </p>
              )}
            </div>
          )}

          {currentSlideData.type === 'experience' && currentSlideData.experience && currentCustomization.layout !== 'textOnly' && (
            <div className={cn(
              "max-w-6xl w-full z-0",
              currentCustomization.layout === 'fullImage' 
                ? "absolute inset-0 p-0" 
                : "grid md:grid-cols-2 gap-8 md:gap-16"
            )}>
              {currentCustomization.layout === 'fullImage' ? (
                <>
                  {currentSlideData.experience.videoThumbnail && (
                    <img 
                      src={currentSlideData.experience.videoThumbnail} 
                      alt={currentSlideData.experience.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute bottom-16 left-8 right-8 bg-background/80 backdrop-blur-sm rounded-2xl p-6">
                    <h2 className="text-2xl md:text-4xl font-bold mb-2">
                      {currentSlideData.experience.title}
                    </h2>
                    {currentSlideData.experience.location && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {currentSlideData.experience.location}
                      </p>
                    )}
                  </div>
                </>
              ) : currentCustomization.layout === 'collage' ? (
                <div className="col-span-2 grid grid-cols-3 gap-4">
                  <div className="col-span-2 row-span-2 aspect-square rounded-2xl overflow-hidden shadow-2xl">
                    {currentSlideData.experience.videoThumbnail ? (
                      <img 
                        src={currentSlideData.experience.videoThumbnail} 
                        alt={currentSlideData.experience.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                        <MapPin className="w-16 h-16 text-primary/50" />
                      </div>
                    )}
                  </div>
                  <div className="bg-card rounded-2xl p-4 flex flex-col justify-center">
                    <span className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
                      {currentSlideData.experience.category}
                    </span>
                    <h2 className="text-lg font-bold mb-2">
                      {currentSlideData.experience.title}
                    </h2>
                  </div>
                  <div className="bg-primary/10 rounded-2xl p-4 flex flex-col justify-center items-center">
                    {currentSlideData.experience.price && (
                      <p className="text-2xl font-bold text-primary">
                        {currentSlideData.experience.price}
                      </p>
                    )}
                    {currentSlideData.experience.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {currentSlideData.experience.location}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                    {currentSlideData.experience.videoThumbnail ? (
                      <img 
                        src={currentSlideData.experience.videoThumbnail} 
                        alt={currentSlideData.experience.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                        <MapPin className="w-16 h-16 text-primary/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center">
                    <span className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
                      {currentSlideData.experience.category}
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                      {currentSlideData.experience.title}
                    </h2>
                    <div className="space-y-3 text-lg text-muted-foreground">
                      {currentSlideData.experience.location && (
                        <p className="flex items-center gap-2">
                          <MapPin className="w-5 h-5" />
                          {currentSlideData.experience.location}
                        </p>
                      )}
                      {currentSlideData.experience.scheduledTime && (
                        <p className="flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          {format(new Date(currentSlideData.experience.scheduledTime), "EEEE, h:mm a")}
                        </p>
                      )}
                      {currentSlideData.experience.price && (
                        <p className="text-2xl font-semibold text-primary mt-4">
                          {currentSlideData.experience.price}
                        </p>
                      )}
                    </div>
                    {currentCustomization.note && (
                      <p className="mt-6 p-4 bg-muted rounded-lg text-muted-foreground italic">
                        {currentCustomization.note}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {currentSlideData.type === 'end' && currentCustomization.layout !== 'textOnly' && (
            <div className="text-center max-w-4xl z-0">
              <span className="text-6xl mb-8 block">🎉</span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready for Adventure!</h2>
              <p className="text-xl text-muted-foreground mb-8">
                {itinerary.experiences.length} experiences await you
              </p>
              <Button size="lg" onClick={() => onOpenChange(false)} className="text-lg px-8">
                Exit Presentation
              </Button>
            </div>
          )}

          {/* Note input when editing */}
          {isEditing && currentSlideData.type === 'experience' && (
            <div className="absolute bottom-24 left-8 right-8 z-10">
              <Textarea
                placeholder="Add a note for this slide..."
                value={currentCustomization.note || ''}
                onChange={(e) => updateCustomization({ note: e.target.value })}
                className="bg-background/80 backdrop-blur-sm resize-none"
                rows={2}
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goPrev}
            disabled={currentSlide === 0}
            className="rounded-full w-12 h-12"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          
          <span className="text-sm text-muted-foreground min-w-[80px] text-center">
            {currentSlide + 1} / {slides.length}
          </span>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goNext}
            disabled={currentSlide === slides.length - 1}
            className="rounded-full w-12 h-12"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted z-20">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper to extract TikTok video ID from URL
function extractTikTokId(url: string): string {
  const match = url.match(/video\/(\d+)/);
  return match ? match[1] : '';
}
