# 💸 Spendly PWA

A premium, production-grade Progressive Web App (PWA) rebuilt from the original Spendly mobile codebase. Designed with Next.js 15 App Router, React 19, TypeScript, Firebase Firestore (with offline persistence), Firebase Auth, TanStack React Query, Zustand, and Tailwind CSS.

---

## 🛠️ Technical Stack

| Layer                | Technology                                              |
|----------------------|---------------------------------------------------------|
| **Core Framework**   | Next.js 15.1 App Router + React 19 + TypeScript          |
| **Backend & Database**| Firebase Firestore (with offline multi-tab persistent cache) |
| **Authentication**   | Firebase Auth (Email/Password & Google OAuth)            |
| **State & Cache**    | TanStack React Query 5 + Zustand 5                      |
| **Styling & UI**     | Tailwind CSS + Radix UI + Lucide Icons + Framer Motion  |
| **Visual Analytics** | Chart.js 4 + react-chartjs-2 (with lazy loading)        |
| **PWA & Service Worker** | `@next-pwa/register` + custom network offline fallback   |

---

## 🌟 Key Features

* 📊 **Interactive Dashboard**: Real-time financial statistics overview and visual distribution charts.
* 💸 **Expense Tracking (CRUD)**: Create, view, update, soft-delete, and restore expenses with precision integer-cent formatting.
* 🔍 **Multi-Range Filtering & Search**: Instant full-text search across titles/notes and preset date filters (*Today*, *This Week*, *This Month*, *All Time*).
* 🎨 **Custom Category Management**: Pre-seeded transactional categories with ability to add custom names, icons, and colors.
* 🎯 **Budget Limits & Trackers**: Monthly spending threshold trackers with visual progress indicators.
* 📈 **Reports & Analytics**: Custom date range spending comparisons and monthly category summaries.
* 💾 **JSON Data Backup & Merging**: Export and import complete user records with automatic conflict resolution.
* 📱 **PWA & Offline Capability**: Full offline functionality using Firestore's persistent local cache and Next.js service workers.

---

## 📂 Project Structure

```
spendly/
├── app/                        # Next.js 15 App Router Routes
│   ├── (app)/                  # Authenticated layout router pages
│   │   ├── dashboard/          # Finance statistics graphs
│   │   ├── expenses/           # CRUD transactions lists
│   │   ├── categories/         # Icons & colors customization grids
│   │   ├── budgets/            # Progress trackers & history limits
│   │   ├── reports/            # Custom dates analytics comparisons
│   │   └── settings/           # Profile edits, JSON backups, DB resets
│   ├── api/                    # API endpoints
│   ├── (auth)/                 # Login and Registration pages
│   ├── offline/                # Custom network loss fallback page
│   ├── globals.css             # Unified CSS variables & Tailwind config
│   └── layout.tsx              # Root HTML view & viewport configs
├── src/                        # Core Application Source
│   ├── components/             # Custom modular UI widgets & Radix components
│   ├── database/               # Repositories & interface contracts
│   ├── firebase/               # Firebase app, auth, and Firestore cache setup
│   ├── hooks/                  # TanStack React Query cache hooks
│   ├── models/                 # Domain model interfaces & schemas
│   ├── services/               # Core business logic services
│   ├── stores/                 # Zustand UI states & toast queue stores
│   └── utils/                  # Formatting & validation helpers
├── public/                     # Static icons, PWA manifests & Service Workers
├── legacy/                     # Original React Native / Expo mobile codebase
├── .env.example                # Deployment environment template
├── package.json                # Project dependencies & scripts
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
Copy the environment template or create a `.env` file:
```bash
cp .env.example .env
```
Fill in your Firebase project credentials in `.env`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Start development server
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 📱 PWA Configuration & Offline Mode

- **PWA Service Worker**: During `npm run build`, Next.js compiles the PWA service worker (`sw.js`) and workbox engine in the `/public` root.
- **Offline Redirection Fallback**: Intercepts un-cached network requests when offline and serves the custom `/offline` page.
- **Persistent Local Cache**: Firestore local cache enables complete offline reading and writing, auto-synchronizing changes once connection is restored.

---

## 🧪 Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts local Next.js hot-reload development server |
| `npm run lint` | Verifies full ESLint compliance |
| `npm run type-check` | Performs TypeScript compiler verification |
| `npm run build` | Compiles optimized static assets and PWA service workers |
| `npm run start` | Runs production server build locally |

---

## 🔮 Roadmap / Future Features

- 📸 **Smart Receipt OCR**: Snap images of receipts to automatically extract amounts, items, and merchants.
- 🔄 **Subscription Tracker**: Automate recurring bills and get alerts prior to due dates.
- 👥 **Shared Wallets**: Collaborative household and shared expense tracking using real-time Firestore listeners.
- 💡 **AI Financial Advisor**: Receive personalized spending alerts, budget projections, and saving tips.
- 🎯 **Goal-Based Savings Pots**: Define savings goals (e.g., Emergency Fund, Vacation) and track progress over time.
