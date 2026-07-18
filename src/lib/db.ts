import { createClient, Client } from '@libsql/client';

const dbUrl = process.env.DATABASE_URL!;
const dbAuthToken = process.env.DATABASE_AUTH_TOKEN || '';

let _client: Client | null = null;

export function getDb(): Client {
  if (!_client) {
    _client = createClient({
      url: dbUrl,
      authToken: dbAuthToken || undefined,
    });
  }
  return _client;
}

// Initialize tables on first use
let _initialized = false;

export async function initDb() {
  if (_initialized) return;
  const db = getDb();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS Token (
      id TEXT PRIMARY KEY,
      uuid TEXT NOT NULL UNIQUE,
      customerName TEXT NOT NULL,
      customerEmail TEXT NOT NULL,
      vehicle TEXT NOT NULL,
      model TEXT,
      rentalRef TEXT,
      reservationNumber TEXT,
      checkoutDate TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      source TEXT NOT NULL DEFAULT 'excel',
      noDamage INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      expiresAt TEXT NOT NULL,
      usedAt TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS Photo (
      id TEXT PRIMARY KEY,
      tokenId TEXT NOT NULL,
      fileName TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      data TEXT NOT NULL,
      note TEXT,
      uploadedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (tokenId) REFERENCES Token(id) ON DELETE CASCADE
    )
  `);

  _initialized = true;
}

export { getDb as db };