import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequestUnified } from '@/lib/auth-unified';
import { db } from '@/lib/db';
import { updateProfileSchema } from '@/types/api';

/**
 * GET /api/profile
 * Get current user profile
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const fullUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        apiKey: true,
        defaultSettings: true,
        createdAt: true,
        passwordHash: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Mask API key - show first 8 and last 4 characters
    const maskedApiKey = fullUser.apiKey.length > 12
      ? `${fullUser.apiKey.slice(0, 8)}${'*'.repeat(fullUser.apiKey.length - 12)}${fullUser.apiKey.slice(-4)}`
      : fullUser.apiKey;

    return NextResponse.json({
      id: fullUser.id,
      email: fullUser.email,
      apiKey: maskedApiKey,
      fullApiKey: fullUser.apiKey, // Include full key for copying
      defaultSettings: fullUser.defaultSettings || {},
      createdAt: fullUser.createdAt,
      hasPassword: !!fullUser.passwordHash,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/profile
 * Update user profile settings
 */
export async function PATCH(request: NextRequest) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const body = await request.json();
    const validated = updateProfileSchema.parse(body);

    // Get current settings
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: { defaultSettings: true },
    });

    // Merge with existing settings
    const existingSettings = (currentUser?.defaultSettings as Record<string, unknown>) || {};
    const updatedSettings = {
      ...existingSettings,
      ...validated.defaultSettings,
    };

    // Remove undefined values
    Object.keys(updatedSettings).forEach(key => {
      if (updatedSettings[key] === undefined) {
        delete updatedSettings[key];
      }
    });

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        defaultSettings: updatedSettings,
      },
      select: {
        id: true,
        email: true,
        defaultSettings: true,
      },
    });

    return NextResponse.json({
      success: true,
      defaultSettings: updatedUser.defaultSettings,
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as { errors?: Array<{ path?: string[]; message?: string }> };
      const errors = zodError.errors?.map((e) => ({
        path: e.path?.join('.') || 'unknown',
        message: e.message || 'Validation error',
      }));
      return NextResponse.json(
        { error: 'Invalid request data', details: errors },
        { status: 400 }
      );
    }

    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
