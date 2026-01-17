'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Episode {
  id: string;
  title: string;
  description?: string;
  publishedAt: string;
  artworkUrl?: string;
  podcast: {
    id: string;
    title: string;
    artworkUrl?: string;
  };
}

interface Progress {
  episodeId: string;
  positionSeconds: number;
  completed: boolean;
  lastUpdatedAt: string;
}

export default function Dashboard() {
  const [recentEpisodes, setRecentEpisodes] = useState<Episode[]>([]);
  const [newEpisodes, setNewEpisodes] = useState<Episode[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch podcasts to get recent episodes
        const podcastsResponse = await fetch('/api/podcasts');
        if (!podcastsResponse.ok) {
          if (podcastsResponse.status === 401) {
            window.location.href = '/login';
            return;
          }
          throw new Error('Failed to fetch podcasts');
        }
        const podcastsData = await podcastsResponse.json();

        // Fetch episodes
        const episodesResponse = await fetch('/api/episodes?limit=10');
        if (episodesResponse.ok) {
          const episodesData = await episodesResponse.json();
          setNewEpisodes(episodesData.episodes || []);
        }

        // Fetch recently played (from progress)
        const progressResponse = await fetch('/api/progress');
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          const recent = (progressData.progress || [])
            .sort((a: any, b: any) => 
              new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime()
            )
            .slice(0, 6)
            .map((p: any) => p.episode);
          setRecentEpisodes(recent);
        }

        // Fetch stats
        const statsResponse = await fetch('/api/stats/dashboard');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.stats);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Dashboard
      </h1>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Listening Time</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatTime(stats.totalListeningTimeSeconds || 0)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Episodes Completed</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalEpisodesCompleted || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalEpisodesInProgress || 0}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Subscribed</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.totalPodcastsSubscribed || 0}
            </p>
          </div>
        </div>
      )}

      {/* Recently Played */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Recently Played
        </h2>
        {recentEpisodes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No recent episodes</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentEpisodes.map((episode) => (
              <Link
                key={episode.id}
                href={`/podcasts/${episode.podcast.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition p-4"
              >
                <div className="flex space-x-4">
                  <img
                    src={episode.artworkUrl || episode.podcast.artworkUrl || '/placeholder-artwork.png'}
                    alt={episode.title}
                    className="h-20 w-20 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {episode.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {episode.podcast.title}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New Episodes */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          New Episodes
        </h2>
        {newEpisodes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No new episodes</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newEpisodes.map((episode) => (
              <Link
                key={episode.id}
                href={`/podcasts/${episode.podcast.id}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition p-4"
              >
                <div className="flex space-x-4">
                  <img
                    src={episode.artworkUrl || episode.podcast.artworkUrl || '/placeholder-artwork.png'}
                    alt={episode.title}
                    className="h-20 w-20 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {episode.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {episode.podcast.title}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(episode.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
