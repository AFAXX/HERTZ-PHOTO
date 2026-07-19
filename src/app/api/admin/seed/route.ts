import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_REQUIREMENTS = [
  {
    key: 'front',
    label: 'Vista anteriore',
    labelEn: 'Front view',
    description: 'Fotografare la parte anteriore del veicolo, inclusa la targa',
    orderIndex: 1,
    required: true,
    icon: 'CarFront',
  },
  {
    key: 'rear',
    label: 'Vista posteriore',
    labelEn: 'Rear view',
    description: 'Fotografare la parte posteriore del veicolo, inclusa la targa',
    orderIndex: 2,
    required: true,
    icon: 'Car',
  },
  {
    key: 'left_side',
    label: 'Fiancata sinistra',
    labelEn: 'Left side',
    description: 'Fotografare il lato sinistro del veicolo per intero',
    orderIndex: 3,
    required: true,
    icon: 'ArrowLeft',
  },
  {
    key: 'right_side',
    label: 'Fiancata destra',
    labelEn: 'Right side',
    description: 'Fotografare il lato destro del veicolo per intero',
    orderIndex: 4,
    required: true,
    icon: 'ArrowRight',
  },
  {
    key: 'dashboard',
    label: 'Cruscotto / Contachilometri',
    labelEn: 'Dashboard / Odometer',
    description: 'Fotografare il cruscotto con il contachilometri ben visibile',
    orderIndex: 5,
    required: true,
    icon: 'Gauge',
  },
  {
    key: 'fuel_level',
    label: 'Livello carburante',
    labelEn: 'Fuel level',
    description: 'Fotografare l\'indicatore del livello carburante',
    orderIndex: 6,
    required: true,
    icon: 'Fuel',
  },
  {
    key: 'damage',
    label: 'Danni preesistenti',
    labelEn: 'Pre-existing damage',
    description: 'Fotografare eventuali danni o ammaccature già presenti. Se non ci sono danni, fotografare un lato integro come conferma',
    orderIndex: 7,
    required: true,
    icon: 'AlertTriangle',
  },
]

export async function POST() {
  try {
    let created = 0
    let skipped = 0

    for (const req of DEFAULT_REQUIREMENTS) {
      const existing = await db.photoRequirement.findUnique({
        where: { key: req.key },
      })

      if (existing) {
        skipped++
        continue
      }

      await db.photoRequirement.create({ data: req })
      created++
    }

    return NextResponse.json({
      success: true,
      message: `Requisiti foto inizializzati: ${created} creati, ${skipped} già esistenti`,
      total: DEFAULT_REQUIREMENTS.length,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Errore nell\'inizializzazione dei requisiti' },
      { status: 500 }
    )
  }
}
