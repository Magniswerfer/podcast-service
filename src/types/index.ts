export interface User {
  id: string;
  email: string;
  apiKey: string;
  createdAt: Date;
}

export interface Podcast {
  id: string;
  feedUrl: string;
  title: string;
  description?: string;
  author?: string;
  artworkUrl?: string;
  language?: string;
  categories: string[];
  lastFetchedAt?: Date;
  createdAt: Date;
}

export interface Episode {
  id: string;
  podcastId: string;
  guid: string;
  title: string;
  description?: string;
  audioUrl: string;
  durationSeconds?: number;
  publishedAt: Date;
  artworkUrl?: string;
  season?: number;
  episodeNumber?: number;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  podcastId: string;
  subscribedAt: Date;
  customSettings?: Record<string, any>;
}

export interface ListeningHistory {
  id: string;
  userId: string;
  episodeId: string;
  positionSeconds: number;
  durationSeconds?: number;
  completed: boolean;
  lastUpdatedAt: Date;
  listeningSessions?: ListeningSession[];
}

export interface ListeningSession {
  startTime: Date;
  endTime?: Date;
  positionStart: number;
  positionEnd: number;
}

export interface QueueItem {
  id: string;
  userId: string;
  episodeId: string;
  position: number;
  addedAt: Date;
}

export interface Favorite {
  id: string;
  userId: string;
  episodeId?: string;
  podcastId?: string;
  createdAt: Date;
}

export interface PodcastFilterSettings {
  episodeFilter?: 'all' | 'unplayed' | 'uncompleted' | 'in-progress';
  episodeSort?: 'newest' | 'oldest';
}
