import { logger } from './logger';

interface ScrapedMetadata {
  videoId: string;
  directMediaUrl: string;
  caption: string;
  hashtags: string[];
  soundTrackId?: string;
  musicTitle?: string;
  engagement: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  author: {
    handle: string;
    followerCount: number;
    verified: boolean;
  };
  uploadTimestamp: Date;
  duration: number;
  resolution: {
    width: number;
    height: number;
  };
  enrichedData?: {
    topicEntities: string[];
    hashtagTrendScores: Record<string, number>;
    creatorNiche: string;
    audioTrend: 'rising' | 'stable' | 'declining';
  };
}

export class SocialMediaScraper {
  static async scrapeTikTok(url: string): Promise<ScrapedMetadata> {
    try {
      // Clean and normalize the TikTok URL first
      const cleanUrl = this.cleanTikTokUrl(url);
      logger.debug('Starting TikTok scrape for URL');
      
      // Extract video ID from TikTok URL
      const videoId = this.extractTikTokVideoId(cleanUrl);
      logger.debug('Extracted TikTok video ID');

      // Try multiple CORS proxy services with the clean URL
      const proxies = [
        `https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent(cleanUrl)}`,
        `https://proxy.cors.sh/${cleanUrl}`,
        `https://cors-anywhere.herokuapp.com/${cleanUrl}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(cleanUrl)}`
      ];

      let html = '';
      let lastError = '';

      for (const proxyUrl of proxies) {
        try {
          logger.debug('Trying proxy');
          const response = await fetch(proxyUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          logger.debug('Proxy response status:', response.status);
          
          if (!response.ok) {
            lastError = `Proxy request failed: ${response.status}`;
            continue;
          }

          // Handle different proxy response formats
          if (proxyUrl.includes('corsproxy.io') || proxyUrl.includes('cors.sh')) {
            html = await response.text();
          } else {
            const proxyData = await response.json();
            html = proxyData.contents || proxyData.data || proxyData;
          }
          
          logger.debug('Received HTML length:', html.length);
          
          if (html && html.length > 1000 && !html.includes('blocked') && !html.includes('captcha')) {
            break;
          } else {
            lastError = 'TikTok page blocked, requires captcha, or insufficient content';
            logger.debug('HTML contains blocking indicators or too short');
          }
        } catch (err) {
          lastError = `Proxy error: ${err instanceof Error ? err.message : 'Unknown error'}`;
          logger.debug('Proxy failed');
          continue;
        }
      }

      if (!html || html.length < 1000) {
        throw new Error(`All proxies failed. Last error: ${lastError}`);
      }

      return this.parseTikTokFromHtml(html, videoId, cleanUrl);
    } catch (error) {
      logger.error('Error scraping TikTok:', error);
      throw new Error(`Failed to scrape TikTok video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static cleanTikTokUrl(url: string): string {
    // Remove query parameters and ensure clean TikTok URL format
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
  }

  private static extractTikTokVideoId(url: string): string {
    const match = url.match(/\/video\/(\d+)/);
    return match ? match[1] : Date.now().toString();
  }

  private static parseTikTokFromHtml(html: string, videoId: string, url: string): ScrapedMetadata {
    try {
      logger.debug('Parsing TikTok HTML for hidden JSON data');
      
      // Look for the hidden JSON data script that Scrapfly method uses
      const scriptMatch = html.match(/<script[^>]*id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)<\/script>/s);
      let metadata: Record<string, unknown> = {};
      
      if (scriptMatch) {
        try {
          const jsonData = JSON.parse(scriptMatch[1]);
          const videoDetail = jsonData?.__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct;
          
          if (videoDetail) {
            logger.debug('Found video detail data in hidden JSON');
            metadata = {
              caption: videoDetail.desc || '',
              hashtags: this.extractHashtagsFromText(videoDetail.desc || ''),
              authorHandle: `@${videoDetail.author?.uniqueId || 'unknown'}`,
              followerCount: videoDetail.authorStats?.followerCount || 0,
              verified: videoDetail.author?.verified || false,
              likes: videoDetail.stats?.diggCount || 0,
              comments: videoDetail.stats?.commentCount || 0,
              shares: videoDetail.stats?.shareCount || 0,
              views: videoDetail.stats?.playCount || 0,
              duration: videoDetail.video?.duration || 0,
              musicTitle: videoDetail.music?.title || '',
              uploadDate: videoDetail.createTime ? new Date(videoDetail.createTime * 1000) : new Date()
            };
          }
        } catch {
          logger.debug('Failed to parse hidden JSON, falling back to HTML parsing');
        }
      }
      
      // Fallback to regular HTML parsing if JSON parsing fails
      if (!metadata.caption) {
        metadata = this.extractMetadataFromHtml(html, 'tiktok');
      }
      
      const topicEntities = this.extractTopicEntities((metadata.caption as string) || '');
      logger.debug('Extracted topic entities');
      
      return {
        videoId,
        directMediaUrl: url,
        caption: (metadata.caption as string) || '',
        hashtags: (metadata.hashtags as string[]) || [],
        soundTrackId: metadata.soundId as string | undefined,
        musicTitle: metadata.musicTitle as string | undefined,
        engagement: {
          views: (metadata.views as number) || 0,
          likes: (metadata.likes as number) || 0,
          comments: (metadata.comments as number) || 0,
          shares: (metadata.shares as number) || 0
        },
        author: {
          handle: (metadata.authorHandle as string) || '@unknown',
          followerCount: (metadata.followerCount as number) || 0,
          verified: (metadata.verified as boolean) || false
        },
        uploadTimestamp: (metadata.uploadDate as Date) || new Date(),
        duration: (metadata.duration as number) || 30,
        resolution: { width: 1080, height: 1920 },
        enrichedData: {
          topicEntities,
          hashtagTrendScores: this.calculateTrendScores((metadata.hashtags as string[]) || []),
          creatorNiche: this.classifyCreatorNiche((metadata.caption as string) || '', (metadata.hashtags as string[]) || []),
          audioTrend: 'stable' as const
        }
      };
    } catch (error) {
      logger.error('Failed to parse TikTok HTML');
      throw new Error('Unable to extract metadata from TikTok video');
    }
  }

  private static extractMetadataFromHtml(html: string, platform: 'tiktok') {
    const metadata: Record<string, unknown> = {};

    try {
      // Extract title/caption
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        metadata.caption = titleMatch[1].trim();
      }

      // Extract hashtags from caption or meta tags
      const hashtagMatches = html.match(/#[\w]+/g);
      if (hashtagMatches) {
        metadata.hashtags = hashtagMatches.map(tag => tag.substring(1));
      }

      // Extract author information
      if (platform === 'tiktok') {
        const authorMatch = html.match(/@[\w.]+/);
        if (authorMatch) {
          metadata.authorHandle = authorMatch[0];
        }
      } else {
        const authorMatch = html.match(/"username":"([^"]+)"/);
        if (authorMatch) {
          metadata.authorHandle = `@${authorMatch[1]}`;
        }
      }

      // Extract engagement metrics from JSON-LD or meta tags
      const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/);
      if (jsonLdMatch) {
        try {
          const jsonData = JSON.parse(jsonLdMatch[1]);
          if (jsonData.interactionStatistic) {
            jsonData.interactionStatistic.forEach((stat: { interactionType?: string; userInteractionCount?: number }) => {
              if (stat.interactionType?.includes('LikeAction')) {
                metadata.likes = parseInt(String(stat.userInteractionCount)) || 0;
              } else if (stat.interactionType?.includes('CommentAction')) {
                metadata.comments = parseInt(String(stat.userInteractionCount)) || 0;
              } else if (stat.interactionType?.includes('ShareAction')) {
                metadata.shares = parseInt(String(stat.userInteractionCount)) || 0;
              }
            });
          }
        } catch {
          logger.debug('Failed to parse JSON-LD data');
        }
      }

      return metadata;
    } catch (error) {
      logger.error('Error extracting metadata from HTML');
      return {};
    }
  }

  private static extractTopicEntities(caption: string): string[] {
    const entities = new Set<string>();
    
    // Clean and normalize the caption
    const cleanCaption = caption.toLowerCase().replace(/[^\w\s#@]/g, ' ');
    const words = cleanCaption.split(/\s+/).filter(word => word.length > 2);
    
    logger.debug('Analyzing caption for topics');
    
    // Enhanced keyword matching with more specific patterns
    const keywordCategories: Record<string, string[]> = {
      'business networking': [
        'business', 'corporate', 'networking', 'professional', 'conference', 
        'meeting', 'office', 'work', 'entrepreneur', 'startup', 'company',
        'career', 'leadership', 'strategy', 'innovation', 'industry',
        'partnership', 'collaboration', 'investment', 'finance', 'commerce'
      ],
      'tourism and travel': [
        'travel', 'vacation', 'beach', 'adventure', 'safari', 'culture', 
        'explore', 'tourist', 'destination', 'journey', 'trip', 'holiday',
        'island', 'mountain', 'ocean', 'city', 'country', 'hotel', 'resort',
        'sightseeing', 'backpacking', 'cruise', 'flight', 'passport'
      ],
      'food and culinary': [
        'food', 'cooking', 'restaurant', 'chef', 'recipe', 'meal', 'eat',
        'cuisine', 'dish', 'kitchen', 'dining', 'taste', 'delicious',
        'spice', 'ingredient', 'menu', 'gourmet', 'foodie'
      ],
      'entertainment': [
        'party', 'music', 'dance', 'fun', 'entertainment', 'celebration',
        'festival', 'concert', 'show', 'performance', 'nightlife', 'club',
        'dj', 'band', 'artist', 'comedy', 'theater'
      ],
      'wildlife and nature': [
        'wildlife', 'nature', 'animal', 'forest', 'park', 'conservation',
        'environment', 'eco', 'green', 'sustainable', 'natural', 'outdoor'
      ]
    };
    
    // Score each category based on keyword matches
    const categoryScores: Record<string, number> = {};
    
    for (const [category, keywords] of Object.entries(keywordCategories)) {
      let score = 0;
      keywords.forEach(keyword => {
        const matches = words.filter(word => 
          word.includes(keyword) || keyword.includes(word)
        ).length;
        score += matches;
      });
      
      if (score > 0) {
        categoryScores[category] = score;
        logger.debug(`Category "${category}" scored ${score} points`);
      }
    }
    
    // Add categories that scored above threshold
    Object.entries(categoryScores)
      .filter(([_, score]) => score > 0)
      .sort(([_, a], [__, b]) => b - a) // Sort by score
      .slice(0, 3) // Take top 3 categories
      .forEach(([category]) => entities.add(category));
    
    // If no specific categories found, try to infer from context
    if (entities.size === 0) {
      if (words.some(w => w.includes('tech') || w.includes('digital') || w.includes('innovation'))) {
        entities.add('business networking');
      } else if (words.some(w => w.includes('event') || w.includes('social'))) {
        entities.add('entertainment');
      }
    }
    
    const result = Array.from(entities);
    logger.debug('Final extracted entities:', result);
    return result;
  }

  private static calculateTrendScores(hashtags: string[]): Record<string, number> {
    const scores: Record<string, number> = {};
    hashtags.forEach(tag => {
      scores[tag] = Math.random() * 0.8 + 0.2; // Random score between 0.2-1.0
    });
    return scores;
  }

  private static classifyCreatorNiche(caption: string, hashtags: string[]): string {
    const content = (caption + ' ' + hashtags.join(' ')).toLowerCase();
    
    if (content.includes('business') || content.includes('corporate') || content.includes('networking')) {
      return 'Business & Professional';
    } else if (content.includes('travel') || content.includes('tourism') || content.includes('adventure')) {
      return 'Travel & Tourism';
    } else if (content.includes('food') || content.includes('cooking') || content.includes('restaurant')) {
      return 'Food & Culinary';
    } else if (content.includes('party') || content.includes('music') || content.includes('dance')) {
      return 'Entertainment & Lifestyle';
    }
    
    return 'General Content';
  }

  private static processTikTokData(data: Record<string, unknown>, videoId: string): ScrapedMetadata {
    // Process actual TikTok API response
    const video = data.video as Record<string, unknown> | undefined;
    const statistics = data.statistics as Record<string, unknown> | undefined;
    const author = data.author as Record<string, unknown> | undefined;
    const music = data.music as Record<string, unknown> | undefined;
    
    return {
      videoId,
      directMediaUrl: ((video?.play_addr as Record<string, unknown>)?.url_list as string[])?.[0] || '',
      caption: (data.desc as string) || '',
      hashtags: this.extractHashtagsFromText((data.desc as string) || ''),
      soundTrackId: music?.id?.toString(),
      musicTitle: music?.title as string | undefined,
      engagement: {
        views: (statistics?.play_count as number) || 0,
        likes: (statistics?.digg_count as number) || 0,
        comments: (statistics?.comment_count as number) || 0,
        shares: (statistics?.share_count as number) || 0
      },
      author: {
        handle: `@${(author?.unique_id as string) || 'unknown'}`,
        followerCount: (author?.follower_count as number) || 0,
        verified: (author?.verification_type as number) === 1
      },
      uploadTimestamp: new Date((data.create_time as number) * 1000),
      duration: (video?.duration as number) || 0,
      resolution: {
        width: (video?.width as number) || 1080,
        height: (video?.height as number) || 1920
      },
      enrichedData: {
        topicEntities: this.extractTopicEntities((data.desc as string) || ''),
        hashtagTrendScores: this.calculateTrendScores(this.extractHashtagsFromText((data.desc as string) || '')),
        creatorNiche: this.classifyCreatorNiche((data.desc as string) || '', this.extractHashtagsFromText((data.desc as string) || '')),
        audioTrend: 'stable' as const
      }
    };
  }

  private static processInstagramData(data: Record<string, unknown>, postId: string): ScrapedMetadata {
    // Process actual Instagram API response
    const caption = data.caption as Record<string, unknown> | undefined;
    const user = data.user as Record<string, unknown> | undefined;
    
    return {
      videoId: postId,
      directMediaUrl: (data.video_url as string) || '',
      caption: (caption?.text as string) || '',
      hashtags: this.extractHashtagsFromText((caption?.text as string) || ''),
      musicTitle: (data.music as Record<string, unknown>)?.title as string | undefined,
      engagement: {
        views: (data.video_view_count as number) || 0,
        likes: (data.like_count as number) || 0,
        comments: (data.comment_count as number) || 0,
        shares: 0 // Instagram doesn't expose share count
      },
      author: {
        handle: `@${(user?.username as string) || 'unknown'}`,
        followerCount: (user?.follower_count as number) || 0,
        verified: (user?.is_verified as boolean) || false
      },
      uploadTimestamp: new Date((data.taken_at as number) * 1000),
      duration: (data.video_duration as number) || 0,
      resolution: {
        width: (data.original_width as number) || 1080,
        height: (data.original_height as number) || 1920
      },
      enrichedData: {
        topicEntities: this.extractTopicEntities((caption?.text as string) || ''),
        hashtagTrendScores: this.calculateTrendScores(this.extractHashtagsFromText((caption?.text as string) || '')),
        creatorNiche: this.classifyCreatorNiche((caption?.text as string) || '', this.extractHashtagsFromText((caption?.text as string) || '')),
        audioTrend: 'stable' as const
      }
    };
  }

  private static extractHashtagsFromText(text: string): string[] {
    const matches = text.match(/#[\w]+/g);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }
}
