import { NextRequest, NextResponse } from 'next/server';
import { refreshAllFeeds } from '@/lib/feed-refresh';

/**
 * Cron job endpoint to refresh all podcast feeds
 * Should be called every 6 hours
 * 
 * For Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/refresh-feeds",
 *     "schedule": "0 */6 * * *"
 *   }]
 * }
 * 
 * For external cron services, protect with a secret header:
 * Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: NextRequest) {
  // Optional: Add authentication for cron jobs
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const result = await refreshAllFeeds();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error refreshing feeds:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
