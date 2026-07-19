# 🚗 Hertz Malta — Portale Check-in Fotografico Veicoli

Portale web per la documentazione fotografica obbligatoria dei veicoli al momento del ritiro. Sostituisce l'invio via email con un processo guidato che garantisce la completezza delle foto.

## ✨ Funzionalità

- **Token monouso** — Link univoco per ogni contratto, scade dopo 6 ore, non riutilizzabile
- **Checklist fotografica obbligatoria** — 7 foto richieste prima di poter inviare
- **Mobile-friendly** — Nessuna app da installare, funziona dal browser del telefono
- **Salvataggio automatico su SharePoint** — Le foto vanno direttamente nel storage M365 aziendale
- **Pannello admin** — Creazione contratti, generazione link, monitoraggio stato

## 🛠️ Stack Tecnologico

| Componente | Tecnologia |
|-----------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui |
| Database | PostgreSQL (Neon) |
| Storage | Microsoft SharePoint via Graph API |
| Hosting | Vercel (free tier) |

## 🚀 Deploy

Vedi la guida completa: [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)

### Setup rapido

```bash
# 1. Installa dipendenze
npm install

# 2. Configura .env.local con le tue variabili (copia da .env.example)
cp .env.example .env.local

# 3. Inizializza il database
npx prisma db push

# 4. Avvia in sviluppo
npm run dev

# 5. Inizializza i requisiti foto
curl -X POST http://localhost:3000/api/admin/seed
```

## 📱 Come si usa

### Staff Hertz
1. Accedi al pannello Admin
2. Crea un nuovo contratto
3. Copia il link generato e invialo al cliente (SMS/email)

### Cliente
1. Apre il link sul telefono
2. Scatta le 7 foto obbligatorie
3. Invia il check-in
4. Il link scade automaticamente

## 💰 Costi

Totalmente **gratuito** con i piani free di Neon + Vercel + Microsoft 365 Business già esistente.

## 📄 Licenza

Proprietario — Hertz Malta
