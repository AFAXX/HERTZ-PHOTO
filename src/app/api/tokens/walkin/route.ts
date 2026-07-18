import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { sendTokenEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';
import { randomBytes } from 'crypto';

function generateId(): string {
  return randomBytes(12).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const db = getDb();

    const body = await request.json();
    const { customerName, customerEmail, vehicle, model, rentalRef } = body;

    if (!customerName || !customerEmail || !vehicle) {
      return NextResponse.json(
        { error: 'Nome cliente, email e targa sono obbligatori' },
        { status: 400 }
      );
    }

    const EXPIRY_HOURS = 48;
    const tokenUuid = uuidv4();
    const id = generateId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + EXPIRY_HOURS * 60 * 60 * 1000);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || '';

    await db.execute({
      sql: `INSERT INTO Token (id, uuid, customerName, customerEmail, vehicle, model, rentalRef, checkoutDate, status, source, noDamage, createdAt, expiresAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'emailed', 'walkin', 0, ?, ?)`,
      args: [id, tokenUuid, customerName.trim(), customerEmail.trim(), vehicle.trim().toUpperCase(), model?.trim() || null, rentalRef?.trim() || null, now.toISOString(), now.toISOString(), expiresAt.toISOString()],
    });

    // Send email
    try {
      await sendTokenEmail({
        to: customerEmail.trim(),
        customerName: customerName.trim(),
        vehicle: vehicle.trim().toUpperCase(),
        model: model?.trim() || null,
        tokenUuid,
        baseUrl,
      });
    } catch (emailErr) {
      console.error('Walk-in email failed:', emailErr);
      // Still return success — the token is created, email is secondary
    }

    return NextResponse.json({
      id,
      uuid: tokenUuid,
      customerName: customerName.trim(),
      vehicle: vehicle.trim().toUpperCase(),
      link: `/?token=${tokenUuid}`,
    });
  } catch (error) {
    console.error('Walk-in creation error:', error);
    return NextResponse.json(
      { error: 'Errore nella creazione del token walk-in' },
      { status: 500 }
    );
  }
}