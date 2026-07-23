import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploadToSharePoint, isGraphConfigured } from '@/lib/graph-api';
import { writeFile } from 'fs/promises';
import path from 'path';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/avi'];
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_MEDIA_PER_REQUIREMENT = 10;

// POST - Upload a photo or video
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get('token') as string;
    const mediaFile = formData.get('media') as File;
    const requirementId = formData.get('requirementId') as string;
    const mediaType = formData.get('mediaType') as string || 'photo';
    const durationStr = formData.get('duration') as string;

    if (!token || !mediaFile || !requirementId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate token
    const accessToken = await db.accessToken.findUnique({
      where: { token },
      include: { contract: true },
    });

    if (!accessToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    if (accessToken.usedAt) {
      return NextResponse.json({ error: 'Token already used' }, { status: 400 });
    }

    if (accessToken.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    }

    // Validate media type
    const mimeType = mediaFile.type;
    const isImage = IMAGE_MIME_TYPES.includes(mimeType);
    const isVideo = VIDEO_MIME_TYPES.includes(mimeType);

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: `Unsupported file type: ${mimeType}. Accepted: images (jpeg, png, webp, heic) and videos (mp4, webm, quicktime, avi)` }, { status: 400 });
    }

    // Validate actual media type matches declared type
    if (mediaType === 'photo' && isVideo) {
      return NextResponse.json({ error: 'Video file uploaded as photo type' }, { status: 400 });
    }
    if (mediaType === 'video' && isImage) {
      return NextResponse.json({ error: 'Image file uploaded as video type' }, { status: 400 });
    }

    // Auto-detect media type from mime
    const detectedMediaType = isVideo ? 'video' : 'photo';

    // Validate file size
    const fileSize = mediaFile.size;
    if (isImage && fileSize > MAX_PHOTO_SIZE) {
      return NextResponse.json({ error: `Image file too large (${Math.round(fileSize / 1024 / 1024)}MB). Max: 10MB` }, { status: 400 });
    }
    if (isVideo && fileSize > MAX_VIDEO_SIZE) {
      return NextResponse.json({ error: `Video file too large (${Math.round(fileSize / 1024 / 1024)}MB). Max: 50MB` }, { status: 400 });
    }

    // Check max media per requirement
    const existingCount = await db.mediaSubmission.count({
      where: {
        contractId: accessToken.contractId,
        requirementId,
      },
    });

    if (existingCount >= MAX_MEDIA_PER_REQUIREMENT) {
      return NextResponse.json({ error: `Max ${MAX_MEDIA_PER_REQUIREMENT} media items per requirement` }, { status: 400 });
    }

    // Validate requirement exists
    const requirement = await db.photoRequirement.findUnique({ where: { id: requirementId } });
    if (!requirement) {
      return NextResponse.json({ error: 'Requirement not found' }, { status: 404 });
    }

    // For videos, check if allowVideo
    if (isVideo && !requirement.allowVideo) {
      return NextResponse.json({ error: 'Video not allowed for this requirement' }, { status: 400 });
    }

    // Generate file name
    const ext = getExtensionFromMimeType(mimeType);
    const fileName = `${requirement.key}_${accessToken.contract.contractNumber}_${existingCount + 1}_${Date.now()}.${ext}`;

    // Read file buffer
    const fileBuffer = Buffer.from(await mediaFile.arrayBuffer());

    // Upload logic
    let localPath: string | null = null;
    let graphItemId: string | null = null;
    let graphDriveId: string | null = null;

    if (isGraphConfigured()) {
      try {
        const result = await uploadToSharePoint(
          fileName,
          fileBuffer,
          mimeType,
          accessToken.contract.contractNumber
        );
        graphItemId = result.itemId;
        graphDriveId = result.driveId;
      } catch (uploadError: any) {
        console.error('SharePoint upload failed, falling back to local:', uploadError.message);
        // Fall back to local storage
        localPath = await saveLocally(fileName, fileBuffer);
      }
    } else {
      // Save locally
      localPath = await saveLocally(fileName, fileBuffer);
    }

    // Update contract status to in_progress if it's pending
    if (accessToken.contract.status === 'pending') {
      await db.rentalContract.update({
        where: { id: accessToken.contractId },
        data: { status: 'in_progress' },
      });
    }

    // Parse duration for videos
    const duration = durationStr ? parseInt(durationStr, 10) : null;

    // Create media submission record
    const submission = await db.mediaSubmission.create({
      data: {
        contractId: accessToken.contractId,
        requirementId,
        mediaType: detectedMediaType,
        fileName,
        fileSize,
        mimeType,
        duration: (detectedMediaType === 'video' && duration && duration > 0) ? duration : null,
        localPath,
        graphItemId,
        graphDriveId,
      },
    });

    return NextResponse.json({ submission });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function saveLocally(fileName: string, buffer: Buffer): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const filePath = path.join(uploadsDir, fileName);
  await writeFile(filePath, buffer);
  return `/uploads/${fileName}`;
}

function getExtensionFromMimeType(mimeType: string): string {
  const mapping: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
    'video/avi': 'avi',
  };
  return mapping[mimeType] || 'bin';
}
