import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'
import * as XLSX from 'xlsx'

// Increase body size limit for file uploads on Vercel
export const maxDuration = 30

interface RowData {
  contractNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  vehiclePlate: string
  vehicleModel: string
  vehicleColor: string
}

// EXACT match only (case-insensitive, trimmed, stripped of special chars)
const columnMap: Record<string, keyof RowData> = {
  // Contract / Rental number — Hertz uses "Rental" column
  'rental': 'contractNumber',
  'contract': 'contractNumber',
  'contractnumber': 'contractNumber',
  'contractno': 'contractNumber',
  'agreement': 'contractNumber',
  'ra': 'contractNumber',
  'reservation': 'contractNumber',
  'reservationno': 'contractNumber',
  'confirmation': 'contractNumber',
  'confirmationno': 'contractNumber',

  // Customer name — Hertz uses "Customer" column
  'customer': 'customerName',
  'customername': 'customerName',
  'client': 'customerName',
  'driver': 'customerName',
  'drivername': 'customerName',
  'name': 'customerName',
  'fullname': 'customerName',
  'surname': 'customerName',

  // Email
  'email': 'customerEmail',
  'customeremail': 'customerEmail',

  // Phone
  'phone': 'customerPhone',
  'customerphone': 'customerPhone',
  'mobile': 'customerPhone',
  'tel': 'customerPhone',
  'telephone': 'customerPhone',

  // Vehicle plate — Hertz uses "Vehicle" column
  'vehicle': 'vehiclePlate',
  'plate': 'vehiclePlate',
  'vehicleplate': 'vehiclePlate',
  'licenseplate': 'vehiclePlate',
  'registration': 'vehiclePlate',
  'targa': 'vehiclePlate',

  // Vehicle model — Hertz uses "Model" or "Group" column
  'model': 'vehicleModel',
  'vehiclemodel': 'vehicleModel',
  'carmodel': 'vehicleModel',
  'cargroup': 'vehicleModel',
  'cgroup': 'vehicleModel',
  'group': 'vehicleModel',
  'make': 'vehicleModel',
  'makemodel': 'vehicleModel',

  // Color
  'color': 'vehicleColor',
  'vehiclecolor': 'vehicleColor',
  'colour': 'vehicleColor',
}

function normalizeStr(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
}

function findMapping(header: string): keyof RowData | null {
  const n = normalizeStr(header)
  return columnMap[n] || null
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows: Record<string, string | number>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

    if (rows.length === 0) {
      return NextResponse.json({ error: 'The file is empty or has no data rows' }, { status: 400 })
    }

    // Map columns - EXACT match only, one header -> one field
    const headers = Object.keys(rows[0])
    const fieldMapping: Record<string, keyof RowData> = {}
    const usedFields = new Set<string>()

    // Priority order: Rental > Confirmation > other for contractNumber
    // Model > Group > C Group for vehicleModel
    const priorityOrder: Partial<Record<keyof RowData, string[]>> = {
      contractNumber: ['rental', 'contract', 'confirmation', 'ra', 'agreement'],
      vehicleModel: ['model', 'cgroup', 'group', 'make'],
    }

    // First pass: map with priority
    for (const field of Object.values(priorityOrder)) {
      for (const preferred of field!) {
        for (const header of headers) {
          const n = normalizeStr(header)
          if (n === preferred && !usedFields.has(n)) {
            const mapped = columnMap[n]
            if (mapped && !Object.values(fieldMapping).includes(mapped)) {
              fieldMapping[header] = mapped
              usedFields.add(n)
            }
          }
        }
      }
    }

    // Second pass: map remaining columns
    for (const header of headers) {
      if (fieldMapping[header]) continue
      const mapped = findMapping(header)
      if (mapped && !Object.values(fieldMapping).includes(mapped)) {
        fieldMapping[header] = mapped
      }
    }

    // Check required
    const mappedFields = new Set(Object.values(fieldMapping))
    const requiredFields: (keyof RowData)[] = ['contractNumber', 'customerName']
    const missingFields = requiredFields.filter(f => !mappedFields.has(f))

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: `Could not find columns for: ${missingFields.join(', ')}. Found columns: ${headers.join(', ')}`,
        detectedColumns: headers,
        mappedColumns: Object.fromEntries(Object.entries(fieldMapping)),
      }, { status: 400 })
    }

    // Process rows
    const results: Array<{
      row: number
      contractNumber: string
      customerName: string
      vehiclePlate: string
      vehicleModel: string
      status: 'created' | 'skipped' | 'error'
      token?: string
      link?: string
      error?: string
    }> = []

    const expirationHours = parseInt(process.env.TOKEN_EXPIRATION_HOURS || '6', 10)

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      const data: Partial<RowData> = {}
      for (const [header, field] of Object.entries(fieldMapping)) {
        const val = row[header]
        data[field] = val !== undefined && val !== null ? String(val).trim() : ''
      }

      const contractNum = data.contractNumber || ''
      const custName = data.customerName || ''
      const plate = data.vehiclePlate || ''
      const model = data.vehicleModel || ''

      if (!contractNum || !custName) {
        results.push({
          row: i + 2,
          contractNumber: contractNum || '(empty)',
          customerName: custName || '(empty)',
          vehiclePlate: plate || '-',
          vehicleModel: model || '-',
          status: 'error',
          error: 'Missing contract number or customer name',
        })
        continue
      }

      const existing = await db.rentalContract.findUnique({
        where: { contractNumber: contractNum },
      })

      if (existing) {
        const token = uuidv4()
        await db.accessToken.create({
          data: {
            token,
            contractId: existing.id,
            expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000),
          },
        })
        results.push({
          row: i + 2,
          contractNumber: contractNum,
          customerName: custName,
          vehiclePlate: plate || existing.vehiclePlate,
          vehicleModel: model || existing.vehicleModel,
          status: 'skipped',
          token,
          link: `/#token=${token}`,
          error: 'Already existed — new token generated',
        })
        continue
      }

      const contract = await db.rentalContract.create({
        data: {
          contractNumber: contractNum,
          customerName: custName,
          customerEmail: data.customerEmail || null,
          customerPhone: data.customerPhone || null,
          vehiclePlate: plate || 'N/A',
          vehicleModel: model || 'N/A',
          vehicleColor: data.vehicleColor || null,
        },
      })

      const token = uuidv4()
      await db.accessToken.create({
        data: {
          token,
          contractId: contract.id,
          expiresAt: new Date(Date.now() + expirationHours * 60 * 60 * 1000),
        },
      })

      results.push({
        row: i + 2,
        contractNumber: contractNum,
        customerName: custName,
        vehiclePlate: plate || 'N/A',
        vehicleModel: model || 'N/A',
        status: 'created',
        token,
        link: `/#token=${token}`,
      })
    }

    const created = results.filter(r => r.status === 'created').length
    const skipped = results.filter(r => r.status === 'skipped').length
    const errors = results.filter(r => r.status === 'error').length

    return NextResponse.json({
      success: true,
      summary: { total: rows.length, created, skipped, errors },
      detectedColumns: headers,
      mappedColumns: Object.fromEntries(Object.entries(fieldMapping)),
      results,
    })
  } catch (error) {
    console.error('Bulk upload error:', error)
    // Detect common xlsx/parsing issues
    const msg = error instanceof Error ? error.message : 'Unknown error'
    if (msg.includes('Unsupported file') || msg.includes('Cannot read')) {
      return NextResponse.json(
        { error: `Unsupported file format. Please use .xlsx, .xls, or .csv files. Details: ${msg}` },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: `Failed to process file: ${msg}` },
      { status: 500 }
    )
  }
}
