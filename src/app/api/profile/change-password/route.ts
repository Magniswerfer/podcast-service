import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { authenticateRequestUnified } from '@/lib/auth-unified';
import { db } from '@/lib/db';
import { changePasswordSchema } from '@/types/api';

/**
 * POST /api/profile/change-password
 * Change user password
 */
export async function POST(request: NextRequest) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const body = await request.json();
    const validated = changePasswordSchema.parse(body);

    // Get current user with password hash
    const currentUser = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If user has a password set, require current password
    if (currentUser.passwordHash) {
      if (!validated.currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required' },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(validated.currentPassword, currentUser.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        );
      }
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(validated.newPassword, 10);

    // Update the password
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
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

    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
