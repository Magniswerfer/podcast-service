import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { db } from './db';

const secretKey = process.env.SESSION_SECRET || 'default-secret-key-change-in-production';
const encodedKey = new TextEncoder().encode(secretKey);

export interface SessionData {
  userId: string;
  email: string;
  apiKey: string;
  [key: string]: unknown;
}

/**
 * Create a session token
 */
export async function createSession(data: SessionData): Promise<string> {
  const token = await new SignJWT(data)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(encodedKey);

  return token;
}

/**
 * Verify and decode session token
 */
export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey);
    return payload as SessionData;
  } catch (error) {
    return null;
  }
}

/**
 * Get current session from cookies
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}

/**
 * Set session cookie
 */
export async function setSession(data: SessionData): Promise<void> {
  const token = await createSession(data);
  const cookieStore = await cookies();
  
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

/**
 * Clear session cookie
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

/**
 * Get user from session
 */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      apiKey: true,
    },
  });

  return user;
}
