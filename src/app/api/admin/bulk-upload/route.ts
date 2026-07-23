import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import * as xlsx from 'xlsx';

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

function smartColumnMap(header: string): string {
  const h = header.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  if (h.includes('rental') || h.includes('contract') || h.includes('num') || h.includes('ref') || h.includes('id') || h === 'contractnumber') return 'contractNumber';
  if (h.includes('customer') || h.includes('client') || h.includes('name') || h === 'customername') return 'customerName';
  if (h.includes('email') || h.includes('mail')) return 'customerEmail';
  if (h.includes('phone') || h.includes('tel') || h.includes('mobile') || h.includes('cell')) return 'customerPhone';
  if (h.includes('plate') || h.includes('license') || h.includes('reg') || h.includes('numberplate')) return 'vehiclePlate';
  if (h.includes('model') || h.includes('car') || h.includes('type') || h === 'vehiclemodel') return 'vehicleModel';
  if (h.includes('color') || h.includes('colour')) return 'vehicleColor';
  return '';
}

// POST - Bulk upload contracts from Excel file
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet) as Record<string, any>[];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Empty spreadsheet' }, { status: 400 });
    }

    // Map columns
    const headers = Object.keys(rows[0]);
    const columnMapping: Record<string, string> = {};
    for (const h of headers) {
      const mapped = smartColumnMap(h);
      if (mapped) columnMapping[h] = mapped;
    }

    const results = { created: 0, errors: [] as string[] };

    for (const row of rows) {
      try {
        const mappedRow: Record<string, any> = {};
        for (const [originalCol, targetCol] of Object.entries(columnMapping)) {
          mappedRow[targetCol] = row[originalCol];
        }

        const { contractNumber, customerName, customerEmail, customerPhone, vehiclePlate, vehicleModel, vehicleColor } = mappedRow;

        if (!contractNumber || !customerName || !vehiclePlate || !vehicleModel) {
          results.errors.push(`Row skipped: missing required fields (${contractNumber || 'no contract number'})`);
          continue;
        }

        const contract = await db.rentalContract.create({
          data: {
            contractNumber: String(contractNumber),
            customerName: String(customerName),
            customerEmail: customerEmail ? String(customerEmail) : null,
            customerPhone: customerPhone ? String(customerPhone) : null,
            vehiclePlate: String(vehiclePlate),
            vehicleModel: String(vehicleModel),
            vehicleColor: vehicleColor ? String(vehicleColor) : null,
            status: 'pending',
          },
        });

        // Auto-generate token
        await db.accessToken.create({
          data: {
            token: uuidv4(),
            contractId: contract.id,
            expiresAt: calculateMaltaTokenExpiry(),
          },
        });

        results.created++;
      } catch (err: any) {
        results.errors.push(`Error: ${err.message}`);
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
