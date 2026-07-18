import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const db = getDb();

    const body = await request.json();
    const { tokenUuid } = body;

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

    const now = new Date().toISOString();
    await db.execute({
      sql: "UPDATE Token SET status = 'used', usedAt = ?, noDamage = 1 WHERE id = ?",
      args: [now, token.id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Confirm error:', error);
    return NextResponse.json({ error: 'Errore nella conferma' }, { status: 500 });
  }
}