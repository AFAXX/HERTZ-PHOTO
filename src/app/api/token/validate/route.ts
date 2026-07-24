import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token mancante o non valido' },
        { status: 400 }
      )
    }

    // Find the token with contract info
    const accessToken = await db.accessToken.findUnique({
      where: { token },
      include: {
        contract: {
          include: {
            photos: {
              include: {
                requirement: true,
              },
            },
          },
        },
      },
    })

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Token non trovato' },
        { status: 404 }
      )
    }

    // Check if token has been used
    if (accessToken.usedAt) {
      return NextResponse.json(
        { error: 'Token già utilizzato. Il check-in fotografico per questo contratto è già stato completato.' },
        { status: 410 }
      )
    }

    // Check if token has expired
    if (new Date() > accessToken.expiresAt) {
      return NextResponse.json(
        { error: 'Token scaduto. Contattare il personale Hertz per ottenere un nuovo link.' },
        { status: 410 }
      )
    }

    // Check if contract already completed
    if (accessToken.contract.status === 'completed') {
      return NextResponse.json(
        { error: 'Check-in fotografico già completato per questo contratto.' },
        { status: 410 }
      )
    }

    // Get all photo requirements
    const requirements = await db.photoRequirement.findMany({
      orderBy: { orderIndex: 'asc' },
    })

    // Count photos per requirement
    const photoCountMap = new Map<string, number>()
    for (const photo of accessToken.contract.photos) {
      const key = photo.requirement.key
      photoCountMap.set(key, (photoCountMap.get(key) || 0) + 1)
    }

    // Map submitted photos
    const submittedKeys = new Set(
      accessToken.contract.photos.map((p) => p.requirement.key)
    )

    const photoChecklist = requirements.map((req) => ({
      id: req.id,
      key: req.key,
      label: req.label,
      labelEn: req.labelEn,
      description: req.description,
      icon: req.icon,
      required: req.required,
      completed: submittedKeys.has(req.key),
      photoCount: photoCountMap.get(req.key) || 0,
    }))

    return NextResponse.json({
      valid: true,
      contract: {
        id: accessToken.contract.id,
        contractNumber: accessToken.contract.contractNumber,
        customerName: accessToken.contract.customerName,
        vehiclePlate: accessToken.contract.vehiclePlate,
        vehicleModel: accessToken.contract.vehicleModel,
        vehicleColor: accessToken.contract.vehicleColor,
        status: accessToken.contract.status,
      },
      photoChecklist,
    })
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    )
  }
}
