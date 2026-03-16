/**
 * Experience Decision Blocks — pairing, included-in-itineraries,
 * best-for persona, save-for-later, follow host, similar.
 */
import { Link, useNavigate } from 'react-router-dom';
import { useIncludedInItineraries, useExperienceRelationships, useFollows, useSaves } from '@/hooks/useSocialGraph';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Bookmark, UserPlus, UserCheck, ArrowRightLeft, Users, Copy,
  Sparkles, MapPin, ChevronRight, Heart, TrendingUp, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IncludedInItinerariesProps {
  experienceId: string;
}

export const IncludedInItineraries = ({ experienceId }: IncludedInItinerariesProps) => {
  const { data: itineraries = [] } = useIncludedInItineraries(experienceId);
  if (itineraries.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3">Included in itineraries</h2>
      <div className="space-y-2">
        {itineraries.slice(0, 5).map((itin: any) => (
          <Link
            key={itin.id}
            to={`/itineraries/${itin.slug}`}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-card border border-border hover:bg-muted/40 transition-colors group"
          >
            {itin.cover_image && (
              <img src={itin.cover_image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{itin.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {itin.like_count > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Heart className="w-3 h-3" /> {itin.like_count}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
};

interface PairingBlockProps {
  experienceId: string;
  onNavigate?: (id: string) => void;
}

export const PairingBlock = ({ experienceId }: PairingBlockProps) => {
  const { pairings, substitutions } = useExperienceRelationships(experienceId);
  if (pairings.length === 0 && substitutions.length === 0) return null;

  return (
    <div className="mb-6 space-y-4">
      {pairings.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Often paired with
          </h2>
          <div className="space-y-2">
            {pairings.slice(0, 4).map((p: any) => (
              <div key={p.id} className="p-3 rounded-xl bg-card border border-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium flex-1">Related experience</span>
                <Badge variant="outline" className="text-[10px]">Score: {Math.round((p.score || 1) * 100)}%</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
      {substitutions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-primary" />
            Swap alternatives
          </h2>
          <div className="space-y-2">
            {substitutions.slice(0, 3).map((s: any) => (
              <div key={s.id} className="p-3 rounded-xl bg-card border border-border flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4 text-accent-foreground" />
                </div>
                <span className="text-sm font-medium flex-1">Alternative option</span>
                <Badge variant="secondary" className="text-[10px]">Swap</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface BestForBlockProps {
  bestFor: string[];
}

export const BestForBlock = ({ bestFor }: BestForBlockProps) => {
  if (!bestFor || bestFor.length === 0) return null;

  const PERSONA_ICONS: Record<string, string> = {
    'couples': '💑',
    'solo': '🧳',
    'families': '👨‍👩‍👧‍👦',
    'friends': '👯',
    'locals': '🏠',
    'first-timers': '🌟',
    'budget': '💰',
    'luxury': '✨',
    'adventure': '🏔️',
  };

  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        Best for
      </h2>
      <div className="flex flex-wrap gap-2">
        {bestFor.map((persona) => (
          <Badge key={persona} variant="secondary" className="text-sm py-1.5 px-3 gap-1.5">
            <span>{PERSONA_ICONS[persona.toLowerCase()] || '👤'}</span>
            <span className="capitalize">{persona}</span>
          </Badge>
        ))}
      </div>
    </div>
  );
};

interface SaveFollowBarProps {
  experienceId: string;
  hostId?: string;
  hostName?: string;
}

export const SaveFollowBar = ({ experienceId, hostId, hostName }: SaveFollowBarProps) => {
  const { isAuthenticated } = useAuth();
  const { isSaved, toggleSave } = useSaves();
  const { isFollowing, toggleFollow } = useFollows();

  const saved = isSaved(experienceId, 'experience');
  const following = hostId ? isFollowing(hostId, 'host') : false;

  return (
    <div className="flex gap-2 mb-6">
      <Button
        variant={saved ? 'default' : 'outline'}
        size="sm"
        className="flex-1 gap-1.5"
        onClick={() => isAuthenticated && toggleSave(experienceId, 'experience')}
      >
        <Bookmark className={cn("w-4 h-4", saved && "fill-current")} />
        {saved ? 'Saved' : 'Save for later'}
      </Button>
      {hostId && (
        <Button
          variant={following ? 'default' : 'outline'}
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => isAuthenticated && toggleFollow(hostId, 'host')}
        >
          {following ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {following ? 'Following' : `Follow${hostName ? ` @${hostName}` : ''}`}
        </Button>
      )}
    </div>
  );
};

interface CopyRemixActionsProps {
  itineraryId?: string;
  itineraryName?: string;
  onCopy?: () => void;
}

export const CopyRemixActions = ({ itineraryId, itineraryName, onCopy }: CopyRemixActionsProps) => {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-3">Start from this</h2>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" className="gap-1.5 h-10" onClick={onCopy}>
          <Copy className="w-3.5 h-3.5" /> Copy itinerary
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 h-10">
          <Sparkles className="w-3.5 h-3.5" /> Shorten to 1 day
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 h-10">
          <Users className="w-3.5 h-3.5" /> Adjust for group
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 h-10">
          <Star className="w-3.5 h-3.5" /> Adjust by vibe
        </Button>
      </div>
    </div>
  );
};
