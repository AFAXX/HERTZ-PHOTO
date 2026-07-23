import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Submit/finalize the check-in (mark contract completed, mark token used)
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
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    if (accessToken.usedAt) {
      return NextResponse.json({ error: 'Token already used' }, { status: 400 });
    }

    if (accessToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    }

    // Verify all required items have at least one media
    const requirements = await db.photoRequirement.findMany({
      where: { required: true },
    });

    for (const req of requirements) {
      const hasSubmission = accessToken.contract.media.some(m => m.requirementId === req.id);
      if (!hasSubmission) {
        return NextResponse.json({
          error: `Required item "${req.labelEn || req.key}" has no media submission`,
          code: 'incomplete',
        }, { status: 400 });
      }
    }

    // Mark contract as completed
    await db.rentalContract.update({
      where: { id: accessToken.contractId },
      data: { status: 'completed' },
    });

    // Mark token as used
    await db.accessToken.update({
      where: { id: accessToken.id },
      data: { usedAt: new Date() },
    });

    const updatedContract = await db.rentalContract.findUnique({
      where: { id: accessToken.contractId },
      include: { media: true, tokens: true },
    });

    return NextResponse.json({
      success: true,
      contract: updatedContract,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
