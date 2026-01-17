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

4. **Set Ports (Optional):**
   - Default ports: App on `3000`, Database on `5432`
   - To change: Add `APP_PORT` and/or `POSTGRES_PORT` environment variables
   - See "Port Configuration" section below for details

5. **Access your application:**
   - The app will be available at `http://localhost:${APP_PORT:-3000}`
   - Database is accessible on `localhost:${POSTGRES_PORT:-5432}`

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

- `APP_PORT`: Port for the web application (default: 3000)
- `POSTGRES_PORT`: External port for PostgreSQL database (default: 5432)
- `API_KEY_LENGTH`: Length of generated API keys (default: 32)
- `ITUNES_API_BASE_URL`: iTunes API base URL (default: https://itunes.apple.com)
- `NODE_ENV`: Set to `production` (automatically set in docker-compose.yml)

### Port Configuration

You can customize the ports by setting environment variables in Portainer:

1. **In Portainer Stack Editor:**
   - Go to **Stacks** → Your stack → **Editor**
   - Add to the environment section or use Portainer's **Environment** tab:
     ```yaml
     # In docker-compose.yml or as environment variables
     APP_PORT: 8080        # Change app port from default 3000
     POSTGRES_PORT: 5433   # Change DB port from default 5432
     ```

2. **Access your application:**
   - App: `http://localhost:${APP_PORT}` (default: `http://localhost:3000`)
   - Database: `localhost:${POSTGRES_PORT}` (default: `localhost:5432`)

**Note:** The internal container ports (3000 for app, 5432 for postgres) remain the same - only the external/host ports are configurable.

## Database Migrations

Prisma migrations run automatically on container startup via the `command` in docker-compose.yml. This means:
- When you update the app, migrations run automatically
- Your existing data is preserved
- Only schema changes are applied (new tables, columns, etc.)
- No data loss occurs

To run migrations manually:
```bash
docker exec -it podcast-app npx prisma migrate deploy
```

**Note:** Migrations are safe - they only add/modify schema, they don't delete your data unless explicitly designed to do so.

## Updating the Application

### ⚠️ Important: Your Database is Safe!

**Your database data will NOT be lost when updating!** The `postgres_data` volume persists all your data between updates. Only the application code gets updated.

### If deployed from GitHub:

**Method 1: Pull and Redeploy (Recommended)**
1. Push your changes to GitHub
2. In Portainer: **Stacks** → Your stack → **Editor**
3. Click **Pull and redeploy** button
   - This pulls the latest code from GitHub
   - Rebuilds the app container with new code
   - **Keeps your database volume intact**
   - Preserves your environment variables

**Method 2: Manual Update**
1. Push your changes to GitHub
2. In Portainer: **Stacks** → Your stack → **Editor**
3. Click **Update the stack**
4. Portainer will:
   - Pull latest code from GitHub
   - Rebuild the app image
   - Restart containers with new code
   - **Database volume remains untouched**

### If deployed locally:

1. Pull latest code to your local machine
2. Rebuild the image: `docker build -t podcast-service:latest .`
3. In Portainer: **Stacks** → Your stack → **Editor** → **Update the stack**

### What Gets Updated vs Preserved:

✅ **Updated (Replaced):**
- Application code
- Application container
- Dependencies (npm packages)
- Prisma migrations (run automatically)

✅ **Preserved (Not Touched):**
- Database data (stored in `postgres_data` volume)
- Environment variables you set in Portainer
- Custom port configurations
- Database container (only restarted if needed)

### Environment Variables During Updates:

When you update, Portainer preserves environment variables you've set. However, if you add new environment variables to `docker-compose.yml`, you may need to:
1. Update the stack
2. Add the new variables in Portainer's **Environment** section
3. Redeploy

**Tip:** Store your custom environment variables (like `SESSION_SECRET`, `CRON_SECRET`, `APP_PORT`) in Portainer's **Environment** section rather than editing `docker-compose.yml` directly. This way they persist across updates.

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
