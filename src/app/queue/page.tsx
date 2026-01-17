'use client';

import { useEffect, useState } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';

interface QueueItem {
  id: string;
  episodeId: string;
  episode: {
    id: string;
    title: string;
    audioUrl: string;
    artworkUrl?: string;
    podcast: {
      id: string;
      title: string;
      artworkUrl?: string;
    };
  };
  position: number;
}

export default function QueuePage() {
  const { queue, loadQueue, playEpisode, currentEpisode } = usePlayer();
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    // Only load if queue is empty (PlayerContext already loads on mount)
    if (queue.length === 0) {
      const fetchQueue = async () => {
        await loadQueue();
        setLoading(false);
      };
      fetchQueue();
    } else {
      setLoading(false);
    }
  }, []); // Empty dependency array - only run on mount

  const handlePlay = async (queueItem: QueueItem) => {
    try {
      await playEpisode({
        id: queueItem.episode.id,
        title: queueItem.episode.title,
        audioUrl: queueItem.episode.audioUrl,
        artworkUrl: queueItem.episode.artworkUrl,
        podcast: {
          id: queueItem.episode.podcast.id,
          title: queueItem.episode.podcast.title,
          artworkUrl: queueItem.episode.podcast.artworkUrl,
        },
      });
    } catch (error) {
      console.error('Error playing episode:', error);
      alert('Failed to play episode. Please try again.');
    }
  };

  const handleRemove = async (queueItemId: string) => {
    setRemoving(queueItemId);
    try {
      const response = await fetch(`/api/queue/${queueItemId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        // Optimistically update queue by removing the item
        // The PlayerContext will sync on next loadQueue call
        await loadQueue();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to remove from queue');
      }
    } catch (error) {
      console.error('Error removing from queue:', error);
      alert('Failed to remove from queue. Please try again.');
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Queue
      </h1>

      {queue.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Your queue is empty</p>
          <a
            href="/discover"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Discover podcasts
          </a>
        </div>
      ) : (
        <div className="space-y-2">
          {queue.map((item) => {
            const isCurrentlyPlaying = currentEpisode?.id === item.episode.id;
            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition ${
                  isCurrentlyPlaying ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-gray-400 dark:text-gray-500 font-mono w-8">
                    {item.position + 1}
                  </span>
                  <img
                    src={item.episode.artworkUrl || item.episode.podcast.artworkUrl || '/placeholder-artwork.png'}
                    alt={item.episode.title}
                    className="h-16 w-16 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {item.episode.title}
                      {isCurrentlyPlaying && (
                        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                          (Now Playing)
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {item.episode.podcast.title}
                    </p>
                  </div>
                  <button
                    onClick={() => handlePlay(item)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isCurrentlyPlaying}
                  >
                    {isCurrentlyPlaying ? 'Playing' : 'Play'}
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={removing === item.id}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {removing === item.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
