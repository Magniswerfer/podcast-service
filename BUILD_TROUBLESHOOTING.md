# Build Troubleshooting Guide

## Common Build Errors and Solutions

### Error: "process /bin/sh -c npm run build did not complete successfully"

This error means the Next.js build is failing. Here's how to debug:

#### 1. **Check Build Logs in Portainer**

In Portainer, when the build fails:
- Go to **Stacks** → Your stack → **Logs**
- Look for the actual error message (TypeScript errors, missing files, etc.)

#### 2. **Test Build Locally First**

Before deploying, test the build locally:

```bash
# Make sure you're in the project directory
cd /path/to/podcast-service

# Test Prisma generation
npx prisma generate

# Test the build
npm run build
```

If this fails locally, fix the errors before deploying.

#### 3. **Common Build Issues**

**TypeScript Errors:**
- Check for type errors: `npm run build` locally
- Fix any TypeScript compilation errors
- Ensure all imports are correct

**Missing Dependencies:**
- Run `npm install` locally to ensure package-lock.json is up to date
- Commit `package-lock.json` to Git

**Prisma Issues:**
- Ensure `prisma/schema.prisma` is committed to Git
- The Dockerfile generates Prisma Client automatically

**Environment Variables:**
- The build uses a dummy DATABASE_URL (doesn't need real DB)
- Real DATABASE_URL is set at runtime in docker-compose.yml

#### 4. **Get Detailed Build Output**

To see the actual error, you can:

**Option A: Check Portainer Logs**
- After build fails, check the stack logs
- Look for the specific error message

**Option B: Build Locally with Docker**
```bash
docker build -t podcast-service:test .
```
This will show you the exact error.

**Option C: Enable Verbose Logging**

Temporarily modify Dockerfile to see more output:
```dockerfile
RUN npm run build -- --debug
```

#### 5. **Quick Fixes**

**If Prisma fails:**
- Ensure `prisma/schema.prisma` exists
- Check that `@prisma/client` is in package.json dependencies

**If TypeScript fails:**
- Run `npm run build` locally to see errors
- Fix type errors before deploying

**If dependencies fail:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Commit the new `package-lock.json`

#### 6. **Verify Files Are Committed**

Make sure these files are in your Git repository:
- ✅ `Dockerfile`
- ✅ `docker-compose.yml`
- ✅ `package.json`
- ✅ `package-lock.json`
- ✅ `prisma/schema.prisma`
- ✅ `next.config.ts`
- ✅ `tsconfig.json`
- ✅ All files in `src/` directory

#### 7. **Check .dockerignore**

Ensure `.dockerignore` isn't excluding important files:
- Should NOT exclude `prisma/`
- Should NOT exclude `src/`
- Should exclude `node_modules`, `.next`, `.env*`

## Still Having Issues?

1. **Share the exact error message** from Portainer logs
2. **Test build locally** first: `npm run build`
3. **Check if it's a Portainer-specific issue** by building with Docker CLI
