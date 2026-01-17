import { db } from './db';
import { differenceInDays, startOfYear, endOfYear, parseISO } from 'date-fns';

export interface DashboardStats {
  totalListeningTimeSeconds: number;
  totalEpisodesCompleted: number;
  totalEpisodesInProgress: number;
  totalPodcastsSubscribed: number;
  averageDailyListeningTimeSeconds: number;
  topPodcasts: Array<{
    podcastId: string;
    podcastTitle: string;
    listeningTimeSeconds: number;
    episodesCompleted: number;
  }>;
}

export interface WrappedStats {
  year: number;
  totalListeningTimeSeconds: number;
  totalEpisodesCompleted: number;
  topPodcasts: Array<{
    podcastId: string;
    podcastTitle: string;
    listeningTimeSeconds: number;
    episodesCompleted: number;
  }>;
  listeningStreaks: {
    currentStreak: number;
    longestStreak: number;
  };
  averageDailyListeningTimeSeconds: number;
  peakListeningHours: Array<{ hour: number; count: number }>;
  peakListeningDays: Array<{ day: string; count: number }>;
  newPodcastsDiscovered: number;
  firstEpisodeOfYear?: {
    episodeId: string;
    episodeTitle: string;
    podcastTitle: string;
    completedAt: Date;
  };
  longestEpisode?: {
    episodeId: string;
    episodeTitle: string;
    podcastTitle: string;
    durationSeconds: number;
  };
  genreBreakdown: Array<{ genre: string; count: number }>;
  completionRate: number;
}

/**
 * Calculate dashboard stats for a user
 */
export async function calculateDashboardStats(userId: string): Promise<DashboardStats> {
  const [history, subscriptions] = await Promise.all([
    db.listeningHistory.findMany({
      where: { userId },
      include: {
        episode: {
          include: {
            podcast: {
              select: {
                id: true,
                title: true,
                categories: true,
              },
            },
          },
        },
      },
    }),
    db.subscription.count({
      where: { userId },
    }),
  ]);

  const totalListeningTimeSeconds = history.reduce((sum, h) => {
    if (h.completed && h.durationSeconds) {
      return sum + h.durationSeconds;
    }
    return sum + h.positionSeconds;
  }, 0);

  const totalEpisodesCompleted = history.filter((h) => h.completed).length;
  const totalEpisodesInProgress = history.filter((h) => !h.completed).length;

  // Calculate average daily listening time (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentHistory = history.filter(
    (h) => h.lastUpdatedAt >= thirtyDaysAgo
  );
  const recentListeningTime = recentHistory.reduce((sum, h) => {
    if (h.completed && h.durationSeconds) {
      return sum + h.durationSeconds;
    }
    return sum + h.positionSeconds;
  }, 0);
  const averageDailyListeningTimeSeconds = recentListeningTime / 30;

  // Top podcasts by listening time
  const podcastStats = new Map<
    string,
    { title: string; listeningTime: number; episodesCompleted: number }
  >();

  for (const h of history) {
    const podcastId = h.episode.podcast.id;
    const podcastTitle = h.episode.podcast.title;
    const existing = podcastStats.get(podcastId) || {
      title: podcastTitle,
      listeningTime: 0,
      episodesCompleted: 0,
    };

    if (h.completed && h.durationSeconds) {
      existing.listeningTime += h.durationSeconds;
    } else {
      existing.listeningTime += h.positionSeconds;
    }

    if (h.completed) {
      existing.episodesCompleted++;
    }

    podcastStats.set(podcastId, existing);
  }

  const topPodcasts = Array.from(podcastStats.entries())
    .map(([podcastId, stats]) => ({
      podcastId,
      podcastTitle: stats.title,
      listeningTimeSeconds: stats.listeningTime,
      episodesCompleted: stats.episodesCompleted,
    }))
    .sort((a, b) => b.listeningTimeSeconds - a.listeningTimeSeconds)
    .slice(0, 10);

  return {
    totalListeningTimeSeconds,
    totalEpisodesCompleted,
    totalEpisodesInProgress,
    totalPodcastsSubscribed: subscriptions,
    averageDailyListeningTimeSeconds,
    topPodcasts,
  };
}

/**
 * Calculate wrapped stats for a specific year
 */
export async function calculateWrappedStats(
  userId: string,
  year: number
): Promise<WrappedStats> {
  const yearStart = startOfYear(new Date(year, 0, 1));
  const yearEnd = endOfYear(new Date(year, 0, 1));

  const history = await db.listeningHistory.findMany({
    where: {
      userId,
      lastUpdatedAt: {
        gte: yearStart,
        lte: yearEnd,
      },
    },
    include: {
      episode: {
        include: {
          podcast: {
            select: {
              id: true,
              title: true,
              categories: true,
            },
          },
        },
      },
    },
  });

  const completedHistory = history.filter((h) => h.completed);

  // Total listening time (only completed episodes)
  const totalListeningTimeSeconds = completedHistory.reduce((sum, h) => {
    return sum + (h.durationSeconds || 0);
  }, 0);

  const totalEpisodesCompleted = completedHistory.length;

  // Top podcasts
  const podcastStats = new Map<
    string,
    { title: string; listeningTime: number; episodesCompleted: number }
  >();

  for (const h of completedHistory) {
    const podcastId = h.episode.podcast.id;
    const podcastTitle = h.episode.podcast.title;
    const existing = podcastStats.get(podcastId) || {
      title: podcastTitle,
      listeningTime: 0,
      episodesCompleted: 0,
    };

    existing.listeningTime += h.durationSeconds || 0;
    existing.episodesCompleted++;

    podcastStats.set(podcastId, existing);
  }

  const topPodcasts = Array.from(podcastStats.entries())
    .map(([podcastId, stats]) => ({
      podcastId,
      podcastTitle: stats.title,
      listeningTimeSeconds: stats.listeningTime,
      episodesCompleted: stats.episodesCompleted,
    }))
    .sort((a, b) => b.listeningTimeSeconds - a.listeningTimeSeconds)
    .slice(0, 10);

  // Listening streaks
  const sortedDates = completedHistory
    .map((h) => h.lastUpdatedAt)
    .sort((a, b) => a.getTime() - b.getTime());

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const daysDiff = differenceInDays(sortedDates[i], sortedDates[i - 1]);
    if (daysDiff <= 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Current streak (from most recent)
  const today = new Date();
  let streakDate = today;
  currentStreak = 0;
  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const daysDiff = differenceInDays(today, sortedDates[i]);
    if (daysDiff === currentStreak) {
      currentStreak++;
      streakDate = sortedDates[i];
    } else {
      break;
    }
  }

  // Average daily listening time
  const daysInYear = differenceInDays(yearEnd, yearStart) + 1;
  const averageDailyListeningTimeSeconds = totalListeningTimeSeconds / daysInYear;

  // Peak listening hours
  const hourCounts = new Map<number, number>();
  for (const h of completedHistory) {
    const hour = h.lastUpdatedAt.getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  }
  const peakListeningHours = Array.from(hourCounts.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Peak listening days
  const dayCounts = new Map<string, number>();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (const h of completedHistory) {
    const day = dayNames[h.lastUpdatedAt.getDay()];
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
  }
  const peakListeningDays = Array.from(dayCounts.entries())
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  // New podcasts discovered
  const podcastsDiscovered = new Set(
    completedHistory.map((h) => h.episode.podcast.id)
  );
  const newPodcastsDiscovered = podcastsDiscovered.size;

  // First episode of year
  const firstCompleted = completedHistory
    .sort((a, b) => a.lastUpdatedAt.getTime() - b.lastUpdatedAt.getTime())[0];
  const firstEpisodeOfYear = firstCompleted
    ? {
        episodeId: firstCompleted.episode.id,
        episodeTitle: firstCompleted.episode.title,
        podcastTitle: firstCompleted.episode.podcast.title,
        completedAt: firstCompleted.lastUpdatedAt,
      }
    : undefined;

  // Longest episode
  const longestEpisodeData = completedHistory
    .filter((h) => h.durationSeconds)
    .sort((a, b) => (b.durationSeconds || 0) - (a.durationSeconds || 0))[0];
  const longestEpisode = longestEpisodeData
    ? {
        episodeId: longestEpisodeData.episode.id,
        episodeTitle: longestEpisodeData.episode.title,
        podcastTitle: longestEpisodeData.episode.podcast.title,
        durationSeconds: longestEpisodeData.durationSeconds || 0,
      }
    : undefined;

  // Genre breakdown
  const genreCounts = new Map<string, number>();
  for (const h of completedHistory) {
    for (const category of h.episode.podcast.categories) {
      genreCounts.set(category, (genreCounts.get(category) || 0) + 1);
    }
  }
  const genreBreakdown = Array.from(genreCounts.entries())
    .map(([genre, count]) => ({ genre, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Completion rate
  const totalEpisodesStarted = history.length;
  const completionRate =
    totalEpisodesStarted > 0 ? (totalEpisodesCompleted / totalEpisodesStarted) * 100 : 0;

  return {
    year,
    totalListeningTimeSeconds,
    totalEpisodesCompleted,
    topPodcasts,
    listeningStreaks: {
      currentStreak,
      longestStreak,
    },
    averageDailyListeningTimeSeconds,
    peakListeningHours,
    peakListeningDays,
    newPodcastsDiscovered,
    firstEpisodeOfYear,
    longestEpisode,
    genreBreakdown,
    completionRate,
  };
}
