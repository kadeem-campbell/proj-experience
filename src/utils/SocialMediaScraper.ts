
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
      console.log('Starting TikTok scrape for cleaned URL:', cleanUrl);
      
      // Extract video ID from TikTok URL
      const videoId = this.extractTikTokVideoId(cleanUrl);
      console.log('Extracted TikTok video ID:', videoId);

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
          console.log('Trying proxy:', proxyUrl);
          const response = await fetch(proxyUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          console.log('Proxy response status:', response.status);
          
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
          
          console.log('Received HTML length:', html.length);
          console.log('HTML preview (first 500 chars):', html.substring(0, 500));
          
          if (html && html.length > 1000 && !html.includes('blocked') && !html.includes('captcha')) {
            break;
          } else {
            lastError = 'TikTok page blocked, requires captcha, or insufficient content';
            console.log('HTML contains blocking indicators or too short');
          }
        } catch (err) {
          lastError = `Proxy error: ${err instanceof Error ? err.message : 'Unknown error'}`;
          console.log('Proxy failed with error:', lastError);
          continue;
        }
      }

      if (!html || html.length < 1000) {
        throw new Error(`All proxies failed. Last error: ${lastError}`);
      }

      return this.parseTikTokFromHtml(html, videoId, cleanUrl);
    } catch (error) {
      console.error('Error scraping TikTok:', error);
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
      console.log('Parsing TikTok HTML for hidden JSON data...');
      
      // Look for the hidden JSON data script that Scrapfly method uses
      const scriptMatch = html.match(/<script[^>]*id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)<\/script>/s);
      let metadata: any = {};
      
      if (scriptMatch) {
        try {
          const jsonData = JSON.parse(scriptMatch[1]);
          const videoDetail = jsonData?.__DEFAULT_SCOPE__?.['webapp.video-detail']?.itemInfo?.itemStruct;
          
          if (videoDetail) {
            console.log('Found video detail data in hidden JSON');
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
        } catch (e) {
          console.log('Failed to parse hidden JSON, falling back to HTML parsing');
        }
      }
      
      // Fallback to regular HTML parsing if JSON parsing fails
      if (!metadata.caption) {
        metadata = this.extractMetadataFromHtml(html, 'tiktok');
      }
      
      const topicEntities = this.extractTopicEntities(metadata.caption || '');
      console.log('Extracted topic entities:', topicEntities);
      
      return {
        videoId,
        directMediaUrl: url,
        caption: metadata.caption || '',
        hashtags: metadata.hashtags || [],
        soundTrackId: metadata.soundId,
        musicTitle: metadata.musicTitle,
        engagement: {
          views: metadata.views || 0,
          likes: metadata.likes || 0,
          comments: metadata.comments || 0,
          shares: metadata.shares || 0
        },
        author: {
          handle: metadata.authorHandle || '@unknown',
          followerCount: metadata.followerCount || 0,
          verified: metadata.verified || false
        },
        uploadTimestamp: metadata.uploadDate || new Date(),
        duration: metadata.duration || 30,
        resolution: { width: 1080, height: 1920 },
        enrichedData: {
          topicEntities,
          hashtagTrendScores: this.calculateTrendScores(metadata.hashtags || []),
          creatorNiche: this.classifyCreatorNiche(metadata.caption || '', metadata.hashtags || []),
          audioTrend: 'stable' as const
        }
      };
    } catch (error) {
      console.error('Failed to parse TikTok HTML:', error);
      throw new Error('Unable to extract metadata from TikTok video');
    }
  }

  private static extractMetadataFromHtml(html: string, platform: 'tiktok') {
    const metadata: any = {};

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
            jsonData.interactionStatistic.forEach((stat: any) => {
              if (stat.interactionType?.includes('LikeAction')) {
                metadata.likes = parseInt(stat.userInteractionCount) || 0;
              } else if (stat.interactionType?.includes('CommentAction')) {
                metadata.comments = parseInt(stat.userInteractionCount) || 0;
              } else if (stat.interactionType?.includes('ShareAction')) {
                metadata.shares = parseInt(stat.userInteractionCount) || 0;
              }
            });
          }
        } catch (e) {
          console.log('Failed to parse JSON-LD data');
        }
      }

      return metadata;
    } catch (error) {
      console.error('Error extracting metadata from HTML:', error);
      return {};
    }
  }

  private static extractTopicEntities(caption: string): string[] {
    const entities = new Set<string>();
    
    // Clean and normalize the caption
    const cleanCaption = caption.toLowerCase().replace(/[^\w\s#@]/g, ' ');
    const words = cleanCaption.split(/\s+/).filter(word => word.length > 2);
    
    console.log('Analyzing caption for topics:', caption);
    console.log('Words found:', words);
    
    // Enhanced keyword matching with more specific patterns
    const keywordCategories = {
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
        console.log(`Category "${category}" scored ${score} points`);
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
    console.log('Final extracted entities:', result);
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

  private static processTikTokData(data: any, videoId: string): ScrapedMetadata {
    // Process actual TikTok API response
    return {
      videoId,
      directMediaUrl: data.video?.play_addr?.url_list?.[0] || '',
      caption: data.desc || '',
      hashtags: this.extractHashtagsFromText(data.desc || ''),
      soundTrackId: data.music?.id?.toString(),
      musicTitle: data.music?.title,
      engagement: {
        views: data.statistics?.play_count || 0,
        likes: data.statistics?.digg_count || 0,
        comments: data.statistics?.comment_count || 0,
        shares: data.statistics?.share_count || 0
      },
      author: {
        handle: `@${data.author?.unique_id || 'unknown'}`,
        followerCount: data.author?.follower_count || 0,
        verified: data.author?.verification_type === 1
      },
      uploadTimestamp: new Date(data.create_time * 1000),
      duration: data.video?.duration || 0,
      resolution: {
        width: data.video?.width || 1080,
        height: data.video?.height || 1920
      },
      enrichedData: {
        topicEntities: this.extractTopicEntities(data.desc || ''),
        hashtagTrendScores: this.calculateTrendScores(this.extractHashtagsFromText(data.desc || '')),
        creatorNiche: this.classifyCreatorNiche(data.desc || '', this.extractHashtagsFromText(data.desc || '')),
        audioTrend: 'stable' as const
      }
    };
  }

  private static processInstagramData(data: any, postId: string): ScrapedMetadata {
    // Process actual Instagram API response
    return {
      videoId: postId,
      directMediaUrl: data.video_url || '',
      caption: data.caption?.text || '',
      hashtags: this.extractHashtagsFromText(data.caption?.text || ''),
      musicTitle: data.music?.title,
      engagement: {
        views: data.video_view_count || 0,
        likes: data.like_count || 0,
        comments: data.comment_count || 0,
        shares: 0 // Instagram doesn't expose share count
      },
      author: {
        handle: `@${data.user?.username || 'unknown'}`,
        followerCount: data.user?.follower_count || 0,
        verified: data.user?.is_verified || false
      },
      uploadTimestamp: new Date(data.taken_at * 1000),
      duration: data.video_duration || 0,
      resolution: {
        width: data.original_width || 1080,
        height: data.original_height || 1920
      },
      enrichedData: {
        topicEntities: this.extractTopicEntities(data.caption?.text || ''),
        hashtagTrendScores: this.calculateTrendScores(this.extractHashtagsFromText(data.caption?.text || '')),
        creatorNiche: this.classifyCreatorNiche(data.caption?.text || '', this.extractHashtagsFromText(data.caption?.text || '')),
        audioTrend: 'stable' as const
      }
    };
  }

  private static extractHashtagsFromText(text: string): string[] {
    const matches = text.match(/#[\w]+/g);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }
}
