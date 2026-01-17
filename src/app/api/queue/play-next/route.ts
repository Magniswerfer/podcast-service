import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequestUnified } from "@/lib/auth-unified";
import { db } from '@/lib/db';
import { addToQueueSchema } from '@/types/api';

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const body = await request.json();
    const validated = addToQueueSchema.parse(body);
    const currentEpisodeId = (body as any).currentEpisodeId as string | undefined;

    // Verify episode exists and user has access
    const episode = await db.episode.findUnique({
      where: { id: validated.episodeId },
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

    // Check if already in queue - if so, remove it first to re-add at play-next position
    const existing = await db.queue.findUnique({
      where: {
        userId_episodeId: {
          userId: user.id,
          episodeId: validated.episodeId,
        },
      },
    });

    if (existing) {
      // Remove existing entry so we can add it at the play-next position
      await db.queue.delete({
        where: { id: existing.id },
      });
    }

    // Get current queue to find insertion point
    const queue = await db.queue.findMany({
      where: { userId: user.id },
      orderBy: { position: 'asc' },
      select: { id: true, episodeId: true, position: true },
    });

    // Find the currently playing episode position
    let insertPosition = 0;
    if (currentEpisodeId) {
      const currentItem = queue.find((item) => item.episodeId === currentEpisodeId);
      if (currentItem) {
        insertPosition = currentItem.position + 1;
      }
    }

    // Shift all items at or after insertPosition down by 1
    const itemsToShift = queue.filter((item) => item.position >= insertPosition);
    
    await db.$transaction([
      // Update positions of existing items
      ...itemsToShift.map((item) =>
        db.queue.update({
          where: { id: item.id },
          data: { position: item.position + 1 },
        })
      ),
      // Create new queue item at insertPosition
      db.queue.create({
        data: {
          userId: user.id,
          episodeId: validated.episodeId,
          position: insertPosition,
        },
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
      }),
    ]);

    // Return updated queue
    const updatedQueue = await db.queue.findMany({
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
        position: 'asc',
      },
    });

    // Get progress for all episodes in queue
    const episodeIds = updatedQueue.map(item => item.episodeId);
    const progressRecords = await db.listeningHistory.findMany({
      where: {
        userId: user.id,
        episodeId: {
          in: episodeIds,
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

    // Attach progress to queue items
    const queueWithProgress = updatedQueue.map(item => ({
      ...item,
      episode: {
        ...item.episode,
        progress: progressMap.get(item.episodeId) || null,
      },
    }));

    const newQueueItem = queueWithProgress.find((item) => item.episodeId === validated.episodeId);

    return NextResponse.json(
      {
        queueItem: newQueueItem,
        queue: queueWithProgress,
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

    console.error('Error adding to play next:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
