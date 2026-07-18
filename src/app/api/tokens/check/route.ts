import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const db = getDb();

    const { searchParams } = new URL(request.url);
    const tokenUuid = searchParams.get('token');

    if (!tokenUuid) {
      return NextResponse.json({ error: 'Token mancante' }, { status: 400 });
    }

    const result = await db.execute({
      sql: 'SELECT * FROM Token WHERE uuid = ?',
      args: [tokenUuid],
    });

    const token = result.rows[0];
    if (!token) {
      return NextResponse.json({ error: 'Token non trovato' }, { status: 404 });
    }

    if (token.status === 'used') {
      return NextResponse.json(
        { error: 'Questo link e stato gia utilizzato. Ogni link e valido una sola volta.', code: 'ALREADY_USED' },
        { status: 410 }
      );
    }

    if (token.status === 'expired' || new Date(token.expiresAt as string) < new Date()) {
      await db.execute({
        sql: "UPDATE Token SET status = 'expired' WHERE id = ?",
        args: [token.id],
      });
      return NextResponse.json(
        { error: 'Questo link e scaduto. Contatta il personale Hertz.', code: 'EXPIRED' },
        { status: 410 }
      );
    }

    if (token.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Questo link e stato annullato.', code: 'CANCELLED' },
        { status: 410 }
      );
    }

    // Get photo count
    const photoResult = await db.execute({
      sql: 'SELECT id, fileName, note, uploadedAt FROM Photo WHERE tokenId = ? ORDER BY uploadedAt ASC',
      args: [token.id],
    });

    return NextResponse.json({
      id: token.id,
      customerName: token.customerName,
      vehicle: token.vehicle,
      model: token.model,
      rentalRef: token.rentalRef,
      checkoutDate: token.checkoutDate,
      expiresAt: token.expiresAt,
      status: token.status,
      source: token.source,
      photoCount: photoResult.rows.length,
      photos: photoResult.rows.map(p => ({
        id: p.id,
        fileName: p.fileName,
        note: p.note,
        uploadedAt: p.uploadedAt,
      })),
    });
  } catch (error) {
    console.error('Token check error:', error);
    return NextResponse.json({ error: 'Errore nella verifica del token' }, { status: 500 });
  }
}