import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Seed photo requirements
export async function POST() {
  try {
    const requirements = [
      { key: 'front', label: 'Fronte', labelEn: 'Front', description: 'Fotografare la parte anteriore del veicolo.', orderIndex: 1, required: true, icon: 'CarFront', allowVideo: true },
      { key: 'passenger_side', label: 'Lato Passeggero', labelEn: 'Passenger Side', description: 'Fotografare il lato passeggero del veicolo.', orderIndex: 2, required: true, icon: 'ArrowRight', allowVideo: true },
      { key: 'back', label: 'Retro', labelEn: 'Back', description: 'Fotografare la parte posteriore del veicolo.', orderIndex: 3, required: true, icon: 'Car', allowVideo: true },
      { key: 'driver_side', label: 'Lato Guidatore', labelEn: 'Driver Side', description: 'Fotografare il lato conducente del veicolo.', orderIndex: 4, required: true, icon: 'ArrowLeft', allowVideo: true },
      { key: 'interior', label: 'Interno', labelEn: 'Interior', description: 'Fotografare cruscotto, contachilometri e sedili.', orderIndex: 5, required: true, icon: 'Armchair', allowVideo: true },
    ];

    const results = [];
    for (const req of requirements) {
      const existing = await db.photoRequirement.findUnique({ where: { key: req.key } });
      if (existing) {
        const updated = await db.photoRequirement.update({ where: { key: req.key }, data: req });
        results.push(updated);
      } else {
        const created = await db.photoRequirement.create({ data: req });
        results.push(created);
      }
    }

    return NextResponse.json({ requirements: results, count: results.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
