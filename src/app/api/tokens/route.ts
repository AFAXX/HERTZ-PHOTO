import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    const db = getDb();

    const result = await db.execute(
      'SELECT * FROM Token ORDER BY createdAt DESC'
    );

    const tokens = [];
    for (const row of result.rows) {
      // Get photos for each token
      const photoResult = await db.execute({
        sql: 'SELECT id, fileName, uploadedAt FROM Photo WHERE tokenId = ? ORDER BY uploadedAt ASC',
        args: [row.id],
      });

      tokens.push({
        id: row.id,
        uuid: row.uuid,
        customerName: row.customerName,
        customerEmail: row.customerEmail,
        vehicle: row.vehicle,
        model: row.model,
        rentalRef: row.rentalRef,
        reservationNumber: row.reservationNumber,
        checkoutDate: row.checkoutDate,
        status: row.status,
        source: row.source,
        noDamage: Boolean(row.noDamage),
        createdAt: row.createdAt,
        expiresAt: row.expiresAt,
        usedAt: row.usedAt,
        photos: photoResult.rows,
      });
    }

    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Tokens list error:', error);
    return NextResponse.json({ error: 'Errore nel caricamento dei token' }, { status: 500 });
  }
}