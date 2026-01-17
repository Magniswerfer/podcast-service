import { db } from './db';
import { parseFeed, ParsedFeed } from './rss-parser';

/**
 * Refresh a single podcast feed
 */
export async function refreshPodcastFeed(podcastId: string): Promise<{
  success: boolean;
  episodesAdded: number;
  error?: string;
}> {
  try {
    const podcast = await db.podcast.findUnique({
      where: { id: podcastId },
    });

    if (!podcast) {
      return {
        success: false,
        episodesAdded: 0,
        error: 'Podcast not found',
      };
    }

    // Parse the RSS feed
    const parsedFeed: ParsedFeed = await parseFeed(podcast.feedUrl);

    // Update podcast metadata
    await db.podcast.update({
      where: { id: podcastId },
      data: {
        title: parsedFeed.title,
        description: parsedFeed.description,
        author: parsedFeed.author,
        artworkUrl: parsedFeed.artworkUrl,
        language: parsedFeed.language,
        categories: parsedFeed.categories,
        lastFetchedAt: new Date(),
      },
    });

    // Create or update episodes
    let episodesAdded = 0;
    for (const episodeData of parsedFeed.episodes) {
      try {
        await db.episode.upsert({
          where: {
            podcastId_guid: {
              podcastId,
              guid: episodeData.guid,
            },
          },
          create: {
            podcastId,
            guid: episodeData.guid,
            title: episodeData.title,
            description: episodeData.description,
            descriptionPlain: episodeData.descriptionPlain,
            audioUrl: episodeData.audioUrl,
            durationSeconds: episodeData.durationSeconds,
            publishedAt: episodeData.publishedAt,
            artworkUrl: episodeData.artworkUrl,
            season: episodeData.season,
            episodeNumber: episodeData.episodeNumber,
          },
          update: {
            title: episodeData.title,
            description: episodeData.description,
            descriptionPlain: episodeData.descriptionPlain,
            audioUrl: episodeData.audioUrl,
            durationSeconds: episodeData.durationSeconds,
            publishedAt: episodeData.publishedAt,
            artworkUrl: episodeData.artworkUrl,
            season: episodeData.season,
            episodeNumber: episodeData.episodeNumber,
          },
        });
        episodesAdded++;
      } catch (error) {
        console.error(`Failed to upsert episode ${episodeData.guid}:`, error);
        // Continue with next episode
      }
    }

    return {
      success: true,
      episodesAdded,
    };
  } catch (error) {
    return {
      success: false,
      episodesAdded: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Refresh all podcast feeds that have subscriptions
 */
export async function refreshAllFeeds(): Promise<{
  total: number;
  successful: number;
  failed: number;
  results: Array<{ podcastId: string; success: boolean; episodesAdded: number; error?: string }>;
}> {
  // Get all podcasts that have at least one subscription
  const podcasts = await db.podcast.findMany({
    where: {
      subscriptions: {
        some: {},
      },
    },
    select: {
      id: true,
    },
  });

  const results = await Promise.allSettled(
    podcasts.map((podcast) => refreshPodcastFeed(podcast.id))
  );

  const processedResults = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return {
        podcastId: podcasts[index].id,
        ...result.value,
      };
    } else {
      return {
        podcastId: podcasts[index].id,
        success: false,
        episodesAdded: 0,
        error: result.reason?.message || 'Unknown error',
      };
    }
  });

  return {
    total: podcasts.length,
    successful: processedResults.filter((r) => r.success).length,
    failed: processedResults.filter((r) => !r.success).length,
    results: processedResults,
  };
}
