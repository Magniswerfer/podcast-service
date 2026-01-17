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
    };
    
    // Only include podcastId if it's provided and not null
    if (podcastIdParam) {
      queryData.podcastId = podcastIdParam;
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

    // Build where clause
    const where: any = {
      podcastId: {
        in: subscribedPodcastIds,
      },
    };

    if (validated.podcastId) {
      // Verify user is subscribed to this podcast
      if (!subscribedPodcastIds.includes(validated.podcastId)) {
        return NextResponse.json(
          { error: 'Not subscribed to this podcast' },
          { status: 403 }
        );
      }
      where.podcastId = validated.podcastId;
    }

    if (validated.fromDate) {
      where.publishedAt = {
        ...where.publishedAt,
        gte: new Date(validated.fromDate),
      };
    }

    if (validated.toDate) {
      where.publishedAt = {
        ...where.publishedAt,
        lte: new Date(validated.toDate),
      };
    }

    // Get total count
    const total = await db.episode.count({ where });

    // Get episodes
    const episodes = await db.episode.findMany({
      where,
      include: {
        podcast: {
          select: {
            id: true,
            title: true,
            artworkUrl: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: validated.limit,
      skip: validated.offset,
    });

    return NextResponse.json({
      episodes,
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
