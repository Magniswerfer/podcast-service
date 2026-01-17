'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface UrlModalProps {
  onClose: () => void;
  onSubmit: (feedUrl: string) => Promise<void>;
}

export function UrlModal({ onClose, onSubmit }: UrlModalProps) {
  const [feedUrl, setFeedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input when modal opens
    inputRef.current?.focus();

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedUrl.trim()) return;

    setLoading(true);
    try {
      await onSubmit(feedUrl);
      setFeedUrl('');
    } catch (error) {
      // Error handling is done in parent component
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#a0a0a0] hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <h2 className="text-xl font-semibold text-white mb-4 pr-8">
            Add Podcast by URL
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="feedUrl" className="block text-sm font-medium text-[#e5e5e5] mb-2">
                RSS Feed URL
              </label>
              <input
                ref={inputRef}
                id="feedUrl"
                type="text"
                placeholder="Enter RSS feed URL..."
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                className="w-full px-4 py-2 border border-[#2a2a2a] rounded-[12px] bg-[#1a1a1a] text-white placeholder-[#a0a0a0] focus:outline-none focus:border-[#FF3B30] focus:ring-2 focus:ring-[#FF3B30]/20 transition-all duration-200"
              />
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !feedUrl.trim()}
                className="flex-1"
              >
                {loading ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
