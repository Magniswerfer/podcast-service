# Portainer Deployment Troubleshooting

## Can't Press Deploy Button - Common Issues

### 1. **Missing Stack Name**
- **Problem**: Deploy button is disabled/grayed out
- **Solution**: Make sure you've entered a **Stack name** at the top of the form
- The stack name field is required before deployment

### 2. **Repository Method Issues**

If deploying from GitHub:

**Check these fields:**
- ✅ **Stack name** is filled in
- ✅ **Repository URL** is correct format: `https://github.com/username/repo.git`
- ✅ **Compose path**: `docker-compose.yml` (or leave default)
- ✅ **Reference**: `main`, `master`, or your branch name

**Common problems:**
- **Private repository**: Portainer needs GitHub authentication
  - Go to **Settings** → **Registries** → Add GitHub registry/token
  - Or use **Web editor** method instead
  
- **Invalid URL format**: 
  - Use: `https://github.com/username/repo.git`
  - NOT: `git@github.com:username/repo.git` (SSH won't work)

- **Branch name**: Make sure the branch exists and has the `docker-compose.yml` file

### 3. **Web Editor Method** (Alternative)

If GitHub method isn't working, use Web Editor:

1. **Stacks** → **Add Stack**
2. Select **Web editor** (not Repository)
3. Copy entire contents of `docker-compose.yml` into the editor
4. Fill in **Stack name**
5. Click **Deploy the stack**

### 4. **Validation Errors**

Portainer validates the compose file before allowing deployment. Check for:

- **YAML syntax errors**: Indentation, colons, dashes
- **Missing required fields**: services, version (if needed)
- **Invalid port format**: Should be `"3000:3000"` or `"${VAR:-3000}:3000"`

### 5. **Browser/UI Issues**

- **Clear browser cache** and refresh
- **Try different browser** (Chrome, Firefox, Edge)
- **Check browser console** (F12) for JavaScript errors
- **Disable browser extensions** that might interfere

### 6. **Portainer Version Issues**

Some older Portainer versions have bugs. Try:
- **Update Portainer** to latest version
- **Check Portainer logs** for errors
- **Restart Portainer** container

## Step-by-Step: Deploy from Web Editor (Most Reliable)

1. **Copy docker-compose.yml content:**
   ```bash
   cat docker-compose.yml
   ```
   Copy the entire output

2. **In Portainer:**
   - **Stacks** → **Add Stack**
   - **Stack name**: `podcast-service`
   - Select **Web editor** tab
   - Paste the docker-compose.yml content
   - Click **Deploy the stack**

3. **If deploy button still disabled:**
   - Check for red error messages in the editor
   - Look for syntax highlighting issues
   - Verify YAML is properly formatted

## Alternative: Deploy via Docker CLI First

Test if the compose file works locally:

```bash
# Test the compose file
docker-compose config

# If valid, deploy locally first
docker-compose up -d

# Then import to Portainer:
# Stacks → Add Stack → Upload → Select docker-compose.yml
```

## Still Having Issues?

**Check Portainer logs:**
```bash
docker logs portainer
```

**Verify docker-compose.yml syntax:**
```bash
docker-compose -f docker-compose.yml config
```

**Common error messages:**
- "Invalid compose file" → Check YAML syntax
- "Repository not found" → Check GitHub URL and access
- "Build context not found" → Make sure Dockerfile exists in repo
- "Port already in use" → Change APP_PORT or POSTGRES_PORT
