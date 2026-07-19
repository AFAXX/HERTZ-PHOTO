import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token mancante' },
        { status: 400 }
      )
    }

    // Validate token
    const accessToken = await db.accessToken.findUnique({
      where: { token },
      include: {
        contract: {
          include: {
            photos: true,
          },
        },
      },
    })

    if (!accessToken) {
      return NextResponse.json({ error: 'Token non valido' }, { status: 404 })
    }

    if (accessToken.usedAt) {
      return NextResponse.json({ error: 'Token già utilizzato' }, { status: 410 })
    }

    if (new Date() > accessToken.expiresAt) {
      return NextResponse.json({ error: 'Token scaduto' }, { status: 410 })
    }

    // Check all required photos are submitted
    const requirements = await db.photoRequirement.findMany({
      where: { required: true },
    })

    const submittedRequirementIds = new Set(
      accessToken.contract.photos.map((p) => p.requirementId)
    )

    const missingPhotos = requirements.filter(
      (r) => !submittedRequirementIds.has(r.id)
    )

    if (missingPhotos.length > 0) {
      return NextResponse.json(
        {
          error: 'Foto mancanti',
          missingPhotos: missingPhotos.map((r) => ({
            key: r.key,
            label: r.label,
          })),
        },
        { status: 400 }
      )
    }

    // Mark contract as completed
    await db.rentalContract.update({
      where: { id: accessToken.contractId },
      data: { status: 'completed' },
    })

    // Mark token as used
    await db.accessToken.update({
      where: { id: accessToken.id },
      data: { usedAt: new Date() },
    })

    // TODO: Send notification email to staff
    // This would use Microsoft Graph API to send an email or trigger a Power Automate flow
    console.log(
      `[CheckIn] Completed for contract ${accessToken.contract.contractNumber}. ` +
      `Notification should be sent to staff.`
    )

    return NextResponse.json({
      success: true,
      contract: {
        contractNumber: accessToken.contract.contractNumber,
        customerName: accessToken.contract.customerName,
        vehiclePlate: accessToken.contract.vehiclePlate,
        completedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json(
      { error: 'Errore durante la sottomissione' },
      { status: 500 }
    )
  }
}
