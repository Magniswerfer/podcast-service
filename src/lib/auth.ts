import { NextRequest, NextResponse } from 'next/server';
import { db } from './db';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    apiKey: string;
  };
}

/**
 * Middleware to authenticate API requests using API key
 * Expects Authorization header: "Bearer <api_key>"
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ user: { id: string; email: string; apiKey: string } } | NextResponse> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized. Missing or invalid Authorization header.' },
      { status: 401 }
    );
  }

  const apiKey = authHeader.substring(7); // Remove "Bearer " prefix

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Unauthorized. API key is required.' },
      { status: 401 }
    );
  }

  const user = await db.user.findUnique({
    where: { apiKey },
    select: {
      id: true,
      email: true,
      apiKey: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized. Invalid API key.' },
      { status: 401 }
    );
  }

  return { user };
}

/**
 * Generate a random API key
 */
export function generateApiKey(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
