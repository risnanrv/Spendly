# 💸 Spendly PWA

A premium, production-grade Progressive Web App (PWA) rebuilt from the original Spendly mobile codebase. Designed with Next.js 15 App Router, React 19, TypeScript, Drizzle ORM, SQLite, Better Auth, and Tailwind CSS.

---

## 🛠️ Rebuild Technical Stack

| Layer                | Technology                                         |
|----------------------|----------------------------------------------------|
| **Core Framework**   | Next.js 15.5 App Router + React 19                 |
| **Database ORM**     | SQLite (better-sqlite3 / libsql) + Drizzle ORM      |
| **Authentication**   | Better Auth (with session SQLite adapters)         |
| **State & Cache**    | TanStack React Query 5 + Zustand 5                 |
| **Styling**          | Tailwind CSS + Vanilla CSS Variables               |
| **Visual Graphics**  | Chart.js 4 + react-chartjs-2 (with lazy loading)   |
| **Notifications**    | Zustand custom toast queue alerts system           |

---

## 📂 Project Structure

```
spendly-pwa/
├── app/                        # Next.js 15 App Router Routes
│   ├── (app)/                  # Authenticated layout router pages
│   │   ├── dashboard/          # Finance statistics graphs
│   │   ├── expenses/           # CRUD transactions lists
│   │   ├── categories/         # Icons & colors customization grids
│   │   ├── budgets/            # Progress trackers & history limits
│   │   ├── reports/            # Custom dates analytics comparisons
│   │   └── settings/           # Profile edits, JSON backups, DB resets
│   ├── api/                    # Authentication endpoint routes
│   ├── (auth)/                 # Login and Registration pages
│   ├── offline/                # Custom network loss fallback page
│   ├── globals.css             # Unified CSS variables color system
│   └── layout.tsx              # Root HTML view & viewport configs
├── src/                        # Core Application Source
│   ├── actions/                # Type-safe Server Actions (RPC Pattern)
│   ├── components/             # Custom modular UI widgets
│   ├── database/               # Drizzle schemas, migrators & seeds
│   ├── hooks/                  # TanStack React Query cache hooks
│   ├── lib/                    # Shared client singletons (services, DB)
│   ├── services/               # Reused legacy business logic layers
│   ├── stores/                 # Zustand UI states stores
│   └── utils/                  # Formatting & validations logic
├── public/                     # Static icons, manifests & Service Workers
├── legacy/                     # Untouched original React Native / Expo files
├── .env.example                # Deployment environment template
├── package.json                # Project dependencies & compile scripts
└── tsconfig.json               # TypeScript compiler config
```

---

## 🚀 Development Quickstart

### 1. Install dependencies
Ensure Node.js 20+ is installed on your local machine:
```bash
npm install --legacy-peer-deps
```

### 2. Configure environment variables
Copy the environment template:
```bash
cp .env.example .env
```
Ensure you generate a secure random secret keys string inside `BETTER_AUTH_SECRET`.

### 3. Start development server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser. Database migrations and initial category seeding will execute automatically on first page request.

---

## 💾 Local SQLite Migrations & Seeds
Spendly PWA automates migrations:
- **Automatic Migration**: `MigrationRunner.run()` compares schemas and updates the local SQLite database (`spendly.db`) automatically during server boot.
- **Seeding Defaults**: `SeedService.seed()` populates core transactional categories (Food, Groceries, Transit, etc.) on the first load of the login screen.
- **Manual Migrations**: If modifying schema files inside `src/database/schema.ts`, generate and apply them using:
  ```bash
  npm run db:generate
  npx drizzle-kit push
  ```

---

## 📱 PWA Configuration & Offline Mode
- **PWA Service Worker**: Powered by `@next-pwa/register`. During execution of `npm run build`, Next.js compiles the service worker (`sw.js`) and workbox engines in the `/public` root.
- **Offline Redirection fallback**: In the event that user network connections fail, the PWA intercepts queries and loads the custom `/offline` route.
- **Icon sets**: PWA assets (favicon, 192px/512px launcher logs, maskable graphics) reside in `/public/` and are mapped to OS configurations inside `/public/manifest.json`.

---

## 🚢 Production Deployment Steps (Vercel / Cloud)

Spendly is prepared for zero-configuration deployments on Vercel:

### 1. Configure Turso (Remote Database option)
If deploying to serverless platforms, replace local SQLite files with a cloud SQLite instance (like Turso):
1. Sign up on [turso.tech](https://turso.tech) and create a database.
2. In your Vercel deployment variables, configure:
   ```env
   DATABASE_URL=libsql://your-database-name-your-username.turso.io
   DATABASE_AUTH_TOKEN=your_turso_auth_token_string
   ```

### 2. Configure Vercel Variables
In your Vercel project dashboard, configure the following Environment Variables:
- `BETTER_AUTH_URL`: `https://your-spendly-project.vercel.app` (your actual deploy URL)
- `BETTER_AUTH_SECRET`: `your_random_32_character_hex_string` (generate with `openssl rand -hex 32`)
- `DATABASE_URL`: Connection string (local or Turso)

### 3. Trigger build
Deploy the codebase. Drizzle ORM migrations run automatically during start-up.

---

## 🧪 Quality Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts local Next.js hot-reload development server |
| `npm run lint` | Verifies full ESLint compliance |
| `npm run type-check` | Performs TypeScript compiler analysis |
| `npm run build` | Compiles optimized static assets and PWA service workers |
