import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequestUnified } from "@/lib/auth-unified";
import { db } from '@/lib/db';
import { progressUpdateSchema } from '@/types/api';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ episode_id: string }> }
) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { episode_id } = await params;
    const episodeId = episode_id;
    const body = await request.json();
    const validated = progressUpdateSchema.parse(body);

    // Verify episode exists and user has access
    const episode = await db.episode.findUnique({
      where: { id: episodeId },
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
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      );
    }

    if (episode.podcast.subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'Not subscribed to this podcast' },
        { status: 403 }
      );
    }

    // Get existing history for session tracking
    const existing = await db.listeningHistory.findUnique({
      where: {
        userId_episodeId: {
          userId: user.id,
          episodeId,
        },
      },
    });

    const listeningSessions = existing?.listeningSessions
      ? (existing.listeningSessions as any[])
      : [];

    // Add new session if position changed significantly
    if (existing && Math.abs(existing.positionSeconds - validated.positionSeconds) > 5) {
      listeningSessions.push({
        startTime: existing.lastUpdatedAt.toISOString(),
        endTime: new Date().toISOString(),
        positionStart: existing.positionSeconds,
        positionEnd: validated.positionSeconds,
      });
    }

    const history = await db.listeningHistory.upsert({
      where: {
        userId_episodeId: {
          userId: user.id,
          episodeId,
        },
      },
      create: {
        userId: user.id,
        episodeId,
        positionSeconds: validated.positionSeconds,
        durationSeconds: validated.durationSeconds,
        completed: validated.completed || false,
        listeningSessions: listeningSessions.length > 0 ? listeningSessions : undefined,
      },
      update: {
        positionSeconds: validated.positionSeconds,
        durationSeconds: validated.durationSeconds,
        completed: validated.completed ?? undefined,
        listeningSessions: listeningSessions.length > 0 ? listeningSessions : undefined,
        lastUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({ progress: history });
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
