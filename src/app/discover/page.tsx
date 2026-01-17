'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface SearchResult {
  feedUrl: string;
  collectionName: string;
  artistName: string;
  artworkUrl100?: string;
  artworkUrl600?: string;
}

export default function DiscoverPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedUrl, setFeedUrl] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Try to fetch user data - if session exists, this will work
      const response = await fetch('/api/podcasts');
      setIsAuthenticated(response.ok);
      if (!response.ok && response.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/podcasts/search?q=${encodeURIComponent(searchQuery)}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Search failed');
      }

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      alert(error instanceof Error ? error.message : 'Failed to search podcasts');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribeByUrl = async () => {
    if (!feedUrl.trim()) return;

    try {
      const response = await fetch('/api/podcasts/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feedUrl: feedUrl.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Subscribe failed');
      }

      alert('Successfully subscribed!');
      setFeedUrl('');
      // Optionally redirect to podcasts page
      window.location.href = '/podcasts';
    } catch (error) {
      console.error('Subscribe error:', error);
      alert(error instanceof Error ? error.message : 'Failed to subscribe');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Discover Podcasts
      </h1>

      {/* Add by URL */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Add Podcast by URL
        </h2>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Enter RSS feed URL..."
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleSubscribeByUrl}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Subscribe
          </button>
        </div>
      </div>

      {/* iTunes Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Search iTunes
        </h2>
        <div className="flex space-x-4 mb-6">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for podcasts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((result, index) => (
              <div
                key={index}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-lg transition"
              >
                <img
                  src={result.artworkUrl600 || result.artworkUrl100 || '/placeholder-artwork.png'}
                  alt={result.collectionName}
                  className="w-full aspect-square rounded-lg object-cover mb-3"
                />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {result.collectionName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  {result.artistName}
                </p>
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/podcasts/subscribe', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ feedUrl: result.feedUrl }),
                      });

                      if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.error || 'Subscribe failed');
                      }

                      alert('Successfully subscribed!');
                      window.location.href = '/podcasts';
                    } catch (error) {
                      console.error('Subscribe error:', error);
                      alert(error instanceof Error ? error.message : 'Failed to subscribe');
                    }
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Subscribe
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
