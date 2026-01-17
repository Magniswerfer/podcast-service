'use client';

import { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { PodcastFilterSettings } from '@/types/index';

type FilterOption = 'all' | 'unplayed' | 'uncompleted' | 'in-progress';
type SortOption = 'newest' | 'oldest';

interface SaveFilterModalProps {
  currentSettings?: PodcastFilterSettings;
  onSave: (settings: PodcastFilterSettings) => Promise<void>;
  onCancel: () => void;
}

export function SaveFilterModal({
  currentSettings,
  onSave,
  onCancel,
}: SaveFilterModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<FilterOption>(currentSettings?.episodeFilter || 'all');
  const [sort, setSort] = useState<SortOption>(currentSettings?.episodeSort || 'newest');

  useEffect(() => {
    cancelButtonRef.current?.focus();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        episodeFilter: filter,
        episodeSort: sort,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onCancel}
      />

      {/* Modal */}
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <Card 
          className="w-full max-w-md p-6 relative pointer-events-auto"
        >
          {/* Close Button */}
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 text-[#a0a0a0] hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <h2 className="text-xl font-semibold text-white mb-4 pr-8">
            Default Filter Settings
          </h2>

          <p className="text-[#a0a0a0] text-sm mb-4">
            Set the default filter and sort for this podcast. These settings will be applied automatically when you visit this podcast.
          </p>

          <div className="space-y-4 mb-6">
            {/* Filter Dropdown */}
            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                Default Filter
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterOption)}
                className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-[12px] text-white text-sm focus:outline-none focus:border-[#FF3B30] transition-colors"
              >
                <option value="all">All Episodes</option>
                <option value="unplayed">Unplayed</option>
                <option value="uncompleted">Uncompleted</option>
                <option value="in-progress">In Progress</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div>
              <label className="block text-sm font-medium text-[#a0a0a0] mb-2">
                Default Sort
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-[12px] text-white text-sm focus:outline-none focus:border-[#FF3B30] transition-colors"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3 justify-end">
            <Button
              ref={cancelButtonRef}
              variant="secondary"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Default'}
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
