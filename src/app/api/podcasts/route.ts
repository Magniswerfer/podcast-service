import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequestUnified } from '@/lib/auth-unified';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const subscriptions = await db.subscription.findMany({
      where: { userId: user.id },
      include: {
        podcast: {
          include: {
            _count: {
              select: {
                episodes: true,
              },
            },
          },
        },
      },
      orderBy: {
        subscribedAt: 'desc',
      },
    });

    const podcasts = subscriptions.map((sub) => ({
      ...sub.podcast,
      subscribedAt: sub.subscribedAt,
      customSettings: sub.customSettings,
      episodeCount: sub.podcast._count.episodes,
    }));

    return NextResponse.json({ podcasts });
  } catch (error) {
    console.error('Error fetching podcasts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
