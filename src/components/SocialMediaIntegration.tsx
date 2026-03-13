import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "lucide-react";
import { SocialMediaPlatformSelector } from "./SocialMediaPlatformSelector";
import { MetadataExtractor } from "./MetadataExtractor";
import { RelatedExperienceFinder } from "./RelatedExperienceFinder";
import { DebugPanel } from "./DebugPanel";

export const SocialMediaIntegration = () => {
  const [selectedPlatform, setSelectedPlatform] = useState<'tiktok' | 'instagram' | null>(null);
  const [inputUrl, setInputUrl] = useState("");
  const [extractedMetadata, setExtractedMetadata] = useState<any>(null);
  const [foundExperiences, setFoundExperiences] = useState<any[]>([]);
  const [debugData, setDebugData] = useState<any>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const handlePlatformSelect = (platform: 'tiktok' | 'instagram') => {
    if (platform === 'instagram') return; // Instagram not yet supported
    setSelectedPlatform(platform);
    setInputUrl("");
    setExtractedMetadata(null);
    setFoundExperiences([]);
  };

  const handleMetadataExtracted = (metadata: any) => {
    setExtractedMetadata(metadata);
  };

  const handleExperiencesFound = (experiences: any[]) => {
    setFoundExperiences(experiences);
  };

  const handleDebugData = (data: any) => {
    setDebugData(data);
  };

  const validateUrl = (url: string, platform: 'tiktok' | 'instagram'): boolean => {
    const patterns = {
      tiktok: /tiktok\.com/,
      instagram: /instagram\.com/
    };
    return patterns[platform].test(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <Link className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Social Media Experience Finder</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Extract video metadata from social media and find related experiences in Tanzania
        </p>
      </Card>

      {/* Platform Selection */}
      <SocialMediaPlatformSelector
        selectedPlatform={selectedPlatform}
        onPlatformSelect={handlePlatformSelect}
      />

      {/* URL Input and Metadata Extraction */}
      {selectedPlatform && selectedPlatform === 'tiktok' && (
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Enter {selectedPlatform === 'tiktok' ? 'TikTok' : 'Instagram'} URL</h3>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder={`Paste ${selectedPlatform === 'tiktok' ? 'TikTok' : 'Instagram'} URL here...`}
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            {inputUrl && !validateUrl(inputUrl, selectedPlatform) && (
              <p className="text-sm text-destructive">
                Please enter a valid {selectedPlatform === 'tiktok' ? 'TikTok' : 'Instagram'} URL
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Metadata Extraction */}
      {selectedPlatform === 'tiktok' && inputUrl && validateUrl(inputUrl, selectedPlatform) && (
        <MetadataExtractor
          platform={selectedPlatform}
          url={inputUrl}
          onMetadataExtracted={handleMetadataExtracted}
          onDebugData={handleDebugData}
        />
      )}

      {/* Related Experience Finder */}
      {extractedMetadata && (
        <RelatedExperienceFinder />
      )}

      {/* Summary */}
      {foundExperiences.length > 0 && (
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 backdrop-blur-sm border-primary/20">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-primary">🎉 Success!</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{foundExperiences.length}</div>
                <div className="text-muted-foreground">Experiences Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(foundExperiences[0]?.matchScore * 100 || 0)}%
                </div>
                <div className="text-muted-foreground">Best Match</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{extractedMetadata.hashtags.length}</div>
                <div className="text-muted-foreground">Hashtags Analyzed</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Debug Panel */}
      <DebugPanel
        debugData={debugData}
        isVisible={showDebugPanel}
        onToggleVisibility={() => setShowDebugPanel(!showDebugPanel)}
      />
    </div>
  );
};