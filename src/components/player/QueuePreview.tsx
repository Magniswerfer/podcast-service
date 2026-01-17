'use client';

import { usePlayer } from '@/contexts/PlayerContext';

interface QueuePreviewProps {
  onClose: () => void;
}

export function QueuePreview({ onClose }: QueuePreviewProps) {
  const { queue, playEpisode, currentEpisode } = usePlayer();

  return (
    <div className="absolute bottom-full left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg max-h-96 overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Queue</h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Close
          </button>
        </div>
        {queue.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Queue is empty</p>
        ) : (
          <ul className="space-y-2">
            {queue.map((item) => {
              const isCurrentlyPlaying = currentEpisode?.id === item.episode.id;
              return (
                <li
                  key={item.id}
                  onClick={() => {
                    if (!isCurrentlyPlaying) {
                      playEpisode({
                        id: item.episode.id,
                        title: item.episode.title,
                        audioUrl: item.episode.audioUrl,
                        artworkUrl: item.episode.artworkUrl,
                        podcast: {
                          id: item.episode.podcast.id,
                          title: item.episode.podcast.title,
                          artworkUrl: item.episode.podcast.artworkUrl,
                        },
                      });
                    }
                  }}
                  className={`flex items-center space-x-3 p-2 rounded cursor-pointer transition ${
                    isCurrentlyPlaying
                      ? 'bg-blue-100 dark:bg-blue-900'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <img
                    src={
                      item.episode.artworkUrl ||
                      item.episode.podcast.artworkUrl ||
                      '/placeholder-artwork.png'
                    }
                    alt={item.episode.title}
                    className="h-12 w-12 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.episode.title}
                      {isCurrentlyPlaying && (
                        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                          (Playing)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {item.episode.podcast.title}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
