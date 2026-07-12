# CareSync &mdash; Healthcare that works anywhere

CareSync is a fully unified healthcare ecosystem built to replace traditional hospital databases. Designed for offline-first environments, it enables hospitals and patients to reliably manage medical records, token queues, and insurance across the globe, CareSync uses Hugging Face models for on-demand symptom diagnosis and multi-language translations.

## Core Features
- **AI Doctor Assistant**: Uses Hugging Face Mistral-7B to interactively parse symptoms.
- **Role-Based Access**: Dedicated dashboards for Patients and Hospital staff.
- **Medical Financing & Insurance**: Modules to support instant loan approvals and manage health policies. 
- **Modern Next.js 15 Setup**: Fully typed App Router logic with Tailwind CSS v4.

## Tech Stack
- Frontend: Next.js + React + Tailwind CSS
- Backend API: Next.js Routes + JWT (jose)
- Database: MySQL + Drizzle ORM
- Offline Storage: next-pwa + dexie
- AI Layer: Hugging Face API

## Environment Variables Configuration
Copy `.env.example` (or the provided `.env`) into the root directory of this project. Be sure to replace the placeholder `HUGGINGFACE_API_KEY` and DB credentials:

```bash
APP_NAME="CareSync"
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=caresync
DB_NAME=caresync
JWT_SECRET=caresync_super_secret_key
HUGGINGFACE_API_KEY=your_hugging_face_key_here
```

## Running the Application

### Setup Database
Wait for the MySQL Docker to be ready or install MySQL locally.
Push the Drizzle Schema to DB:
```bash
npx drizzle-kit push
```

### Dev Server
```bash
npm install
npm run dev
```

The app will be running at [http://localhost:3000](http://localhost:3000).

---
**Designed by Antigravity AI**.
