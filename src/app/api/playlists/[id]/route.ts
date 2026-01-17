import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequestUnified } from '@/lib/auth-unified';
import { db } from '@/lib/db';
import { updatePlaylistSchema } from '@/types/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { id } = await params;
    const playlist = await db.playlist.findUnique({
      where: { id },
      include: {
        items: {
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
          orderBy: {
            position: 'asc',
          },
        },
      },
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

    return NextResponse.json({ playlist });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = updatePlaylistSchema.parse(body);

    // Check if playlist exists and belongs to user
    const existingPlaylist = await db.playlist.findUnique({
      where: { id },
    });

    if (!existingPlaylist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    if (existingPlaylist.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const playlist = await db.playlist.update({
      where: { id },
      data: {
        name: validated.name,
        description: validated.description,
      },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    return NextResponse.json({ playlist });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    console.error('Error updating playlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { id } = await params;

    // Check if playlist exists and belongs to user
    const existingPlaylist = await db.playlist.findUnique({
      where: { id },
    });

    if (!existingPlaylist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    if (existingPlaylist.userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete playlist (cascades to items)
    await db.playlist.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
