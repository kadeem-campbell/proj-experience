import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  MapPin, 
  Zap, 
  ExternalLink,
  Star,
  Clock,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExtractedMetadata {
  hashtags: string[];
  enrichedData?: {
    topicEntities: string[];
  };
  author: {
    handle: string;
  };
}

interface Experience {
  id: string;
  title: string;
  location: string;
  category: string;
  rating: number;
  duration: string;
  groupSize: string;
  price: number;
  thumbnail: string;
  matchScore: number;
  matchingFactors: string[];
}

interface RelatedExperienceFinderProps {
  metadata: ExtractedMetadata;
  onExperiencesFound: (experiences: Experience[]) => void;
}

export const RelatedExperienceFinder = ({ 
  metadata, 
  onExperiencesFound 
}: RelatedExperienceFinderProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [foundExperiences, setFoundExperiences] = useState<Experience[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const { toast } = useToast();

  const searchSteps = [
    "Extracting keywords from metadata...",
    "Building search queries...",
    "Searching exact locations...",
    "Broadening to regional search...",
    "Analyzing experience matches...",
    "Calculating match scores...",
    "Ranking results..."
  ];

  // Mock experience database
  const mockExperiences: Experience[] = [
    {
      id: '1',
      title: 'Cliff Diving Adventure',
      location: 'Dar Es Salaam',
      category: 'Adventure',
      rating: 4.8,
      duration: '3 hours',
      groupSize: '4-8 people',
      price: 85,
      thumbnail: '/src/assets/adventure-experience.jpg',
      matchScore: 0,
      matchingFactors: []
    },
    {
      id: '2',
      title: 'Jet Ski Experience',
      location: 'Zanzibar',
      category: 'Water Sports',
      rating: 4.6,
      duration: '2 hours',
      groupSize: '2-6 people',
      price: 120,
      thumbnail: '/src/assets/jetski-experience.jpg',
      matchScore: 0,
      matchingFactors: []
    },
    {
      id: '3',
      title: 'Spice Farm Tour',
      location: 'Stone Town',
      category: 'Cultural',
      rating: 4.7,
      duration: '4 hours',
      groupSize: '6-12 people',
      price: 45,
      thumbnail: '/src/assets/food-experience.jpg',
      matchScore: 0,
      matchingFactors: []
    },
    {
      id: '4',
      title: 'Beach Party Extravaganza',
      location: 'Coco Beach',
      category: 'Party',
      rating: 4.5,
      duration: 'All night',
      groupSize: '10-50 people',
      price: 35,
      thumbnail: '/src/assets/beach-experience.jpg',
      matchScore: 0,
      matchingFactors: []
    },
    {
      id: '5',
      title: 'Wildlife Safari Experience',
      location: 'Serengeti',
      category: 'Wildlife',
      rating: 4.9,
      duration: 'Full day',
      groupSize: '4-8 people',
      price: 200,
      thumbnail: '/src/assets/wildlife-experience.jpg',
      matchScore: 0,
      matchingFactors: []
    },
    {
      id: '6',
      title: 'Mountain Climbing Adventure',
      location: 'Kilimanjaro Base',
      category: 'Adventure',
      rating: 4.8,
      duration: '6 hours',
      groupSize: '4-10 people',
      price: 150,
      thumbnail: '/src/assets/adventure-experience.jpg',
      matchScore: 0,
      matchingFactors: []
    }
  ];

  const calculateMatchScore = (experience: Experience, keywords: string[]): { score: number; factors: string[] } => {
    let score = 0;
    const factors: string[] = [];

    // Only award points for ACTUAL matches, not false positives
    const experienceKeywords = [
      experience.title.toLowerCase(),
      experience.category.toLowerCase(),
      experience.location.toLowerCase()
    ];

    // Strict keyword matching - only award points for exact or meaningful matches
    keywords.forEach(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      
      // Skip generic/business keywords that don't match tourism experiences
      if (['business', 'networking', 'corporate', 'professional', 'career', 'conference'].includes(lowerKeyword)) {
        // These keywords don't match our tourism experiences at all
        return;
      }

      experienceKeywords.forEach(expKeyword => {
        if (expKeyword.includes(lowerKeyword) && lowerKeyword.length > 2) {
          score += 0.2;
          factors.push(`Keyword match: "${keyword}"`);
        }
      });
    });

    // Category-specific bonuses - only for relevant matches
    if (keywords.some(k => ['adventure', 'extreme', 'cliff', 'diving', 'mountain', 'climbing'].includes(k.toLowerCase())) && 
        experience.category === 'Adventure') {
      score += 0.4;
      factors.push('Adventure category match');
    }

    if (keywords.some(k => ['water', 'ocean', 'beach', 'jet', 'ski', 'swimming'].includes(k.toLowerCase())) && 
        experience.category === 'Water Sports') {
      score += 0.4;
      factors.push('Water sports match');
    }

    if (keywords.some(k => ['spice', 'food', 'culture', 'traditional', 'cooking', 'culinary'].includes(k.toLowerCase())) && 
        experience.category === 'Cultural') {
      score += 0.4;
      factors.push('Cultural experience match');
    }

    if (keywords.some(k => ['party', 'music', 'dance', 'nightlife', 'entertainment'].includes(k.toLowerCase())) && 
        experience.category === 'Party') {
      score += 0.4;
      factors.push('Party/entertainment match');
    }

    if (keywords.some(k => ['wildlife', 'safari', 'animals', 'nature'].includes(k.toLowerCase())) && 
        experience.category === 'Wildlife') {
      score += 0.4;
      factors.push('Wildlife experience match');
    }

    // Location bonus - only for tourism-relevant locations
    if (keywords.some(k => {
      const lowerK = k.toLowerCase();
      return experience.location.toLowerCase().includes(lowerK) && 
             !['business', 'corporate', 'office', 'conference'].includes(lowerK);
    })) {
      score += 0.15;
      factors.push(`Location match: ${experience.location}`);
    }

    // Don't give rating bonus unless there's already some content match
    if (experience.rating >= 4.7 && score > 0.3) {
      score += 0.05;
      factors.push('High-rated experience');
    }

    return { score: Math.min(score, 1), factors };
  };

  const mockSearchExperiences = async (keywords: string[]): Promise<Experience[]> => {
    // Simulate search process
    for (let i = 0; i < searchSteps.length; i++) {
      setCurrentStep(searchSteps[i]);
      setSearchProgress((i + 1) / searchSteps.length * 100);
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    // Calculate match scores for all experiences
    const scoredExperiences = mockExperiences.map(exp => {
      const { score, factors } = calculateMatchScore(exp, keywords);
      return {
        ...exp,
        matchScore: score,
        matchingFactors: factors
      };
    });

    // Filter and sort by match score - be more strict about what constitutes a match
    const relatedExperiences = scoredExperiences
      .filter(exp => exp.matchScore > 0.3) // Higher threshold for actual matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 4);

    // If no related experiences found, return a small set of default experiences with clear messaging
    if (relatedExperiences.length === 0) {
      setCurrentStep("No matching experiences found - showing alternative experiences...");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Return only top-rated diverse experiences as alternatives
      return mockExperiences
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3)
        .map(exp => ({ 
          ...exp, 
          matchScore: 0, 
          matchingFactors: ['No direct match - Alternative experience'] 
        }));
    }

    return relatedExperiences;
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setSearchProgress(0);

    try {
      // Extract keywords from metadata
      const keywords = [
        ...metadata.hashtags,
        ...(metadata.enrichedData?.topicEntities || [])
      ];

      // Build search queries
      const queries = [
        keywords.slice(0, 3).join(' '),
        `${keywords[0]} ${keywords[1] || ''}`.trim(),
        metadata.hashtags[0] || 'adventure'
      ];

      setSearchQueries(queries);

      const experiences = await mockSearchExperiences(keywords);
      setFoundExperiences(experiences);
      onExperiencesFound(experiences);

      toast({
        title: experiences.length > 0 ? "Experiences found!" : "No matches found",
        description: experiences.length > 0 
          ? `Found ${experiences.length} related experiences`
          : "Try broadening your search criteria",
        variant: experiences.length > 0 ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Could not search for related experiences",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-start search when metadata is provided
  useEffect(() => {
    if (metadata && metadata.hashtags.length > 0) {
      handleSearch();
    }
  }, [metadata]);

  const formatMatchScore = (score: number): string => {
    return `${Math.round(score * 100)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Find Related Experiences</h3>
          </div>

          {searchQueries.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Search queries:</p>
              <div className="space-y-1">
                {searchQueries.map((query, index) => (
                  <div key={index} className="text-xs font-mono bg-muted px-2 py-1 rounded">
                    {query}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isSearching && (
            <div className="space-y-2">
              <Progress value={searchProgress} className="w-full" />
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4 animate-pulse" />
                {currentStep}
              </p>
            </div>
          )}

          <Button 
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full"
          >
            {isSearching ? "Searching..." : "Search for Related Experiences"}
          </Button>
        </div>
      </Card>

      {/* Search Results */}
      {foundExperiences.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Related Experiences Found</h3>
            <Badge variant="secondary" className="text-xs">
              {foundExperiences.length} matches
            </Badge>
          </div>

          <div className="grid gap-4">
            {foundExperiences.map((experience) => (
              <Card key={experience.id} className="p-4 bg-card/70 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300">
                <div className="flex gap-4">
                  <img 
                    src={experience.thumbnail} 
                    alt={experience.title}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold">{experience.title}</h4>
                      <Badge 
                        variant={experience.matchScore === 0 ? "secondary" : "outline"} 
                        className="text-xs"
                      >
                        {experience.matchScore === 0 ? "No Match" : `${formatMatchScore(experience.matchScore)} match`}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {experience.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {experience.rating}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {experience.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {experience.groupSize}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold text-primary">
                        ${experience.price}
                      </div>
                      <Button size="sm" variant="outline">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                    </div>

                    {experience.matchingFactors.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Why this matches:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {experience.matchingFactors.slice(0, 3).map((factor, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {foundExperiences.length === 0 && !isSearching && searchQueries.length > 0 && (
        <Card className="p-6 text-center bg-destructive/10 backdrop-blur-sm border-destructive/20">
          <div className="space-y-3">
            <h3 className="font-medium text-destructive">No Matching Experiences Found</h3>
            <p className="text-sm text-muted-foreground">
              The video content doesn't match our available tourism experiences. 
              This appears to be about {metadata.enrichedData?.topicEntities?.[0] || 'business/corporate content'}, 
              but our platform focuses on adventure, cultural, and recreational experiences in Tanzania.
            </p>
            <p className="text-xs text-muted-foreground">
              Try uploading a video about tourism, adventures, or cultural activities instead.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};