import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().min(8).optional()
  ),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.preprocess(
    (val) => (val === '' || val === null ? undefined : val),
    z.string().min(8).optional()
  ),
});

// Podcast schemas
export const subscribeSchema = z.object({
  feedUrl: z.string().url(),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

// Episode schemas
export const episodesQuerySchema = z.object({
  podcastId: z.preprocess(
    (val) => (val === null || val === '' ? undefined : val),
    z.string().uuid().optional()
  ),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional(),
  filter: z.enum(['all', 'unplayed', 'uncompleted', 'in-progress']).optional().default('all'),
  sort: z.enum(['newest', 'oldest']).optional().default('newest'),
});

// Subscription settings schema
export const subscriptionSettingsSchema = z.object({
  episodeFilter: z.enum(['all', 'unplayed', 'uncompleted', 'in-progress']).optional(),
  episodeSort: z.enum(['newest', 'oldest']).optional(),
});

// Profile schemas
export const updateProfileSchema = z.object({
  defaultSettings: z.object({
    episodeFilter: z.enum(['all', 'unplayed', 'uncompleted', 'in-progress']).optional(),
    episodeSort: z.enum(['newest', 'oldest']).optional(),
    dateFormat: z.enum(['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).optional(),
  }).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8),
});

// Progress schemas
export const progressUpdateSchema = z.object({
  episodeId: z.string().uuid(),
  positionSeconds: z.number().int().min(0),
  durationSeconds: z.number().int().min(0).optional(),
  completed: z.boolean().optional(),
});

export const bulkProgressUpdateSchema = z.object({
  updates: z.array(progressUpdateSchema).min(1).max(100),
});

// Queue schemas
export const addToQueueSchema = z.object({
  episodeId: z.string().uuid(),
});

export const reorderQueueSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      position: z.number().int().min(0),
    })
  ).min(1),
});

// Playlist schemas
export const createPlaylistSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

export const updatePlaylistSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
});

export const addPlaylistItemSchema = z.object({
  podcastId: z.string().uuid().optional(),
  episodeId: z.string().uuid().optional(),
  position: z.number().int().min(0).optional(),
}).refine(
  (data) => data.podcastId || data.episodeId,
  {
    message: "Either podcastId or episodeId must be provided",
  }
);

export const updatePlaylistItemPositionSchema = z.object({
  position: z.number().int().min(0),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type EpisodesQuery = z.infer<typeof episodesQuerySchema>;
export type ProgressUpdate = z.infer<typeof progressUpdateSchema>;
export type BulkProgressUpdate = z.infer<typeof bulkProgressUpdateSchema>;
export type AddToQueueInput = z.infer<typeof addToQueueSchema>;
export type ReorderQueueInput = z.infer<typeof reorderQueueSchema>;
export type CreatePlaylistInput = z.infer<typeof createPlaylistSchema>;
export type UpdatePlaylistInput = z.infer<typeof updatePlaylistSchema>;
export type AddPlaylistItemInput = z.infer<typeof addPlaylistItemSchema>;
export type UpdatePlaylistItemPositionInput = z.infer<typeof updatePlaylistItemPositionSchema>;
export type SubscriptionSettingsInput = z.infer<typeof subscriptionSettingsSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
