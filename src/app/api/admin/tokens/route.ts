import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

function calculateMaltaTokenExpiry(): Date {
  const now = new Date();
  const maltaOffset = getMaltaOffset(now);
  const maltaNow = new Date(now.getTime() + maltaOffset * 60 * 1000);
  const nextDay = new Date(maltaNow);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(4, 30, 0, 0);
  const utcExpiry = new Date(nextDay.getTime() - maltaOffset * 60 * 1000);
  return utcExpiry;
}

function getMaltaOffset(date: Date): number {
  const year = date.getFullYear();
  const marchLastSunday = getLastSunday(year, 2);
  const octoberLastSunday = getLastSunday(year, 9);
  const maltaTime = new Date(date.getTime() + 60 * 1000);
  const maltaMs = maltaTime.getTime();
  if (maltaMs >= marchLastSunday.getTime() && maltaMs < octoberLastSunday.getTime()) {
    return 120;
  }
  return 60;
}

function getLastSunday(year: number, month: number): Date {
  const lastDay = new Date(year, month + 1, 0);
  const day = lastDay.getDay();
  const diff = day === 0 ? 0 : day;
  lastDay.setDate(lastDay.getDate() - diff);
  lastDay.setHours(1, 0, 0, 0);
  return lastDay;
}

// POST - Generate a new token for a contract
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractId } = body;

    if (!contractId) {
      return NextResponse.json({ error: 'Missing contractId' }, { status: 400 });
    }

    const contract = await db.rentalContract.findUnique({ where: { id: contractId } });
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const token = await db.accessToken.create({
      data: {
        token: uuidv4(),
        contractId: contract.id,
        expiresAt: calculateMaltaTokenExpiry(),
      },
    });

    return NextResponse.json({ token });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
