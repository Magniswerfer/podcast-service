'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { PlayIcon } from '@heroicons/react/24/solid';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/Tooltip';
import { usePlayer } from '@/contexts/PlayerContext';
import { AlertModal } from '@/components/AlertModal';
import { formatDate, useDateFormat } from '@/lib/date-format';

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
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const { playEpisode } = usePlayer();
  const userDateFormat = useDateFormat();

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

  const handlePlayEpisode = async (e: React.MouseEvent, episodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch(`/api/episodes/${episodeId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch episode');
      }
      const data = await res.json();
      await playEpisode({
        id: data.id,
        title: data.title,
        audioUrl: data.audioUrl,
        artworkUrl: data.artworkUrl,
        podcast: {
          id: data.podcast.id,
          title: data.podcast.title,
          artworkUrl: data.podcast.artworkUrl,
        },
      });
    } catch (error) {
      console.error('Error fetching episode:', error);
      setAlertMessage('Failed to load episode. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-[#a0a0a0]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">
        Dashboard
      </h1>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-8">
          <Card hover={false} className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-[#a0a0a0] mb-1 sm:mb-2">Total Listening Time</p>
            <p className="text-lg sm:text-2xl font-bold text-white">
              {formatTime(stats.totalListeningTimeSeconds || 0)}
            </p>
          </Card>
          <Card hover={false} className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-[#a0a0a0] mb-1 sm:mb-2">Episodes Completed</p>
            <p className="text-lg sm:text-2xl font-bold text-white">
              {stats.totalEpisodesCompleted || 0}
            </p>
          </Card>
          <Card hover={false} className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-[#a0a0a0] mb-1 sm:mb-2">In Progress</p>
            <p className="text-lg sm:text-2xl font-bold text-white">
              {stats.totalEpisodesInProgress || 0}
            </p>
          </Card>
          <Card hover={false} className="p-4 sm:p-6">
            <p className="text-xs sm:text-sm text-[#a0a0a0] mb-1 sm:mb-2">Subscribed</p>
            <p className="text-lg sm:text-2xl font-bold text-white">
              {stats.totalPodcastsSubscribed || 0}
            </p>
          </Card>
        </div>
      )}

      {/* Recently Played */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-white mb-6">
          Recently Played
        </h2>
        {recentEpisodes.length === 0 ? (
          <p className="text-[#a0a0a0]">No recent episodes</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {recentEpisodes.map((episode) => (
              <Link
                key={episode.id}
                href={`/podcasts/${episode.podcast.id}`}
              >
                <Card interactive className="p-3 sm:p-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <img
                      src={episode.artworkUrl || episode.podcast.artworkUrl || '/placeholder-artwork.png'}
                      alt={episode.title}
                      className="h-14 w-14 sm:h-20 sm:w-20 rounded-[12px] object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate text-sm sm:text-base">
                        {episode.title}
                      </p>
                      <p className="text-xs sm:text-sm text-[#a0a0a0] truncate">
                        {episode.podcast.title}
                      </p>
                    </div>
                    <div className="flex items-center shrink-0">
                      <Tooltip content="Play" position="left">
                        <Button
                          variant="icon"
                          size="sm"
                          onClick={(e) => handlePlayEpisode(e, episode.id)}
                        >
                          <PlayIcon className="h-5 w-5" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* New Episodes */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-6">
          New Episodes
        </h2>
        {newEpisodes.length === 0 ? (
          <p className="text-[#a0a0a0]">No new episodes</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {newEpisodes.map((episode) => (
              <Link
                key={episode.id}
                href={`/podcasts/${episode.podcast.id}`}
              >
                <Card interactive className="p-3 sm:p-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <img
                      src={episode.artworkUrl || episode.podcast.artworkUrl || '/placeholder-artwork.png'}
                      alt={episode.title}
                      className="h-14 w-14 sm:h-20 sm:w-20 rounded-[12px] object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate text-sm sm:text-base">
                        {episode.title}
                      </p>
                      <p className="text-xs sm:text-sm text-[#a0a0a0] truncate">
                        {episode.podcast.title}
                      </p>
                      <p className="text-xs text-[#a0a0a0] mt-1">
                        {formatDate(episode.publishedAt, userDateFormat)}
                      </p>
                    </div>
                    <div className="flex items-center shrink-0">
                      <Tooltip content="Play" position="left">
                        <Button
                          variant="icon"
                          size="sm"
                          onClick={(e) => handlePlayEpisode(e, episode.id)}
                        >
                          <PlayIcon className="h-5 w-5" />
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {alertMessage && (
        <AlertModal
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
          title="Error"
        />
      )}
    </div>
  );
}
