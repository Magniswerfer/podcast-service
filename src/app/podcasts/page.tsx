'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Podcast {
  id: string;
  title: string;
  description?: string;
  artworkUrl?: string;
  author?: string;
  episodeCount?: number;
}

export default function PodcastsPage() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        const response = await fetch('/api/podcasts');
        if (!response.ok) {
          if (response.status === 401) {
            // Redirect to login if not authenticated
            window.location.href = '/login';
            return;
          }
          throw new Error('Failed to fetch podcasts');
        }
        const data = await response.json();
        setPodcasts(data.podcasts || []);
      } catch (error) {
        console.error('Error fetching podcasts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPodcasts();
  }, []);

  const filteredPodcasts = podcasts.filter((podcast) =>
    podcast.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Podcasts
        </h1>
        <Link
          href="/discover"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add Podcast
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search podcasts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* Podcast Grid */}
      {filteredPodcasts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery ? 'No podcasts found' : 'No podcasts subscribed yet'}
          </p>
          <Link
            href="/discover"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Discover podcasts
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredPodcasts.map((podcast) => (
            <Link
              key={podcast.id}
              href={`/podcasts/${podcast.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition p-4"
            >
              <img
                src={podcast.artworkUrl || '/placeholder-artwork.png'}
                alt={podcast.title}
                className="w-full aspect-square rounded-lg object-cover mb-3"
              />
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {podcast.title}
              </h3>
              {podcast.author && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {podcast.author}
                </p>
              )}
              {podcast.episodeCount !== undefined && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {podcast.episodeCount} episodes
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
