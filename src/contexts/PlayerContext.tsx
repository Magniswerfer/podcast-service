'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { AlertModal } from '@/components/AlertModal';

interface Episode {
  id: string;
  title: string;
  audioUrl: string;
  artworkUrl?: string;
  durationSeconds?: number;
  podcast: {
    id: string;
    title: string;
    artworkUrl?: string;
  };
}

interface EpisodeProgress {
  positionSeconds: number;
  durationSeconds?: number;
  completed: boolean;
}

interface QueueEpisode extends Episode {
  progress?: EpisodeProgress | null;
}

interface QueueItem {
  id: string;
  episodeId: string;
  position: number;
  episode: QueueEpisode;
}

// localStorage persistence for player state
const PLAYER_STATE_KEY = 'podcast-player-state';

interface PersistedPlayerState {
  episodeId: string;
  currentTime: number;
  wasPlaying: boolean;
  playbackRate: number;
  volume: number;
}

function savePlayerState(state: PersistedPlayerState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Error saving player state to localStorage:', error);
  }
}

function loadPlayerState(): PersistedPlayerState | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(PLAYER_STATE_KEY);
    if (saved) {
      return JSON.parse(saved) as PersistedPlayerState;
    }
  } catch (error) {
    console.error('Error loading player state from localStorage:', error);
  }
  return null;
}

function clearPlayerState(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PLAYER_STATE_KEY);
  } catch (error) {
    console.error('Error clearing player state from localStorage:', error);
  }
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
  isMinimized: boolean;
  setCurrentEpisode: (episode: Episode | null) => void;
  loadEpisode: (episode: Episode) => Promise<void>;
  playEpisode: (episode: Episode, startPosition?: number) => Promise<void>;
  addToQueue: (episodeId: string) => Promise<void>;
  playNext: (episodeId: string) => Promise<void>;
  clearQueue: () => Promise<void>;
  loadQueue: () => Promise<void>;
  togglePlayPause: () => void;
  skipForward: () => void;
  skipBackward: () => void;
  handleSeek: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  toggleMinimized: () => void;
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio();
      
      const audio = audioRef.current;
      
      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => setDuration(audio.duration);
      const handleEnded = async () => {
        setIsPlaying(false);
        setCurrentTime(0);
        // Save progress when episode ends (mark as completed)
        // Note: currentEpisode will be available via closure from the component state
        // We'll handle this in a separate useEffect to avoid closure issues
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
  // Track start position for the current episode
  const startPositionRef = useRef<number | undefined>(undefined);
  // Track if we're restoring from localStorage (to avoid saving during restore)
  const isRestoringRef = useRef(false);
  // Throttle saving to localStorage (last save timestamp)
  const lastSaveTimeRef = useRef<number>(0);

  // Update audio source when episode changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentEpisode) {
      audio.src = currentEpisode.audioUrl;
      audio.load();
      
      // Set start position if provided
      if (startPositionRef.current !== undefined) {
        const handleLoadedMetadata = () => {
          audio.currentTime = startPositionRef.current || 0;
          startPositionRef.current = undefined;
        };
        audio.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      }
      
      // If we should auto-play, wait for canplay event
      if (shouldAutoPlayRef.current) {
        const handleCanPlay = async () => {
          try {
            // Ensure start position is set before playing
            if (startPositionRef.current !== undefined && audio.readyState >= 1) {
              audio.currentTime = startPositionRef.current;
              startPositionRef.current = undefined;
            }
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
      startPositionRef.current = undefined;
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

  const saveProgressNow = useCallback(async () => {
    if (!currentEpisode || duration === 0) return;
    
    try {
      const positionSeconds = Math.floor(currentTime);
      const durationSeconds = Math.floor(duration);
      const completed = currentTime >= duration - 1;

      await fetch(`/api/progress/${currentEpisode.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId: currentEpisode.id,
          positionSeconds,
          durationSeconds,
          completed,
        }),
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }, [currentEpisode, currentTime, duration]);

  // Save player state to localStorage (throttled)
  const saveToLocalStorage = useCallback((force = false) => {
    if (isRestoringRef.current) return;
    if (!currentEpisode) return;
    
    const now = Date.now();
    // Throttle to every 5 seconds unless forced
    if (!force && now - lastSaveTimeRef.current < 5000) return;
    lastSaveTimeRef.current = now;
    
    const audio = audioRef.current;
    const time = audio ? audio.currentTime : currentTime;
    
    savePlayerState({
      episodeId: currentEpisode.id,
      currentTime: time,
      wasPlaying: isPlaying,
      playbackRate,
      volume,
    });
  }, [currentEpisode, currentTime, isPlaying, playbackRate, volume]);

  // Save to localStorage when episode changes or playback state changes
  useEffect(() => {
    if (isRestoringRef.current) return;
    if (currentEpisode) {
      saveToLocalStorage(true); // Force save on episode change
    } else {
      // Clear localStorage when episode is cleared
      clearPlayerState();
    }
  }, [currentEpisode?.id, isPlaying, playbackRate, volume, saveToLocalStorage]);

  // Save position periodically while playing (using timeupdate)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentEpisode) return;

    const handleTimeUpdate = () => {
      saveToLocalStorage(false); // Throttled save
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [currentEpisode, saveToLocalStorage]);

  // Save final position on page unload/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!currentEpisode) return;
      
      const audio = audioRef.current;
      const time = audio ? audio.currentTime : currentTime;
      
      // Use synchronous localStorage write (no async operations in beforeunload)
      savePlayerState({
        episodeId: currentEpisode.id,
        currentTime: time,
        wasPlaying: isPlaying,
        playbackRate,
        volume,
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [currentEpisode, currentTime, isPlaying, playbackRate, volume]);

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
        // Save progress when pausing
        await saveProgressNow();
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
      setAlertMessage('Unable to play audio. Please check your browser settings or try again.');
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

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  const handleSeek = async (newTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    // Save progress after seeking
    // Use a small delay to ensure currentTime state is updated
    setTimeout(() => {
      saveProgressNow();
    }, 100);
  };

  const loadEpisode = async (episode: Episode) => {
    // Load episode without playing - just set it in context
    // Check if episode is in queue and get queue item id
    const existingQueueItem = queue.find((item) => item.episodeId === episode.id);
    let queueItemId: string | null = existingQueueItem?.id || null;
    
    // Don't set auto-play flag
    shouldAutoPlayRef.current = false;
    startPositionRef.current = undefined;
    setCurrentEpisode(episode);
    setCurrentQueueItemId(queueItemId);
  };

  const playEpisode = async (episode: Episode, startPosition?: number) => {
    // If no startPosition provided, try to load progress from DB
    let positionToUse = startPosition;
    if (positionToUse === undefined) {
      try {
        const response = await fetch(`/api/progress`);
        if (response.ok) {
          const data = await response.json();
          const progress = data.progress?.find((p: any) => p.episode.id === episode.id);
          if (progress && progress.positionSeconds > 0 && !progress.completed) {
            positionToUse = progress.positionSeconds;
          }
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    }
    
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
    
    // Set start position if we have one
    startPositionRef.current = positionToUse;
    
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

  const clearQueue = async () => {
    try {
      // Include current episode ID in query params to preserve it
      const url = currentEpisode 
        ? `/api/queue?currentEpisodeId=${encodeURIComponent(currentEpisode.id)}`
        : '/api/queue';
      
      const response = await fetch(url, {
        method: 'DELETE',
      });
      if (response.ok) {
        const data = await response.json();
        setQueue(data.queue || []);
        // Update currentQueueItemId if the current episode is still in the queue
        if (currentEpisode && data.queue) {
          const remainingItem = data.queue.find((item: QueueItem) => item.episodeId === currentEpisode.id);
          if (remainingItem) {
            setCurrentQueueItemId(remainingItem.id);
          } else {
            setCurrentQueueItemId(null);
          }
        } else if (!currentEpisode) {
          setCurrentQueueItemId(null);
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear queue');
      }
    } catch (error) {
      console.error('Error clearing queue:', error);
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

  // Save progress periodically while playing
  useEffect(() => {
    if (!currentEpisode || !isPlaying || duration === 0) return;

    // Save immediately when starting to play
    saveProgressNow();

    // Save every 10 seconds while playing
    const interval = setInterval(() => {
      if (isPlaying && currentEpisode) {
        saveProgressNow();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [currentEpisode, isPlaying, duration, saveProgressNow]);

  // Save progress when episode ends (mark as completed)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentEpisode) return;

    const handleEndedSaveProgress = async () => {
      try {
        const durationSeconds = Math.floor(duration);
        await fetch(`/api/progress/${currentEpisode.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            episodeId: currentEpisode.id,
            positionSeconds: durationSeconds,
            durationSeconds,
            completed: true,
          }),
        });
      } catch (error) {
        console.error('Error saving progress on episode end:', error);
      }
    };

    audio.addEventListener('ended', handleEndedSaveProgress);
    return () => {
      audio.removeEventListener('ended', handleEndedSaveProgress);
    };
  }, [currentEpisode, duration]);

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

  // Restore player state from localStorage on mount
  useEffect(() => {
    const restorePlayerState = async () => {
      const savedState = loadPlayerState();
      if (!savedState) return;

      try {
        isRestoringRef.current = true;

        // Restore playback rate and volume first
        setPlaybackRate(savedState.playbackRate);
        setVolume(savedState.volume);

        // Fetch episode data from API
        const response = await fetch(`/api/episodes/${savedState.episodeId}`);
        if (!response.ok) {
          // Episode not found or not accessible, clear saved state
          clearPlayerState();
          isRestoringRef.current = false;
          return;
        }

        const episodeData = await response.json();
        
        // Transform API response to Episode format
        const episode: Episode = {
          id: episodeData.id,
          title: episodeData.title,
          audioUrl: episodeData.audioUrl,
          artworkUrl: episodeData.artworkUrl,
          podcast: {
            id: episodeData.podcast.id,
            title: episodeData.podcast.title,
            artworkUrl: episodeData.podcast.artworkUrl,
          },
        };

        // Set start position for restoration
        startPositionRef.current = savedState.currentTime;

        // Check if episode is in queue and get queue item id
        const queueResponse = await fetch('/api/queue');
        let queueItemId: string | null = null;
        if (queueResponse.ok) {
          const queueData = await queueResponse.json();
          const queueItem = queueData.queue?.find((item: any) => item.episodeId === episode.id);
          queueItemId = queueItem?.id || null;
        }

        // Set whether to auto-play (only if was playing before)
        shouldAutoPlayRef.current = savedState.wasPlaying;

        // Set the episode (this will trigger audio load)
        setCurrentEpisode(episode);
        setCurrentQueueItemId(queueItemId);

        // Mark restoration complete after a short delay to allow state updates
        setTimeout(() => {
          isRestoringRef.current = false;
        }, 500);

      } catch (error) {
        console.error('Error restoring player state:', error);
        clearPlayerState();
        isRestoringRef.current = false;
      }
    };

    restorePlayerState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

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
        isMinimized,
        setCurrentEpisode,
        loadEpisode,
        playEpisode,
        addToQueue,
        playNext,
        clearQueue,
        loadQueue,
        togglePlayPause,
        skipForward,
        skipBackward,
        handleSeek,
        setPlaybackRate,
        setVolume,
        toggleMinimized,
      }}
    >
      {children}
      {alertMessage && (
        <AlertModal
          message={alertMessage}
          onClose={() => setAlertMessage(null)}
          title="Playback Error"
        />
      )}
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

export function usePlayerVisible() {
  const { currentEpisode } = usePlayer();
  return currentEpisode !== null;
}
