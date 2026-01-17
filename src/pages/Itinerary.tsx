import { useState } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useItineraries } from "@/hooks/useItineraries";
import { LikedExperience } from "@/hooks/useLikedExperiences";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, 
  Share2, 
  Search,
  Check,
  Plus,
  Trash2,
  Globe,
  Lock,
  Download,
  FileText,
  FileSpreadsheet,
  StickyNote,
  MessageCircle,
  Copy,
  MapPin,
  LayoutGrid,
  List,
  ChevronRight
} from "lucide-react";

type ViewMode = 'grid' | 'table';

const Itinerary = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { 
    activeItinerary, 
    removeExperience,
    togglePublic,
    getShareUrl
  } = useItineraries();

  if (!activeItinerary) {
    return (
      <MainLayout>
        <div className="p-6 max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">No Itinerary Selected</h1>
          <p className="text-muted-foreground mb-6">Select an itinerary from the sidebar to view it.</p>
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
    const shareUrl = getShareUrl(activeItinerary.id);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: activeItinerary.name,
          text: `Check out my itinerary: ${activeItinerary.name}`,
          url: shareUrl,
        });
      } catch (err) {
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
    const shareUrl = getShareUrl(activeItinerary.id);
    const text = `Check out my itinerary: ${activeItinerary.name}\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleRemoveExperience = (experience: LikedExperience, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeExperience(experience.id);
    toast({
      title: "Removed from itinerary",
      description: `${experience.title} has been removed.`,
    });
  };

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

  const handleExportPDF = () => {
    const totalPrice = activeItinerary.experiences.reduce((sum, exp) => {
      const price = parseFloat(exp.price?.replace('$', '') || '0') || 0;
      return sum + price;
    }, 0);

    const printContent = `
      <html>
        <head>
          <title>${activeItinerary.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #E32255; margin-bottom: 10px; }
            .subtitle { color: #666; margin-bottom: 30px; }
            .experience { border-bottom: 1px solid #eee; padding: 15px 0; }
            .number { background: #E32255; color: white; width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 10px; }
            .title { font-weight: bold; font-size: 16px; }
            .details { color: #666; font-size: 14px; margin-top: 5px; }
          </style>
        </head>
        <body>
          <h1>${activeItinerary.name}</h1>
          <p class="subtitle">${activeItinerary.experiences.length} experiences • Est. $${totalPrice.toFixed(0)} total</p>
          ${activeItinerary.experiences.map((exp, i) => `
            <div class="experience">
              <span class="number">${i + 1}</span>
              <span class="title">${exp.title}</span>
              <div class="details">${exp.location} • ${exp.price} • ${exp.category || ''}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
    
    toast({ title: "Ready to print!", description: "Print dialog opened" });
  };

  const handleExportNote = () => {
    const totalPrice = activeItinerary.experiences.reduce((sum, exp) => {
      const price = parseFloat(exp.price?.replace('$', '') || '0') || 0;
      return sum + price;
    }, 0);

    const noteContent = `${activeItinerary.name}\n${'='.repeat(activeItinerary.name.length)}\n\n${activeItinerary.experiences.length} experiences • Est. $${totalPrice.toFixed(0)} total\n\n${activeItinerary.experiences.map((exp, i) => `${i + 1}. ${exp.title}\n   📍 ${exp.location} • 💰 ${exp.price}`).join('\n\n')}`;
    
    const blob = new Blob([noteContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeItinerary.name.replace(/\s+/g, '_')}_itinerary.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Exported!", description: "Note file downloaded" });
  };

  // Filter experiences by search query
  const filteredExperiences = activeItinerary.experiences.filter((experience) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      experience.title?.toLowerCase().includes(q) ||
      experience.location?.toLowerCase().includes(q) ||
      experience.category?.toLowerCase().includes(q)
    );
  });

  // Get cover image from first experience or use gradient
  const coverImage = activeItinerary.experiences[0]?.videoThumbnail;

  // Render experience card component (grid view)
  const renderExperienceCard = (experience: LikedExperience) => {
    return (
      <Link 
        key={experience.id}
        to={`/experience/${experience.id}`}
      >
        <Card 
          className="group overflow-hidden border-0 bg-card hover:bg-accent/10 transition-colors duration-150 cursor-pointer rounded-lg p-2"
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
            
            {/* Remove Button */}
            <button
              onClick={(e) => handleRemoveExperience(experience, e)}
              className="absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300"
            >
              <Trash2 className="w-4 h-4" />
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

  // Render experience row component (table view)
  const renderExperienceRow = (experience: LikedExperience) => {
    return (
      <Link 
        key={experience.id}
        to={`/experience/${experience.id}`}
        className="group flex items-center gap-4 px-3 md:px-4 py-3 hover:bg-accent/10 transition-colors duration-150 border-b border-border/50 last:border-0"
      >
        {/* Thumbnail */}
        <div className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-md overflow-hidden">
          {experience.videoThumbnail ? (
            <img 
              src={experience.videoThumbnail} 
              alt={experience.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary/60" />
            </div>
          )}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0 md:flex-[2]">
          <div className="flex items-center gap-1">
            <span className="font-medium text-sm md:text-base truncate group-hover:text-primary transition-colors">
              {experience.title}
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        </div>

        {/* Location - hidden on mobile */}
        <div className="hidden md:flex flex-1 items-center gap-2 text-muted-foreground text-sm">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="truncate">{experience.location || '-'}</span>
        </div>

        {/* Category - hidden on mobile */}
        <div className="hidden lg:block flex-1 text-muted-foreground text-sm truncate">
          {experience.category || '-'}
        </div>

        {/* Price */}
        <div className="text-sm font-medium text-primary w-16 text-right">
          {experience.price || '-'}
        </div>

        {/* Remove Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => handleRemoveExperience(experience, e)}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
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
              {coverImage ? (
                <img 
                  src={coverImage} 
                  alt={activeItinerary.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/50 to-primary/20 flex items-center justify-center">
                  <MapPin className="w-12 h-12 text-primary-foreground/70" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  My Itinerary
                </p>
                {activeItinerary.isPublic ? (
                  <span className="text-xs text-primary flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Public
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Private
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 line-clamp-2">
                {activeItinerary.name}
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                {activeItinerary.experiences.length} experiences
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 md:gap-3 mt-4 md:mt-6">
            <Button 
              onClick={() => togglePublic(activeItinerary.id)} 
              variant="outline"
              size="sm" 
              className="gap-2 rounded-full md:hidden"
            >
              {activeItinerary.isPublic ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
              {activeItinerary.isPublic ? 'Private' : 'Public'}
            </Button>
            <Button 
              onClick={() => togglePublic(activeItinerary.id)} 
              variant="outline"
              size="default" 
              className="gap-2 rounded-full hidden md:flex"
            >
              {activeItinerary.isPublic ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
              {activeItinerary.isPublic ? 'Make Private' : 'Make Public'}
            </Button>

            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full w-8 h-8 md:w-10 md:h-10">
                  <Download className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Export CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportNote}>
                  <StickyNote className="w-4 h-4 mr-2" />
                  Export Note
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Share Dropdown */}
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

        {/* Search Bar with View Toggle */}
        <div className="px-3 md:px-6 py-3 md:py-4 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center bg-muted rounded-full px-3 md:px-4 py-2 max-w-md flex-1">
              <Search className="w-4 h-4 text-muted-foreground mr-2 md:mr-3" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in your itinerary..."
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-sm placeholder:text-muted-foreground"
              />
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-full p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Experiences Content */}
        <div className="flex-1 overflow-y-auto">
          {activeItinerary.experiences.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h2 className="text-xl font-semibold mb-2">Your itinerary is empty</h2>
              <p className="text-muted-foreground mb-6">
                Start exploring and add experiences to build your perfect trip!
              </p>
              <Link to="/">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Discover Experiences
                </Button>
              </Link>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="p-3 md:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4">
                {filteredExperiences.map(renderExperienceCard)}
              </div>

              {/* Empty search state */}
              {filteredExperiences.length === 0 && searchQuery && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No experiences found matching "{searchQuery}"
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card/50">
              {/* Table Header */}
              <div className="hidden md:flex items-center gap-4 px-4 py-3 border-b border-border text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <div className="w-14 shrink-0">Image</div>
                <div className="flex-[2]">Experience</div>
                <div className="flex-1 hidden md:block">Location</div>
                <div className="flex-1 hidden lg:block">Category</div>
                <div className="w-16 text-right">Price</div>
                <div className="w-20"></div>
              </div>
              
              {/* Table Rows */}
              <div>
                {filteredExperiences.map(renderExperienceRow)}
              </div>

              {/* Empty search state */}
              {filteredExperiences.length === 0 && searchQuery && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No experiences found matching "{searchQuery}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Itinerary;