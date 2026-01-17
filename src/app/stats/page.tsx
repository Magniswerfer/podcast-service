'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';

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
    const fetchStats = async () => {
      try {
        const statsResponse = await fetch('/api/stats/dashboard');
        if (!statsResponse.ok) {
          if (statsResponse.status === 401) {
            window.location.href = '/login';
            return;
          }
          throw new Error('Failed to fetch stats');
        }
        const statsData = await statsResponse.json();
        if (statsData.stats) {
          setStats(statsData.stats);
        } else {
          console.error('Stats data is missing from API response:', statsData);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatTime = (seconds: number) => {
    if (!seconds || seconds === 0) {
      return '0s';
    }
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
    return `${secs}s`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-[#a0a0a0]">Loading...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-[#a0a0a0]">No stats available</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">
        Listening Statistics
      </h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card hover={false} className="p-6">
          <p className="text-sm text-[#a0a0a0] mb-2">Total Listening Time</p>
          <p className="text-2xl font-bold text-white">
            {formatTime(stats.totalListeningTimeSeconds)}
          </p>
        </Card>
        <Card hover={false} className="p-6">
          <p className="text-sm text-[#a0a0a0] mb-2">Episodes Completed</p>
          <p className="text-2xl font-bold text-white">
            {stats.totalEpisodesCompleted}
          </p>
        </Card>
        <Card hover={false} className="p-6">
          <p className="text-sm text-[#a0a0a0] mb-2">In Progress</p>
          <p className="text-2xl font-bold text-white">
            {stats.totalEpisodesInProgress}
          </p>
        </Card>
        <Card hover={false} className="p-6">
          <p className="text-sm text-[#a0a0a0] mb-2">Subscribed</p>
          <p className="text-2xl font-bold text-white">
            {stats.totalPodcastsSubscribed}
          </p>
        </Card>
      </div>

      {/* Average Daily Listening */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-2">
          Average Daily Listening Time
        </h2>
        <p className="text-3xl font-bold text-[#FF3B30]">
          {formatTime(stats.averageDailyListeningTimeSeconds)}
        </p>
      </Card>

      {/* Top Podcasts */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Top Podcasts
        </h2>
        {stats.topPodcasts.length === 0 ? (
          <p className="text-[#a0a0a0]">No data available</p>
        ) : (
          <div className="space-y-4">
            {stats.topPodcasts.map((podcast, index) => (
              <div key={podcast.podcastId} className="flex items-center space-x-4 p-3 rounded-[12px] hover:bg-[#252525] transition-colors">
                <span className={`text-2xl font-bold w-8 ${
                  index === 0 ? 'text-[#FF3B30]' : 'text-[#a0a0a0]'
                }`}>
                  {index + 1}
                </span>
                <div className="flex-1">
                  <h3 className="font-medium text-white">
                    {podcast.podcastTitle}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-[#a0a0a0] mt-1">
                    <span>{formatTime(podcast.listeningTimeSeconds)}</span>
                    <span>•</span>
                    <span>{podcast.episodesCompleted} episodes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
