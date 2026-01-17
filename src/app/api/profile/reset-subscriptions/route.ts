import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequestUnified } from '@/lib/auth-unified';
import { db } from '@/lib/db';

/**
 * POST /api/profile/reset-subscriptions
 * Delete all subscriptions, queue items, and listening history for the user
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    // Use a transaction to ensure all deletions are atomic
    const result = await db.$transaction(async (tx) => {
      // Delete all queue items
      const deletedQueue = await tx.queue.deleteMany({
        where: { userId: user.id },
      });

      // Delete all listening history
      const deletedHistory = await tx.listeningHistory.deleteMany({
        where: { userId: user.id },
      });

      // Delete all favorites
      const deletedFavorites = await tx.favorite.deleteMany({
        where: { userId: user.id },
      });

      // Delete all playlist items first (due to foreign key)
      const userPlaylists = await tx.playlist.findMany({
        where: { userId: user.id },
        select: { id: true },
      });
      const playlistIds = userPlaylists.map(p => p.id);

      const deletedPlaylistItems = await tx.playlistItem.deleteMany({
        where: { playlistId: { in: playlistIds } },
      });

      // Delete all playlists
      const deletedPlaylists = await tx.playlist.deleteMany({
        where: { userId: user.id },
      });

      // Delete all subscriptions
      const deletedSubscriptions = await tx.subscription.deleteMany({
        where: { userId: user.id },
      });

      return {
        subscriptions: deletedSubscriptions.count,
        queue: deletedQueue.count,
        history: deletedHistory.count,
        favorites: deletedFavorites.count,
        playlists: deletedPlaylists.count,
        playlistItems: deletedPlaylistItems.count,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'All subscriptions and related data have been reset',
      deleted: result,
    });
  } catch (error) {
    console.error('Reset subscriptions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
