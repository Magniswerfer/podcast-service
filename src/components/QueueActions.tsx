'use client';

import { useState } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';

interface QueueActionsProps {
  episodeId: string;
  onSuccess?: () => void;
}

export function QueueActions({ episodeId, onSuccess }: QueueActionsProps) {
  const { addToQueue, playNext } = usePlayer();
  const [addingToQueue, setAddingToQueue] = useState(false);
  const [addingToPlayNext, setAddingToPlayNext] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToQueue = async () => {
    setAddingToQueue(true);
    setError(null);
    try {
      await addToQueue(episodeId);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to add to queue');
    } finally {
      setAddingToQueue(false);
    }
  };

  const handlePlayNext = async () => {
    setAddingToPlayNext(true);
    setError(null);
    try {
      await playNext(episodeId);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to add to play next');
    } finally {
      setAddingToPlayNext(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex space-x-2">
        <button
          onClick={handleAddToQueue}
          disabled={addingToQueue || addingToPlayNext}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {addingToQueue ? 'Adding...' : 'Add to Queue'}
        </button>
        <button
          onClick={handlePlayNext}
          disabled={addingToQueue || addingToPlayNext}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {addingToPlayNext ? 'Adding...' : 'Play Next'}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
