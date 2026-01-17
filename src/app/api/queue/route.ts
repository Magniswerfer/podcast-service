import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequestUnified } from "@/lib/auth-unified";
import { db } from '@/lib/db';
import { addToQueueSchema, reorderQueueSchema } from '@/types/api';

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const queue = await db.queue.findMany({
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

    return NextResponse.json({ queue });
  } catch (error) {
    console.error('Error fetching queue:', error);
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
    const validated = addToQueueSchema.parse(body);

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

    // Check if already in queue
    const existing = await db.queue.findUnique({
      where: {
        userId_episodeId: {
          userId: user.id,
          episodeId: validated.episodeId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Episode already in queue' },
        { status: 409 }
      );
    }

    // Get max position
    const maxPosition = await db.queue.findFirst({
      where: { userId: user.id },
      orderBy: { position: 'desc' },
      select: { position: true },
    });

    const newPosition = maxPosition ? maxPosition.position + 1 : 0;

    const queueItem = await db.queue.create({
      data: {
        userId: user.id,
        episodeId: validated.episodeId,
        position: newPosition,
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
    });

    // Return updated queue to avoid another API call
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

    return NextResponse.json({ queueItem, queue: updatedQueue }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    console.error('Error adding to queue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const body = await request.json();
    const validated = reorderQueueSchema.parse(body);

    // Verify all items belong to user
    const queueItems = await db.queue.findMany({
      where: {
        userId: user.id,
        id: {
          in: validated.items.map((item) => item.id),
        },
      },
    });

    if (queueItems.length !== validated.items.length) {
      return NextResponse.json(
        { error: 'Some queue items not found or not owned by user' },
        { status: 403 }
      );
    }

    // Update positions in a transaction
    await db.$transaction(
      validated.items.map((item) =>
        db.queue.update({
          where: { id: item.id },
          data: { position: item.position },
        })
      )
    );

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

    return NextResponse.json({ queue: updatedQueue });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    console.error('Error reordering queue:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
