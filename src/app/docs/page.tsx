export default function DocsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-white mb-2">API Documentation</h1>
      <p className="text-[#a0a0a0] mb-8">
        Complete API reference for iOS app integration and other external clients.
      </p>

      {/* Table of Contents */}
      <div className="mb-12 p-6 bg-[#1f1f1f] rounded-[20px] border border-[#2a2a2a]">
        <h2 className="text-xl font-semibold text-white mb-4">Table of Contents</h2>
        <ul className="space-y-2 text-[#a0a0a0]">
          <li><a href="#authentication" className="hover:text-white transition-colors">Authentication</a></li>
          <li><a href="#podcasts" className="hover:text-white transition-colors">Podcasts</a></li>
          <li><a href="#episodes" className="hover:text-white transition-colors">Episodes</a></li>
          <li><a href="#progress" className="hover:text-white transition-colors">Progress</a></li>
          <li><a href="#queue" className="hover:text-white transition-colors">Queue</a></li>
          <li><a href="#playlists" className="hover:text-white transition-colors">Playlists</a></li>
          <li><a href="#stats" className="hover:text-white transition-colors">Stats</a></li>
          <li><a href="#cron-jobs" className="hover:text-white transition-colors">Cron Jobs (Internal)</a></li>
        </ul>
      </div>

      {/* Authentication Section */}
      <section id="authentication" className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-6">Authentication</h2>
        <p className="text-[#a0a0a0] mb-6">
          All API endpoints (except authentication endpoints) require authentication via API key.
          Include the API key in the Authorization header:
        </p>
        <div className="bg-[#1f1f1f] rounded-[12px] p-4 mb-6 border border-[#2a2a2a]">
          <code className="text-sm text-white font-mono">
            Authorization: Bearer {'<api_key>'}
          </code>
        </div>

        <div className="space-y-8">
          {/* Register */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#FF3B30] text-white text-sm font-semibold rounded-[8px]">POST</span>
              <code className="text-white font-mono text-lg">/api/auth/register</code>
              <span className="px-2 py-1 bg-[#2a2a2a] text-[#a0a0a0] text-xs rounded">No Auth</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Create a new user account and receive an API key.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Request Body:</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "email": "user@example.com",
  "password": "optional_password" // Optional, min 8 characters
}`}</code>
              </pre>
            </div>

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (201):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "apiKey": "your_api_key_here"
  }
}`}</code>
              </pre>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-2">Error Responses:</h4>
              <ul className="text-[#a0a0a0] text-sm space-y-1 ml-4">
                <li>• <strong>400:</strong> Invalid request data</li>
                <li>• <strong>409:</strong> User with this email already exists</li>
              </ul>
            </div>
          </div>

          {/* Login */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#FF3B30] text-white text-sm font-semibold rounded-[8px]">POST</span>
              <code className="text-white font-mono text-lg">/api/auth/login</code>
              <span className="px-2 py-1 bg-[#2a2a2a] text-[#a0a0a0] text-xs rounded">No Auth</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Authenticate and receive your API key.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Request Body:</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "email": "user@example.com",
  "password": "optional_password" // Optional if account has no password
}`}</code>
              </pre>
            </div>

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (200):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "apiKey": "your_api_key_here"
  }
}`}</code>
              </pre>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-2">Error Responses:</h4>
              <ul className="text-[#a0a0a0] text-sm space-y-1 ml-4">
                <li>• <strong>400:</strong> Invalid request data</li>
                <li>• <strong>401:</strong> Invalid email or password</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Podcasts Section */}
      <section id="podcasts" className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-6">Podcasts</h2>

        <div className="space-y-8">
          {/* List Podcasts */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#4CAF50] text-white text-sm font-semibold rounded-[8px]">GET</span>
              <code className="text-white font-mono text-lg">/api/podcasts</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Get all podcasts the user is subscribed to.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (200):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "podcasts": [
    {
      "id": "uuid",
      "title": "Podcast Title",
      "description": "Description",
      "feedUrl": "https://...",
      "artworkUrl": "https://...",
      "author": "Author Name",
      "subscribedAt": "2025-01-01T00:00:00Z",
      "episodeCount": 100,
      "customSettings": {}
    }
  ]
}`}</code>
              </pre>
            </div>
          </div>

          {/* Subscribe */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#FF3B30] text-white text-sm font-semibold rounded-[8px]">POST</span>
              <code className="text-white font-mono text-lg">/api/podcasts/subscribe</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Subscribe to a podcast by RSS feed URL.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Request Body:</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "feedUrl": "https://example.com/feed.xml"
}`}</code>
              </pre>
            </div>

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (201):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "podcast": {
    "id": "uuid",
    "title": "Podcast Title",
    "subscribedAt": "2025-01-01T00:00:00Z",
    "episodeCount": 100
  }
}`}</code>
              </pre>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-2">Error Responses:</h4>
              <ul className="text-[#a0a0a0] text-sm space-y-1 ml-4">
                <li>• <strong>400:</strong> Invalid request data</li>
                <li>• <strong>409:</strong> Already subscribed to this podcast</li>
              </ul>
            </div>
          </div>

          {/* Unsubscribe */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#f44336] text-white text-sm font-semibold rounded-[8px]">DELETE</span>
              <code className="text-white font-mono text-lg">/api/podcasts/{'{id}'}</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Unsubscribe from a podcast.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (200):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "success": true
}`}</code>
              </pre>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-2">Error Responses:</h4>
              <ul className="text-[#a0a0a0] text-sm space-y-1 ml-4">
                <li>• <strong>404:</strong> Subscription not found</li>
              </ul>
            </div>
          </div>

          {/* Search */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#4CAF50] text-white text-sm font-semibold rounded-[8px]">GET</span>
              <code className="text-white font-mono text-lg">/api/podcasts/search</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Search for podcasts on iTunes.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Query Parameters:</h4>
              <ul className="text-[#a0a0a0] text-sm space-y-1 ml-4">
                <li>• <strong>q</strong> (required): Search query</li>
                <li>• <strong>limit</strong> (optional): Results limit (1-200, default: 50)</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Example:</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">GET /api/podcasts/search?q=tech&limit=20</code>
              </pre>
            </div>

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (200):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "results": [
    {
      "title": "Podcast Title",
      "feedUrl": "https://...",
      "artworkUrl": "https://...",
      "author": "Author Name"
    }
  ],
  "count": 20
}`}</code>
              </pre>
            </div>
          </div>

          {/* Refresh Feed */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#FF3B30] text-white text-sm font-semibold rounded-[8px]">POST</span>
              <code className="text-white font-mono text-lg">/api/podcasts/{'{id}'}/refresh</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Force refresh a podcast feed to fetch new episodes.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (200):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "success": true,
  "episodesAdded": 5
}`}</code>
              </pre>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-2">Error Responses:</h4>
              <ul className="text-[#a0a0a0] text-sm space-y-1 ml-4">
                <li>• <strong>404:</strong> Subscription not found</li>
                <li>• <strong>500:</strong> Failed to refresh feed</li>
              </ul>
            </div>
          </div>

          {/* Update Settings */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#2196F3] text-white text-sm font-semibold rounded-[8px]">PATCH</span>
              <code className="text-white font-mono text-lg">/api/podcasts/{'{id}'}/settings</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Update subscription-specific settings (episode filter and sort preferences).</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Request Body:</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "episodeFilter": "all" | "unplayed" | "uncompleted" | "in-progress", // Optional
  "episodeSort": "newest" | "oldest" // Optional
}`}</code>
              </pre>
            </div>

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (200):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "success": true,
  "customSettings": {
    "episodeFilter": "unplayed",
    "episodeSort": "newest"
  }
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Episodes Section */}
      <section id="episodes" className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-6">Episodes</h2>

        <div className="space-y-8">
          {/* List Episodes */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#4CAF50] text-white text-sm font-semibold rounded-[8px]">GET</span>
              <code className="text-white font-mono text-lg">/api/episodes</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Get episodes from subscribed podcasts with filtering and pagination.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Query Parameters:</h4>
              <ul className="text-[#a0a0a0] text-sm space-y-1 ml-4">
                <li>• <strong>podcastId</strong> (optional): Filter by podcast UUID</li>
                <li>• <strong>limit</strong> (optional): Results per page (1-100, default: 20)</li>
                <li>• <strong>offset</strong> (optional): Pagination offset (default: 0)</li>
                <li>• <strong>fromDate</strong> (optional): ISO datetime string - filter episodes published after</li>
                <li>• <strong>toDate</strong> (optional): ISO datetime string - filter episodes published before</li>
                <li>• <strong>filter</strong> (optional): "all" | "unplayed" | "uncompleted" | "in-progress" (default: "all")</li>
                <li>• <strong>sort</strong> (optional): "newest" | "oldest" (default: "newest")</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Example:</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">GET /api/episodes?podcastId=uuid&limit=50&filter=unplayed&sort=newest</code>
              </pre>
            </div>

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (200):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "episodes": [
    {
      "id": "uuid",
      "title": "Episode Title",
      "description": "Description",
      "audioUrl": "https://...",
      "publishedAt": "2025-01-01T00:00:00Z",
      "durationSeconds": 3600,
      "artworkUrl": "https://...",
      "podcast": {
        "id": "uuid",
        "title": "Podcast Title",
        "artworkUrl": "https://..."
      },
      "progress": {
        "positionSeconds": 1200,
        "durationSeconds": 3600,
        "completed": false
      } // or null if not started
    }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}`}</code>
              </pre>
            </div>
          </div>

          {/* Get Episode */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#4CAF50] text-white text-sm font-semibold rounded-[8px]">GET</span>
              <code className="text-white font-mono text-lg">/api/episodes/{'{id}'}</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Get detailed information about a specific episode.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (200):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "id": "uuid",
  "title": "Episode Title",
  "description": "Full description",
  "audioUrl": "https://...",
  "publishedAt": "2025-01-01T00:00:00Z",
  "durationSeconds": 3600,
  "artworkUrl": "https://...",
  "podcast": {
    "id": "uuid",
    "title": "Podcast Title",
    "artworkUrl": "https://..."
  },
  "progress": {
    "positionSeconds": 1200,
    "durationSeconds": 3600,
    "completed": false,
    "lastUpdatedAt": "2025-01-01T00:00:00Z"
  } // or null
}`}</code>
              </pre>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-2">Error Responses:</h4>
              <ul className="text-[#a0a0a0] text-sm space-y-1 ml-4">
                <li>• <strong>403:</strong> Not subscribed to this podcast</li>
                <li>• <strong>404:</strong> Episode not found</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Section */}
      <section id="progress" className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-6">Progress</h2>

        <div className="space-y-8">
          {/* Get Progress */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#4CAF50] text-white text-sm font-semibold rounded-[8px]">GET</span>
              <code className="text-white font-mono text-lg">/api/progress</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Get all listening progress records.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (200):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "progress": [
    {
      "id": "uuid",
      "episodeId": "uuid",
      "positionSeconds": 1200,
      "durationSeconds": 3600,
      "completed": false,
      "lastUpdatedAt": "2025-01-01T00:00:00Z",
      "episode": {
        "id": "uuid",
        "title": "Episode Title",
        "podcast": {
          "id": "uuid",
          "title": "Podcast Title"
        }
      }
    }
  ]
}`}</code>
              </pre>
            </div>
          </div>

          {/* Bulk Update Progress */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#FF3B30] text-white text-sm font-semibold rounded-[8px]">POST</span>
              <code className="text-white font-mono text-lg">/api/progress</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Bulk update listening progress for multiple episodes (up to 100 at once).</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Request Body:</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "updates": [
    {
      "episodeId": "uuid",
      "positionSeconds": 1200,
      "durationSeconds": 3600, // Optional
      "completed": false // Optional
    }
  ]
}`}</code>
              </pre>
            </div>

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (200):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "results": [
    {
      "episodeId": "uuid",
      "success": true,
      "progress": { ... }
    },
    {
      "episodeId": "uuid",
      "success": false,
      "error": "Episode not found"
    }
  ]
}`}</code>
              </pre>
            </div>
          </div>

          {/* Update Single Progress */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#2196F3] text-white text-sm font-semibold rounded-[8px]">PUT</span>
              <code className="text-white font-mono text-lg">/api/progress/{'{episode_id}'}</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Update listening progress for a single episode.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Request Body:</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "positionSeconds": 1200,
  "durationSeconds": 3600, // Optional
  "completed": false // Optional
}`}</code>
              </pre>
            </div>

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (200):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "progress": {
    "id": "uuid",
    "episodeId": "uuid",
    "positionSeconds": 1200,
    "durationSeconds": 3600,
    "completed": false,
    "lastUpdatedAt": "2025-01-01T00:00:00Z"
  }
}`}</code>
              </pre>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-2">Error Responses:</h4>
              <ul className="text-[#a0a0a0] text-sm space-y-1 ml-4">
                <li>• <strong>400:</strong> Invalid request data</li>
                <li>• <strong>403:</strong> Not subscribed to this podcast</li>
                <li>• <strong>404:</strong> Episode not found</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Queue Section */}
      <section id="queue" className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-6">Queue</h2>

        <div className="space-y-8">
          {/* Get Queue */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#4CAF50] text-white text-sm font-semibold rounded-[8px]">GET</span>
              <code className="text-white font-mono text-lg">/api/queue</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Get the user's listening queue, ordered by position.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (200):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "queue": [
    {
      "id": "uuid",
      "episodeId": "uuid",
      "position": 0,
      "episode": {
        "id": "uuid",
        "title": "Episode Title",
        "audioUrl": "https://...",
        "podcast": {
          "id": "uuid",
          "title": "Podcast Title"
        },
        "progress": {
          "positionSeconds": 0,
          "completed": false
        } // or null
      }
    }
  ]
}`}</code>
              </pre>
            </div>
          </div>

          {/* Add to Queue */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#FF3B30] text-white text-sm font-semibold rounded-[8px]">POST</span>
              <code className="text-white font-mono text-lg">/api/queue</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Add an episode to the end of the queue.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Request Body:</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "episodeId": "uuid"
}`}</code>
              </pre>
            </div>

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (201):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "queueItem": { ... },
  "queue": [ ... ] // Full updated queue
}`}</code>
              </pre>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-2">Error Responses:</h4>
              <ul className="text-[#a0a0a0] text-sm space-y-1 ml-4">
                <li>• <strong>400:</strong> Invalid request data</li>
                <li>• <strong>403:</strong> Not subscribed to this podcast</li>
                <li>• <strong>404:</strong> Episode not found</li>
                <li>• <strong>409:</strong> Episode already in queue</li>
              </ul>
            </div>
          </div>

          {/* Reorder Queue */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#2196F3] text-white text-sm font-semibold rounded-[8px]">PUT</span>
              <code className="text-white font-mono text-lg">/api/queue</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Reorder queue items by updating their positions.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Request Body:</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "items": [
    {
      "id": "queue_item_uuid",
      "position": 0
    },
    {
      "id": "queue_item_uuid",
      "position": 1
    }
  ]
}`}</code>
              </pre>
            </div>

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (200):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "queue": [ ... ] // Full updated queue
}`}</code>
              </pre>
            </div>
          </div>

          {/* Clear Queue */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#f44336] text-white text-sm font-semibold rounded-[8px]">DELETE</span>
              <code className="text-white font-mono text-lg">/api/queue</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Clear all items from the queue. Optionally preserve the currently playing episode.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Query Parameters:</h4>
              <ul className="text-[#a0a0a0] text-sm space-y-1 ml-4">
                <li>• <strong>currentEpisodeId</strong> (optional): Preserve this episode in the queue</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Example:</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">DELETE /api/queue?currentEpisodeId=uuid</code>
              </pre>
            </div>

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (200):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "success": true,
  "queue": [ ... ] // Remaining queue (may contain current episode)
}`}</code>
              </pre>
            </div>
          </div>

          {/* Remove from Queue */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#f44336] text-white text-sm font-semibold rounded-[8px]">DELETE</span>
              <code className="text-white font-mono text-lg">/api/queue/{'{id}'}</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Remove a specific item from the queue.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (200):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "success": true
}`}</code>
              </pre>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-2">Error Responses:</h4>
              <ul className="text-[#a0a0a0] text-sm space-y-1 ml-4">
                <li>• <strong>403:</strong> Unauthorized (not your queue item)</li>
                <li>• <strong>404:</strong> Queue item not found</li>
              </ul>
            </div>
          </div>

          {/* Play Next */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#FF3B30] text-white text-sm font-semibold rounded-[8px]">POST</span>
              <code className="text-white font-mono text-lg">/api/queue/play-next</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Add an episode to play immediately after the currently playing episode.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Request Body:</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "episodeId": "uuid",
  "currentEpisodeId": "uuid" // Optional: ID of currently playing episode
}`}</code>
              </pre>
            </div>

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (201):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "queueItem": { ... },
  "queue": [ ... ] // Full updated queue
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Playlists Section */}
      <section id="playlists" className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-6">Playlists</h2>

        <div className="space-y-8">
          {/* List Playlists */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#4CAF50] text-white text-sm font-semibold rounded-[8px]">GET</span>
              <code className="text-white font-mono text-lg">/api/playlists</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Get all playlists created by the user.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (200):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "playlists": [
    {
      "id": "uuid",
      "name": "My Playlist",
      "description": "Description",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z",
      "_count": {
        "items": 10
      }
    }
  ]
}`}</code>
              </pre>
            </div>
          </div>

          {/* Create Playlist */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#FF3B30] text-white text-sm font-semibold rounded-[8px]">POST</span>
              <code className="text-white font-mono text-lg">/api/playlists</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Create a new playlist.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Request Body:</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "name": "My Playlist", // Required, 1-200 chars
  "description": "Optional description" // Optional, max 1000 chars
}`}</code>
              </pre>
            </div>

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (201):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "playlist": {
    "id": "uuid",
    "name": "My Playlist",
    "description": "Description",
    "_count": {
      "items": 0
    }
  }
}`}</code>
              </pre>
            </div>
          </div>

          {/* Get Playlist */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#4CAF50] text-white text-sm font-semibold rounded-[8px]">GET</span>
              <code className="text-white font-mono text-lg">/api/playlists/{'{id}'}</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Get a playlist with all its items.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (200):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "playlist": {
    "id": "uuid",
    "name": "My Playlist",
    "items": [
      {
        "id": "uuid",
        "position": 0,
        "podcast": { ... }, // or null
        "episode": {
          "id": "uuid",
          "title": "Episode Title",
          "podcast": { ... }
        } // or null
      }
    ]
  }
}`}</code>
              </pre>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-2">Error Responses:</h4>
              <ul className="text-[#a0a0a0] text-sm space-y-1 ml-4">
                <li>• <strong>403:</strong> Forbidden (not your playlist)</li>
                <li>• <strong>404:</strong> Playlist not found</li>
              </ul>
            </div>
          </div>

          {/* Update Playlist */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#2196F3] text-white text-sm font-semibold rounded-[8px]">PUT</span>
              <code className="text-white font-mono text-lg">/api/playlists/{'{id}'}</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Update playlist name and/or description.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Request Body:</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "name": "Updated Name", // Optional
  "description": "Updated description" // Optional
}`}</code>
              </pre>
            </div>
          </div>

          {/* Delete Playlist */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#f44336] text-white text-sm font-semibold rounded-[8px]">DELETE</span>
              <code className="text-white font-mono text-lg">/api/playlists/{'{id}'}</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Delete a playlist and all its items.</p>
          </div>

          {/* Add Playlist Item */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#FF3B30] text-white text-sm font-semibold rounded-[8px]">POST</span>
              <code className="text-white font-mono text-lg">/api/playlists/{'{id}'}/items</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Add a podcast or episode to a playlist.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Request Body:</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "podcastId": "uuid", // Optional, either podcastId or episodeId required
  "episodeId": "uuid", // Optional
  "position": 0 // Optional, defaults to end
}`}</code>
              </pre>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-2">Error Responses:</h4>
              <ul className="text-[#a0a0a0] text-sm space-y-1 ml-4">
                <li>• <strong>400:</strong> Invalid request data (must provide podcastId or episodeId)</li>
                <li>• <strong>409:</strong> Item already in playlist</li>
              </ul>
            </div>
          </div>

          {/* Update Playlist Item Position */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#2196F3] text-white text-sm font-semibold rounded-[8px]">PUT</span>
              <code className="text-white font-mono text-lg">/api/playlists/{'{id}'}/items/{'{itemId}'}</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Update the position of an item in a playlist.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Request Body:</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "position": 2
}`}</code>
              </pre>
            </div>
          </div>

          {/* Delete Playlist Item */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#f44336] text-white text-sm font-semibold rounded-[8px]">DELETE</span>
              <code className="text-white font-mono text-lg">/api/playlists/{'{id}'}/items/{'{itemId}'}</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Remove an item from a playlist.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-6">Stats</h2>

        <div className="space-y-8">
          {/* Dashboard Stats */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#4CAF50] text-white text-sm font-semibold rounded-[8px]">GET</span>
              <code className="text-white font-mono text-lg">/api/stats/dashboard</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Get dashboard statistics including listening time, completed episodes, and more.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (200):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "stats": {
    "totalListeningTimeSeconds": 36000,
    "totalEpisodesCompleted": 50,
    "totalEpisodesInProgress": 10,
    "totalPodcastsSubscribed": 5
  }
}`}</code>
              </pre>
            </div>
          </div>

          {/* Wrapped Stats */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a]">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#4CAF50] text-white text-sm font-semibold rounded-[8px]">GET</span>
              <code className="text-white font-mono text-lg">/api/stats/wrapped</code>
              <span className="px-2 py-1 bg-[#FF3B30] text-white text-xs rounded">Auth Required</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Get year-end wrapped statistics for a specific year.</p>
            
            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Query Parameters:</h4>
              <ul className="text-[#a0a0a0] text-sm space-y-1 ml-4">
                <li>• <strong>year</strong> (optional): Year to get stats for (default: current year)</li>
              </ul>
            </div>

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Example:</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">GET /api/stats/wrapped?year=2024</code>
              </pre>
            </div>

            <div className="mb-4">
              <h4 className="text-white font-semibold mb-2">Response (200):</h4>
              <pre className="bg-[#1a1a1a] rounded-[8px] p-4 overflow-x-auto border border-[#2a2a2a]">
                <code className="text-sm text-[#a0a0a0] font-mono">{`{
  "stats": {
    "year": 2024,
    "totalListeningTimeSeconds": 360000,
    "topPodcasts": [ ... ],
    "topEpisodes": [ ... ]
  }
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Cron Jobs Section */}
      <section id="cron-jobs" className="mb-12">
        <h2 className="text-3xl font-bold text-white mb-6">Cron Jobs (Internal)</h2>
        <p className="text-[#a0a0a0] mb-6">
          These endpoints are for internal use only (scheduled tasks). They require a CRON_SECRET header
          and should not be called by iOS applications.
        </p>

        <div className="space-y-8">
          {/* Refresh Feeds */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a] opacity-75">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#FF3B30] text-white text-sm font-semibold rounded-[8px]">POST</span>
              <code className="text-white font-mono text-lg">/api/cron/refresh-feeds</code>
              <span className="px-2 py-1 bg-[#2a2a2a] text-[#a0a0a0] text-xs rounded">CRON_SECRET</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Refresh all podcast feeds. Called automatically every 6 hours.</p>
          </div>

          {/* Cleanup */}
          <div className="bg-[#1f1f1f] rounded-[20px] p-6 border border-[#2a2a2a] opacity-75">
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#FF3B30] text-white text-sm font-semibold rounded-[8px]">POST</span>
              <code className="text-white font-mono text-lg">/api/cron/cleanup</code>
              <span className="px-2 py-1 bg-[#2a2a2a] text-[#a0a0a0] text-xs rounded">CRON_SECRET</span>
            </div>
            <p className="text-[#a0a0a0] mb-4">Run daily cleanup tasks. Called automatically once per day.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-[#2a2a2a] text-center text-[#a0a0a0] text-sm">
        <p>API Documentation for Podcast Sync Service</p>
        <p className="mt-2">For questions or support, please contact the development team.</p>
      </div>
    </div>
  );
}
