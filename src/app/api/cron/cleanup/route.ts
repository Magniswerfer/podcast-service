import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Cron job endpoint for daily cleanup tasks
// - Archive old completed episodes (older than 1 year)
// - Clean up orphaned data
// 
// For Vercel Cron: Add to vercel.json with path "/api/cron/cleanup"
// and schedule daily at 2 AM
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

    // Count old completed listening history (older than 1 year)
    // Note: Actual deletion/archiving can be implemented if needed
    const oldCompletedCount = await db.listeningHistory.count({
      where: {
        completed: true,
        lastUpdatedAt: {
          lt: oneYearAgo,
        },
      },
    });

    // Note: Orphaned queue items and listening history are automatically
    // cleaned up by Prisma's onDelete: Cascade when episodes are deleted.
    // No manual cleanup needed.

    return NextResponse.json({
      success: true,
      oldCompletedEpisodes: oldCompletedCount,
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
