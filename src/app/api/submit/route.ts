import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    if (!token) return NextResponse.json({ error: 'Token mancante' }, { status: 400 })

    const accessToken = await db.accessToken.findUnique({
      where: { token },
      include: { contract: { include: { photos: true } } },
    })

    if (!accessToken) return NextResponse.json({ error: 'Token non valido' }, { status: 404 })
    if (accessToken.usedAt) return NextResponse.json({ error: 'Token gia utilizzato' }, { status: 410 })
    if (new Date() > accessToken.expiresAt) return NextResponse.json({ error: 'Token scaduto' }, { status: 410 })
    if (accessToken.contract.photos.length === 0) return NextResponse.json({ error: 'Almeno una foto richiesta.' }, { status: 400 })

    await db.rentalContract.update({ where: { id: accessToken.contractId }, data: { status: 'completed' } })
    await db.accessToken.update({ where: { id: accessToken.id }, data: { usedAt: new Date() } })

    return NextResponse.json({
      success: true,
      contract: { contractNumber: accessToken.contract.contractNumber, customerName: accessToken.contract.customerName, vehiclePlate: accessToken.contract.vehiclePlate, completedAt: new Date().toISOString() },
    })
  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json({ error: 'Errore durante la sottomissione' }, { status: 500 })
  }
}
