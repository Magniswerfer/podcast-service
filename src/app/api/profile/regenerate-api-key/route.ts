import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequestUnified } from '@/lib/auth-unified';
import { db } from '@/lib/db';
import { generateApiKey } from '@/lib/auth';

/**
 * POST /api/profile/regenerate-api-key
 * Generate a new API key for the user (invalidates the old one)
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    // Generate a new unique API key
    let newApiKey: string;
    let isUnique = false;

    // Ensure uniqueness
    while (!isUnique) {
      newApiKey = generateApiKey(32);
      const existing = await db.user.findUnique({
        where: { apiKey: newApiKey },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    // Update the user's API key
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        apiKey: newApiKey!,
      },
      select: {
        id: true,
        email: true,
        apiKey: true,
      },
    });

    return NextResponse.json({
      success: true,
      apiKey: updatedUser.apiKey,
      message: 'API key regenerated successfully. Please update any applications using the old key.',
    });
  } catch (error) {
    console.error('Regenerate API key error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
