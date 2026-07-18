import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { randomBytes } from 'crypto';

function generateId(): string {
  return randomBytes(12).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const db = getDb();

    const body = await request.json();
    const { tokenUuid, photos } = body;

    if (!tokenUuid) {
      return NextResponse.json({ error: 'Token mancante' }, { status: 400 });
    }

    const tokenResult = await db.execute({
      sql: 'SELECT * FROM Token WHERE uuid = ?',
      args: [tokenUuid],
    });

    const token = tokenResult.rows[0];
    if (!token) {
      return NextResponse.json({ error: 'Token non trovato' }, { status: 404 });
    }
    if (token.status === 'used') {
      return NextResponse.json({ error: 'Token gia utilizzato' }, { status: 410 });
    }
    if (token.status === 'expired' || new Date(token.expiresAt as string) < new Date()) {
      await db.execute({ sql: "UPDATE Token SET status = 'expired' WHERE id = ?", args: [token.id] });
      return NextResponse.json({ error: 'Token scaduto' }, { status: 410 });
    }

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json({ error: 'Nessuna foto fornita' }, { status: 400 });
    }

    const now = new Date().toISOString();

    for (const p of photos) {
      const photoId = generateId();
      await db.execute({
        sql: 'INSERT INTO Photo (id, tokenId, fileName, mimeType, data, note, uploadedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [photoId, token.id, p.fileName, p.mimeType, p.data, p.note || null, now],
      });
    }

    await db.execute({
      sql: "UPDATE Token SET status = 'used', usedAt = ? WHERE id = ?",
      args: [now, token.id],
    });

    return NextResponse.json({ success: true, photoCount: photos.length });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ error: 'Errore nel caricamento delle foto' }, { status: 500 });
  }
}