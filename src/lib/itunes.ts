const ITUNES_API_BASE_URL = process.env.ITUNES_API_BASE_URL || 'https://itunes.apple.com';

export interface iTunesSearchResult {
  feedUrl: string;
  collectionId: number;
  collectionName: string;
  artistName: string;
  artworkUrl100?: string;
  artworkUrl600?: string;
  genres: string[];
  country: string;
  primaryGenreName?: string;
}

// iTunes API search response (doesn't include feedUrl)
interface iTunesSearchAPIResult {
  collectionId: number;
  collectionName: string;
  artistName: string;
  artworkUrl100?: string;
  artworkUrl600?: string;
  genres?: string[];
  country: string;
  primaryGenreName?: string;
  feedUrl?: string; // Only in lookup response
}

interface iTunesSearchAPIResponse {
  results: iTunesSearchAPIResult[];
  resultCount: number;
}

/**
 * Search iTunes for podcasts
 */
export async function searchiTunesPodcasts(query: string, limit: number = 50): Promise<iTunesSearchResult[]> {
  try {
    const url = new URL(`${ITUNES_API_BASE_URL}/search`);
    url.searchParams.set('term', query);
    url.searchParams.set('media', 'podcast');
    url.searchParams.set('limit', String(limit));

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`iTunes API error: ${response.statusText}`);
    }

    const data: iTunesSearchAPIResponse = await response.json();

    // Map iTunes results to our format
    // Note: iTunes search API doesn't return feedUrl directly, so we need to do lookups
    // But we'll batch them for better performance
    const results: iTunesSearchResult[] = [];
    const collectionIds = data.results.map((r) => r.collectionId).filter(Boolean);

    // Batch lookup feed URLs (lookup multiple IDs at once)
    if (collectionIds.length > 0) {
      const lookupUrl = new URL(`${ITUNES_API_BASE_URL}/lookup`);
      lookupUrl.searchParams.set('id', collectionIds.join(','));
      lookupUrl.searchParams.set('entity', 'podcast');

      try {
        const lookupResponse = await fetch(lookupUrl.toString());
        if (lookupResponse.ok) {
          const lookupData: iTunesSearchAPIResponse = await lookupResponse.json();
          const lookupMap = new Map(
            lookupData.results.map((podcast) => [podcast.collectionId, podcast])
          );

          // Match search results with lookup results
          for (const result of data.results) {
            const podcast = lookupMap.get(result.collectionId);
            if (podcast?.feedUrl) {
              results.push({
                feedUrl: podcast.feedUrl,
                collectionId: result.collectionId,
                collectionName: result.collectionName,
                artistName: result.artistName,
                artworkUrl100: result.artworkUrl100,
                artworkUrl600: result.artworkUrl600?.replace('100x100', '600x600'),
                genres: result.genres || [],
                country: result.country,
                primaryGenreName: result.primaryGenreName,
              });
            }
          }
        }
      } catch (error) {
        console.warn('Failed to lookup feed URLs:', error);
        // Return empty results if lookup fails
      }
    }

    return results;
  } catch (error) {
    throw new Error(
      `Failed to search iTunes: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Lookup podcast by iTunes collection ID
 */
export async function lookupiTunesPodcast(collectionId: number): Promise<iTunesSearchResult | null> {
  try {
    const url = new URL(`${ITUNES_API_BASE_URL}/lookup`);
    url.searchParams.set('id', String(collectionId));
    url.searchParams.set('entity', 'podcast');

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`iTunes API error: ${response.statusText}`);
    }

    const data: iTunesSearchAPIResponse = await response.json();
    const result = data.results[0];

    if (!result?.feedUrl) {
      return null;
    }

    return {
      feedUrl: result.feedUrl,
      collectionId: result.collectionId,
      collectionName: result.collectionName,
      artistName: result.artistName,
      artworkUrl100: result.artworkUrl100,
      artworkUrl600: result.artworkUrl600?.replace('100x100', '600x600'),
      genres: result.genres || [],
      country: result.country,
      primaryGenreName: result.primaryGenreName,
    };
  } catch (error) {
    throw new Error(
      `Failed to lookup iTunes podcast: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
