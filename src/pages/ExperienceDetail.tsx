import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MainLayout } from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Plus, Check, ArrowLeft, Share2, Calendar, MapPin, Users, Clock, Star, Bookmark, ChevronRight } from "lucide-react";
import { useItineraries } from "@/hooks/useItineraries";
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
    title: "Jet Ski Adventure - where are you to do",
    creator: "JohnDoe",
    views: "5000",
    videoThumbnail: jetskiImage,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    category: "Water Sports",
    location: "Dar Es Salaam",
    price: 49,
    currency: "USD",
    description: "Experience the thrill of high-speed jet skiing through crystal-clear waters. Perfect for adventure seekers.",
    duration: "2 hours",
    groupSize: "4-8 people",
    rating: 4.8,
    totalReviews: 127,
    date: "Available on request",
    time: "Flexible timing",
    includes: ["Professional instructor", "Safety equipment", "Jet ski rental", "Refreshments", "Photography session", "Insurance coverage"],
    agenda: [
      { time: "Start", activity: "Safety briefing & equipment check" },
      { time: "During", activity: "Guided adventure tour" },
      { time: "End", activity: "Free riding time & return" }
    ],
    spotsLeft: 3,
    totalSpots: 8
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
    description: "All-night beach party with DJs and tropical vibes.",
    duration: "5 hours",
    groupSize: "10-100 people",
    rating: 4.7,
    totalReviews: 89,
    date: "Every weekend",
    time: "8:00 PM - 1:00 AM",
    includes: ["DJ set", "Welcome drink", "Security", "Lighting"],
    agenda: [
      { time: "8:00 PM", activity: "Doors open" },
      { time: "10:00 PM", activity: "Headline DJ set" },
      { time: "1:00 AM", activity: "Close" }
    ],
    spotsLeft: 20,
    totalSpots: 100
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
    description: "Guided safari through the Serengeti with expert rangers.",
    duration: "6 hours",
    groupSize: "2-6 people",
    rating: 4.9,
    totalReviews: 203,
    date: "Daily",
    time: "6:00 AM - 12:00 PM",
    includes: ["Guide", "4x4 Vehicle", "Snacks", "Binoculars"],
    agenda: [
      { time: "6:00 AM", activity: "Pick up & briefing" },
      { time: "9:00 AM", activity: "Game drive" },
      { time: "12:00 PM", activity: "Drop off" }
    ],
    spotsLeft: 2,
    totalSpots: 6
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
    description: "Taste the best local dishes with a culinary expert.",
    duration: "3 hours",
    groupSize: "4-10 people",
    rating: 4.6,
    totalReviews: 54,
    date: "Mon-Fri",
    time: "1:00 PM - 4:00 PM",
    includes: ["Food samples", "Guide", "Water"],
    agenda: [
      { time: "1:00 PM", activity: "Meet & greet" },
      { time: "2:00 PM", activity: "Market tour" },
      { time: "4:00 PM", activity: "Wrap up" }
    ],
    spotsLeft: 5,
    totalSpots: 10
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
    description: "Relax on pristine sands and swim in turquoise waters.",
    duration: "4 hours",
    groupSize: "2-12 people",
    rating: 4.7,
    totalReviews: 178,
    date: "Daily",
    time: "10:00 AM - 2:00 PM",
    includes: ["Sunbeds", "Umbrellas", "Soft drinks"],
    agenda: [
      { time: "10:00 AM", activity: "Arrival & setup" },
      { time: "12:00 PM", activity: "Beach activities" },
      { time: "2:00 PM", activity: "Wrap up" }
    ],
    spotsLeft: 6,
    totalSpots: 12
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
    description: "Challenge yourself with a guided climb and breathtaking views.",
    duration: "8 hours",
    groupSize: "1-5 people",
    rating: 4.8,
    totalReviews: 92,
    date: "Weekends",
    time: "6:00 AM - 2:00 PM",
    includes: ["Guide", "Safety gear", "Snacks"],
    agenda: [
      { time: "6:00 AM", activity: "Meet & brief" },
      { time: "8:00 AM", activity: "Ascent" },
      { time: "2:00 PM", activity: "Descent & debrief" }
    ],
    spotsLeft: 1,
    totalSpots: 5
  }
];

export default function ExperienceDetail() {
  const { id } = useParams();
  const { isInItinerary, addExperience, removeExperience } = useItineraries();
  const [activeTab, setActiveTab] = useState("overview");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [experienceData, setExperienceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
              agenda: [
                { time: "Start", activity: "Meet at designated location" },
                { time: "During", activity: data.description },
                { time: "End", activity: "Experience completion" }
              ],
              spotsLeft: data.max_participants || 8,
              totalSpots: data.max_participants || 8
            });
            return;
          }
        }
        
        const mockExperience = mockExperiences.find(exp => exp.id === id);
        if (mockExperience) {
          setExperienceData(mockExperience);
        } else {
          throw new Error('Experience not found');
        }
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

  useEffect(() => {
    if (videoRef.current && experience?.videoUrl) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [experience?.videoUrl]);

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
              <Button>Back to Experiences</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showItineraryPanel={false}>
      <div className="min-h-full">
        {/* Hero Section */}
        <div className="relative h-[50vh] overflow-hidden">
          {experience.videoUrl ? (
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
          ) : (
            <img src={experience.videoThumbnail} alt={experience.title} className="w-full h-full object-cover" />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent">
            <div className="absolute top-6 left-6">
              <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground transition-colors bg-background/20 backdrop-blur-sm px-3 py-2 rounded-lg">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </div>
            
            <div className="absolute top-6 right-6 flex gap-3">
              <Button onClick={handleToggleItinerary} variant="secondary" className="bg-background/20 backdrop-blur-sm border-border/30 hover:bg-background/30">
                {inItinerary ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    In Itinerary
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Itinerary
                  </>
                )}
              </Button>
              <Button size="icon" variant="secondary" className="bg-background/20 backdrop-blur-sm border-border/30 hover:bg-background/30">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="absolute bottom-8 left-8 right-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-primary/90 text-primary-foreground">{experience.category}</Badge>
                <div className="flex items-center gap-1 text-primary-foreground">
                  <Star className="w-4 h-4 fill-current text-yellow-400" />
                  <span className="font-medium">{experience.rating}</span>
                  <span className="text-primary-foreground/70">({experience.totalReviews})</span>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">{experience.title}</h1>
              <div className="flex items-center gap-6 text-primary-foreground/90 flex-wrap">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{experience.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{experience.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{experience.time}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-14 h-14">
                      <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                        {experience.creator.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold">Hosted by {experience.creator}</h3>
                      <p className="text-muted-foreground text-sm">Verified Host • 4.9 rating</p>
                    </div>
                  </div>
                  <Button variant="outline">Message Host</Button>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">About this experience</h3>
                <p className="text-muted-foreground leading-relaxed">{experience.description}</p>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">What's included</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {experience.includes.map((item: string, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span className="text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Schedule</h3>
                <div className="space-y-4">
                  {experience.agenda.map((item: { time: string; activity: string }, index: number) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-20 font-medium text-primary">{item.time}</div>
                      <div className="flex-1 text-muted-foreground">{item.activity}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Right Sidebar - Booking Card */}
            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-20">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-primary">${experience.price}</div>
                  <div className="text-muted-foreground">per person</div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{experience.duration}</div>
                      <div className="text-xs text-muted-foreground">Duration</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-sm">{experience.groupSize}</div>
                      <div className="text-xs text-muted-foreground">Group</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button size="lg" className="w-full">
                    Reserve your spot
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                  
                  <Button variant="outline" size="lg" className="w-full" onClick={handleToggleItinerary}>
                    {inItinerary ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        In Itinerary
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Itinerary
                      </>
                    )}
                  </Button>
                </div>

                <Separator className="my-6" />

                <div className="text-center text-sm text-muted-foreground">
                  <p>Free cancellation up to 24 hours before</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
