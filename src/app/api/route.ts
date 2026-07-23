import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'Hertz Malta Vehicle Check-in Portal', version: '1.0.0' });
}
