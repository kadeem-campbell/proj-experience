import { useState } from "react";
import { Link } from "react-router-dom";
import { slugify, generateExperienceUrl } from "@/utils/slugUtils";
import { 
  GripVertical, 
  Trash2, 
  Share2, 
  Users, 
  Globe, 
  Lock, 
  Copy, 
  Check,
  MapPin,
  ChevronRight,
  Plus,
  ChevronDown,
  ChevronUp,
  PanelRightClose,
  PanelRightOpen,
  Download,
  FileText,
  FileSpreadsheet,
  StickyNote,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useItineraries } from "@/hooks/useItineraries";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ItineraryPanelProps {
  isMobile?: boolean;
}

export const ItineraryPanel = ({ isMobile = false }: ItineraryPanelProps) => {
  const { toast } = useToast();
  const {
    activeItinerary,
    addExperience,
    removeExperience,
    reorderExperiences,
    togglePublic,
    addCollaborator,
    removeCollaborator,
    getShareUrl,
    isInItinerary
  } = useItineraries();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!activeItinerary) return null;

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      reorderExperiences(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleCopyLink = () => {
    // Auto-make public when sharing
    if (!activeItinerary.isPublic) {
      togglePublic(activeItinerary.id);
      toast({
        title: "Made public & link copied!",
        description: "Your itinerary is now shareable with anyone",
      });
    } else {
      toast({
        title: "Link copied!",
        description: "Share this link with your friends",
      });
    }
    
    const url = getShareUrl(activeItinerary.id);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    // Auto-make public when sharing
    if (!activeItinerary.isPublic) {
      togglePublic(activeItinerary.id);
    }
    
    const url = getShareUrl(activeItinerary.id);
    const text = `Check out my itinerary: ${activeItinerary.name}\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleAddCollaborator = async () => {
    if (collaboratorEmail.trim()) {
      const email = collaboratorEmail.trim();
      
      const result = await addCollaborator(activeItinerary.id, email);
      
      if (!result.success) {
        toast({
          title: "Cannot add collaborator",
          description: result.message,
          variant: "destructive"
        });
        return;
      }
      
      setCollaboratorEmail("");
      
      if (result.emailSent) {
        toast({
          title: "Invitation sent! 📧",
          description: `${email} will receive an email with a link to collaborate.`,
        });
      } else {
        toast({
          title: "Collaborator added",
          description: result.message || `${email} can now view this itinerary`,
        });
      }
    }
  };

  // Handle external drops (from public itinerary or experience cards)
  const handleExternalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    try {
      const data = e.dataTransfer.getData('text/plain');
      if (data) {
        const experience = JSON.parse(data);
        if (experience && experience.id && experience.title) {
          if (isInItinerary(experience.id)) {
            toast({
              title: "Already in itinerary",
              description: `${experience.title} is already in your itinerary`,
            });
            return;
          }
          
          addExperience({
            id: experience.id,
            title: experience.title,
            creator: experience.creator || '',
            videoThumbnail: experience.videoThumbnail || '',
            category: experience.category || '',
            location: experience.location || '',
            price: experience.price || '$0',
          });
          
          toast({
            title: "Added to itinerary!",
            description: `${experience.title} has been added`,
          });
        }
      }
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
  };

  const handleExternalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleExternalDragLeave = () => {
    setIsDragOver(false);
  };

  const totalPrice = activeItinerary.experiences.reduce((sum, exp) => {
    const price = parseFloat(exp.price?.replace('$', '') || '0') || 0;
    return sum + price;
  }, 0);

  const handleExportCSV = () => {
    const headers = ['#', 'Title', 'Category', 'Location', 'Price', 'Creator'];
    const rows = activeItinerary.experiences.map((exp, i) => [
      i + 1,
      exp.title,
      exp.category || '',
      exp.location || '',
      exp.price || '',
      exp.creator || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeItinerary.name.replace(/\s+/g, '_')}_itinerary.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Exported!", description: "CSV file downloaded" });
  };

  // Collapsed state - just show a thin bar with expand button (desktop only)
  if (isCollapsed && !isMobile) {
    return (
      <aside className="hidden lg:flex w-12 flex-col border-l border-border bg-card/50 items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsCollapsed(false)}
        >
          <PanelRightOpen className="w-4 h-4" />
        </Button>
      </aside>
    );
  }

  // Mobile layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-card">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-lg truncate">{activeItinerary.name}</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <Badge variant="secondary">{activeItinerary.experiences.length} experiences</Badge>
            <span>• ${totalPrice.toFixed(0)}</span>
          </div>
        </div>

        {/* Experiences List */}
        <ScrollArea className="flex-1">
          {activeItinerary.experiences.length === 0 ? (
            <div className="p-6 text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-medium mb-2">Start planning</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add experiences to build your perfect trip
              </p>
              <Link to="/things-to-do">
                <Button variant="outline" size="sm">
                  Discover Experiences
                </Button>
              </Link>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {activeItinerary.experiences.map((experience, index) => (
                <Card key={experience.id} className="p-3">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{experience.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{experience.location}</span>
                        <span className="font-medium text-primary">{experience.price}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive shrink-0"
                      onClick={() => removeExperience(experience.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {activeItinerary.experiences.length > 0 && (
          <div className="p-4 border-t border-border">
            <Link to="/itinerary">
              <Button className="w-full">
                View Full Itinerary
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <aside 
      className={cn(
        "hidden lg:flex w-80 flex-col border-l border-border bg-card/50 transition-all",
        isDragOver && "ring-2 ring-primary ring-inset bg-primary/5"
      )}
      onDragOver={handleExternalDragOver}
      onDragLeave={handleExternalDragLeave}
      onDrop={handleExternalDrop}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg truncate flex-1">{activeItinerary.name}</h2>
          <div className="flex items-center gap-1">
            {/* Collapse button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsCollapsed(true)}
              title="Collapse panel"
            >
              <PanelRightClose className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => togglePublic(activeItinerary.id)}
            >
              {activeItinerary.isPublic ? (
                <Globe className="w-4 h-4 text-primary" />
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
            
            {/* Share Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Share2 className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Share Itinerary</DialogTitle>
                  <DialogDescription>
                    Share your travel plans with friends and family
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 pt-4">
                  {/* Share Link */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Public Link</label>
                    <div className="flex gap-2">
                      <Input 
                        value={getShareUrl(activeItinerary.id)} 
                        readOnly 
                        className="text-sm"
                      />
                      <Button onClick={handleCopyLink}>
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Social Share */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Share via</label>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={handleShareWhatsApp}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={handleCopyLink}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </Button>
                    </div>
                  </div>

                  {/* Visibility Toggle */}
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Visibility</p>
                      <p className="text-xs text-muted-foreground">
                        {activeItinerary.isPublic ? "Anyone with the link can view" : "Only you and collaborators"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublic(activeItinerary.id)}
                    >
                      {activeItinerary.isPublic ? "Make Private" : "Make Public"}
                    </Button>
                  </div>

                  {/* Collaborators */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Collaborators
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Email address"
                        value={collaboratorEmail}
                        onChange={(e) => setCollaboratorEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddCollaborator()}
                      />
                      <Button onClick={handleAddCollaborator}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {activeItinerary.collaborators.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {activeItinerary.collaborators.map((email) => (
                          <div key={email} className="flex items-center justify-between text-sm bg-muted rounded-md px-3 py-2">
                            <span>{email}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeCollaborator(activeItinerary.id, email)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">{activeItinerary.experiences.length} experiences</Badge>
          <span>• ${totalPrice.toFixed(0)}</span>
          {activeItinerary.isPublic && (
            <Badge variant="outline" className="text-primary border-primary">
              <Globe className="w-3 h-3 mr-1" />
              Public
            </Badge>
          )}
        </div>

        {/* Drop hint when dragging */}
        {isDragOver && (
          <div className="mt-2 p-2 border-2 border-dashed border-primary rounded-lg bg-primary/10 text-center">
            <p className="text-xs text-primary font-medium">Drop to add experience</p>
          </div>
        )}
      </div>
      {/* Experiences List - Collapsible */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className="flex-1 flex flex-col min-h-0">
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between px-4 py-2 h-auto rounded-none border-b border-border"
          >
            <span className="text-sm font-medium">Experiences</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex-1 min-h-0">
          <ScrollArea className="h-full">
            {activeItinerary.experiences.length === 0 ? (
              <div className="p-6 text-center">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-medium mb-2">Start planning</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add experiences to build your perfect trip
                </p>
                <Link to="/experiences">
                  <Button variant="outline" size="sm">
                    Discover Experiences
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {activeItinerary.experiences.map((experience, index) => (
                  <Card
                    key={experience.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "p-3 cursor-move transition-all group",
                      draggedIndex === index && "opacity-50",
                      dragOverIndex === index && "ring-2 ring-primary"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <GripVertical className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                            {index + 1}
                          </span>
                          <h4 className="font-medium text-sm truncate">{experience.title}</h4>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{experience.location}</span>
                          <span className="font-medium text-primary">{experience.price}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={generateExperienceUrl(experience.location || '', experience.title)}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeExperience(experience.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>

      {/* Footer */}
      {activeItinerary.experiences.length > 0 && (
        <div className="p-4 border-t border-border">
          <Link to="/itinerary">
            <Button className="w-full">
              View Full Itinerary
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      )}
    </aside>
  );
};
