# Deployment Guide for Portainer

This guide explains how to deploy the Podcast Service on Portainer, including GitHub integration.

## Prerequisites

- Portainer installed and running on your localhost
- Docker and Docker Compose installed
- GitHub repository with your code (optional, for GitHub integration)

## Option 1: Deploy from GitHub (Recommended)

Portainer supports deploying directly from GitHub repositories using Docker Compose stacks.

### Steps:

1. **Prepare your repository:**
   - Ensure all files are committed and pushed to GitHub
   - Make sure `.env` files are NOT committed (they're in `.gitignore`)

2. **In Portainer:**
   - Navigate to **Stacks** → **Add Stack**
   - Name your stack (e.g., `podcast-service`)
   - Select **Repository** as the build method
   - Configure:
     - **Repository URL**: `https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git`
     - **Compose path**: `docker-compose.yml`
     - **Reference**: `main` (or your branch name)
   - Click **Deploy the stack**

3. **Set Environment Variables:**
   - After creating the stack, go to **Stacks** → Your stack → **Editor**
   - Add environment variables in the `app` service:
     ```yaml
     environment:
       SESSION_SECRET: your-secret-key-here
       CRON_SECRET: your-cron-secret-here
     ```
   - Or use Portainer's **Environment** section to add them securely

4. **Access your application:**
   - The app will be available at `http://localhost:3000`
   - Database is accessible on `localhost:5432`

## Option 2: Deploy from Local Files

If you prefer to deploy without GitHub:

1. **In Portainer:**
   - Navigate to **Stacks** → **Add Stack**
   - Name your stack (e.g., `podcast-service`)
   - Select **Web editor** or **Upload** as the build method
   - Copy the contents of `docker-compose.yml` into the editor
   - Click **Deploy the stack**

2. **Build the Docker image:**
   - Portainer will build the image automatically from the Dockerfile
   - Or you can build it manually:
     ```bash
     docker build -t podcast-service:latest .
     ```

3. **Set Environment Variables** (same as Option 1)

## Option 3: GitHub Actions + Portainer Webhook (Advanced)

For automatic deployments on push:

1. **Set up a Portainer Webhook:**
   - In Portainer, go to **Stacks** → Your stack → **Webhook**
   - Copy the webhook URL

2. **Create GitHub Actions workflow** (`.github/workflows/deploy.yml`):
   ```yaml
   name: Deploy to Portainer
   
   on:
     push:
       branches: [ main ]
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - name: Trigger Portainer webhook
           run: |
             curl -X POST ${{ secrets.PORTAINER_WEBHOOK_URL }}
   ```

3. **Add webhook URL to GitHub Secrets:**
   - Go to your GitHub repo → **Settings** → **Secrets**
   - Add `PORTAINER_WEBHOOK_URL` with your Portainer webhook URL

## Environment Variables

Required environment variables:

- `DATABASE_URL`: PostgreSQL connection string (automatically set in docker-compose.yml)
- `SESSION_SECRET`: Secret key for session encryption (REQUIRED - change from default!)
- `CRON_SECRET`: Secret for cron job authentication (REQUIRED - change from default!)

Optional environment variables:

- `API_KEY_LENGTH`: Length of generated API keys (default: 32)
- `ITUNES_API_BASE_URL`: iTunes API base URL (default: https://itunes.apple.com)
- `NODE_ENV`: Set to `production` (automatically set in docker-compose.yml)

## Database Migrations

Prisma migrations run automatically on container startup via the `command` in docker-compose.yml.

To run migrations manually:
```bash
docker exec -it podcast-app npx prisma migrate deploy
```

## Updating the Application

### If deployed from GitHub:

1. **Pull latest changes:**
   - In Portainer: **Stacks** → Your stack → **Editor** → **Pull and redeploy**
   - Or manually: **Stacks** → Your stack → **Editor** → Update → **Update the stack**

2. **Rebuild:**
   - Portainer will rebuild the image automatically
   - Or trigger rebuild: **Stacks** → Your stack → **Editor** → **Rebuild**

### If deployed locally:

1. Pull latest code
2. Rebuild the image: `docker build -t podcast-service:latest .`
3. In Portainer: **Stacks** → Your stack → **Editor** → **Update the stack**

## Troubleshooting

### Check logs:
- In Portainer: **Containers** → `podcast-app` → **Logs`
- Or via CLI: `docker logs podcast-app`

### Database connection issues:
- Verify PostgreSQL is healthy: `docker ps`
- Check DATABASE_URL matches docker-compose.yml settings
- Ensure both containers are on the same network

### Build issues:
- Check Dockerfile syntax
- Verify all dependencies in package.json
- Check build logs in Portainer

## Security Notes

⚠️ **IMPORTANT**: 
- Change `SESSION_SECRET` and `CRON_SECRET` in production!
- Don't commit `.env` files to GitHub
- Use Portainer's environment variable management for sensitive data
- Consider using Docker secrets for production deployments
