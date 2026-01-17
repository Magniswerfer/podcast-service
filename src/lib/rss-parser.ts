import Parser from 'rss-parser';
import DOMPurify from 'isomorphic-dompurify';

const parser = new Parser({
  customFields: {
    item: [
      ['itunes:duration', 'itunesDuration'],
      ['itunes:episode', 'itunesEpisode'],
      ['itunes:season', 'itunesSeason'],
      ['itunes:image', 'itunesImage', { keepArray: false }],
      ['enclosure', 'enclosure', { keepArray: false }],
      ['content:encoded', 'contentEncoded'],
      ['itunes:summary', 'itunesSummary'],
    ],
    feed: [
      ['itunes:image', 'itunesImage', { keepArray: false }],
      ['itunes:category', 'itunesCategories', { keepArray: true }],
    ],
  },
});

export interface ParsedFeed {
  title: string;
  description?: string;
  author?: string;
  artworkUrl?: string;
  language?: string;
  categories: string[];
  episodes: ParsedEpisode[];
}

export interface ParsedEpisode {
  guid: string;
  title: string;
  description?: string;
  descriptionPlain?: string;
  audioUrl: string;
  durationSeconds?: number;
  publishedAt: Date;
  artworkUrl?: string;
  season?: number;
  episodeNumber?: number;
}

/**
 * Parse duration string (e.g., "01:23:45" or "1234") to seconds
 */
function parseDuration(duration: string | undefined): number | undefined {
  if (!duration) return undefined;

  // Handle format like "01:23:45" or "23:45"
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  // Handle numeric string (seconds)
  const seconds = parseInt(duration, 10);
  return isNaN(seconds) ? undefined : seconds;
}

/**
 * Strip HTML tags from text and return plain text
 */
function stripHtml(html: string | undefined): string | undefined {
  if (!html) return undefined;
  // Use DOMPurify to strip all HTML tags
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] }).trim();
}

/**
 * Extract artwork URL from various sources
 * Handles different formats: string, object with href, object with $.href
 */
function extractArtworkUrl(item: any, feed: any): string | undefined {
  // Helper to extract URL from various formats
  const extractUrl = (value: any): string | undefined => {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    if (value.href) return value.href;
    if (value.$?.href) return value.$.href;
    if (value.url) return value.url;
    return undefined;
  };

  // Try itunes:image from item
  const itemArtwork = extractUrl(item.itunesImage);
  if (itemArtwork) return itemArtwork;

  // Try feed-level artwork
  const feedArtwork = extractUrl(feed.itunesImage);
  if (feedArtwork) return feedArtwork;

  // Try image tag
  if (item.image?.url) return item.image.url;
  if (feed.image?.url) return feed.image.url;

  return undefined;
}

/**
 * Parse RSS feed from URL
 */
export async function parseFeed(feedUrl: string): Promise<ParsedFeed> {
  try {
    const feed = await parser.parseURL(feedUrl);

    const episodes: ParsedEpisode[] = (feed.items || []).map((item) => {
      const guid = item.guid || item.id || item.link || '';
      const audioUrl = item.enclosure?.url || item.link || '';
      const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
      
      // Get HTML description (prioritize contentEncoded, then content, then others)
      const htmlDescription = item.contentEncoded || item.content || item.itunesSummary || item.summary || item.description;
      // Extract plain text version
      const plainDescription = stripHtml(htmlDescription);

      return {
        guid,
        title: item.title || 'Untitled Episode',
        description: htmlDescription,
        descriptionPlain: plainDescription,
        audioUrl,
        durationSeconds: parseDuration(item.itunesDuration),
        publishedAt,
        artworkUrl: extractArtworkUrl(item, feed),
        season: item.itunesSeason ? parseInt(String(item.itunesSeason), 10) : undefined,
        episodeNumber: item.itunesEpisode
          ? parseInt(String(item.itunesEpisode), 10)
          : undefined,
      };
    });

    // Extract categories
    const categories: string[] = [];
    if (feed.itunesCategories) {
      for (const cat of feed.itunesCategories) {
        if (typeof cat === 'string') {
          categories.push(cat);
        } else if (cat._) {
          categories.push(cat._);
        }
      }
    }

    // Extract feed artwork - handle various formats
    const extractFeedArtworkUrl = (feed: any): string | undefined => {
      if (!feed.itunesImage) {
        return feed.image?.url;
      }
      if (typeof feed.itunesImage === 'string') {
        return feed.itunesImage;
      }
      if (feed.itunesImage.href) {
        return feed.itunesImage.href;
      }
      if (feed.itunesImage.$?.href) {
        return feed.itunesImage.$.href;
      }
      return feed.image?.url;
    };

    const artworkUrl = extractFeedArtworkUrl(feed);

    return {
      title: feed.title || 'Untitled Podcast',
      description: feed.description,
      author: feed.itunes?.author || feed.creator || feed.managingEditor,
      artworkUrl,
      language: feed.language,
      categories,
      episodes,
    };
  } catch (error) {
    throw new Error(`Failed to parse RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
