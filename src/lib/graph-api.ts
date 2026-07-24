/**
 * Microsoft Graph API Integration Module
 * 
 * This module handles authentication and file uploads to SharePoint/OneDrive
 * via Microsoft Graph API using client credentials flow (app-only).
 * 
 * Configuration required in .env:
 * - GRAPH_TENANT_ID: Azure AD tenant ID
 * - GRAPH_CLIENT_ID: App registration client ID
 * - GRAPH_CLIENT_SECRET: App registration client secret
 * - GRAPH_SITE_ID: SharePoint site ID
 * - GRAPH_DRIVE_ID: Document library drive ID
 */

interface GraphTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

interface GraphUploadResponse {
  id: string
  name: string
  webUrl: string
  size: number
}

// In-memory token cache
let tokenCache: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  const tenantId = process.env.GRAPH_TENANT_ID
  const clientId = process.env.GRAPH_CLIENT_ID
  const clientSecret = process.env.GRAPH_CLIENT_SECRET

  // If credentials are not configured, return empty (fallback to local storage)
  if (!tenantId || tenantId === 'your-tenant-id' || !clientId || !clientSecret) {
    console.log('[GraphAPI] Credentials not configured, using local storage fallback')
    return ''
  }

  // Check cache
  if (tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.token
  }

  try {
    const response = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://graph.microsoft.com/.default',
          grant_type: 'client_credentials',
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error('[GraphAPI] Token acquisition failed:', error)
      return ''
    }

    const data: GraphTokenResponse = await response.json()
    
    // Cache with 5 minute buffer
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 300) * 1000,
    }

    return data.access_token
  } catch (error) {
    console.error('[GraphAPI] Token acquisition error:', error)
    return ''
  }
}

export async function uploadToSharePoint(
  fileName: string,
  fileBuffer: Buffer,
  contractNumber: string
): Promise<{ graphItemId: string; graphDriveId: string; webUrl: string } | null> {
  const accessToken = await getAccessToken()
  
  if (!accessToken) {
    console.log('[GraphAPI] No access token, skipping SharePoint upload')
    return null
  }

  const driveId = process.env.GRAPH_DRIVE_ID
  const siteId = process.env.GRAPH_SITE_ID

  if (!driveId && !siteId) {
    console.log('[GraphAPI] No drive/site ID configured, skipping SharePoint upload')
    return null
  }

  try {
    // Create folder for contract if it doesn't exist
    const folderName = `CheckIn_${contractNumber}_${new Date().toISOString().split('T')[0]}`
    
    let uploadEndpoint: string
    
    if (driveId) {
      // Ensure folder exists
      await fetch(
        `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${folderName}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: folderName,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'Rename',
          }),
        }
      )

      // Upload file to the folder
      // For files < 4MB, use simple upload
      uploadEndpoint = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${folderName}/${fileName}:/content`
    } else {
      // Use site-based path
      uploadEndpoint = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:/${folderName}/${fileName}:/content`
    }

    const uploadResponse = await fetch(uploadEndpoint, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: fileBuffer,
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text()
      console.error('[GraphAPI] Upload failed:', error)
      return null
    }

    const result: GraphUploadResponse = await uploadResponse.json()

    return {
      graphItemId: result.id,
      graphDriveId: driveId || '',
      webUrl: result.webUrl,
    }
  } catch (error) {
    console.error('[GraphAPI] Upload error:', error)
    return null
  }
}

export async function isGraphConfigured(): Promise<boolean> {
  const tenantId = process.env.GRAPH_TENANT_ID
  const clientId = process.env.GRAPH_CLIENT_ID
  const clientSecret = process.env.GRAPH_CLIENT_SECRET
  return !!(
    tenantId && tenantId !== 'your-tenant-id' &&
    clientId && clientId !== 'your-client-id' &&
    clientSecret && clientSecret !== 'your-client-secret'
  )
}
