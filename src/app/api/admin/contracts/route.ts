import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

function calculateMaltaTokenExpiry(): Date {
  // Token expires at 4:30 AM next day in Malta timezone (Europe/Malta = UTC+1, DST = UTC+2)
  const now = new Date();
  // Convert to Malta time
  const maltaOffset = getMaltaOffset(now);
  const maltaNow = new Date(now.getTime() + maltaOffset * 60 * 1000);
  
  // Next day at 4:30 AM Malta time
  const nextDay = new Date(maltaNow);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(4, 30, 0, 0);
  
  // Convert back to UTC
  const utcExpiry = new Date(nextDay.getTime() - maltaOffset * 60 * 1000);
  return utcExpiry;
}

function getMaltaOffset(date: Date): number {
  // Malta is UTC+1 in winter (CET) and UTC+2 in summer (CEST)
  // Simplified: check if DST applies (last Sunday of March to last Sunday of October)
  const year = date.getFullYear();
  const marchLastSunday = getLastSunday(year, 2); // March
  const octoberLastSunday = getLastSunday(year, 9); // October
  
  const maltaTime = new Date(date.getTime() + 60 * 1000); // Start with UTC+1
  const maltaMs = maltaTime.getTime();
  
  if (maltaMs >= marchLastSunday.getTime() && maltaMs < octoberLastSunday.getTime()) {
    return 120; // CEST = UTC+2
  }
  return 60; // CET = UTC+1
}

function getLastSunday(year: number, month: number): Date {
  const lastDay = new Date(year, month + 1, 0); // Last day of the month
  const day = lastDay.getDay();
  const diff = day === 0 ? 0 : day;
  lastDay.setDate(lastDay.getDate() - diff);
  lastDay.setHours(1, 0, 0, 0); // 1:00 UTC (3:00 Malta in CEST, 2:00 Malta in CET)
  return lastDay;
}

// GET - List all contracts with tokens and media
export async function GET() {
  try {
    const contracts = await db.rentalContract.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tokens: true,
        media: true,
      },
    });
    return NextResponse.json({ contracts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new contract with auto-generated token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractNumber, customerName, customerEmail, customerPhone, vehiclePlate, vehicleModel, vehicleColor } = body;

    if (!contractNumber || !customerName || !vehiclePlate || !vehicleModel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const contract = await db.rentalContract.create({
      data: {
        contractNumber,
        customerName,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        vehiclePlate,
        vehicleModel,
        vehicleColor: vehicleColor || null,
        status: 'pending',
      },
    });

    // Auto-generate token
    const token = await db.accessToken.create({
      data: {
        token: uuidv4(),
        contractId: contract.id,
        expiresAt: calculateMaltaTokenExpiry(),
      },
    });

    const result = await db.rentalContract.findUnique({
      where: { id: contract.id },
      include: { tokens: true, media: true },
    });

    return NextResponse.json({ contract: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update contract
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, contractNumber, customerName, customerEmail, customerPhone, vehiclePlate, vehicleModel, vehicleColor, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing contract id' }, { status: 400 });
    }

    const contract = await db.rentalContract.update({
      where: { id },
      data: {
        contractNumber,
        customerName,
        customerEmail,
        customerPhone,
        vehiclePlate,
        vehicleModel,
        vehicleColor,
        status,
      },
      include: { tokens: true, media: true },
    });

    return NextResponse.json({ contract });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete contract
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing contract id' }, { status: 400 });
    }

    await db.rentalContract.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
