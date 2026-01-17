'use client';

import { useEffect, useState } from 'react';

interface DashboardStats {
  totalListeningTimeSeconds: number;
  totalEpisodesCompleted: number;
  totalEpisodesInProgress: number;
  totalPodcastsSubscribed: number;
  averageDailyListeningTimeSeconds: number;
  topPodcasts: Array<{
    podcastId: string;
    podcastTitle: string;
    listeningTimeSeconds: number;
    episodesCompleted: number;
  }>;
}

export default function StatsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch stats from API
    setLoading(false);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-500 dark:text-gray-400">No stats available</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Listening Statistics
      </h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Listening Time</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatTime(stats.totalListeningTimeSeconds)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Episodes Completed</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalEpisodesCompleted}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalEpisodesInProgress}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Subscribed</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats.totalPodcastsSubscribed}
          </p>
        </div>
      </div>

      {/* Average Daily Listening */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Average Daily Listening Time
        </h2>
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {formatTime(stats.averageDailyListeningTimeSeconds)}
        </p>
      </div>

      {/* Top Podcasts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Top Podcasts
        </h2>
        {stats.topPodcasts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        ) : (
          <div className="space-y-4">
            {stats.topPodcasts.map((podcast, index) => (
              <div key={podcast.podcastId} className="flex items-center space-x-4">
                <span className="text-2xl font-bold text-gray-400 dark:text-gray-500 w-8">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {podcast.podcastTitle}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span>{formatTime(podcast.listeningTimeSeconds)}</span>
                    <span>•</span>
                    <span>{podcast.episodesCompleted} episodes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
