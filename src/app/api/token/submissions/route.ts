import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - List all media submissions for a token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const accessToken = await db.accessToken.findUnique({
      where: { token },
      include: { contract: true },
    });

    if (!accessToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    const submissions = await db.mediaSubmission.findMany({
      where: { contractId: accessToken.contractId },
      include: { requirement: true },
      orderBy: { uploadedAt: 'desc' },
    });

    return NextResponse.json({ submissions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
