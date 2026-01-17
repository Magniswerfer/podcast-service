import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Cron job endpoint for daily cleanup tasks
 * - Archive old completed episodes (older than 1 year)
 * - Clean up orphaned data
 * 
 * For Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
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
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Archive old completed listening history (mark as archived or delete)
    // For now, we'll just log the count - actual archiving can be implemented later
    const oldCompletedCount = await db.listeningHistory.count({
      where: {
        completed: true,
        lastUpdatedAt: {
          lt: oneYearAgo,
        },
      },
    });

    // Clean up orphaned queue items (episodes that no longer exist)
    const orphanedQueueItems = await db.queue.findMany({
      where: {
        episode: null,
      },
    });

    if (orphanedQueueItems.length > 0) {
      await db.queue.deleteMany({
        where: {
          id: {
            in: orphanedQueueItems.map((item) => item.id),
          },
        },
      });
    }

    // Clean up orphaned listening history
    const orphanedHistory = await db.listeningHistory.findMany({
      where: {
        episode: null,
      },
    });

    if (orphanedHistory.length > 0) {
      await db.listeningHistory.deleteMany({
        where: {
          id: {
            in: orphanedHistory.map((h) => h.id),
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      oldCompletedEpisodes: oldCompletedCount,
      orphanedQueueItemsRemoved: orphanedQueueItems.length,
      orphanedHistoryRemoved: orphanedHistory.length,
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
