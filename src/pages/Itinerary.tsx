import { useState } from "react";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Trash2, 
  GripVertical, 
  Share2, 
  Globe, 
  Lock,
  Users,
  Copy,
  Check,
  Plus,
  ExternalLink
} from "lucide-react";
import { useItineraries } from "@/hooks/useItineraries";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const Itinerary = () => {
  const { toast } = useToast();
  const {
    activeItinerary,
    removeExperience,
    reorderExperiences,
    togglePublic,
    addCollaborator,
    removeCollaborator,
    getShareUrl
  } = useItineraries();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [copied, setCopied] = useState(false);

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
    if (!activeItinerary) return;
    const url = getShareUrl(activeItinerary.id);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copied!",
      description: "Share this link with your friends",
    });
  };

  const handleAddCollaborator = () => {
    if (collaboratorEmail.trim() && activeItinerary) {
      addCollaborator(activeItinerary.id, collaboratorEmail.trim());
      setCollaboratorEmail("");
      toast({
        title: "Collaborator added",
        description: `${collaboratorEmail} can now view this itinerary`,
      });
    }
  };

  if (!activeItinerary || activeItinerary.experiences.length === 0) {
    return (
      <MainLayout showItineraryPanel={false}>
        <div className="flex items-center justify-center h-full">
          <div className="max-w-md text-center py-20 px-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Your Itinerary is Empty</h1>
            <p className="text-muted-foreground mb-8">
              Start exploring experiences and add them to your itinerary to plan your perfect trip!
            </p>
            <Link to="/">
              <Button size="lg" className="gap-2">
                <Plus className="w-4 h-4" />
                Discover Experiences
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const totalPrice = activeItinerary.experiences.reduce((sum, exp) => {
    const price = parseFloat(exp.price.replace('$', '')) || 0;
    return sum + price;
  }, 0);

  return (
    <MainLayout showItineraryPanel={false}>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{activeItinerary.name}</h1>
              {activeItinerary.isPublic ? (
                <Badge variant="outline" className="text-primary border-primary">
                  <Globe className="w-3 h-3 mr-1" />
                  Public
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Lock className="w-3 h-3 mr-1" />
                  Private
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {activeItinerary.experiences.length} experiences • Est. ${totalPrice.toFixed(0)} total
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => togglePublic(activeItinerary.id)}
            >
              {activeItinerary.isPublic ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Make Private
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-2" />
                  Make Public
                </>
              )}
            </Button>

            {/* Share Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share Itinerary</DialogTitle>
                  <DialogDescription>
                    Share your travel plans with friends and family
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 pt-4">
                  {/* Share Link */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Share Link</label>
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

                  {/* Collaborators */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Add Collaborators
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
          </div>
        </div>

        {/* Experiences List */}
        <div className="space-y-4">
          {activeItinerary.experiences.map((experience, index) => (
            <Card
              key={experience.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "overflow-hidden transition-all group cursor-move",
                draggedIndex === index && "opacity-50 scale-95",
                dragOverIndex === index && "ring-2 ring-primary"
              )}
            >
              <div className="flex flex-col md:flex-row">
                {/* Image */}
                <div 
                  className="md:w-48 h-48 md:h-auto bg-cover bg-center relative"
                  style={{ backgroundImage: `url(${experience.videoThumbnail})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/10" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 md:p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <Badge className="mb-2">{experience.category}</Badge>
                        <h3 className="text-xl font-semibold">{experience.title}</h3>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>

                    <p className="text-muted-foreground text-sm mb-4">
                      By {experience.creator}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{experience.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-primary">{experience.price}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Added {new Date(experience.likedAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link to={`/experience/${experience.id}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeExperience(experience.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Add More CTA */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">Want to add more experiences?</p>
          <Link to="/">
            <Button variant="outline" size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Discover More Experiences
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default Itinerary;
