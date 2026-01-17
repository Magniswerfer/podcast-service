'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  QueueListIcon,
} from '@heroicons/react/24/solid';
import { ProgressBar } from './ProgressBar';
import { Controls } from './Controls';
import { QueuePreview } from './QueuePreview';
import { usePlayer } from '@/contexts/PlayerContext';

export function Player() {
  const router = useRouter();
  const {
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    playbackRate,
    volume,
    togglePlayPause,
    skipForward,
    skipBackward,
    handleSeek,
    setPlaybackRate,
    setVolume,
  } = usePlayer();
  
  const [showQueue, setShowQueue] = useState(false);

  if (!currentEpisode) {
    return null;
  }

  const handlePlayerClick = () => {
    router.push('/player');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center space-x-4">
          {/* Episode Artwork - Clickable */}
          <div className="flex-shrink-0 cursor-pointer" onClick={handlePlayerClick}>
            <img
              src={currentEpisode.artworkUrl || currentEpisode.podcast.artworkUrl || '/placeholder-artwork.png'}
              alt={currentEpisode.title}
              className="h-16 w-16 rounded-lg object-cover"
            />
          </div>

          {/* Episode Info - Clickable */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={handlePlayerClick}>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {currentEpisode.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {currentEpisode.podcast.title}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={skipBackward}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Skip backward 15 seconds"
            >
              <BackwardIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={togglePlayPause}
              className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <PauseIcon className="h-6 w-6" />
              ) : (
                <PlayIcon className="h-6 w-6" />
              )}
            </button>
            <button
              onClick={skipForward}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Skip forward 15 seconds"
            >
              <ForwardIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 max-w-md">
            <ProgressBar
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
            />
          </div>

          {/* Speed & Volume Controls */}
          <Controls
            playbackRate={playbackRate}
            onPlaybackRateChange={setPlaybackRate}
            volume={volume}
            onVolumeChange={setVolume}
          />

          {/* Queue Toggle */}
          <button
            onClick={() => setShowQueue(!showQueue)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Show queue"
          >
            <QueueListIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {showQueue && <QueuePreview onClose={() => setShowQueue(false)} />}
    </div>
  );
}
