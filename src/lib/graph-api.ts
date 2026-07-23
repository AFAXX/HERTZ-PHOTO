/**
 * Microsoft Graph API integration for SharePoint file uploads.
 * Supports both direct upload (<4MB) and chunked upload (>4MB via createUploadSession).
 */

const GRAPH_TENANT_ID = process.env.GRAPH_TENANT_ID || '';
const GRAPH_CLIENT_ID = process.env.GRAPH_CLIENT_ID || '';
const GRAPH_CLIENT_SECRET = process.env.GRAPH_CLIENT_SECRET || '';
const GRAPH_SITE_ID = process.env.GRAPH_SITE_ID || '';
const GRAPH_DRIVE_ID = process.env.GRAPH_DRIVE_ID || '';
const GRAPH_FOLDER_PATH = process.env.GRAPH_FOLDER_PATH || 'VehicleCheckin';

let cachedToken: { token: string; expiresAt: number } | null = null;

export function isGraphConfigured(): boolean {
  return !!GRAPH_TENANT_ID && !!GRAPH_CLIENT_ID && !!GRAPH_CLIENT_SECRET && !!GRAPH_SITE_ID && !!GRAPH_DRIVE_ID;
}

export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.token;
  }

  const url = `https://login.microsoftonline.com/${GRAPH_TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: GRAPH_CLIENT_ID,
    client_secret: GRAPH_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials',
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get Graph access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

async function getDriveItemId(accessToken: string, folderPath: string): Promise<string> {
  // Try to find the folder, create if not exists
  const encodedPath = encodeURIComponent(folderPath);
  const checkUrl = `https://graph.microsoft.com/v1.0/sites/${GRAPH_SITE_ID}/drives/${GRAPH_DRIVE_ID}/root:/${encodedPath}`;

  const checkResponse = await fetch(checkUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (checkResponse.ok) {
    const folderData = await checkResponse.json();
    return folderData.id;
  }

  // Create folder if it doesn't exist
  const createUrl = `https://graph.microsoft.com/v1.0/sites/${GRAPH_SITE_ID}/drives/${GRAPH_DRIVE_ID}/root/children`;
  const createResponse = await fetch(createUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderPath,
      folder: {},
      '@microsoft.graph.conflictBehavior': 'rename',
    }),
  });

  if (!createResponse.ok) {
    throw new Error(`Failed to create folder: ${createResponse.status}`);
  }

  const createdFolder = await createResponse.json();
  return createdFolder.id;
}

/**
 * Upload a file to SharePoint via Microsoft Graph API.
 * For files > 4MB, uses chunked upload via createUploadSession.
 */
export async function uploadToSharePoint(
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string,
  contractFolder?: string
): Promise<{ itemId: string; driveId: string; webUrl?: string }> {
  if (!isGraphConfigured()) {
    throw new Error('Graph API is not configured. Check environment variables.');
  }

  const accessToken = await getAccessToken();

  // Build the target path: GRAPH_FOLDER_PATH/contractFolder/fileName
  const targetPath = contractFolder
    ? `${GRAPH_FOLDER_PATH}/${contractFolder}/${fileName}`
    : `${GRAPH_FOLDER_PATH}/${fileName}`;

  const fileSize = fileBuffer.length;
  const encodedPath = encodeURIComponent(targetPath);

  // For files < 4MB, use direct upload
  if (fileSize < 4 * 1024 * 1024) {
    const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${GRAPH_SITE_ID}/drives/${GRAPH_DRIVE_ID}/root:/${encodedPath}:/content`;
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': mimeType,
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Direct upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return {
      itemId: result.id,
      driveId: result.parentReference?.driveId || GRAPH_DRIVE_ID,
      webUrl: result.webUrl,
    };
  }

  // For files > 4MB, use chunked upload via createUploadSession
  const sessionUrl = `https://graph.microsoft.com/v1.0/sites/${GRAPH_SITE_ID}/drives/${GRAPH_DRIVE_ID}/root:/${encodedPath}:/createUploadSession`;
  const sessionResponse = await fetch(sessionUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item: {
        '@microsoft.graph.conflictBehavior': 'rename',
        name: fileName,
      },
    }),
  });

  if (!sessionResponse.ok) {
    const errorText = await sessionResponse.text();
    throw new Error(`Failed to create upload session: ${sessionResponse.status} - ${errorText}`);
  }

  const sessionData = await sessionResponse.json();
  const uploadSessionUrl = sessionData.uploadUrl;

  // Upload in chunks of 4MB
  const chunkSize = 4 * 1024 * 1024;
  let offset = 0;
  let lastResult: any = null;

  while (offset < fileSize) {
    const chunkEnd = Math.min(offset + chunkSize, fileSize);
    const chunk = fileBuffer.slice(offset, chunkEnd);
    const contentRange = `bytes ${offset}-${chunkEnd - 1}/${fileSize}`;

    const chunkResponse = await fetch(uploadSessionUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': chunk.length.toString(),
        'Content-Range': contentRange,
      },
      body: chunk,
    });

    if (!chunkResponse.ok) {
      const errorText = await chunkResponse.text();
      throw new Error(`Chunk upload failed at offset ${offset}: ${chunkResponse.status} - ${errorText}`);
    }

    lastResult = await chunkResponse.json();
    offset = chunkEnd;
  }

  return {
    itemId: lastResult.id,
    driveId: lastResult.parentReference?.driveId || GRAPH_DRIVE_ID,
    webUrl: lastResult.webUrl,
  };
}
