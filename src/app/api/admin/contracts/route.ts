import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  try {
    const contracts = await db.rentalContract.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tokens: true,
        photos: {
          include: {
            requirement: true,
          },
        },
      },
    })

    const enriched = contracts.map((c) => {
      const requirements = c.photos.map((p) => ({
        key: p.requirement.key,
        label: p.requirement.label,
        fileName: p.fileName,
        uploadedAt: p.uploadedAt,
      }))

      return {
        id: c.id,
        contractNumber: c.contractNumber,
        customerName: c.customerName,
        customerEmail: c.customerEmail,
        customerPhone: c.customerPhone,
        vehiclePlate: c.vehiclePlate,
        vehicleModel: c.vehicleModel,
        vehicleColor: c.vehicleColor,
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        tokens: c.tokens.map((t) => ({
          id: t.id,
          token: t.token,
          expiresAt: t.expiresAt,
          usedAt: t.usedAt,
          isExpired: new Date() > t.expiresAt,
        })),
        photosSubmitted: c.photos.length,
        photos: requirements,
      }
    })

    return NextResponse.json({ contracts: enriched })
  } catch (error) {
    console.error('List contracts error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to fetch contracts: ${msg}` },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractNumber, customerName, customerEmail, customerPhone, vehiclePlate, vehicleModel, vehicleColor } = body

    if (!contractNumber || !customerName) {
      return NextResponse.json(
        { error: 'Missing required fields: contract number and customer name' },
        { status: 400 }
      )
    }

    // Check if contract number already exists
    const existing = await db.rentalContract.findUnique({
      where: { contractNumber },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Contract number already exists' },
        { status: 409 }
      )
    }

    // Create contract
    const contract = await db.rentalContract.create({
      data: {
        contractNumber,
        customerName,
        customerEmail: customerEmail || null,
        customerPhone: customerPhone || null,
        vehiclePlate: vehiclePlate || 'N/A',
        vehicleModel: vehicleModel || 'N/A',
        vehicleColor: vehicleColor || null,
      },
    })

    // Generate access token
    const expirationHours = parseInt(process.env.TOKEN_EXPIRATION_HOURS || '6', 10)
    const token = uuidv4()

    const accessToken = await db.accessToken.create({
      data: {
        token,
        contractId: contract.id,
        expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000),
      },
    })

    return NextResponse.json({
      success: true,
      contract: {
        id: contract.id,
        contractNumber: contract.contractNumber,
        customerName: contract.customerName,
      },
      accessToken: {
        token: accessToken.token,
        expiresAt: accessToken.expiresAt,
        link: `/#token=${accessToken.token}`,
      },
    })
  } catch (error) {
    console.error('Create contract error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to create contract: ${msg}` },
      { status: 500 }
    )
  }
}
