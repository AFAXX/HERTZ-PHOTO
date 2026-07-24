# Guida Deploy — Hertz Malta Check-in Fotografico

## Panoramica dei costi: TUTTO GRATIS

| Servizio | Piano | Costo |
|----------|-------|-------|
| Neon (Database PostgreSQL) | Free Tier | 0 EUR/mese |
| Vercel (Hosting) | Hobby (Free) | 0 EUR/mese |
| SharePoint (Storage foto) | Incluso in M365 Business | 0 EUR/mese |
| Azure AD (API Auth) | Incluso in M365 Business | 0 EUR/mese |

---

## FASE 1: Creare il Database PostgreSQL su Neon — 5 minuti

Neon fornisce un database PostgreSQL gratuito (0.5 GB) accessibile da internet, necessario perché Vercel non ha un filesystem persistente.

1. Vai su **https://neon.tech** e clicca "Sign Up"
2. Registrati con il tuo account Microsoft (lo stesso di M365)
3. Dopo il login, clicca **"New Project"**
4. Nome progetto: `hertz-checkin`
5. Regione: scegli **Europe** (piu vicino a Malta)
6. Clicca **"Create Project"**
7. Nella pagina del progetto, copia la **Connection String** — assomiglia a:
   ```
   postgresql://neondb_owner:AbCdEf123456@ep-cool-name-123456.eu-west-2.aws.neon.tech/neondb?sslmode=require
   ```
8. **Salvala** — ti servira tra poco!

---

## FASE 2: Creare l'App Azure AD (per SharePoint) — 15 minuti

Questa e la parte che permette all'app di salvare le foto su SharePoint.
Serve l'accesso amministratore a Microsoft 365.

### 2.1 Registrare l'app

1. Vai su **https://portal.azure.com**
2. Accedi con l'account amministratore di Hertz Malta
3. Nel menu a sinistra, clicca **"Microsoft Entra ID"** (prima si chiamava Azure AD)
4. Clicca **"App registrations"** nel menu laterale
5. Clicca **"+ New registration"**
6. Nome: `Hertz Check-in Portal`
7. Tipi di account: **"Accounts in this organizational directory only"**
8. URI di reindirizzamento: lascia vuoto
9. Clicca **"Register"**

### 2.2 Copiare ID e creare il segreto

1. Nella pagina **Overview** dell'app, copia questi due valori:
   - **Application (client) ID** -> e il tuo `GRAPH_CLIENT_ID`
   - **Directory (tenant) ID** -> e il tuo `GRAPH_TENANT_ID`
2. Vai su **"Certificates & secrets"** nel menu laterale
3. Clicca **"+ New client secret"**
4. Descrizione: `Check-in Portal`
5. Scadenza: **24 months**
6. Clicca **"Add"**
7. **COPIA SUBITO IL VALORE** del segreto (non si vede piu dopo!) -> e il tuo `GRAPH_CLIENT_SECRET`

### 2.3 Dare i permessi all'app

1. Vai su **"API permissions"** nel menu laterale
2. Clicca **"+ Add a permission"**
3. Seleziona **"Microsoft Graph"**
4. Seleziona **"Application permissions"** (non Delegated!)
5. Cerca e spunta questi permessi:
   - `Files.ReadWrite.All` (leggere/scrivere file su SharePoint)
   - `Sites.ReadWrite.All` (leggere/scrivere siti SharePoint)
6. Clicca **"Add permissions"**
7. IMPORTANTE: Clicca **"Grant admin consent for [tuo-tenant]"** e conferma
   (il pulsante diventa verde con un segno di spunta)

### 2.4 Ottenere Site ID e Drive ID di SharePoint

1. Vai su **https://developer.microsoft.com/graph/graph-explorer**
2. Accedi con il tuo account amministratore
3. Esegui questa query per ottenere il Site ID:
   ```
   GET https://graph.microsoft.com/v1.0/sites/hertzmalta.sharepoint.com
   ```
   (sostituisci "hertzmalta" con il tuo dominio SharePoint)
4. Dalla risposta, copia il campo **"id"** -> e il tuo `GRAPH_SITE_ID`
5. Esegui questa query per ottenere il Drive ID:
   ```
   GET https://graph.microsoft.com/v1.0/sites/{SITE-ID}/drives
   ```
   (sostituisci {SITE-ID} con il Site ID appena copiato)
6. Dalla risposta, trova il drive "Documents" e copia il suo **"id"** -> e il tuo `GRAPH_DRIVE_ID`

---

## FASE 3: Pubblicare su Vercel — 10 minuti

### 3.1 Caricare il codice su GitHub

1. Vai su **https://github.com** e registrati (se non hai un account)
2. Crea un nuovo repository:
   - Nome: `hertz-checkin-portal`
   - Visibilita: **Private** (contiene dati aziendali)
   - NON inizializzare con README
3. Estrai lo ZIP del progetto e carica i file su GitHub:
   - Metodo semplice: trascina i file nella pagina "Upload files" di GitHub
   - Metodo rapido: usa git da terminale:
     ```bash
     cd hertz-checkin-portal
     git init
     git add .
     git commit -m "Initial commit"
     git remote add origin https://github.com/TUO-USERNAME/hertz-checkin-portal.git
     git push -u origin main
     ```

### 3.2 Collegare a Vercel

1. Vai su **https://vercel.com** e clicca "Sign Up"
2. Registrati con **"Continue with GitHub"**
3. Dopo il login, clicca **"Add New..." -> "Project"**
4. Seleziona il repository `hertz-checkin-portal`
5. Framework Preset: **Next.js** (dovrebbe essere rilevato automaticamente)
6. NON cliccare Deploy ancora! Prima configura le variabili d'ambiente

### 3.3 Configurare le variabili d'ambiente su Vercel

Nella pagina di configurazione del progetto, scorri fino a **"Environment Variables"**
e aggiungi QUESTE variabili una per una:

| Key | Value | Obbligatoria? |
|-----|-------|---------------|
| `DATABASE_URL` | La connection string di Neon (Fase 1) | SI - senza questa niente funziona |
| `GRAPH_TENANT_ID` | Il tenant ID di Azure (Fase 2.2) | No - foto salvate solo in locale |
| `GRAPH_CLIENT_ID` | Il client ID di Azure (Fase 2.2) | No |
| `GRAPH_CLIENT_SECRET` | Il segreto di Azure (Fase 2.2) | No |
| `GRAPH_SITE_ID` | Il Site ID di SharePoint (Fase 2.4) | No |
| `GRAPH_DRIVE_ID` | Il Drive ID di SharePoint (Fase 2.4) | No |
| `TOKEN_EXPIRATION_HOURS` | `6` | No (default: 6 ore) |
| `NOTIFICATION_EMAIL` | Email per le notifiche | No |

7. Clicca **"Deploy"**
8. Attendi 2-3 minuti per il build (Prisma migrate verra eseguito automaticamente)
9. Il tuo portale e online! Riceverai un URL tipo:
   `https://hertz-checkin-portal.vercel.app`

### 3.4 Inizializzare il database

Dopo il primo deploy, il database e vuoto. Per inizializzare i requisiti foto:

1. Apri il browser e vai al tuo URL + `/api/admin/seed` con metodo POST:
   - Puoi usare il terminale: `curl -X POST https://tuo-sito.vercel.app/api/admin/seed`
   - Oppure semplicemente apri la dashboard e i requisiti vengono creati automaticamente

---

## FASE 4: Personalizzare il dominio (opzionale)

1. Su Vercel, vai in **Settings -> Domains**
2. Aggiungi il tuo dominio personalizzato (es. `checkin.hertzmalta.com`)
3. Configura il DNS come indicato da Vercel
4. Il certificato SSL e automatico e gratuito

---

## Come usare il portale nel quotidiano

### Per lo staff Hertz:

1. Vai sulla dashboard (la pagina principale)
2. Clicca **"New Contract"** e compila i dati del noleggio
3. Copia il link generato e invialo al cliente via **SMS o email**
4. Oppure usa **"Bulk Upload"** per caricare un file Excel con piu contratti alla volta
5. Quando il cliente completa il check-in, le foto sono su SharePoint

### Per il cliente:

1. Riceve il link via SMS/email
2. Apre il link sul telefono
3. Scatta le 7 foto obbligatorie
4. Invia il check-in
5. Il link scade e non e piu riutilizzabile

---

## Risoluzione problemi

| Problema | Soluzione |
|----------|-----------|
| Errore "Environment variable not found: DATABASE_URL" | Aggiungi DATABASE_URL su Vercel > Settings > Environment Variables |
| Errore "Token non trovato" | Il token e scaduto o gia usato. Generarne uno nuovo dall'admin |
| Le foto non vanno su SharePoint | Verificare le credenziali Azure AD e che "Grant admin consent" sia stato fatto |
| Il sito non carica | Controllare le variabili d'ambiente su Vercel |
| Database vuoto dopo deploy | La prima volta che apri la dashboard, i requisiti foto vengono creati automaticamente |
| Build fallita su Vercel | Controllare che DATABASE_URL sia impostata correttamente |

---

## Supporto

Per qualsiasi problema, controllare i log su:
- Vercel: Dashboard -> Progetto -> Deployments -> clicca sul deploy -> "Function Logs"
- Neon: Dashboard -> Progetto -> Monitoring
