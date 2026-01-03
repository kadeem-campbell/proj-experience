import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Platform {
  id: 'tiktok' | 'instagram';
  name: string;
  icon: string;
  description: string;
  urlPattern: RegExp;
  examples: string[];
}

interface SocialMediaPlatformSelectorProps {
  selectedPlatform: 'tiktok' | 'instagram' | null;
  onPlatformSelect: (platform: 'tiktok' | 'instagram') => void;
}

const platforms: Platform[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    description: 'Extract from TikTok videos',
    urlPattern: /tiktok\.com/,
    examples: ['tiktok.com/@user/video/123', 'vm.tiktok.com/abc123']
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    description: 'Coming Soon - Instagram integration',
    urlPattern: /instagram\.com/,
    examples: ['instagram.com/p/abc123', 'instagram.com/reel/xyz789']
  }
];

export const SocialMediaPlatformSelector = ({ 
  selectedPlatform, 
  onPlatformSelect 
}: SocialMediaPlatformSelectorProps) => {
  const [hoveredPlatform, setHoveredPlatform] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Platform</h3>
        <p className="text-sm text-muted-foreground">
          Choose the social media platform to extract experience data from
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platforms.map((platform) => (
          <Card
            key={platform.id}
            className={`p-4 transition-all duration-300 ${
              platform.id === 'instagram' 
                ? 'cursor-not-allowed opacity-60 border-border/30' 
                : `cursor-pointer hover:shadow-lg ${
                    selectedPlatform === platform.id 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border/50 hover:border-primary/50'
                  }`
            }`}
            onClick={() => platform.id !== 'instagram' ? onPlatformSelect(platform.id) : null}
            onMouseEnter={() => setHoveredPlatform(platform.id)}
            onMouseLeave={() => setHoveredPlatform(null)}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{platform.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{platform.name}</h4>
                  {platform.id === 'instagram' && (
                    <Badge variant="outline" className="text-xs">Coming Soon</Badge>
                  )}
                  {selectedPlatform === platform.id && (
                    <Badge variant="default" className="text-xs">Selected</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {platform.description}
                </p>
                
                {(hoveredPlatform === platform.id || selectedPlatform === platform.id) && (
                  <div className="space-y-1 animate-fade-in">
                    <p className="text-xs font-medium text-muted-foreground">
                      Supported URL formats:
                    </p>
                    {platform.examples.map((example, index) => (
                      <div key={index} className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {example}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};