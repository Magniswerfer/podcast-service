import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequestUnified } from '@/lib/auth-unified';
import { db } from '@/lib/db';
import { parseFeed } from '@/lib/rss-parser';
import { subscribeSchema } from '@/types/api';
import { refreshPodcastFeed } from '@/lib/feed-refresh';

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const body = await request.json();
    const validated = subscribeSchema.parse(body);

    // Check if podcast already exists
    let podcast = await db.podcast.findUnique({
      where: { feedUrl: validated.feedUrl },
    });

    if (!podcast) {
      // Parse the feed to get metadata
      const parsedFeed = await parseFeed(validated.feedUrl);

      // Create podcast
      podcast = await db.podcast.create({
        data: {
          feedUrl: validated.feedUrl,
          title: parsedFeed.title,
          description: parsedFeed.description,
          author: parsedFeed.author,
          artworkUrl: parsedFeed.artworkUrl,
          language: parsedFeed.language,
          categories: parsedFeed.categories,
          lastFetchedAt: new Date(),
        },
      });

      // Create episodes
      for (const episodeData of parsedFeed.episodes) {
        try {
          await db.episode.create({
            data: {
              podcastId: podcast.id,
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
          });
        } catch (error) {
          // Skip duplicate episodes
          console.warn(`Skipping duplicate episode: ${episodeData.guid}`);
        }
      }
    } else {
      // Refresh feed if podcast exists but hasn't been fetched recently
      const hoursSinceLastFetch =
        podcast.lastFetchedAt
          ? (Date.now() - podcast.lastFetchedAt.getTime()) / (1000 * 60 * 60)
          : Infinity;

      if (hoursSinceLastFetch > 6) {
        await refreshPodcastFeed(podcast.id);
      }
    }

    // Check if already subscribed
    const existingSubscription = await db.subscription.findUnique({
      where: {
        userId_podcastId: {
          userId: user.id,
          podcastId: podcast.id,
        },
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Already subscribed to this podcast' },
        { status: 409 }
      );
    }

    // Create subscription
    const subscription = await db.subscription.create({
      data: {
        userId: user.id,
        podcastId: podcast.id,
      },
      include: {
        podcast: {
          include: {
            _count: {
              select: {
                episodes: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        podcast: {
          ...subscription.podcast,
          subscribedAt: subscription.subscribedAt,
          customSettings: subscription.customSettings,
          episodeCount: subscription.podcast._count.episodes,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    console.error('Subscribe error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
