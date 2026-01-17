'use client';

import { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface PlaylistModalProps {
  onClose: () => void;
  onSave: (name: string, description?: string) => Promise<void>;
  initialName?: string;
  initialDescription?: string;
  title?: string;
}

export function PlaylistModal({
  onClose,
  onSave,
  initialName = '',
  initialDescription = '',
  title = 'Create Playlist',
}: PlaylistModalProps) {
  const [name, setName] = useState(initialName || '');
  const [description, setDescription] = useState(initialDescription || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Playlist name is required');
      return;
    }

    setLoading(true);
    try {
      await onSave(name.trim(), description.trim() || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save playlist');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <Card className="w-full max-w-md p-6 relative pointer-events-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#a0a0a0] hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <h2 className="text-xl font-semibold text-white mb-4 pr-8">
            {title}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="playlist-name"
                className="block text-sm font-medium text-[#e5e5e5] mb-2"
              >
                Name *
              </label>
              <input
                ref={nameInputRef}
                id="playlist-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
                className="w-full px-4 py-2 border border-[#2a2a2a] rounded-[12px] bg-[#1a1a1a] text-white placeholder-[#a0a0a0] focus:outline-none focus:border-[#FF3B30] transition-all duration-200"
                placeholder="My Playlist"
                disabled={loading}
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="playlist-description"
                className="block text-sm font-medium text-[#e5e5e5] mb-2"
              >
                Description
              </label>
              <textarea
                id="playlist-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={3}
                className="w-full px-4 py-2 border border-[#2a2a2a] rounded-[12px] bg-[#1a1a1a] text-white placeholder-[#a0a0a0] focus:outline-none focus:border-[#FF3B30] transition-all duration-200 resize-none"
                placeholder="Optional description..."
                disabled={loading}
              />
            </div>

            {error && (
              <div className="mb-4 text-sm text-[#FF3B30]">
                {error}
              </div>
            )}

            <div className="flex space-x-3 justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !name.trim()}
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
