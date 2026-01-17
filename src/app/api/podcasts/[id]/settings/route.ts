import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequestUnified } from "@/lib/auth-unified";
import { db } from '@/lib/db';
import { subscriptionSettingsSchema } from '@/types/api';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const { id } = await params;
    const podcastId = id;

    // Verify subscription exists
    const subscription = await db.subscription.findUnique({
      where: {
        userId_podcastId: {
          userId: user.id,
          podcastId,
        },
      },
      select: {
        id: true,
        customSettings: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = subscriptionSettingsSchema.parse(body);

    // Merge with existing customSettings
    const existingSettings = (subscription.customSettings as Record<string, unknown>) || {};
    const mergedSettings: Record<string, unknown> = {
      ...existingSettings,
      ...validated,
    };

    // Remove undefined values
    const updatedSettings = Object.fromEntries(
      Object.entries(mergedSettings).filter(([, value]) => value !== undefined)
    );

    // Update subscription
    const updated = await db.subscription.update({
      where: {
        id: subscription.id,
      },
      data: {
        customSettings: updatedSettings as object,
      },
      include: {
        podcast: {
          select: {
            id: true,
            title: true,
            artworkUrl: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      customSettings: updated.customSettings,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    
    // Check if it's a Zod validation error
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      const zodError = error as any;
      const errors = zodError.errors?.map((e: any) => ({
        path: e.path?.join('.') || 'unknown',
        message: e.message || 'Validation error',
      }));
      return NextResponse.json(
        { error: 'Invalid request data', details: errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
