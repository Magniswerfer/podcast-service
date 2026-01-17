'use client';

import { TrashIcon, PlayIcon } from '@heroicons/react/24/outline';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import Link from 'next/link';

interface PlaylistItemProps {
  id: string;
  podcast?: {
    id: string;
    title: string;
    artworkUrl?: string;
    author?: string;
  } | null;
  episode?: {
    id: string;
    title: string;
    artworkUrl?: string;
    podcast?: {
      id: string;
      title: string;
      artworkUrl?: string;
    };
  } | null;
  position?: number;
  onRemove: (itemId: string) => Promise<void>;
  onPlay?: () => void;
  isRemoving?: boolean;
}

export function PlaylistItem({
  id,
  podcast,
  episode,
  position,
  onRemove,
  onPlay,
  isRemoving = false,
}: PlaylistItemProps) {
  const item = podcast || episode;
  const artworkUrl = podcast?.artworkUrl || episode?.artworkUrl || episode?.podcast?.artworkUrl || '/placeholder-artwork.png';
  const title = podcast?.title || episode?.title || 'Unknown';
  const subtitle = podcast ? podcast.author : episode?.podcast?.title;
  const linkHref = podcast ? `/podcasts/${podcast.id}` : `/episodes/${episode?.id}`;

  return (
    <Card interactive={false} className="p-4">
      <div className="flex items-center space-x-4">
        <Link href={linkHref} className="shrink-0">
          <img
            src={artworkUrl}
            alt={title}
            className="w-16 h-16 rounded-[12px] object-cover"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={linkHref}>
            <h3 className="font-medium text-white truncate hover:text-[#FF3B30] transition-colors">
              {title}
            </h3>
          </Link>
          {subtitle && (
            <p className="text-sm text-[#a0a0a0] truncate mt-1">
              {subtitle}
            </p>
          )}
          <div className="text-xs text-[#a0a0a0] mt-1">
            {podcast ? 'Podcast' : 'Episode'}
          </div>
        </div>
        <div className="shrink-0 flex space-x-2">
          {episode && onPlay && (
            <Button
              variant="icon"
              size="sm"
              onClick={onPlay}
              title="Play episode"
            >
              <PlayIcon className="h-5 w-5" />
            </Button>
          )}
          <Button
            variant="icon"
            size="sm"
            onClick={() => onRemove(id)}
            disabled={isRemoving}
            title="Remove from playlist"
          >
            <TrashIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
