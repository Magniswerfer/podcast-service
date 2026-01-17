import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { generateApiKey } from '@/lib/auth';
import { registerSchema } from '@/types/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Generate API key
    const apiKey = generateApiKey(parseInt(process.env.API_KEY_LENGTH || '32', 10));

    // Hash password if provided
    const passwordHash = validated.password
      ? await bcrypt.hash(validated.password, 10)
      : null;

    // Create user
    const user = await db.user.create({
      data: {
        email: validated.email,
        passwordHash,
        apiKey,
      },
      select: {
        id: true,
        email: true,
        apiKey: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          apiKey: user.apiKey,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
