import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const db = getDb();
    const { id } = await params;

    const result = await db.execute({
      sql: 'SELECT * FROM Photo WHERE tokenId = ? ORDER BY uploadedAt ASC',
      args: [id],
    });

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Photos fetch error:', error);
    return NextResponse.json({ error: 'Errore nel caricamento delle foto' }, { status: 500 });
  }
}