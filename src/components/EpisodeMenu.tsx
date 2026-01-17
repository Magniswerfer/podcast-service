'use client';

import { useState, useRef, useEffect } from 'react';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { usePlayer } from '@/contexts/PlayerContext';
import { AddToPlaylistModal } from './AddToPlaylistModal';

interface EpisodeMenuProps {
  episodeId: string;
  episode: {
    id: string;
    title: string;
    audioUrl: string;
    artworkUrl?: string;
    podcast: {
      id: string;
      title: string;
      artworkUrl?: string;
    };
  };
  progress?: {
    positionSeconds: number;
    durationSeconds?: number;
    completed: boolean;
  } | null;
  durationSeconds?: number;
  onMarkedAsPlayed?: () => void;
}

export function EpisodeMenu({ episodeId, episode, progress, durationSeconds, onMarkedAsPlayed }: EpisodeMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { playEpisode } = usePlayer();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const hasProgress = progress && progress.positionSeconds > 0 && !progress.completed;
  const isCompleted = progress?.completed === true;

  const handleContinuePlay = async () => {
    setIsOpen(false);
    await playEpisode(episode, progress?.positionSeconds);
  };

  const handlePlayFromBeginning = async () => {
    setIsOpen(false);
    await playEpisode(episode, 0);
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      const response = await fetch(`/api/playlists/${playlistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add to playlist');
      }

      setShowAddToPlaylist(false);
      setIsOpen(false);
      setAlertMessage('Added to playlist!');
      setTimeout(() => setAlertMessage(null), 3000);
    } catch (error) {
      setAlertMessage(error instanceof Error ? error.message : 'Failed to add to playlist');
      setTimeout(() => setAlertMessage(null), 3000);
      throw error;
    }
  };

  const handleCreatePlaylist = async (name: string, description?: string) => {
    const response = await fetch('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create playlist');
    }

    const data = await response.json();
    return data.playlist;
  };

  const handleMarkAsPlayed = async () => {
    setIsOpen(false);
    
    try {
      // Get episode duration - use prop, progress, or fetch from API
      let episodeDuration = durationSeconds || progress?.durationSeconds;
      
      // If we don't have duration, fetch episode details
      if (!episodeDuration) {
        const episodeResponse = await fetch(`/api/episodes/${episodeId}`);
        if (episodeResponse.ok) {
          const episodeData = await episodeResponse.json();
          episodeDuration = episodeData.durationSeconds;
        }
      }

      // If still no duration, use a default large value to mark as complete
      const positionSeconds = episodeDuration || 999999;
      const durationSecondsValue = episodeDuration || 999999;

      const response = await fetch(`/api/progress/${episodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId,
          positionSeconds,
          durationSeconds: durationSecondsValue,
          completed: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark episode as played');
      }

      setAlertMessage('Episode marked as played!');
      setTimeout(() => setAlertMessage(null), 3000);
      
      // Notify parent component to refresh
      if (onMarkedAsPlayed) {
        onMarkedAsPlayed();
      }
    } catch (error) {
      setAlertMessage(error instanceof Error ? error.message : 'Failed to mark episode as played');
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  const handleUnmarkAsPlayed = async () => {
    setIsOpen(false);
    
    try {
      const response = await fetch(`/api/progress/${episodeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId,
          positionSeconds: 0,
          durationSeconds: progress?.durationSeconds || durationSeconds || 0,
          completed: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to unmark episode as played');
      }

      setAlertMessage('Episode unmarked as played!');
      setTimeout(() => setAlertMessage(null), 3000);
      
      // Notify parent component to refresh
      if (onMarkedAsPlayed) {
        onMarkedAsPlayed();
      }
    } catch (error) {
      setAlertMessage(error instanceof Error ? error.message : 'Failed to unmark episode as played');
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full text-[#a0a0a0] hover:text-white hover:bg-[#252525] transition-all duration-200"
          aria-label="Episode options"
        >
          <EllipsisVerticalIcon className="h-5 w-5" />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#1f1f1f] border border-[#2a2a2a] rounded-[12px] shadow-lg z-50 overflow-hidden">
            {hasProgress && (
              <>
                <button
                  onClick={handleContinuePlay}
                  className="w-full px-4 py-3 text-left text-white hover:bg-[#252525] transition-colors text-sm"
                >
                  Continue playing
                </button>
                <button
                  onClick={handlePlayFromBeginning}
                  className="w-full px-4 py-3 text-left text-[#a0a0a0] hover:bg-[#252525] hover:text-white transition-colors text-sm border-t border-[#2a2a2a]"
                >
                  Play from beginning
                </button>
              </>
            )}
            <button
              onClick={() => {
                setIsOpen(false);
                setShowAddToPlaylist(true);
              }}
              className="w-full px-4 py-3 text-left text-[#a0a0a0] hover:bg-[#252525] hover:text-white transition-colors text-sm border-t border-[#2a2a2a]"
            >
              Add to Playlist
            </button>
            <button
              onClick={isCompleted ? handleUnmarkAsPlayed : handleMarkAsPlayed}
              className="w-full px-4 py-3 text-left text-[#a0a0a0] hover:bg-[#252525] hover:text-white transition-colors text-sm border-t border-[#2a2a2a]"
            >
              {isCompleted ? 'Unmark as Played' : 'Mark as Played'}
            </button>
          </div>
        )}
      </div>

      {showAddToPlaylist && (
        <AddToPlaylistModal
          onClose={() => setShowAddToPlaylist(false)}
          onAddToPlaylist={handleAddToPlaylist}
          onCreatePlaylist={handleCreatePlaylist}
          episodeId={episodeId}
        />
      )}

      {alertMessage && (
        <div className="fixed bottom-4 right-4 bg-[#1f1f1f] border border-[#2a2a2a] rounded-[12px] px-4 py-3 text-white shadow-lg z-50">
          {alertMessage}
        </div>
      )}
    </>
  );
}
