# Podcast Sync Service

A full-stack podcast synchronization service built with Next.js 14+, PostgreSQL, Prisma, and TypeScript. Provides API endpoints for iOS app integration and a web-based player interface.

## Features

- **Podcast Management**: Subscribe to podcasts via RSS feed URL or iTunes search
- **Episode Sync**: Automatic RSS feed parsing and episode management
- **Progress Tracking**: Sync listening progress across devices
- **Queue Management**: Build and manage your listening queue
- **Web Player**: Full-featured audio player with speed controls, skip, and more
- **Statistics**: Track listening time, top podcasts, and generate year-end wrapped data
- **Background Jobs**: Automatic feed refresh and cleanup tasks

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: PostgreSQL (via Docker)
- **ORM**: Prisma
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Heroicons

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for PostgreSQL)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd podcast-service
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start PostgreSQL database:
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
npx prisma migrate dev
```

6. Generate Prisma client:
```bash
npx prisma generate
```

7. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Authenticate and get API key

### Podcasts

- `GET /api/podcasts` - List user's subscribed podcasts
- `POST /api/podcasts/subscribe` - Subscribe to a podcast by feed URL
- `DELETE /api/podcasts/{id}/unsubscribe` - Unsubscribe from a podcast
- `GET /api/podcasts/search?q=query` - Search iTunes for podcasts
- `POST /api/podcasts/{id}/refresh` - Force refresh podcast feed

### Episodes

- `GET /api/episodes` - List episodes (paginated, filtered)
- `GET /api/episodes/{id}` - Get episode details

### Progress

- `GET /api/progress` - Get all listening progress
- `POST /api/progress` - Bulk update progress
- `PUT /api/progress/{episode_id}` - Update single episode progress

### Queue

- `GET /api/queue` - Get user's queue
- `POST /api/queue` - Add episode to queue
- `PUT /api/queue` - Reorder queue
- `DELETE /api/queue/{id}` - Remove from queue

### Stats

- `GET /api/stats/dashboard` - Get dashboard statistics
- `GET /api/stats/wrapped?year=2025` - Get year-end wrapped data

### Cron Jobs

- `POST /api/cron/refresh-feeds` - Refresh all podcast feeds (every 6 hours)
- `POST /api/cron/cleanup` - Daily cleanup tasks

## Authentication

All API endpoints (except auth endpoints) require authentication via API key:

```
Authorization: Bearer <api_key>
```

Get your API key by registering or logging in via the auth endpoints.

## Database Schema

The database includes the following models:

- **User**: User accounts with API keys
- **Podcast**: Podcast metadata and feed information
- **Episode**: Individual podcast episodes
- **Subscription**: User podcast subscriptions
- **ListeningHistory**: Playback progress tracking
- **Queue**: User's listening queue
- **Favorite**: Favorite episodes/podcasts (optional)

## Background Jobs

Configure cron jobs to automatically refresh feeds and perform cleanup:

### Vercel Cron (if deploying to Vercel)

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-feeds",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### External Cron Service

Set `CRON_SECRET` environment variable and call endpoints with:
```
Authorization: Bearer <CRON_SECRET>
```

## Development

### Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# View database in Prisma Studio
npx prisma studio
```

### Type Generation

```bash
# Generate Prisma client
npx prisma generate
```

## Project Structure

```
podcast-service/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   ├── podcasts/           # Podcast pages
│   │   ├── discover/           # Discover page
│   │   ├── queue/              # Queue page
│   │   └── stats/              # Stats page
│   ├── components/             # React components
│   ├── lib/                    # Utility functions
│   └── types/                  # TypeScript types
└── docker-compose.yml          # PostgreSQL container
```

## License

MIT
