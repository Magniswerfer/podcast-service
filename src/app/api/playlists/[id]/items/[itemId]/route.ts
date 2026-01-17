import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequestUnified } from '@/lib/auth-unified';
import { db } from '@/lib/db';
import { updatePlaylistItemPositionSchema } from '@/types/api';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { id, itemId } = await params;
    const body = await request.json();
    const validated = updatePlaylistItemPositionSchema.parse(body);

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

    // Check if item exists and belongs to this playlist
    const item = await db.playlistItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.playlistId !== id) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    const oldPosition = item.position;
    const newPosition = validated.position;

    if (oldPosition === newPosition) {
      // No change needed
      const updatedItem = await db.playlistItem.findUnique({
        where: { id: itemId },
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
      return NextResponse.json({ item: updatedItem });
    }

    // Use transaction to reorder items
    await db.$transaction(async (tx) => {
      if (newPosition > oldPosition) {
        // Moving down: shift items between old and new positions up
        const itemsToShift = await tx.playlistItem.findMany({
          where: {
            playlistId: id,
            position: { gt: oldPosition, lte: newPosition },
          },
          select: { id: true },
        });

        await Promise.all(
          itemsToShift.map((item) =>
            tx.playlistItem.update({
              where: { id: item.id },
              data: { position: { decrement: 1 } },
            })
          )
        );
      } else {
        // Moving up: shift items between new and old positions down
        const itemsToShift = await tx.playlistItem.findMany({
          where: {
            playlistId: id,
            position: { gte: newPosition, lt: oldPosition },
          },
          select: { id: true },
        });

        await Promise.all(
          itemsToShift.map((item) =>
            tx.playlistItem.update({
              where: { id: item.id },
              data: { position: { increment: 1 } },
            })
          )
        );
      }

      // Update the item's position
      await tx.playlistItem.update({
        where: { id: itemId },
        data: { position: newPosition },
      });
    });

    const updatedItem = await db.playlistItem.findUnique({
      where: { id: itemId },
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

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    console.error('Error updating playlist item position:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { id, itemId } = await params;

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

    // Check if item exists and belongs to this playlist
    const item = await db.playlistItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.playlistId !== id) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    const position = item.position;

    // Use transaction to remove item and reorder
    await db.$transaction(async (tx) => {
      // Delete the item
      await tx.playlistItem.delete({
        where: { id: itemId },
      });

      // Shift items after this position up
      const itemsToShift = await tx.playlistItem.findMany({
        where: {
          playlistId: id,
          position: { gt: position },
        },
        select: { id: true },
      });

      await Promise.all(
        itemsToShift.map((item) =>
          tx.playlistItem.update({
            where: { id: item.id },
            data: { position: { decrement: 1 } },
          })
        )
      );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting playlist item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
