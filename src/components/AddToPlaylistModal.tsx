'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { PlaylistModal } from './PlaylistModal';

interface Playlist {
  id: string;
  name: string;
  description?: string;
  _count?: {
    items: number;
  };
}

interface AddToPlaylistModalProps {
  onClose: () => void;
  onAddToPlaylist: (playlistId: string) => Promise<void>;
  onCreatePlaylist: (name: string, description?: string) => Promise<Playlist>;
  podcastId?: string;
  episodeId?: string;
  targetPlaylistId?: string; // If provided, adds directly to this playlist
}

export function AddToPlaylistModal({
  onClose,
  onAddToPlaylist,
  onCreatePlaylist,
  targetPlaylistId,
}: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const response = await fetch('/api/playlists');
      if (!response.ok) {
        throw new Error('Failed to fetch playlists');
      }
      const data = await response.json();
      setPlaylists(data.playlists || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    setAddingToPlaylist(playlistId);
    setError(null);
    try {
      await onAddToPlaylist(playlistId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to playlist');
    } finally {
      setAddingToPlaylist(null);
    }
  };

  const handleCreatePlaylist = async (name: string, description?: string) => {
    const newPlaylist = await onCreatePlaylist(name, description);
    setPlaylists((prev) => [newPlaylist, ...prev]);
    setShowCreateModal(false);
    // Automatically add to the newly created playlist
    await handleAddToPlaylist(newPlaylist.id);
  };

  if (showCreateModal) {
    return (
      <PlaylistModal
        onClose={() => setShowCreateModal(false)}
        onSave={handleCreatePlaylist}
        title="Create New Playlist"
      />
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <Card className="w-full max-w-md p-6 relative pointer-events-auto max-h-[80vh] flex flex-col">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#a0a0a0] hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <h2 className="text-xl font-semibold text-white mb-4 pr-8">
            Add to Playlist
          </h2>

          {error && (
            <div className="mb-4 text-sm text-[#FF3B30]">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center text-[#a0a0a0] py-8">
              Loading playlists...
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                  className="w-full"
                >
                  <PlusIcon className="h-5 w-5 mr-2 inline" />
                  Create New Playlist
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto mb-4">
                {playlists.length === 0 ? (
                  <div className="text-center text-[#a0a0a0] py-8">
                    <p className="mb-4">No playlists yet</p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowCreateModal(true)}
                    >
                      Create Your First Playlist
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {playlists.map((playlist) => (
                      <button
                        key={playlist.id}
                        onClick={() => handleAddToPlaylist(playlist.id)}
                        disabled={addingToPlaylist === playlist.id}
                        className="w-full text-left p-3 rounded-[12px] bg-[#1a1a1a] hover:bg-[#252525] border border-[#2a2a2a] hover:border-[#FF3B30] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="font-medium text-white">
                          {playlist.name}
                        </div>
                        {playlist.description && (
                          <div className="text-sm text-[#a0a0a0] mt-1 line-clamp-1">
                            {playlist.description}
                          </div>
                        )}
                        {playlist._count && (
                          <div className="text-xs text-[#a0a0a0] mt-1">
                            {playlist._count.items} item{playlist._count.items !== 1 ? 's' : ''}
                          </div>
                        )}
                        {addingToPlaylist === playlist.id && (
                          <div className="text-xs text-[#FF3B30] mt-1">
                            Adding...
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
