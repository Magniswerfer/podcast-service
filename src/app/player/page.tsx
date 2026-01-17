'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlayer } from '@/contexts/PlayerContext';
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
} from '@heroicons/react/24/solid';
import { ProgressBar } from '@/components/player/ProgressBar';
import { Controls } from '@/components/player/Controls';
import { Shownotes } from '@/components/player/Shownotes';

export default function PlayerPage() {
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

  const [episodeDetails, setEpisodeDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentEpisode) {
      router.push('/');
      return;
    }

    // Fetch full episode details including description
    const fetchEpisodeDetails = async () => {
      try {
        const response = await fetch(`/api/episodes/${currentEpisode.id}`);
        if (response.ok) {
          const data = await response.json();
          setEpisodeDetails(data);
        }
      } catch (error) {
        console.error('Error fetching episode details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodeDetails();
  }, [currentEpisode, router]);

  if (!currentEpisode) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section with Artwork */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Artwork */}
            <div className="flex-shrink-0">
              <img
                src={
                  currentEpisode.artworkUrl ||
                  currentEpisode.podcast.artworkUrl ||
                  '/placeholder-artwork.png'
                }
                alt={currentEpisode.title}
                className="w-64 h-64 md:w-80 md:h-80 rounded-lg shadow-2xl object-cover"
              />
            </div>

            {/* Episode Info */}
            <div className="flex-1 text-center md:text-left">
              <Link
                href={`/podcasts/${currentEpisode.podcast.id}`}
                className="text-sm text-gray-300 hover:text-white mb-2 inline-block"
              >
                {currentEpisode.podcast.title}
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {currentEpisode.title}
              </h1>
              {episodeDetails?.publishedAt && (
                <p className="text-gray-300 text-sm mb-4">
                  {new Date(episodeDetails.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
              {episodeDetails?.durationSeconds && (
                <p className="text-gray-300 text-sm">
                  Duration: {formatTime(episodeDetails.durationSeconds)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Player Controls Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          {/* Progress Bar */}
          <div className="mb-6">
            <ProgressBar
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
            />
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <button
              onClick={skipBackward}
              className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="Skip backward 15 seconds"
            >
              <BackwardIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
            <button
              onClick={togglePlayPause}
              className="p-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <PauseIcon className="h-8 w-8" />
              ) : (
                <PlayIcon className="h-8 w-8" />
              )}
            </button>
            <button
              onClick={skipForward}
              className="p-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="Skip forward 15 seconds"
            >
              <ForwardIcon className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </button>
          </div>

          {/* Speed & Volume Controls */}
          <div className="flex justify-center">
            <Controls
              playbackRate={playbackRate}
              onPlaybackRateChange={setPlaybackRate}
              volume={volume}
              onVolumeChange={setVolume}
            />
          </div>
        </div>

        {/* Shownotes Section */}
        {episodeDetails?.description && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Shownotes
            </h2>
            <Shownotes content={episodeDetails.description} />
          </div>
        )}
      </div>
    </div>
  );
}
