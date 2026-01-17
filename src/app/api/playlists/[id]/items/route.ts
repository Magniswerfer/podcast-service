import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequestUnified } from '@/lib/auth-unified';
import { db } from '@/lib/db';
import { addPlaylistItemSchema } from '@/types/api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = addPlaylistItemSchema.parse(body);

    // Check if playlist exists and belongs to user
    const playlist = await db.playlist.findUnique({
      where: { id },
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    if (playlist.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Check if item already exists in playlist
    const existingItem = await db.playlistItem.findFirst({
      where: {
        playlistId: id,
        ...(validated.podcastId ? { podcastId: validated.podcastId } : {}),
        ...(validated.episodeId ? { episodeId: validated.episodeId } : {}),
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: 'Item already in playlist' },
        { status: 409 }
      );
    }

    // Determine position (if not provided, append to end)
    let position = validated.position;
    if (position === undefined) {
      const maxPosition = await db.playlistItem.findFirst({
        where: { playlistId: id },
        orderBy: { position: 'desc' },
        select: { position: true },
      });
      position = maxPosition ? maxPosition.position + 1 : 0;
    } else {
      // Shift existing items at or after this position
      const itemsToShift = await db.playlistItem.findMany({
        where: {
          playlistId: id,
          position: { gte: position },
        },
        select: { id: true },
      });

      // Update each item's position in a transaction
      await db.$transaction(async (tx) => {
        await Promise.all(
          itemsToShift.map((item) =>
            tx.playlistItem.update({
              where: { id: item.id },
              data: {
                position: { increment: 1 },
              },
            })
          )
        );
      });
    }

    // Create the item
    const item = await db.playlistItem.create({
      data: {
        playlistId: id,
        podcastId: validated.podcastId || null,
        episodeId: validated.episodeId || null,
        position,
      },
      include: {
        podcast: true,
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

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    console.error('Error adding playlist item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
