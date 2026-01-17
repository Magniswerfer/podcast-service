import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './session';
import { authenticateRequest } from './auth';

/**
 * Unified authentication that supports both:
 * 1. Session-based auth (for web app) - checks cookies
 * 2. API key auth (for external clients) - checks Authorization header
 */
export async function authenticateRequestUnified(
  request: NextRequest
): Promise<{ user: { id: string; email: string; apiKey: string } } | NextResponse> {
  // First try session-based auth (for web app)
  const session = await getSession();
  if (session) {
    // Normalize session data to match API key auth format (userId -> id)
    return {
      user: {
        id: session.userId,
        email: session.email,
        apiKey: session.apiKey,
      },
    };
  }

  // Fall back to API key auth (for external clients like iOS app)
  return authenticateRequest(request);
}
