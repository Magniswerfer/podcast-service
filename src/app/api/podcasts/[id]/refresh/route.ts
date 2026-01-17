import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequestUnified } from "@/lib/auth-unified";
import { db } from '@/lib/db';
import { refreshPodcastFeed } from '@/lib/feed-refresh';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { id } = await params;
    const podcastId = id;

    // Verify subscription exists
    const subscription = await db.subscription.findUnique({
      where: {
        userId_podcastId: {
          userId: user.id,
          podcastId,
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Refresh feed
    const result = await refreshPodcastFeed(podcastId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to refresh feed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      episodesAdded: result.episodesAdded,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
