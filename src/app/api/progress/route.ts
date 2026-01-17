import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequestUnified } from "@/lib/auth-unified";
import { db } from '@/lib/db';
import { bulkProgressUpdateSchema, progressUpdateSchema } from '@/types/api';

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const progress = await db.listeningHistory.findMany({
      where: { userId: user.id },
      include: {
        episode: {
          include: {
            podcast: {
              select: {
                id: true,
                title: true,
                artworkUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        lastUpdatedAt: 'desc',
      },
    });

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const body = await request.json();
    const validated = bulkProgressUpdateSchema.parse(body);

    const results = [];

    for (const update of validated.updates) {
      // Verify episode exists and user has access (is subscribed)
      const episode = await db.episode.findUnique({
        where: { id: update.episodeId },
        include: {
          podcast: {
            include: {
              subscriptions: {
                where: { userId: user.id },
                select: { id: true },
              },
            },
          },
        },
      });

      if (!episode) {
        results.push({
          episodeId: update.episodeId,
          success: false,
          error: 'Episode not found',
        });
        continue;
      }

      if (episode.podcast.subscriptions.length === 0) {
        results.push({
          episodeId: update.episodeId,
          success: false,
          error: 'Not subscribed to this podcast',
        });
        continue;
      }

      // Get or create listening history
      const existing = await db.listeningHistory.findUnique({
        where: {
          userId_episodeId: {
            userId: user.id,
            episodeId: update.episodeId,
          },
        },
      });

      const listeningSessions = existing?.listeningSessions
        ? (existing.listeningSessions as any[])
        : [];

      // Add new session if position changed significantly
      if (existing && Math.abs(existing.positionSeconds - update.positionSeconds) > 5) {
        listeningSessions.push({
          startTime: existing.lastUpdatedAt.toISOString(),
          endTime: new Date().toISOString(),
          positionStart: existing.positionSeconds,
          positionEnd: update.positionSeconds,
        });
      }

      const history = await db.listeningHistory.upsert({
        where: {
          userId_episodeId: {
            userId: user.id,
            episodeId: update.episodeId,
          },
        },
        create: {
          userId: user.id,
          episodeId: update.episodeId,
          positionSeconds: update.positionSeconds,
          durationSeconds: update.durationSeconds,
          completed: update.completed || false,
          listeningSessions: listeningSessions.length > 0 ? listeningSessions : undefined,
        },
        update: {
          positionSeconds: update.positionSeconds,
          durationSeconds: update.durationSeconds,
          completed: update.completed ?? undefined,
          listeningSessions: listeningSessions.length > 0 ? listeningSessions : undefined,
          lastUpdatedAt: new Date(),
        },
      });

      results.push({
        episodeId: update.episodeId,
        success: true,
        progress: history,
      });
    }

    return NextResponse.json({ results });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
