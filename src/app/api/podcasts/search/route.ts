import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequestUnified } from '@/lib/auth-unified';
import { searchiTunesPodcasts } from '@/lib/itunes';
import { searchQuerySchema } from '@/types/api';

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequestUnified(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limit');

    const validated = searchQuerySchema.parse({
      q: query,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    const results = await searchiTunesPodcasts(validated.q, validated.limit);

    return NextResponse.json({
      results,
      count: results.length,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    console.error('Search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
