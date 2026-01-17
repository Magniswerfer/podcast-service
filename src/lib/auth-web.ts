import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './session';

/**
 * Middleware to authenticate web requests using session cookies
 * Returns user data or redirects to login
 */
export async function authenticateWebRequest(
  request: NextRequest,
  redirectToLogin: boolean = false
): Promise<{ user: { id: string; email: string; apiKey: string } } | NextResponse> {
  const session = await getSession();

  if (!session) {
    if (redirectToLogin) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.json(
      { error: 'Unauthorized. Please log in.' },
      { status: 401 }
    );
  }

  return { user: { id: session.userId, email: session.email, apiKey: session.apiKey } };
}
