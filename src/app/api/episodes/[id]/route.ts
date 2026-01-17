import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequestUnified } from "@/lib/auth-unified";
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { id } = await params;
    const episodeId = id;

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
        listeningHistory: {
          where: { userId: user.id },
          select: {
            positionSeconds: true,
            durationSeconds: true,
            completed: true,
            lastUpdatedAt: true,
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

    // Check if user is subscribed to this podcast
    if (episode.podcast.subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'Not subscribed to this podcast' },
        { status: 403 }
      );
    }

    const { podcast, listeningHistory, ...episodeData } = episode;

    return NextResponse.json({
      ...episodeData,
      podcast: {
        id: podcast.id,
        title: podcast.title,
        artworkUrl: podcast.artworkUrl,
      },
      progress: listeningHistory[0] || null,
    });
  } catch (error) {
    console.error('Error fetching episode:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
