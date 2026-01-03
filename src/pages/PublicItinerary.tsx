import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { publicItinerariesData } from "@/hooks/useItineraries";
import { CopyItineraryDialog } from "@/components/CopyItineraryDialog";
import { 
  ArrowLeft, 
  Copy, 
  Share2, 
  MapPin, 
  User, 
  Calendar,
  ExternalLink,
  Check
} from "lucide-react";
import { useState } from "react";

const PublicItinerary = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);

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
        // User cancelled or error
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

  const handleCopyComplete = () => {
    toast({
      title: "Itinerary copied!",
      description: `The experiences have been added to your itinerary.`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-4xl mx-auto">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Discover
        </Link>

        {/* Header */}
        <div className="mb-8">
          {/* Cover Image */}
          {itinerary.coverImage && (
            <div className="relative h-48 md:h-64 rounded-xl overflow-hidden mb-6">
              <img 
                src={itinerary.coverImage} 
                alt={itinerary.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <Badge variant="secondary" className="mb-2">
                  Public Itinerary
                </Badge>
                <h1 className="text-3xl font-bold text-white drop-shadow-lg">{itinerary.name}</h1>
              </div>
            </div>
          )}

          {!itinerary.coverImage && (
            <>
              <Badge variant="secondary" className="mb-2">
                Public Itinerary
              </Badge>
              <h1 className="text-3xl font-bold mb-4">{itinerary.name}</h1>
            </>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>by {itinerary.creatorName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Updated {formatDate(itinerary.updatedAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{itinerary.experiences.length} experiences</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setCopyDialogOpen(true)} className="gap-2">
              <Copy className="w-4 h-4" />
              Copy to My Itineraries
            </Button>
            <Button variant="outline" onClick={handleShare} className="gap-2">
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              {copied ? "Copied!" : "Share"}
            </Button>
          </div>
        </div>

        {/* Experiences List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Experiences in this itinerary</h2>
          
          {itinerary.experiences.map((experience, index) => (
            <Card key={experience.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Order Number */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                    {index + 1}
                  </div>

                  {/* Experience Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1">{experience.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {experience.location}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {experience.category}
                      </Badge>
                      <span className="font-medium text-foreground">{experience.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      by {experience.creator}
                    </p>
                  </div>

                  {/* View Button */}
                  <Link to={`/experience/${experience.id}`}>
                    <Button variant="ghost" size="sm" className="gap-1">
                      View
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 p-6 bg-muted/50 rounded-xl text-center">
          <h3 className="text-lg font-semibold mb-2">Like this itinerary?</h3>
          <p className="text-muted-foreground mb-4">
            Copy it to your collection and customize it for your own trip.
          </p>
          <Button onClick={() => setCopyDialogOpen(true)} size="lg" className="gap-2">
            <Copy className="w-4 h-4" />
            Copy to My Itineraries
          </Button>
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
