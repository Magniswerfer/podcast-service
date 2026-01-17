import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequestUnified } from '@/lib/auth-unified';
import { db } from '@/lib/db';
import { createPlaylistSchema } from '@/types/api';

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const playlists = await db.playlist.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json({ playlists });
  } catch (error) {
    console.error('Error fetching playlists:', error);
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
    const validated = createPlaylistSchema.parse(body);

    const playlist = await db.playlist.create({
      data: {
        userId: user.id,
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

    return NextResponse.json({ playlist }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    console.error('Error creating playlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
