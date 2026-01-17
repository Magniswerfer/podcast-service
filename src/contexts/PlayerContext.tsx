'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';

interface Episode {
  id: string;
  title: string;
  audioUrl: string;
  artworkUrl?: string;
  podcast: {
    id: string;
    title: string;
    artworkUrl?: string;
  };
}

interface QueueItem {
  id: string;
  episodeId: string;
  position: number;
  episode: Episode;
}

interface PlayerContextType {
  currentEpisode: Episode | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  volume: number;
  queue: QueueItem[];
  currentQueueItemId: string | null;
  setCurrentEpisode: (episode: Episode | null) => void;
  playEpisode: (episode: Episode) => Promise<void>;
  addToQueue: (episodeId: string) => Promise<void>;
  playNext: (episodeId: string) => Promise<void>;
  loadQueue: () => Promise<void>;
  togglePlayPause: () => void;
  skipForward: () => void;
  skipBackward: () => void;
  handleSeek: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentQueueItemId, setCurrentQueueItemId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      
      const audio = audioRef.current;
      
      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => setDuration(audio.duration);
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.pause();
        audio.src = '';
      };
    }
  }, []);

  // Track if we should auto-play after loading
  const shouldAutoPlayRef = useRef(false);

  // Update audio source when episode changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentEpisode) {
      audio.src = currentEpisode.audioUrl;
      audio.load();
      
      // If we should auto-play, wait for canplay event
      if (shouldAutoPlayRef.current) {
        const handleCanPlay = async () => {
          try {
            await audio.play();
            shouldAutoPlayRef.current = false;
          } catch (error) {
            console.error('Error auto-playing audio:', error);
            shouldAutoPlayRef.current = false;
          }
        };
        audio.addEventListener('canplay', handleCanPlay, { once: true });
        return () => {
          audio.removeEventListener('canplay', handleCanPlay);
        };
      }
    } else {
      audio.pause();
      audio.src = '';
      shouldAutoPlayRef.current = false;
    }
  }, [currentEpisode]);

  // Update playback rate
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackRate;
  }, [playbackRate]);

  // Update volume
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) {
      console.error('Audio element not available');
      return;
    }
    if (!currentEpisode) {
      console.error('No episode selected');
      return;
    }

    try {
      if (isPlaying) {
        audio.pause();
      } else {
        // Ensure audio is loaded before playing
        if (audio.readyState < 2) {
          await new Promise((resolve) => {
            audio.addEventListener('canplay', resolve, { once: true });
            audio.load();
          });
        }
        await audio.play();
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      // Show user-friendly error message
      alert('Unable to play audio. Please check your browser settings or try again.');
    }
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.currentTime + 15, duration);
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(audio.currentTime - 15, 0);
  };

  const handleSeek = (newTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const playEpisode = async (episode: Episode) => {
    // First, ensure episode is in queue (if not already)
    const existingQueueItem = queue.find((item) => item.episodeId === episode.id);
    let queueItemId: string | null = existingQueueItem?.id || null;
    
    if (!existingQueueItem) {
      // Add to queue at play-next position (right after current episode)
      try {
        const response = await fetch('/api/queue/play-next', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            episodeId: episode.id,
            currentEpisodeId: currentEpisode?.id,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          if (data.queue) {
            setQueue(data.queue);
            // Find the newly added item
            const newItem = data.queue.find((item: any) => item.episodeId === episode.id);
            queueItemId = newItem?.id || null;
          }
        }
      } catch (error) {
        // If adding to queue fails, still play the episode
        console.error('Error adding to queue:', error);
      }
    }
    
    // Set flag to auto-play after source loads
    shouldAutoPlayRef.current = true;
    setCurrentEpisode(episode);
    setCurrentQueueItemId(queueItemId);
    // The useEffect will handle the actual playing when audio is ready
  };

  const loadQueue = useCallback(async () => {
    try {
      const response = await fetch('/api/queue');
      if (response.ok) {
        const data = await response.json();
        setQueue(data.queue || []);
      }
    } catch (error) {
      console.error('Error loading queue:', error);
    }
  }, []); // Memoize to prevent recreation

  const addToQueue = async (episodeId: string) => {
    try {
      const response = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId }),
      });
      if (response.ok) {
        // Use the response data if available, otherwise reload
        const data = await response.json();
        if (data.queue) {
          setQueue(data.queue);
        } else {
          await loadQueue();
        }
      } else if (response.status === 409) {
        // Episode already in queue - just reload queue to get current state
        await loadQueue();
        return;
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add to queue');
      }
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  };

  const playNext = async (episodeId: string) => {
    try {
      const response = await fetch('/api/queue/play-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId,
          currentEpisodeId: currentEpisode?.id,
        }),
      });
      if (response.ok) {
        // Use the response data if available, otherwise reload
        const data = await response.json();
        if (data.queue) {
          setQueue(data.queue);
        } else {
          await loadQueue();
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add to play next');
      }
    } catch (error) {
      console.error('Error adding to play next:', error);
      throw error;
    }
  };

  const advanceToNextQueueItem = async () => {
    if (!currentQueueItemId || queue.length === 0) return;

    const currentItem = queue.find((item) => item.id === currentQueueItemId);
    if (!currentItem) return;

    const currentIndex = queue.findIndex((item) => item.id === currentQueueItemId);
    const nextItem = queue[currentIndex + 1];

    if (nextItem) {
      // Play next episode from queue
      shouldAutoPlayRef.current = true;
      setCurrentEpisode(nextItem.episode);
      setCurrentQueueItemId(nextItem.id);
    } else {
      // No more items in queue
      setCurrentQueueItemId(null);
    }
  };

  // Handle auto-advance when episode ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleAutoAdvance = () => {
      // Small delay to ensure state is updated
      setTimeout(() => {
        advanceToNextQueueItem();
      }, 100);
    };

    audio.addEventListener('ended', handleAutoAdvance);
    return () => {
      audio.removeEventListener('ended', handleAutoAdvance);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQueueItemId]); // Only depend on currentQueueItemId to avoid excessive re-renders

  // Load queue on mount
  useEffect(() => {
    loadQueue();
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentEpisode,
        isPlaying,
        currentTime,
        duration,
        playbackRate,
        volume,
        queue,
        currentQueueItemId,
        setCurrentEpisode,
        playEpisode,
        addToQueue,
        playNext,
        loadQueue,
        togglePlayPause,
        skipForward,
        skipBackward,
        handleSeek,
        setPlaybackRate,
        setVolume,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
