# 🚀 Guida Deploy — Hertz Malta Check-in Fotografico

## Panoramica dei costi: TUTTO GRATIS

| Servizio | Piano | Costo |
|----------|-------|-------|
| Neon (Database) | Free Tier | €0/mese |
| Vercel (Hosting) | Hobby (Free) | €0/mese |
| SharePoint (Storage) | Incluso in M365 Business | €0/mese |
| Azure AD (API Auth) | Incluso in M365 Business | €0/mese |

---

## FASE 1: Creare il Database (Neon) — 5 minuti

1. Vai su **https://neon.tech** e clicca "Sign Up"
2. Registrati con il tuo account Microsoft (lo stesso di M365)
3. Dopo il login, clicca **"New Project"**
4. Nome progetto: `hertz-checkin`
5. Regione: scegli **Europe** (più vicino a Malta)
6. Clicca **"Create Project"**
7. Nella pagina del progetto, copia la **Connection String** — assomiglia a:
   ```
   postgresql://neondb_owner:AbCdEf123456@ep-cool-name-123456.eu-west-2.aws.neon.tech/neondb?sslmode=require
   ```
8. **Salvala** — ti servirà tra poco!

---

## FASE 2: Creare l'App Azure AD (per SharePoint) — 15 minuti

Questa è la parte che permette all'app di salvare le foto su SharePoint.
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
   - **Application (client) ID** → è il tuo `GRAPH_CLIENT_ID`
   - **Directory (tenant) ID** → è il tuo `GRAPH_TENANT_ID`
2. Vai su **"Certificates & secrets"** nel menu laterale
3. Clicca **"+ New client secret"**
4. Descrizione: `Check-in Portal`
5. Scadenza: **24 months**
6. Clicca **"Add"**
7. **COPIA SUBITO IL VALORE** del segreto (non si vede più dopo!) → è il tuo `GRAPH_CLIENT_SECRET`

### 2.3 Dare i permessi all'app

1. Vai su **"API permissions"** nel menu laterale
2. Clicca **"+ Add a permission"**
3. Seleziona **"Microsoft Graph"**
4. Seleziona **"Application permissions"** (non Delegated!)
5. Cerca e spunta questi permessi:
   - `Files.ReadWrite.All` (leggere/scrivere file su SharePoint)
   - `Sites.ReadWrite.All` (leggere/scrivere siti SharePoint)
6. Clicca **"Add permissions"**
7. ⚠️ **IMPORTANTE**: Clicca **"Grant admin consent for [tuo-tenant]"** e conferma
   (il pulsante diventa verde con un ✓)

### 2.4 Ottenere Site ID e Drive ID di SharePoint

1. Vai su **https://developer.microsoft.com/graph/graph-explorer**
2. Accedi con il tuo account amministratore
3. Esegui questa query per ottenere il Site ID:
   ```
   GET https://graph.microsoft.com/v1.0/sites/hertzmalta.sharepoint.com
   ```
   (sostituisci "hertzmalta" con il tuo dominio SharePoint)
4. Dalla risposta, copia il campo **"id"** → è il tuo `GRAPH_SITE_ID`
5. Esegui questa query per ottenere il Drive ID:
   ```
   GET https://graph.microsoft.com/v1.0/sites/{SITE-ID}/drives
   ```
   (sostituisci {SITE-ID} con il Site ID appena copiato)
6. Dalla risposta, trova il drive "Documents" e copia il suo **"id"** → è il tuo `GRAPH_DRIVE_ID`

---

## FASE 3: Pubblicare su Vercel — 10 minuti

### 3.1 Preparare il codice su GitHub

1. Vai su **https://github.com** e registrati (se non hai un account)
2. Crea un nuovo repository:
   - Nome: `hertz-checkin-portal`
   - Visibilità: **Private** (contiene dati aziendali)
   - NON inizializzare con README
3. Scarica il codice del progetto (tutti i file) e caricali su GitHub
   - Puoi usare "Upload files" nell'interfaccia web di GitHub

### 3.2 Collegare a Vercel

1. Vai su **https://vercel.com** e clicca "Sign Up"
2. Registrati con **"Continue with GitHub"**
3. Dopo il login, clicca **"Add New..." → "Project"**
4. Seleziona il repository `hertz-checkin-portal`
5. Framework Preset: **Next.js** (dovrebbe essere rilevato automaticamente)
6. ⚠️ NON cliccare Deploy ancora! Prima configura le variabili d'ambiente

### 3.3 Configurare le variabili d'ambiente su Vercel

Nella pagina di configurazione del progetto, scorri fino a **"Environment Variables"**
e aggiungi QUESTE variabili una per una:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | La connection string di Neon (Fase 1) |
| `GRAPH_TENANT_ID` | Il tenant ID di Azure (Fase 2.2) |
| `GRAPH_CLIENT_ID` | Il client ID di Azure (Fase 2.2) |
| `GRAPH_CLIENT_SECRET` | Il segreto di Azure (Fase 2.2) |
| `GRAPH_SITE_ID` | Il Site ID di SharePoint (Fase 2.4) |
| `GRAPH_DRIVE_ID` | Il Drive ID di SharePoint (Fase 2.4) |
| `TOKEN_EXPIRATION_HOURS` | `6` |
| `NOTIFICATION_EMAIL` | L'email per le notifiche (es. checkin@hertzmalta.com) |

7. Clicca **"Deploy"**
8. Attendi 2-3 minuti per il build
9. ✅ Il tuo portale è online! Riceverai un URL tipo:
   `https://hertz-checkin-portal.vercel.app`

### 3.4 Inizializzare il database

Dopo il primo deploy, il database è vuoto. Per inizializzare i requisiti foto:

1. Vai al tuo URL + `/api/admin/seed`
   Es: `https://hertz-checkin-portal.vercel.app/api/admin/seed`
2. Dovresti vedere: `{"success":true,"message":"Requisiti foto inizializzati: 7 creati, 0 già esistenti"}`

---

## FASE 4: Personalizzare il dominio (opzionale)

1. Su Vercel, vai in **Settings → Domains**
2. Aggiungi il tuo dominio personalizzato (es. `checkin.hertzmalta.com`)
3. Configura il DNS come indicato da Vercel
4. Il certificato SSL è automatico e gratuito

---

## 📱 Come usare il portale nel quotidiano

### Per lo staff Hertz:

1. Vai su `https://tuo-sito.vercel.app` e clicca **"Admin"**
2. Clicca **"Nuovo Contratto"** e compila i dati
3. Copia il link generato e invialo al cliente via **SMS o email**
4. Quando il cliente completa il check-in, le foto sono su SharePoint

### Per il cliente:

1. Riceve il link via SMS/email
2. Apre il link sul telefono
3. Scatta le 7 foto obbligatorie
4. Invia il check-in
5. Il link scade e non è più riutilizzabile

---

## 🔧 Risoluzione problemi

| Problema | Soluzione |
|----------|-----------|
| Errore "Token non trovato" | Il token è scaduto o già usato. Generarne uno nuovo dall'admin |
| Le foto non vanno su SharePoint | Verificare le credenziali Azure AD e che "Grant admin consent" sia stato fatto |
| Il sito non carica | Controllare le variabili d'ambiente su Vercel |
| Database vuoto dopo deploy | Andare su /api/admin/seed per inizializzare |

---

## 📞 Supporto

Per qualsiasi problema, controllare i log su:
- Vercel: Dashboard → Progetto → Deployments → clicca sul deploy → "Function Logs"
- Neon: Dashboard → Progetto → Monitoring
