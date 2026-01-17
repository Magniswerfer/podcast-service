'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePlayer } from '@/contexts/PlayerContext';
import { QueueActions } from '@/components/QueueActions';

interface Episode {
  id: string;
  title: string;
  description?: string;
  publishedAt: string;
  durationSeconds?: number;
  artworkUrl?: string;
  audioUrl?: string;
  podcast?: {
    id: string;
    title: string;
    artworkUrl?: string;
  };
}

interface Podcast {
  id: string;
  title: string;
  description?: string;
  artworkUrl?: string;
  author?: string;
}

export default function PodcastDetailPage() {
  const params = useParams();
  const podcastId = params.id as string;
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const { playEpisode } = usePlayer();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch podcasts to get the specific podcast details
        const podcastsResponse = await fetch('/api/podcasts');
        if (!podcastsResponse.ok) {
          if (podcastsResponse.status === 401) {
            window.location.href = '/login';
            return;
          }
          throw new Error('Failed to fetch podcast');
        }
        const podcastsData = await podcastsResponse.json();
        const foundPodcast = podcastsData.podcasts?.find((p: any) => p.id === podcastId);
        
        if (!foundPodcast) {
          setLoading(false);
          return;
        }

        setPodcast({
          id: foundPodcast.id,
          title: foundPodcast.title,
          description: foundPodcast.description,
          artworkUrl: foundPodcast.artworkUrl,
          author: foundPodcast.author,
        });

        // Fetch episodes for this podcast
        const episodesResponse = await fetch(`/api/episodes?podcastId=${podcastId}`);
        if (episodesResponse.ok) {
          const episodesData = await episodesResponse.json();
          setEpisodes(episodesData.episodes || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (podcastId) {
      fetchData();
    }
  }, [podcastId]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-500 dark:text-gray-400">Podcast not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Podcast Header */}
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6 mb-8">
        <img
          src={podcast.artworkUrl || '/placeholder-artwork.png'}
          alt={podcast.title}
          className="w-48 h-48 rounded-lg object-cover flex-shrink-0"
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {podcast.title}
          </h1>
          {podcast.author && (
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">
              {podcast.author}
            </p>
          )}
          {podcast.description && (
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {podcast.description}
            </p>
          )}
          <div className="flex space-x-4">
            <button
              onClick={async () => {
                try {
                  const response = await fetch(`/api/podcasts/${podcastId}/refresh`, {
                    method: 'POST',
                  });
                  if (response.ok) {
                    // Reload episodes
                    const episodesResponse = await fetch(`/api/episodes?podcastId=${podcastId}`);
                    if (episodesResponse.ok) {
                      const episodesData = await episodesResponse.json();
                      setEpisodes(episodesData.episodes || []);
                    }
                    alert('Episodes refreshed!');
                  } else {
                    const error = await response.json();
                    alert(error.error || 'Failed to refresh episodes');
                  }
                } catch (error) {
                  console.error('Error refreshing episodes:', error);
                  alert('Failed to refresh episodes');
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh Episodes
            </button>
            <button
              onClick={async () => {
                if (!confirm('Are you sure you want to unsubscribe from this podcast?')) {
                  return;
                }
                try {
                  const response = await fetch(`/api/podcasts/${podcastId}`, {
                    method: 'DELETE',
                  });
                  if (response.ok) {
                    window.location.href = '/podcasts';
                  } else {
                    const error = await response.json();
                    alert(error.error || 'Failed to unsubscribe');
                  }
                } catch (error) {
                  console.error('Error unsubscribing:', error);
                  alert('Failed to unsubscribe');
                }
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Unsubscribe
            </button>
          </div>
        </div>
      </div>

      {/* Episodes List */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Episodes
        </h2>
        {episodes.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No episodes available</p>
        ) : (
          <div className="space-y-2">
            {episodes.map((episode) => (
              <div
                key={episode.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={episode.artworkUrl || podcast.artworkUrl || '/placeholder-artwork.png'}
                    alt={episode.title}
                    className="w-16 h-16 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                      {episode.title}
                    </h3>
                    {episode.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                        {episode.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{new Date(episode.publishedAt).toLocaleDateString()}</span>
                      {episode.durationSeconds && (
                        <span>{formatDuration(episode.durationSeconds)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                    <button
                      onClick={async () => {
                        try {
                          // Fetch full episode details to ensure we have audioUrl
                          const res = await fetch(`/api/episodes/${episode.id}`);
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
                          alert('Failed to load episode. Please try again.');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Play
                    </button>
                    <QueueActions
                      episodeId={episode.id}
                      onSuccess={() => {
                        // Optionally show success message or refresh
                      }}
                    />
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
