import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploadToSharePoint, isGraphConfigured } from '@/lib/graph-api';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const maxDuration = 30;
const MAX_PHOTOS_PER_REQUIREMENT = 10;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const file = formData.get('photo') as File | null;
    const requirementId = formData.get('requirementId') as string;

    if (!token || !file || !requirementId) {
      return NextResponse.json({ error: 'Missing required fields: token, photo, requirementId' }, { status: 400 });
    }

    const accessToken = await db.accessToken.findUnique({ where: { token }, include: { contract: true } });
    if (!accessToken) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    if (accessToken.usedAt) return NextResponse.json({ error: 'Token already used' }, { status: 403 });
    if (new Date(accessToken.expiresAt) < new Date()) return NextResponse.json({ error: 'Token expired' }, { status: 403 });

    const existingCount = await db.photoSubmission.count({ where: { contractId: accessToken.contractId, requirementId } });
    if (existingCount >= MAX_PHOTOS_PER_REQUIREMENT) {
      return NextResponse.json({ error: 'Maximum ' + MAX_PHOTOS_PER_REQUIREMENT + ' photos for this angle.' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type)) return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop() || 'jpg';
    const uniqueId = crypto.randomUUID();
    const fileName = accessToken.contract.contractNumber + '_' + requirementId + '_' + uniqueId + '.' + ext;

    const isVercel = !!process.env.VERCEL;
    const baseDir = isVercel ? '/tmp/uploads' : path.join(process.cwd(), 'uploads');
    const contractDir = path.join(baseDir, accessToken.contract.contractNumber);
    await mkdir(contractDir, { recursive: true });

    let localPath = '';
    let graphItemId: string | null = null;
    let graphDriveId: string | null = null;

    if (await isGraphConfigured()) {
      try {
        const result = await uploadToSharePoint(fileName, buffer, accessToken.contract.contractNumber);
        if (result) { graphItemId = result.graphItemId; graphDriveId = result.graphDriveId; localPath = result.webUrl; }
      } catch (graphError) { console.error('Graph API failed, fallback to local:', graphError); }
    }

    if (!graphItemId) {
      await writeFile(path.join(contractDir, fileName), buffer);
      localPath = '/uploads/' + accessToken.contract.contractNumber + '/' + fileName;
    }

    const submission = await db.photoSubmission.create({
      data: { contractId: accessToken.contractId, requirementId, fileName, fileSize: file.size, mimeType: file.type, localPath, graphItemId, graphDriveId },
    });

    await db.rentalContract.update({ where: { id: accessToken.contractId }, data: { status: 'in_progress' } });

    return NextResponse.json({ success: true, submission: { id: submission.id, fileName: submission.fileName, localPath: submission.localPath }, photoCount: existingCount + 1 });
  } catch (error) {
    console.error('Photo upload error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to upload photo: ' + msg }, { status: 500 });
  }
}
