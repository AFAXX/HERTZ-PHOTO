import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Validate a token and return contract info + checklist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const accessToken = await db.accessToken.findUnique({
      where: { token },
      include: { contract: { include: { media: true } } },
    });

    if (!accessToken) {
      return NextResponse.json({ error: 'Invalid token', code: 'invalid' }, { status: 404 });
    }

    // Check if token is used
    if (accessToken.usedAt) {
      return NextResponse.json({ error: 'Token already used', code: 'used', contract: accessToken.contract }, { status: 400 });
    }

    // Check if token is expired
    if (accessToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Token expired', code: 'expired', contract: accessToken.contract }, { status: 400 });
    }

    // Get photo requirements
    const requirements = await db.photoRequirement.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    // Get media submissions for this contract
    const mediaSubmissions = await db.mediaSubmission.findMany({
      where: { contractId: accessToken.contractId },
    });

    // Build checklist with completion status
    const checklist = requirements.map(req => {
      const submissions = mediaSubmissions.filter(m => m.requirementId === req.id);
      return {
        ...req,
        submissions,
        completed: submissions.length > 0,
        photoCount: submissions.filter(s => s.mediaType === 'photo').length,
        videoCount: submissions.filter(s => s.mediaType === 'video').length,
      };
    });

    return NextResponse.json({
      valid: true,
      contract: accessToken.contract,
      token: accessToken,
      checklist,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
