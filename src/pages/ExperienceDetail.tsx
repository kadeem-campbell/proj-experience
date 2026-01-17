import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Check, 
  ArrowLeft, 
  Share2, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Star, 
  Globe,
  Play,
  Pause,
  Image as ImageIcon
} from "lucide-react";
import { useItineraries, publicItinerariesData } from "@/hooks/useItineraries";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Mock data - in real app this would come from API
import partyImage from "@/assets/party-experience.jpg";
import beachImage from "@/assets/beach-experience.jpg";
import foodImage from "@/assets/food-experience.jpg";
import wildlifeImage from "@/assets/wildlife-experience.jpg";
import jetskiImage from "@/assets/jetski-experience.jpg";
import adventureImage from "@/assets/adventure-experience.jpg";

const mockExperiences = [
  {
    id: "1",
    title: "Jet Ski Adventure",
    creator: "JohnDoe",
    views: "5000",
    videoThumbnail: jetskiImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    category: "Water Sports",
    location: "Dar es Salaam",
    price: 49,
    currency: "USD",
    description: "Experience the thrill of high-speed jet skiing through crystal-clear waters. Perfect for adventure seekers looking for an adrenaline rush on the beautiful coastline. Our expert instructors will guide you through the best spots while ensuring your safety throughout the journey.",
    duration: "2 hours",
    groupSize: "4-8 people",
    rating: 4.8,
    totalReviews: 127,
    date: "Available daily",
    time: "Flexible timing",
    includes: ["Professional instructor", "Safety equipment", "Jet ski rental", "Refreshments", "Photography session", "Insurance coverage"],
    highlights: ["Crystal clear waters", "Professional guides", "Photo opportunities", "Beginner friendly"],
    gallery: [jetskiImage, beachImage, adventureImage, partyImage],
    languages: ["English", "Swahili", "French"],
    meetingPoint: "Coco Beach Marina, Dar es Salaam",
    cancellationPolicy: "Free cancellation up to 24 hours before"
  },
  {
    id: "2",
    title: "Beach Party Extravaganza",
    creator: "BeachVibes",
    views: "12.5K",
    videoThumbnail: partyImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    category: "Party",
    location: "Zanzibar",
    price: 35,
    currency: "USD",
    description: "All-night beach party with world-class DJs and tropical vibes. Dance under the stars on pristine white sand beaches with the Indian Ocean as your backdrop.",
    duration: "5 hours",
    groupSize: "10-100 people",
    rating: 4.7,
    totalReviews: 89,
    date: "Every weekend",
    time: "8:00 PM - 1:00 AM",
    includes: ["DJ set", "Welcome drink", "Security", "Lighting", "Beach access"],
    highlights: ["World-class DJs", "Beach setting", "Tropical cocktails", "Unforgettable atmosphere"],
    gallery: [partyImage, beachImage, foodImage],
    languages: ["English", "Swahili"],
    meetingPoint: "Nungwi Beach Club, Zanzibar",
    cancellationPolicy: "Free cancellation up to 48 hours before"
  },
  {
    id: "3",
    title: "Safari Wildlife Experience",
    creator: "WildlifePro",
    views: "8.2K",
    videoThumbnail: wildlifeImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    category: "Wildlife",
    location: "Serengeti",
    price: 120,
    currency: "USD",
    description: "Guided safari through the Serengeti with expert rangers. Witness the incredible wildlife of East Africa including lions, elephants, and the great migration.",
    duration: "6 hours",
    groupSize: "2-6 people",
    rating: 4.9,
    totalReviews: 203,
    date: "Daily",
    time: "6:00 AM - 12:00 PM",
    includes: ["Guide", "4x4 Vehicle", "Snacks", "Binoculars", "Park fees"],
    highlights: ["Big Five sightings", "Expert guides", "Premium vehicles", "Sunrise views"],
    gallery: [wildlifeImage, adventureImage, beachImage],
    languages: ["English", "Swahili", "German"],
    meetingPoint: "Seronera Airstrip, Serengeti",
    cancellationPolicy: "Free cancellation up to 72 hours before"
  },
  {
    id: "4",
    title: "Local Food Tasting Tour",
    creator: "FoodieGuide",
    views: "6.7K",
    videoThumbnail: foodImage,
    category: "Food",
    location: "Stone Town",
    price: 25,
    currency: "USD",
    description: "Taste the best local dishes with a culinary expert. Explore the vibrant spice markets and hidden food gems of Stone Town.",
    duration: "3 hours",
    groupSize: "4-10 people",
    rating: 4.6,
    totalReviews: 54,
    date: "Mon-Fri",
    time: "1:00 PM - 4:00 PM",
    includes: ["Food samples", "Guide", "Water", "Market tour"],
    highlights: ["Authentic cuisine", "Spice markets", "Local secrets", "Cultural immersion"],
    gallery: [foodImage, partyImage, beachImage],
    languages: ["English", "Swahili", "Arabic"],
    meetingPoint: "Forodhani Gardens, Stone Town",
    cancellationPolicy: "Free cancellation up to 24 hours before"
  },
  {
    id: "5",
    title: "Tropical Beach Paradise",
    creator: "BeachLover",
    views: "15.3K",
    videoThumbnail: beachImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    category: "Beach",
    location: "Kendwa",
    price: 40,
    currency: "USD",
    description: "Relax on pristine sands and swim in turquoise waters. Experience the ultimate tropical beach day with all amenities included.",
    duration: "4 hours",
    groupSize: "2-12 people",
    rating: 4.7,
    totalReviews: 178,
    date: "Daily",
    time: "10:00 AM - 2:00 PM",
    includes: ["Sunbeds", "Umbrellas", "Soft drinks", "Towels"],
    highlights: ["White sand beaches", "Crystal clear water", "Relaxation", "Snorkeling spots"],
    gallery: [beachImage, jetskiImage, partyImage],
    languages: ["English", "Swahili", "Italian"],
    meetingPoint: "Kendwa Rocks Beach, Zanzibar",
    cancellationPolicy: "Free cancellation up to 24 hours before"
  },
  {
    id: "6",
    title: "Mountain Climbing Adventure",
    creator: "AdventureSeeker",
    views: "4.1K",
    videoThumbnail: adventureImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    category: "Adventure",
    location: "Mount Kilimanjaro",
    price: 200,
    currency: "USD",
    description: "Challenge yourself with a guided climb and breathtaking views. Conquer the roof of Africa with experienced mountaineering guides.",
    duration: "8 hours",
    groupSize: "1-5 people",
    rating: 4.8,
    totalReviews: 92,
    date: "Weekends",
    time: "6:00 AM - 2:00 PM",
    includes: ["Guide", "Safety gear", "Snacks", "First aid", "Permits"],
    highlights: ["Summit views", "Expert guides", "Achievement", "Stunning landscapes"],
    gallery: [adventureImage, wildlifeImage, beachImage],
    languages: ["English", "Swahili"],
    meetingPoint: "Machame Gate, Kilimanjaro",
    cancellationPolicy: "Free cancellation up to 1 week before"
  }
];

export default function ExperienceDetail() {
  const { id } = useParams();
  const { isInItinerary, addExperience, removeExperience } = useItineraries();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [experienceData, setExperienceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const fetchExperience = async () => {
      try {
        const isUUID = id && id.length === 36 && id.includes('-');
        
        if (isUUID) {
          const { data, error } = await supabase
            .from('experiences')
            .select('*')
            .eq('id', id)
            .maybeSingle();

          if (error) throw new Error('Experience not found');

          if (data) {
            setExperienceData({
              id: data.id,
              title: data.title,
              creator: data.creator,
              views: "0",
              videoThumbnail: data.video_thumbnail || getDefaultImage(data.category),
              videoUrl: "",
              category: data.category,
              location: data.location,
              price: data.price,
              currency: data.currency || "USD",
              description: data.description,
              duration: `${data.duration_hours} hours`,
              groupSize: `1-${data.max_participants} people`,
              rating: 4.8,
              totalReviews: 0,
              date: "Available on request",
              time: "Flexible timing",
              includes: ["Professional guide", "Safety equipment", "Refreshments", "Insurance coverage"],
              highlights: ["Unique experience", "Expert guides", "Photo opportunities"],
              gallery: [data.video_thumbnail || getDefaultImage(data.category)],
              languages: ["English", "Swahili"],
              meetingPoint: data.location,
              cancellationPolicy: "Free cancellation up to 24 hours before"
            });
            return;
          }
        }
        
        // Check mock experiences first
        const mockExperience = mockExperiences.find(exp => exp.id === id);
        if (mockExperience) {
          setExperienceData(mockExperience);
          return;
        }
        
        // Check experiences from public itineraries
        for (const itinerary of publicItinerariesData) {
          const itineraryExp = itinerary.experiences.find(exp => exp.id === id);
          if (itineraryExp) {
            // Convert itinerary experience to full experience format
            setExperienceData({
              id: itineraryExp.id,
              title: itineraryExp.title,
              creator: itineraryExp.creator,
              views: "0",
              videoThumbnail: itineraryExp.videoThumbnail || getDefaultImage(itineraryExp.category),
              videoUrl: "",
              category: itineraryExp.category,
              location: itineraryExp.location,
              price: parseInt(itineraryExp.price?.replace(/[^0-9]/g, '') || '0'),
              currency: "USD",
              description: `Experience the best of ${itineraryExp.location} with this amazing ${itineraryExp.category.toLowerCase()} experience. Join ${itineraryExp.creator} for an unforgettable adventure that showcases the local culture and hidden gems.`,
              duration: "3 hours",
              groupSize: "2-10 people",
              rating: 4.7,
              totalReviews: Math.floor(Math.random() * 100) + 20,
              date: "Available daily",
              time: "Flexible timing",
              includes: ["Professional guide", "Transportation", "Refreshments", "Insurance coverage"],
              highlights: ["Local expertise", "Authentic experience", "Photo opportunities", "Small groups"],
              gallery: [itineraryExp.videoThumbnail || getDefaultImage(itineraryExp.category)],
              languages: ["English", "Swahili"],
              meetingPoint: itineraryExp.location,
              cancellationPolicy: "Free cancellation up to 24 hours before"
            });
            return;
          }
        }
        
        throw new Error('Experience not found');
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load experience details.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchExperience();
  }, [id, toast]);

  const getDefaultImage = (category: string) => {
    const imageMap: { [key: string]: string } = {
      'water-sports': jetskiImage, 'Water Sports': jetskiImage,
      'party': partyImage, 'Party': partyImage,
      'wildlife': wildlifeImage, 'Wildlife': wildlifeImage,
      'food': foodImage, 'Food': foodImage, 'Food & Dining': foodImage,
      'beach': beachImage, 'Beach': beachImage,
      'adventure': adventureImage, 'Adventure': adventureImage,
      'nightlife': partyImage, 'Nightlife': partyImage
    };
    return imageMap[category] || jetskiImage;
  };

  const experience = experienceData || mockExperiences.find(exp => exp.id === id);
  const inItinerary = experience ? isInItinerary(experience.id) : false;

  const handleToggleItinerary = () => {
    if (!experience) return;
    
    if (inItinerary) {
      removeExperience(experience.id);
      toast({ title: "Removed from itinerary", description: `${experience.title} has been removed` });
    } else {
      addExperience({
        id: experience.id,
        title: experience.title,
        creator: experience.creator,
        videoThumbnail: experience.videoThumbnail,
        category: experience.category,
        location: experience.location,
        price: experience.price.toString()
      });
      toast({ title: "Added to itinerary", description: `${experience.title} has been added to your trip` });
    }
  };

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (loading) {
    return (
      <MainLayout showItineraryPanel={false}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading experience...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!experience) {
    return (
      <MainLayout showItineraryPanel={false}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Experience not found</h1>
            <Link to="/">
              <Button>Back to Discover</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const gallery = experience.gallery || [experience.videoThumbnail];

  return (
    <MainLayout showItineraryPanel={false}>
      <div className="min-h-full bg-background">
        {/* Hero Section - Full Width Image/Video */}
        <div className="relative h-[60vh] overflow-hidden">
          {experience.videoUrl ? (
            <>
              <video
                ref={videoRef}
                poster={experience.videoThumbnail}
                className="w-full h-full object-cover"
                muted loop playsInline autoPlay
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                <source src={experience.videoUrl} type="video/mp4" />
              </video>
              <button 
                onClick={toggleVideo}
                className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <img src={experience.videoThumbnail} alt={experience.title} className="w-full h-full object-cover" />
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          
          {/* Navigation */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
            <Link to="/" className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Back</span>
            </Link>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleToggleItinerary} 
                variant="secondary" 
                className="rounded-full bg-white/90 text-foreground hover:bg-white gap-2"
              >
                {inItinerary ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {inItinerary ? "Saved" : "Save"}
              </Button>
              <Button 
                size="icon" 
                variant="secondary" 
                className="rounded-full bg-white/90 text-foreground hover:bg-white"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Title Section at bottom of hero */}
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-3 mb-3">
                <Badge className="bg-white/90 text-foreground hover:bg-white">{experience.category}</Badge>
                <div className="flex items-center gap-1 text-white">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{experience.rating}</span>
                  <span className="text-white/70">({experience.totalReviews} reviews)</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                {experience.title}
              </h1>
              <div className="flex items-center gap-4 text-white/90">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {experience.location}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - 3 Column Layout */}
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column - General Info */}
            <div className="lg:col-span-3 space-y-6">
              <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Quick Info
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{experience.duration}</p>
                      <p className="text-sm text-muted-foreground">Duration</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{experience.groupSize}</p>
                      <p className="text-sm text-muted-foreground">Group size</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{experience.date}</p>
                      <p className="text-sm text-muted-foreground">Availability</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{experience.languages?.join(", ") || "English"}</p>
                      <p className="text-sm text-muted-foreground">Languages</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
                <h3 className="font-semibold text-lg mb-4">Highlights</h3>
                <ul className="space-y-2">
                  {(experience.highlights || experience.includes.slice(0, 4)).map((item: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
                <h3 className="font-semibold text-lg mb-4">Meeting Point</h3>
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {experience.meetingPoint || experience.location}
                </p>
              </Card>
            </div>

            {/* Middle Column - Photos Gallery */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  Photos
                </h3>
                
                {/* Main Image */}
                <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                  <img 
                    src={gallery[selectedImage]} 
                    alt={`${experience.title} - Photo ${selectedImage + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Thumbnail Strip */}
                {gallery.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {gallery.map((img: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all ${
                          selectedImage === index 
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
                <h3 className="font-semibold text-lg mb-4">About This Experience</h3>
                <p className="text-muted-foreground leading-relaxed">{experience.description}</p>
              </Card>

              <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
                <h3 className="font-semibold text-lg mb-4">What's Included</h3>
                <div className="grid grid-cols-2 gap-3">
                  {experience.includes.map((item: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Column - Indicative Pricing & Info */}
            <div className="lg:col-span-4 space-y-6">
              {/* Indicative Price Card */}
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 backdrop-blur-sm sticky top-6">
                <div className="mb-6">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Indicative Price</p>
                  <div className="text-4xl font-bold text-primary">
                    ${experience.price}
                  </div>
                  <div className="text-muted-foreground text-sm">per person (approx)</div>
                </div>

                <Separator className="my-4" />

                {/* Experience Type */}
                <div className="space-y-4 mb-6">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Experience Type</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="rounded-full">
                        <Users className="w-3 h-3 mr-1" />
                        {experience.groupSize?.includes("1-") ? "Solo or Group" : "Group"}
                      </Badge>
                      <Badge variant="outline" className="rounded-full">
                        {experience.category}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Preferred Payment</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="rounded-full">
                        💵 Cash on arrival
                      </Badge>
                      <Badge variant="outline" className="rounded-full">
                        💳 Card accepted
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Best For</p>
                    <div className="flex flex-wrap gap-2">
                      {experience.category === "Wildlife" || experience.category === "Adventure" ? (
                        <>
                          <Badge variant="outline" className="rounded-full">👨‍👩‍👧‍👦 Families</Badge>
                          <Badge variant="outline" className="rounded-full">🎒 Solo travelers</Badge>
                        </>
                      ) : experience.category === "Party" || experience.category === "Nightlife" ? (
                        <>
                          <Badge variant="outline" className="rounded-full">👯 Friends</Badge>
                          <Badge variant="outline" className="rounded-full">🎉 Groups</Badge>
                        </>
                      ) : (
                        <>
                          <Badge variant="outline" className="rounded-full">💑 Couples</Badge>
                          <Badge variant="outline" className="rounded-full">👯 Friends</Badge>
                          <Badge variant="outline" className="rounded-full">🎒 Solo</Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full rounded-full"
                  onClick={handleToggleItinerary}
                >
                  {inItinerary ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      In Your Itinerary
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Itinerary
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  Prices may vary. Contact vendors directly for exact pricing.
                </p>
              </Card>
            </div>
          </div>

          {/* Where to Experience Section */}
          <Separator className="my-10" />
          
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Where to Experience</h2>
              <p className="text-muted-foreground">Find locations and vendors offering this experience</p>
            </div>

            {/* Locations - Meeting Points */}
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Locations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { 
                    name: experience.meetingPoint || experience.location, 
                    area: experience.location,
                    type: "Main Location",
                    coordinates: "Popular spot"
                  },
                  ...(experience.category === "Water Sports" || experience.category === "Beach" ? [
                    { name: "Coco Beach", area: experience.location, type: "Beach Access", coordinates: "Easy parking" },
                    { name: "Ocean Road Pier", area: experience.location, type: "Marina", coordinates: "Equipment rental" }
                  ] : experience.category === "Adventure" ? [
                    { name: "Main Gate Entrance", area: experience.location, type: "Starting Point", coordinates: "Registration here" },
                    { name: "Visitor Center", area: experience.location, type: "Info Point", coordinates: "Guides available" }
                  ] : [
                    { name: "City Center", area: experience.location, type: "Meeting Point", coordinates: "Central location" }
                  ])
                ].map((location, index) => (
                  <Card key={index} className="p-4 hover:shadow-md transition-all hover:border-primary/30">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{location.name}</h4>
                        <p className="text-xs text-muted-foreground">{location.type}</p>
                        <p className="text-xs text-primary mt-1">{location.coordinates}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Vendors */}
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Experience Providers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    name: `${experience.location} Adventures`,
                    rating: 4.8,
                    reviews: 156,
                    specialty: experience.category,
                    verified: true
                  },
                  {
                    name: `East Africa ${experience.category} Tours`,
                    rating: 4.6,
                    reviews: 89,
                    specialty: "Local experts",
                    verified: true
                  },
                  {
                    name: `${experience.creator}'s Experiences`,
                    rating: 4.9,
                    reviews: 234,
                    specialty: "Original creator",
                    verified: true
                  }
                ].map((vendor, index) => (
                  <Card key={index} className="p-4 hover:shadow-md transition-all hover:border-primary/30 group">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12 rounded-xl">
                        <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                          {vendor.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm truncate">{vendor.name}</h4>
                          {vendor.verified && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              <Check className="w-3 h-3" />
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{vendor.rating}</span>
                          <span>({vendor.reviews})</span>
                        </div>
                        <p className="text-xs text-primary mt-1">{vendor.specialty}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Booking Tip */}
            {(experience.category === "Water Sports" || experience.category === "Beach" || experience.category === "Party") && (
              <Card className="p-5 bg-amber-500/10 border-amber-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">💡</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-700 dark:text-amber-400">Better to book on the day</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      This type of experience is often available on-demand. Head to the location and negotiate directly with vendors for the best prices and flexibility.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {(experience.category === "Adventure" || experience.category === "Wildlife") && (
              <Card className="p-5 bg-blue-500/10 border-blue-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">📅</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-700 dark:text-blue-400">Advance booking recommended</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      This experience typically requires advance booking. Contact vendors ahead of time to secure your spot and arrange transportation.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
