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
