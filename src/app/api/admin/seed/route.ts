import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEFAULT_REQUIREMENTS = [
  { key: 'front', label: 'Front', labelEn: 'Front', description: 'Fotografare la parte anteriore del veicolo.', orderIndex: 1, required: true, icon: 'CarFront' },
  { key: 'passenger_side', label: 'Passenger Side', labelEn: 'Passenger Side', description: 'Fotografare il lato passeggero del veicolo.', orderIndex: 2, required: true, icon: 'ArrowRight' },
  { key: 'back', label: 'Back', labelEn: 'Back', description: 'Fotografare la parte posteriore del veicolo.', orderIndex: 3, required: true, icon: 'Car' },
  { key: 'driver_side', label: 'Driver Side', labelEn: 'Driver Side', description: 'Fotografare il lato conducente del veicolo.', orderIndex: 4, required: true, icon: 'ArrowLeft' },
]

// Keys that should NOT exist (removed categories)
const REMOVED_KEYS = ['interior', 'dashboard', 'fuel_level', 'damage']

export async function POST() {
  try {
    let created = 0, skipped = 0, deleted = 0

    // Remove unwanted categories
    for (const key of REMOVED_KEYS) {
      const existing = await db.photoRequirement.findUnique({ where: { key } })
      if (existing) {
        await db.photoRequirement.delete({ where: { key } })
        deleted++
      }
    }

    // Create or update required categories
    for (const req of DEFAULT_REQUIREMENTS) {
      const existing = await db.photoRequirement.findUnique({ where: { key: req.key } })
      if (existing) {
        // Update in case labels/descriptions changed
        await db.photoRequirement.update({ where: { key: req.key }, data: req })
        skipped++
      } else {
        await db.photoRequirement.create({ data: req })
        created++
      }
    }

    return NextResponse.json({
      success: true,
      message: `${created} created, ${skipped} updated, ${deleted} removed`,
      total: DEFAULT_REQUIREMENTS.length
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seed error' }, { status: 500 })
  }
}
