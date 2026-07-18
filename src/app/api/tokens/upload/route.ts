import { NextRequest, NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';
import { sendTokenEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { randomBytes } from 'crypto';

function generateId(): string {
  return randomBytes(12).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    await initDb();
    const db = getDb();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nessun file caricato' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    const EXPIRY_HOURS = 48;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin') || '';

    const results: { success: number; skipped: number; errors: string[] } = {
      success: 0,
      skipped: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const customerName = String(row['Customer'] || '').trim();
      const vehicle = String(row['Vehicle'] || '').trim();
      const rentalRef = String(row['Rental'] || '').trim();
      const model = String(row['Model'] || '').trim();
      const timeRaw = row['Time'];

      if (!vehicle || !customerName) {
        results.skipped++;
        continue;
      }

      let checkoutDate: Date;
      if (timeRaw) {
        if (typeof timeRaw === 'number') {
          const excelEpoch = new Date(1899, 11, 30);
          checkoutDate = new Date(excelEpoch.getTime() + timeRaw * 86400000);
        } else if (timeRaw instanceof Date) {
          checkoutDate = timeRaw;
        } else {
          checkoutDate = new Date(timeRaw);
        }
      } else {
        checkoutDate = new Date();
      }

      let customerEmail = '';
      const emailKeys = Object.keys(row).filter(
        k => k.toLowerCase().includes('email') || k.toLowerCase().includes('mail')
      );
      if (emailKeys.length > 0 && row[emailKeys[0]]) {
        customerEmail = String(row[emailKeys[0]]).trim();
      }
      if (!customerEmail) {
        customerEmail = `${vehicle.toLowerCase()}@hertz-checkout.local`;
      }

      const id = generateId();
      const tokenUuid = uuidv4();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + EXPIRY_HOURS * 60 * 60 * 1000);

      try {
        await db.execute({
          sql: `INSERT INTO Token (id, uuid, customerName, customerEmail, vehicle, model, rentalRef, checkoutDate, status, source, noDamage, createdAt, expiresAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'emailed', 'excel', 0, ?, ?)`,
          args: [id, tokenUuid, customerName, customerEmail, vehicle, model || null, rentalRef || null, checkoutDate.toISOString(), now.toISOString(), expiresAt.toISOString()],
        });
        results.success++;

        try {
          await sendTokenEmail({
            to: customerEmail,
            customerName,
            vehicle,
            model: model || null,
            tokenUuid,
            baseUrl,
          });
        } catch (emailErr) {
          console.error(`Email failed for ${vehicle}:`, emailErr);
          results.errors.push(`Email non inviata per ${vehicle}`);
        }
      } catch (dbErr) {
        results.skipped++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Excel upload error:', error);
    return NextResponse.json(
      { error: 'Errore nel processamento del file Excel' },
      { status: 500 }
    );
  }
}