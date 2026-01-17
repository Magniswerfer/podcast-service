import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequestUnified } from "@/lib/auth-unified";
import { db } from '@/lib/db';
import { episodesQuerySchema } from '@/types/api';

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const podcastIdParam = searchParams.get('podcastId');
    
    // Parse query params with proper handling of null/undefined
    const queryData: any = {
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
      fromDate: searchParams.get('fromDate') || undefined,
      toDate: searchParams.get('toDate') || undefined,
      filter: searchParams.get('filter') || undefined,
      sort: searchParams.get('sort') || undefined,
    };
    
    // Only include podcastId if it's provided and not null
    if (podcastIdParam) {
      queryData.podcastId = podcastIdParam;
      
      // If filter/sort not provided, check for saved preferences in customSettings
      if (!queryData.filter || !queryData.sort) {
        const subscription = await db.subscription.findUnique({
          where: {
            userId_podcastId: {
              userId: user.id,
              podcastId: podcastIdParam,
            },
          },
          select: {
            customSettings: true,
          },
        });
        
        if (subscription?.customSettings) {
          const settings = subscription.customSettings as Record<string, unknown>;
          if (!queryData.filter && settings.episodeFilter) {
            queryData.filter = settings.episodeFilter;
          }
          if (!queryData.sort && settings.episodeSort) {
            queryData.sort = settings.episodeSort;
          }
        }
      }
    }
    
    // If filter/sort still not set, fall back to user's default settings
    if (!queryData.filter || !queryData.sort) {
      const userWithDefaults = await db.user.findUnique({
        where: { id: user.id },
        select: { defaultSettings: true },
      });
      
      if (userWithDefaults?.defaultSettings) {
        const defaults = userWithDefaults.defaultSettings as Record<string, unknown>;
        if (!queryData.filter && defaults.episodeFilter) {
          queryData.filter = defaults.episodeFilter;
        }
        if (!queryData.sort && defaults.episodeSort) {
          queryData.sort = defaults.episodeSort;
        }
      }
    }
    
    const validated = episodesQuerySchema.parse(queryData);

    // Get user's subscribed podcast IDs
    const subscriptions = await db.subscription.findMany({
      where: { userId: user.id },
      select: { podcastId: true },
    });

    const subscribedPodcastIds = subscriptions.map((s) => s.podcastId);

    if (subscribedPodcastIds.length === 0) {
      return NextResponse.json({
        episodes: [],
        total: 0,
        limit: validated.limit,
        offset: validated.offset,
      });
    }

    // Build base where clause
    const baseWhere: any = {
      podcastId: validated.podcastId 
        ? validated.podcastId 
        : {
            in: subscribedPodcastIds,
          },
    };

    // Verify user is subscribed if podcastId is provided
    if (validated.podcastId) {
      if (!subscribedPodcastIds.includes(validated.podcastId)) {
        return NextResponse.json(
          { error: 'Not subscribed to this podcast' },
          { status: 403 }
        );
      }
    }

    // Add date filters if provided
    if (validated.fromDate || validated.toDate) {
      baseWhere.publishedAt = {};
      if (validated.fromDate) {
        baseWhere.publishedAt.gte = new Date(validated.fromDate);
      }
      if (validated.toDate) {
        baseWhere.publishedAt.lte = new Date(validated.toDate);
      }
    }

    // Get all episode IDs that match the base where clause (before filtering by play status)
    const allMatchingEpisodes = await db.episode.findMany({
      where: baseWhere,
      select: {
        id: true,
      },
    });
    const allEpisodeIds = allMatchingEpisodes.map(e => e.id);

    // Get progress for all matching episodes to determine filter status
    const progressRecords = await db.listeningHistory.findMany({
      where: {
        userId: user.id,
        episodeId: {
          in: allEpisodeIds,
        },
      },
      select: {
        episodeId: true,
        positionSeconds: true,
        durationSeconds: true,
        completed: true,
      },
    });

    // Create a map of episodeId -> progress
    const progressMap = new Map(
      progressRecords.map(p => [p.episodeId, {
        positionSeconds: p.positionSeconds,
        durationSeconds: p.durationSeconds,
        completed: p.completed,
      }])
    );

    // Apply filter based on play status
    let filteredEpisodeIds = allEpisodeIds;
    if (validated.filter !== 'all') {
      filteredEpisodeIds = allEpisodeIds.filter(episodeId => {
        const progress = progressMap.get(episodeId);
        
        switch (validated.filter) {
          case 'unplayed':
            // Episodes with no listening history
            return !progress;
          case 'uncompleted':
            // Episodes that haven't been completed (no history OR not completed)
            return !progress || progress.completed === false;
          case 'in-progress':
            // Episodes that have been started but not completed
            return progress !== undefined && 
                   progress.completed === false && 
                   progress.positionSeconds > 0;
          default:
            return true;
        }
      });
    }

    // Build final where clause with filtered episode IDs
    let finalWhere: any;
    if (validated.filter !== 'all') {
      // If no episodes match the filter, return empty result
      if (filteredEpisodeIds.length === 0) {
        return NextResponse.json({
          episodes: [],
          total: 0,
          limit: validated.limit,
          offset: validated.offset,
        });
      }
      // Create new where clause with filtered IDs
      finalWhere = {
        ...baseWhere,
        id: {
          in: filteredEpisodeIds,
        },
      };
    } else {
      finalWhere = baseWhere;
    }

    // Get total count after filtering
    const total = await db.episode.count({ where: finalWhere });

    // Determine sort order
    const orderBy = validated.sort === 'oldest' 
      ? { publishedAt: 'asc' as const }
      : { publishedAt: 'desc' as const };

    // Get episodes
    const episodes = await db.episode.findMany({
      where: finalWhere,
      include: {
        podcast: {
          select: {
            id: true,
            title: true,
            artworkUrl: true,
          },
        },
      },
      orderBy,
      take: validated.limit,
      skip: validated.offset,
    });

    // Attach progress to episodes (using the progressMap we created earlier)
    const episodesWithProgress = episodes.map(episode => ({
      ...episode,
      progress: progressMap.get(episode.id) || null,
    }));

    return NextResponse.json({
      episodes: episodesWithProgress,
      total,
      limit: validated.limit,
      offset: validated.offset,
    });
  } catch (error) {
    console.error('Error fetching episodes:', error);
    
    // Check if it's a Zod validation error
    if (error && typeof error === 'object') {
      if ('name' in error && error.name === 'ZodError') {
        const zodError = error as any;
        const errors = zodError.errors?.map((e: any) => ({
          path: e.path?.join('.') || 'unknown',
          message: e.message || 'Validation error',
        }));
        console.error('Validation error details:', JSON.stringify(errors, null, 2));
        return NextResponse.json(
          { error: 'Invalid request data', details: errors },
          { status: 400 }
        );
      }
      
      // Log the full error for debugging
      if ('issues' in error) {
        console.error('Zod issues:', (error as any).issues);
        return NextResponse.json(
          { error: 'Invalid request data', details: (error as any).issues },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
